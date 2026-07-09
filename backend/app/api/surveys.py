from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.models import Survey, User
from app.schemas.survey_schemas import SurveyCreate, SurveyOut, SurveyUpdate
from app.services.survey_service import ensure_site_exists

router = APIRouter(prefix="/api/surveys", tags=["surveys"])

WRITE_ROLES = ("administrator", "forest_department_officer")


@router.post("/", response_model=SurveyOut, status_code=201)
def create_survey(
    payload: SurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*WRITE_ROLES)),
):
    ensure_site_exists(db, payload.site_id)
    survey = Survey(
        site_id=payload.site_id,
        created_by=current_user.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        notes=payload.notes,
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return survey


@router.get("/", response_model=List[SurveyOut])
def list_surveys(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Survey).order_by(Survey.created_at.desc()).all()


@router.get("/by-site/{site_id}", response_model=List[SurveyOut])
def list_surveys_by_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_site_exists(db, site_id)
    return (
        db.query(Survey)
        .filter(Survey.site_id == site_id)
        .order_by(Survey.start_date.desc())
        .all()
    )


@router.get("/{survey_id}", response_model=SurveyOut)
def get_survey(survey_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


@router.put("/{survey_id}", response_model=SurveyOut)
def update_survey(
    survey_id: str,
    payload: SurveyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*WRITE_ROLES)),
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    updates = payload.model_dump(exclude_unset=True)
    if "site_id" in updates:
        ensure_site_exists(db, updates["site_id"])

    for field, value in updates.items():
        setattr(survey, field, value)

    db.commit()
    db.refresh(survey)
    return survey


@router.delete("/{survey_id}", status_code=204)
def delete_survey(
    survey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrator")),
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    db.delete(survey)
    db.commit()
