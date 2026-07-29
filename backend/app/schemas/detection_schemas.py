from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict


class DetectionOut(BaseModel):
    id: str
    observation_id: str
    species_id: Optional[str] = None
    species_name: Optional[str] = None  # Populated via join when available
    species_scientific_name: Optional[str] = None  # Scientific name from Species table
    confidence: float
    count: int
    created_at: datetime

    # Bounding box in original image pixel coords (image detections only)
    bbox: Optional[Dict[str, Any]] = None  # {"x1": f, "y1": f, "x2": f, "y2": f}

    # Raw model label when no species record matched (YAMNet audio fallback)
    raw_label: Optional[str] = None

    # Which AI model produced this result: "yolo", "birdnet", "yamnet"
    detection_source: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
