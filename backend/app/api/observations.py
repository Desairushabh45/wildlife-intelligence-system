import logging
import os
import uuid
import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.mongo import get_observations_collection
from app.models.models import Detection, Observation, ObservationType, Species, Survey, User
from app.schemas.detection_schemas import DetectionOut
from app.schemas.observation_schemas import ObservationOut
from app.services import detection_service

logger = logging.getLogger("wildlife.observations")

router = APIRouter(prefix="/api/observations", tags=["observations"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

@router.post("/", response_model=ObservationOut, status_code=201)
def create_observation(
    survey_id: str = Form(...),
    observation_type: str = Form(...),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate survey
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    # Validate type
    if observation_type not in ["image", "audio"]:
        raise HTTPException(status_code=400, detail="Invalid observation type")

    # Validate file size (e.g. 20MB limit)
    contents = file.file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    # Validate file extension/type roughly
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if observation_type == "image" and ext not in [".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Images must be jpg/jpeg/png")
    if observation_type == "audio" and ext not in [".mp3", ".wav"]:
        raise HTTPException(status_code=400, detail="Audio must be mp3/wav")

    # Save to disk
    sub_dir = "images" if observation_type == "image" else "audio"
    file_id = str(uuid.uuid4())
    save_filename = f"{file_id}{ext}"
    local_path = os.path.join(UPLOAD_DIR, sub_dir, save_filename)

    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    with open(local_path, "wb") as f:
        f.write(contents)

    file_path = f"/uploads/{sub_dir}/{save_filename}"

    # Insert into MongoDB
    mongo_collection = get_observations_collection()
    mongo_id = None
    if mongo_collection is not None:
        try:
            metadata = {
                "original_filename": filename,
                "content_type": file.content_type,
                "size_bytes": len(contents),
                "upload_timestamp": datetime.datetime.utcnow(),
                "analysis_results": {}
            }
            res = mongo_collection.insert_one(metadata)
            mongo_id = str(res.inserted_id)
        except Exception as e:
            logger.warning(f"Could not save metadata to MongoDB: {e}")

    # Insert into Postgres
    observation = Observation(
        survey_id=survey_id,
        observation_type=ObservationType(observation_type),
        file_path=file_path,
        mongo_metadata_id=mongo_id,
        notes=notes,
        uploaded_by=current_user.id,
        captured_at=datetime.datetime.utcnow()
    )
    db.add(observation)
    db.commit()
    db.refresh(observation)

    return observation


@router.get("/", response_model=List[ObservationOut])
def list_observations(
    survey_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Observation)
    if survey_id:
        query = query.filter(Observation.survey_id == survey_id)
    return query.order_by(Observation.created_at.desc()).all()


@router.get("/{observation_id}", response_model=ObservationOut)
def get_observation(
    observation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    observation = db.query(Observation).filter(Observation.id == observation_id).first()
    if not observation:
        raise HTTPException(status_code=404, detail="Observation not found")
    return observation


@router.delete("/{observation_id}", status_code=204)
def delete_observation(
    observation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    observation = db.query(Observation).filter(Observation.id == observation_id).first()
    if not observation:
        raise HTTPException(status_code=404, detail="Observation not found")

    if current_user.role != "administrator" and str(observation.uploaded_by) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this observation")

    # Delete from MongoDB
    if observation.mongo_metadata_id:
        mongo_collection = get_observations_collection()
        if mongo_collection is not None:
            from bson.objectid import ObjectId
            try:
                mongo_collection.delete_one({"_id": ObjectId(observation.mongo_metadata_id)})
            except Exception:
                pass  # Ignore invalid ObjectId or other mongo errors during delete

    # Delete file from disk
    if observation.file_path.startswith("/uploads/"):
        # Map the url path to the local docker path
        local_path = os.path.join("/app", observation.file_path.lstrip("/"))
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError:
                pass

    # Delete from Postgres
    db.delete(observation)
    db.commit()


# ---------------------------------------------------------------------------
# Detection endpoints
# ---------------------------------------------------------------------------

def _resolve_local_path(file_path: str) -> str:
    """Convert a stored file_path like /uploads/images/abc.jpg to the real
    filesystem path."""
    rel = file_path.lstrip("/")
    if rel.startswith("uploads/"):
        rel = rel[len("uploads/"):]
    return os.path.join(UPLOAD_DIR, rel)


def _build_detection_out(detection: Detection, db: Session) -> DetectionOut:
    """Enrich a Detection ORM row with the species common_name and all new fields."""
    species = None
    if detection.species_id:
        species = db.query(Species).filter(Species.id == detection.species_id).first()

    # Build bbox dict if coordinates exist on the row
    bbox = None
    if all(v is not None for v in [detection.bbox_x1, detection.bbox_y1, detection.bbox_x2, detection.bbox_y2]):
        bbox = {
            "x1": detection.bbox_x1,
            "y1": detection.bbox_y1,
            "x2": detection.bbox_x2,
            "y2": detection.bbox_y2,
        }

    return DetectionOut(
        id=detection.id,
        observation_id=detection.observation_id,
        species_id=detection.species_id,
        species_name=species.common_name if species else detection.raw_label,
        species_scientific_name=species.scientific_name if species else None,
        confidence=detection.confidence,
        count=detection.count,
        created_at=detection.created_at,
        bbox=bbox,
        raw_label=detection.raw_label,
        detection_source=detection.detection_source,
    )


@router.post("/{observation_id}/detect", response_model=List[DetectionOut], status_code=201)
def run_detection(
    observation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run AI species detection on an observation's file.

    Image observations → YOLOv8 (returns species + confidence + bbox).
    Audio observations:
        Step 1: Run BirdNET.
        Step 2: If BirdNET returns results → use them (detection_source="birdnet").
        Step 3: If BirdNET returns nothing → run YAMNet fallback (detection_source="yamnet").

    For audio detections where the label cannot be resolved to a Species record:
    - species_id is stored as NULL
    - raw_label stores the original model output label
    - detection_source records which model ran
    """
    observation = db.query(Observation).filter(Observation.id == observation_id).first()
    if not observation:
        raise HTTPException(status_code=404, detail="Observation not found")

    obs_type = observation.observation_type
    local_path = _resolve_local_path(observation.file_path)

    if obs_type == ObservationType.IMAGE:
        raw_results = detection_service.run_image_detection(local_path)
        default_source = "yolo"

    elif obs_type == ObservationType.AUDIO:
        # Run both Avian (BirdNET) and General AudioSet / Mammal Bioacoustics (YAMNet) analysis
        bird_results = detection_service.run_audio_detection(local_path)
        yamnet_results = detection_service.run_yamnet_detection(local_path)

        combined_results = []
        seen_labels = set()
        for res in sorted(bird_results + yamnet_results, key=lambda x: x.get("confidence", 0), reverse=True):
            lbl = res.get("species_label")
            if lbl and lbl not in seen_labels:
                seen_labels.add(lbl)
                combined_results.append(res)

        raw_results = combined_results
        default_source = "yamnet" if not bird_results and yamnet_results else "birdnet"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported observation type for detection: {obs_type}",
        )

    # Clear old detections for this observation before adding fresh results
    db.query(Detection).filter(Detection.observation_id == observation_id).delete()

    created_detections: List[Detection] = []

    # Handle both list and dict response structures (such as demo mode mock_response)
    results_list = raw_results.get("detections", []) if isinstance(raw_results, dict) else (raw_results or [])

    for result in results_list:
        label = result.get("species_label") or result.get("species") or "Unknown Species"
        confidence = float(result.get("confidence", 0.75))
        # detection_source comes from the service function; fall back to default_source
        source = result.get("detection_source", default_source)

        species_id = detection_service.resolve_species_id(db, label)

        # Build detection row — species_id may be None for unmatched audio labels
        det_kwargs: dict = {
            "observation_id": observation_id,
            "species_id": species_id,
            "confidence": confidence,
            "count": int(result.get("count", 1)),
            "raw_label": label,
            "detection_source": source,
        }

        # For image detections, persist bbox coordinates if present
        if obs_type == ObservationType.IMAGE:
            bbox = result.get("bbox")
            if bbox:
                det_kwargs["bbox_x1"] = bbox.get("x1")
                det_kwargs["bbox_y1"] = bbox.get("y1")
                det_kwargs["bbox_x2"] = bbox.get("x2")
                det_kwargs["bbox_y2"] = bbox.get("y2")

        detection = Detection(**det_kwargs)
        db.add(detection)
        created_detections.append(detection)

    db.commit()
    for det in created_detections:
        db.refresh(det)

    logger.info(
        "Detection run on observation %s (%s): %d detections created (source=%s).",
        observation_id,
        obs_type,
        len(created_detections),
        default_source,
    )

    return [_build_detection_out(det, db) for det in created_detections]


@router.get("/{observation_id}/detections", response_model=List[DetectionOut])
def list_detections(
    observation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all existing detections for a given observation."""
    observation = db.query(Observation).filter(Observation.id == observation_id).first()
    if not observation:
        raise HTTPException(status_code=404, detail="Observation not found")

    detections = (
        db.query(Detection)
        .filter(Detection.observation_id == observation_id)
        .order_by(Detection.confidence.desc())
        .all()
    )
    return [_build_detection_out(det, db) for det in detections]
