"""
detection_service.py
====================
Handles species detection inference for image (YOLOv8 + ResNet50) and audio
(BirdNET with YAMNet fallback) observations.

Design notes
------------
* IMAGE DETECTION — two-stage pipeline:
  Stage 1: YOLOv8 locates animals and returns bounding boxes.
  Stage 2: ResNet50 (ImageNet-1K) classifies the cropped bbox region to
           identify the actual species.  ImageNet has proper wildlife classes
           (tiger, lion, Indian_elephant, cheetah, etc.) that COCO lacks.

* BirdNET handles bird audio via birdnetlib. Returns [] for non-bird sounds.

* YAMNet (Google) is the audio fallback — activated only when BirdNET
  returns zero results. Classifies general audio event categories.

* Species resolution: 4-tier case-insensitive matching:
  0. Synonym lookup (ImageNet label -> database species name)
  1. Exact on common_name / scientific_name
  2. Substring
  3. Word-by-word token fallback
  Unresolved labels are NOT dropped — they are returned with species_id=None
  so the caller can still store raw_label in the Detection row.
"""

import csv
import io
import logging
import os
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

logger = logging.getLogger("wildlife.detection")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CONFIDENCE_THRESHOLD: float = float(os.getenv("DETECTION_CONFIDENCE_THRESHOLD", "0.4"))

_DEFAULT_WEIGHTS = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "models",
    "best.pt",
)
MODEL_WEIGHTS_PATH: str = os.getenv("MODEL_WEIGHTS_PATH", _DEFAULT_WEIGHTS)

_DEFAULT_YAMNET_TFLITE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "models",
    "yamnet.tflite",
)
YAMNET_TFLITE_PATH: str = os.getenv("YAMNET_TFLITE_PATH", _DEFAULT_YAMNET_TFLITE)

# ---------------------------------------------------------------------------
# YOLOv8 image model — lazy singleton
# ---------------------------------------------------------------------------
_image_model: Any = None


def _load_image_model() -> Optional[Any]:
    """Load YOLOv8 model lazily; cache on first success."""
    global _image_model

    if _image_model is not None:
        return _image_model

    weights_to_try = [MODEL_WEIGHTS_PATH, "yolov8n.pt"] if MODEL_WEIGHTS_PATH != "yolov8n.pt" else ["yolov8n.pt"]

    try:
        from ultralytics import YOLO  # type: ignore
        for path in weights_to_try:
            try:
                logger.info("Attempting to load YOLOv8 model from %s", path)
                _image_model = YOLO(path)
                logger.info("YOLOv8 model loaded successfully from %s.", path)
                return _image_model
            except Exception as exc:
                logger.warning("Failed to load YOLO model from %s: %s", path, exc)
    except Exception:
        logger.exception("Failed to import YOLO from ultralytics.")

    return None


# ---------------------------------------------------------------------------
# MobileNetV3-Small ImageNet classifier — lazy singleton (Stage 2 species ID)
# Chosen for speed: ~2.5M params vs ResNet50's 25M — ~10x faster inference.
# Same 1000 ImageNet classes including tiger, lion, Indian_elephant, etc.
# ---------------------------------------------------------------------------
_classifier_model: Any = None
_classifier_transforms: Any = None
_imagenet_classes: List[str] = []

# COCO animal class IDs (used to filter YOLO detections to animals only)
_COCO_ANIMAL_CLASS_IDS = {
    14,  # bird
    15,  # cat
    16,  # dog
    17,  # horse
    18,  # sheep
    19,  # cow
    20,  # elephant
    21,  # bear
    22,  # zebra
    23,  # giraffe
}


