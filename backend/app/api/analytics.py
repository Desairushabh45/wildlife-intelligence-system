"""
analytics.py
============
Biodiversity analytics and survey report endpoints.

GET /api/surveys/{id}/biodiversity  — Shannon index + species breakdown
GET /api/sites/{id}/biodiversity    — Same, aggregated across all site surveys
GET /api/surveys/{id}/report        — Full report: survey info + obs count +
                                      detections by species + biodiversity score
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Detection, MonitoringSite, Observation, Species, Survey, User
from app.services import biodiversity_service

router = APIRouter(tags=["analytics"])


# ---------------------------------------------------------------------------
# Biodiversity endpoints
# ---------------------------------------------------------------------------

@router.get("/api/surveys/{survey_id}/biodiversity")
def survey_biodiversity(
    survey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return Shannon-Wiener diversity index and species breakdown for a survey.

    Testable immediately: manually insert rows into the detections table (even
    without running real inference) to see the analytics in action.
    """
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    return biodiversity_service.compute_shannon_index(survey_id, db)


@router.get("/api/sites/{site_id}/biodiversity")
def site_biodiversity(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return aggregate biodiversity metrics across all surveys at a site.
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return biodiversity_service.compute_site_biodiversity(site_id, db)


# ---------------------------------------------------------------------------
# Section 4: Survey report endpoint
# ---------------------------------------------------------------------------

@router.get("/api/surveys/{survey_id}/report")
def survey_report(
    survey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Combined read-only summary for a survey:
    - Survey metadata
    - Observation count (image vs audio breakdown)
    - All detections grouped by species with counts
    - Biodiversity score (Shannon index + richness)
    """
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    # Observation counts
    obs_query = db.query(Observation).filter(Observation.survey_id == survey_id)
    observations_total = obs_query.count()
    image_count = obs_query.filter(Observation.observation_type == "image").count()
    audio_count = obs_query.filter(Observation.observation_type == "audio").count()

    # Detections grouped by species (for display table)
    detection_rows = (
        db.query(
            Detection.species_id,
            func.count(Detection.id).label("detection_count"),
            func.avg(Detection.confidence).label("avg_confidence"),
        )
        .join(Observation, Observation.id == Detection.observation_id)
        .filter(Observation.survey_id == survey_id)
        .group_by(Detection.species_id)
        .all()
    )

    detections_by_species: List[Dict[str, Any]] = []
    for row in sorted(detection_rows, key=lambda r: -r.detection_count):
        if row.species_id:
            sp = db.query(Species).filter(Species.id == row.species_id).first()
            sp_id = str(row.species_id)
            sp_name = sp.common_name if sp else "Unknown"
            sci_name = sp.scientific_name if sp else None
            is_endangered = sp.is_endangered if sp else False
            status = (
                (sp.conservation_status.value if hasattr(sp.conservation_status, "value") else str(sp.conservation_status))
                if sp and sp.conservation_status else None
            )
        else:
            sp_id = None
            sp_name = "Unclassified / Raw Detection"
            sci_name = None
            is_endangered = False
            status = None

        detections_by_species.append(
            {
                "species_id": sp_id,
                "species_name": sp_name,
                "scientific_name": sci_name,
                "is_endangered": is_endangered,
                "conservation_status": status,
                "detection_count": int(row.detection_count),
                "avg_confidence": round(float(row.avg_confidence), 4),
            }
        )

    biodiversity = biodiversity_service.compute_shannon_index(survey_id, db)

    site = db.query(MonitoringSite).filter(MonitoringSite.id == survey.site_id).first()

    return {
        "survey": {
            "id": survey.id,
            "site_id": survey.site_id,
            "site_name": site.name if site else None,
            "start_date": survey.start_date.isoformat() if survey.start_date else None,
            "end_date": survey.end_date.isoformat() if survey.end_date else None,
            "notes": survey.notes,
            "created_at": survey.created_at.isoformat() if survey.created_at else None,
        },
        "observations": {
            "total": observations_total,
            "image_count": image_count,
            "audio_count": audio_count,
        },
        "detections_by_species": detections_by_species,
        "biodiversity": biodiversity,
    }
