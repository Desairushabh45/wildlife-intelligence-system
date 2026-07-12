import os
import uuid
import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.mongo import get_observations_collection
from app.models.models import Observation, Survey, User, ObservationType
from app.schemas.observation_schemas import ObservationOut

router = APIRouter(prefix="/api/observations", tags=["observations"])

UPLOAD_DIR = "/app/uploads"
# We're running in a docker container mapped to backend:/app, so /app/uploads maps to backend/uploads

@router.post("/", response_model=ObservationOut, status_code=201)
async def create_observation(
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
    contents = await file.read()
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
        metadata = {
            "original_filename": filename,
            "content_type": file.content_type,
            "size_bytes": len(contents),
            "upload_timestamp": datetime.datetime.utcnow(),
            "analysis_results": {}
        }
        res = mongo_collection.insert_one(metadata)
        mongo_id = str(res.inserted_id)

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
                pass # Ignore invalid ObjectId or other mongo errors during delete

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