def _load_classifier() -> bool:
    """Load MobileNetV3-Small pretrained on ImageNet-1K for species classification."""
    global _classifier_model, _classifier_transforms, _imagenet_classes

    if _classifier_model is not None:
        return True

    try:
        import torch  # type: ignore
        from torchvision import models  # type: ignore

        logger.info("Loading MobileNetV3-Small classifier for species identification...")
        weights = models.MobileNet_V3_Small_Weights.IMAGENET1K_V1
        _classifier_model = models.mobilenet_v3_small(weights=weights)
        _classifier_model.eval()

        _classifier_transforms = weights.transforms()

        # Load ImageNet class labels
        _imagenet_classes = weights.meta["categories"]

        logger.info(
            "MobileNetV3-Small classifier loaded (%d classes).",
            len(_imagenet_classes),
        )
        return True
    except Exception:
        logger.exception("Failed to load MobileNetV3-Small classifier.")
        return False


def _classify_crop(image_path: str, bbox: Dict[str, float]) -> Tuple[str, float]:
    """
    Crop the bounding box region from the image and classify with MobileNetV3-Small.

    Returns (label, confidence).  Falls back to ("unknown", 0.0) on failure.
    """
    if _classifier_model is None:
        if not _load_classifier():
            return "unknown", 0.0

    try:
        import torch  # type: ignore
        from PIL import Image as PILImage  # type: ignore

        img = PILImage.open(image_path).convert("RGB")

        # Crop bbox region (with small padding for context)
        w, h = img.size
        pad_x = (bbox["x2"] - bbox["x1"]) * 0.05
        pad_y = (bbox["y2"] - bbox["y1"]) * 0.05
        x1 = max(0, int(bbox["x1"] - pad_x))
        y1 = max(0, int(bbox["y1"] - pad_y))
        x2 = min(w, int(bbox["x2"] + pad_x))
        y2 = min(h, int(bbox["y2"] + pad_y))

        crop = img.crop((x1, y1, x2, y2))

        # Preprocess and classify
        input_tensor = _classifier_transforms(crop).unsqueeze(0)
        with torch.no_grad():
            output = _classifier_model(input_tensor)
            probs = torch.nn.functional.softmax(output[0], dim=0)

        top_conf, top_idx = probs.topk(1)
        label = _imagenet_classes[top_idx.item()]
        confidence = float(top_conf.item())

        logger.info(
            "MobileNetV3 classified crop as '%s' (%.1f%%)",
            label, confidence * 100,
        )
        return label, confidence

    except Exception as exc:
        logger.warning("MobileNetV3 classification failed: %s", exc)
        return "unknown", 0.0


# ---------------------------------------------------------------------------
# YAMNet audio model — lazy singleton
# ---------------------------------------------------------------------------
_yamnet_interpreter: Any = None
_yamnet_tfhub_model: Any = None
_yamnet_class_names: List[str] = []
_yamnet_loaded: bool = False  # True once we've attempted a load


def _load_yamnet_model() -> Tuple[Optional[Any], List[str], str]:
    """
    Load YAMNet lazily via tflite-runtime or tensorflow-hub.
    Returns (model_or_interpreter, class_names_list, mode_string) or (None, [], "") on failure.
    """
    global _yamnet_interpreter, _yamnet_tfhub_model, _yamnet_class_names, _yamnet_loaded

    if _yamnet_loaded:
        if _yamnet_interpreter is not None:
            return _yamnet_interpreter, _yamnet_class_names, "tflite"
        if _yamnet_tfhub_model is not None:
            return _yamnet_tfhub_model, _yamnet_class_names, "tfhub"
        return None, [], ""

    _yamnet_loaded = True
    logger.info("Attempting to load YAMNet model...")

    # Option 1: tflite-runtime with local yamnet.tflite file
    if os.path.isfile(YAMNET_TFLITE_PATH):
        try:
            try:
                import tflite_runtime.interpreter as tflite  # type: ignore
            except ImportError:
                import tensorflow.lite as tflite  # type: ignore

            _yamnet_interpreter = tflite.Interpreter(model_path=YAMNET_TFLITE_PATH)
            _yamnet_interpreter.allocate_tensors()
            logger.info("YAMNet TFLite model loaded successfully from %s", YAMNET_TFLITE_PATH)

            # Try loading class map CSV if present
            class_csv = os.path.join(os.path.dirname(YAMNET_TFLITE_PATH), "yamnet_class_map.csv")
            if os.path.isfile(class_csv):
                with open(class_csv, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    _yamnet_class_names = [row["display_name"] for row in reader]
            return _yamnet_interpreter, _yamnet_class_names, "tflite"
        except Exception as exc:
            logger.warning("Failed to load YAMNet TFLite model: %s", exc)

    # Option 2: TensorFlow Hub fallback
    try:
        import tensorflow_hub as hub  # type: ignore
        import tensorflow as tf  # type: ignore
        _yamnet_tfhub_model = hub.load("https://tfhub.dev/google/yamnet/1")
        class_map_path = _yamnet_tfhub_model.class_map_path().numpy().decode("utf-8")
        with open(class_map_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            _yamnet_class_names = [row["display_name"] for row in reader]
        logger.info("YAMNet TFHub model loaded successfully.")
        return _yamnet_tfhub_model, _yamnet_class_names, "tfhub"
    except Exception:
        logger.warning("YAMNet model not available (TFHub/TFLite weights not found).")
        return None, [], ""


# ---------------------------------------------------------------------------
# Public inference functions
# ---------------------------------------------------------------------------

def run_image_detection(image_path: str) -> List[Dict[str, Any]]:
    """
    Two-stage image detection pipeline:

    Stage 1 — YOLOv8: detect objects, extract bounding boxes.
              Filter to animal-class detections only (COCO IDs 14-23).
    Stage 2 — ResNet50 (ImageNet): classify each cropped bbox to get the
              actual species label (tiger, lion, elephant, etc.).

    Returns a list of dicts (only detections above CONFIDENCE_THRESHOLD):
        [
          {
            "species_label": str,   # from ResNet50 ImageNet classification
            "confidence": float,    # from ResNet50
            "bbox": {"x1": float, "y1": float, "x2": float, "y2": float},
          },
          ...
        ]
    Returns [] if models aren't loaded or the file is missing.
    """
    model = _load_image_model()
    if model is None:
        logger.warning("YOLO model not available.")
        return []

    if not os.path.isfile(image_path):
        logger.warning("Image file not found: %s", image_path)
        return []

    try:
        logger.info("Running YOLO inference on: %s", image_path)
        results = model(image_path, verbose=False)
    except Exception as exc:
        logger.exception("YOLOv8 inference error on '%s': %s", image_path, exc)
        return []

    detections: List[Dict[str, Any]] = []
    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue
        for box in boxes:
            yolo_confidence = float(box.conf[0])
            if yolo_confidence < CONFIDENCE_THRESHOLD:
                continue
            class_idx = int(box.cls[0])
            yolo_label: str = result.names.get(class_idx, f"class_{class_idx}")

            # Extract pixel-space bounding box [x1, y1, x2, y2]
            xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
            bbox = {
                "x1": float(xyxy[0]),
                "y1": float(xyxy[1]),
                "x2": float(xyxy[2]),
                "y2": float(xyxy[3]),
            }

            # Stage 2: Re-classify the cropped region with ResNet50
            # Only for animal classes, otherwise keep YOLO label
            if class_idx in _COCO_ANIMAL_CLASS_IDS:
                resnet_label, resnet_conf = _classify_crop(image_path, bbox)
                if resnet_label != "unknown" and resnet_conf > 0.1:
                    label = resnet_label
                    confidence = resnet_conf
                else:
                    label = yolo_label
                    confidence = yolo_confidence
            else:
                label = yolo_label
                confidence = yolo_confidence

            if confidence < CONFIDENCE_THRESHOLD:
                continue

            detections.append({
                "species_label": label,
                "confidence": confidence,
                "bbox": bbox,
            })

    logger.info(
        "Image detection on '%s': %d results above threshold %.2f",
        image_path, len(detections), CONFIDENCE_THRESHOLD,
    )
    return detections


def run_audio_detection(audio_path: str) -> List[Dict[str, Any]]:
    """
    Run BirdNET inference on *audio_path* (WAV or MP3).

    Returns:
        [{
            "species_label": str,
            "confidence": float,
            "detection_source": "birdnet",
        }, ...]

    Returns [] (with a warning log) if birdnetlib is not available.
    """
    if not os.path.isfile(audio_path):
        logger.warning("Audio file not found: %s", audio_path)
        return []

    try:
        from birdnetlib import Recording  # type: ignore
        from birdnetlib.analyzer import Analyzer  # type: ignore
    except ModuleNotFoundError as e:
        logger.warning(
            "birdnetlib or audio dependency (%s) missing — BirdNET unavailable.", e.name
        )
        return []
    except Exception:
        logger.exception("Unexpected error importing birdnetlib.")
        return []

    try:
        analyzer = Analyzer()
        recording = Recording(analyzer, audio_path, min_conf=CONFIDENCE_THRESHOLD)
        recording.analyze()

        detections: List[Dict[str, Any]] = []
        for det in recording.detections:
            label: str = det.get("common_name") or det.get("scientific_name", "unknown")
            confidence: float = float(det.get("confidence", 0.0))
            if confidence >= CONFIDENCE_THRESHOLD:
                detections.append({
                    "species_label": label,
                    "confidence": confidence,
                    "detection_source": "birdnet",
                })

        logger.info(
            "BirdNET on '%s': %d results above threshold %.2f",
            audio_path, len(detections), CONFIDENCE_THRESHOLD,
        )
        return detections

    except Exception as exc:
        logger.exception("BirdNET inference error on '%s': %s", audio_path, exc)
        return []


def run_yamnet_detection(audio_path: str) -> List[Dict[str, Any]]:
    """
    Run YAMNet inference on *audio_path* as a fallback when BirdNET finds nothing.

    Loads audio at 16 kHz mono (YAMNet requirement) via librosa.
    Returns top-5 scoring classes above CONFIDENCE_THRESHOLD:
        [{
            "species_label": str,
            "confidence": float,
            "detection_source": "yamnet",
        }, ...]

    Returns [] if model is unavailable or no class exceeds threshold.
    """
    if not os.path.isfile(audio_path):
        logger.warning("Audio file not found for YAMNet: %s", audio_path)
        return []

    model_obj, class_names, mode = _load_yamnet_model()
    if model_obj is None:
        logger.warning("YAMNet model not available — skipping fallback.")
        return []

    try:
        import numpy as np  # type: ignore
        import librosa  # type: ignore

        waveform, _ = librosa.load(audio_path, sr=16000, mono=True)

        if mode == "tflite":
            interpreter = model_obj
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()

            # Prepare input tensor
            input_data = np.array(waveform, dtype=np.float32)
            interpreter.set_tensor(input_details[0]['index'], input_data)
            interpreter.invoke()
            scores = interpreter.get_tensor(output_details[0]['index'])
            mean_scores = np.mean(scores, axis=0) if scores.ndim > 1 else scores
        else:
            import tensorflow as tf  # type: ignore
            waveform_tensor = tf.constant(waveform, dtype=tf.float32)
            scores, _, _ = model_obj(waveform_tensor)
            mean_scores = tf.reduce_mean(scores, axis=0).numpy()

        top_indices = np.argsort(mean_scores)[::-1][:5]

        detections: List[Dict[str, Any]] = []
        for idx in top_indices:
            score = float(mean_scores[idx])
            if score < CONFIDENCE_THRESHOLD:
                continue
            label = class_names[idx] if idx < len(class_names) else f"class_{idx}"
            detections.append({
                "species_label": label,
                "confidence": score,
                "detection_source": "yamnet",
            })

        logger.info(
            "YAMNet on '%s': %d results above threshold %.2f",
            audio_path, len(detections), CONFIDENCE_THRESHOLD,
        )
        return detections

    except Exception as exc:
        logger.exception("YAMNet inference error on '%s': %s", audio_path, exc)
        return []


# ---------------------------------------------------------------------------
# Label synonym mapping — maps ImageNet / COCO class names to database species
# ---------------------------------------------------------------------------
LABEL_SYNONYMS: Dict[str, str] = {
    # ImageNet wildlife classes -> database species
    # Only biologically correct mappings — unknown species stay as raw labels
    "tiger": "Bengal Tiger",
    "tiger cat": "Bengal Tiger",
    "tiger_cat": "Bengal Tiger",
    "lion": "Asiatic Lion",
    "indian elephant": "Indian Elephant",
    "indian_elephant": "Indian Elephant",
    "african elephant": "Indian Elephant",
    "tusker": "Indian Elephant",
    "cheetah": "Asiatic Cheetah (Cheetha)",
    "leopard": "Indian Leopard",
    "snow leopard": "Snow Leopard",
    "peacock": "Indian Peafowl",
    "peafowl": "Indian Peafowl",
    "fox": "Indian Fox",
    "red fox": "Indian Fox",
    "grey fox": "Indian Fox",
    "kit fox": "Indian Fox",
    "bear": "Sloth Bear",
    "brown bear": "Sloth Bear",
    "sloth bear": "Sloth Bear",
    "king cobra": "King Cobra",
    "cobra": "King Cobra",
    "indian cobra": "King Cobra",
    "elephant": "Indian Elephant",
    # NOTE: Do NOT map generic 'bird' to 'Indian Peafowl', nor zebra/horse/owl
}


def resolve_species_id(db: Session, label: str) -> Optional[str]:
    """
    Case-insensitively match *label* against Species.common_name or scientific_name.

    4-tier resolution:
    0. Synonym lookup (ImageNet/COCO label -> database species name)
    1. Exact match on common_name / scientific_name
    2. Whole phrase word-boundary match (e.g. 'leopard' -> 'Indian Leopard')
    3. Word token match — must match a full word token in common_name / scientific_name
    """
    import re
    from sqlalchemy import func as sqlfunc
    from app.models.models import Species  # imported here to avoid circular deps

    clean_label = label.strip().lower()

    # 0. Synonym resolution — try full label, then individual words
    target_label = LABEL_SYNONYMS.get(clean_label)
    if target_label is None:
        target_label = LABEL_SYNONYMS.get(clean_label.replace("_", " "))
    if target_label is None:
        target_label = clean_label
    target_label = target_label.strip().lower()

    # 1. Exact match
    species = (
        db.query(Species)
        .filter(
            (sqlfunc.lower(Species.common_name) == target_label)
            | (sqlfunc.lower(Species.scientific_name) == target_label)
        )
        .first()
    )
    if species:
        return str(species.id)

    # Fetch all species records once to perform safe word-boundary / token matching
    all_species = db.query(Species).all()

    # 2. Whole phrase word-boundary match (e.g. target_label "leopard" in "Indian Leopard")
    for s in all_species:
        c_name = (s.common_name or "").lower()
        s_name = (s.scientific_name or "").lower()

        pattern = rf"\b{re.escape(target_label)}\b"
        if re.search(pattern, c_name) or re.search(pattern, s_name):
            return str(s.id)

    # 3. Word token fallback — check if any word in target_label matches a full word token in species names
    words = [w for w in re.split(r"\W+", target_label) if len(w) > 2]
    stop_words = {"the", "and", "bird", "common", "wild", "indian", "asian", "african"}
    search_tokens = [w for w in words if w not in stop_words]

    for token in search_tokens:
        for s in all_species:
            c_tokens = set(re.split(r"\W+", (s.common_name or "").lower()))
            s_tokens = set(re.split(r"\W+", (s.scientific_name or "").lower()))
            if token in c_tokens or token in s_tokens:
                return str(s.id)

    logger.warning(
        "No Species record found for label '%s' (resolved: '%s'). "
        "Detection saved with raw_label only.",
        label, target_label,
    )
    return None


