from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.geo import coords_from_point
from app.models.models import Detection, MonitoringSite, Observation, Species, Survey, User
from app.services import habitat_service

router = APIRouter(prefix="/api/gis", tags=["gis"])


@router.get("/sites")
def get_gis_sites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get GIS spatial data for all monitoring sites including lat/lon,
    habitat score/grade, and species richness metrics.
    """
    sites = db.query(MonitoringSite).all()
    results = []

    for site in sites:
        lat, lon = coords_from_point(site.location)
        hab_data = habitat_service.compute_habitat_score(site.id, db)

        # Calculate distinct species count and endangered count at this site
        detections = (
            db.query(Detection)
            .join(Observation, Detection.observation_id == Observation.id)
            .join(Survey, Observation.survey_id == Survey.id)
            .filter(Survey.site_id == site.id)
            .all()
        )

        distinct_species = set()
        endangered_species = set()

        for det in detections:
            if det.species_id:
                distinct_species.add(det.species_id)
                species_obj = db.query(Species).filter(Species.id == det.species_id).first()
                if species_obj and species_obj.is_endangered:
                    endangered_species.add(det.species_id)

        results.append(
            {
                "id": site.id,
                "name": site.name,
                "latitude": lat,
                "longitude": lon,
                "habitat_type": site.habitat_type,
                "protected_area": site.protected_area,
                "habitat_score": hab_data.get("habitat_score", 0.0),
                "habitat_grade": hab_data.get("grade", "F"),
                "species_count": len(distinct_species),
                "endangered_species_count": len(endangered_species),
            }
        )

    return results


@router.get("/detections")
def get_gis_detections(
    species_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get GIS spatial points for individual detection events, joined through
    Observation -> Survey -> MonitoringSite.
    Supports filtering by species_id, date_from, date_to.
    """
    query = (
        db.query(Detection, Observation, Survey, MonitoringSite)
        .join(Observation, Detection.observation_id == Observation.id)
        .join(Survey, Observation.survey_id == Survey.id)
        .join(MonitoringSite, Survey.site_id == MonitoringSite.id)
    )

    if species_id:
        query = query.filter(Detection.species_id == species_id)

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.filter(Detection.created_at >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.filter(Detection.created_at <= dt_to)
        except ValueError:
            pass

    rows = query.order_by(Detection.created_at.desc()).limit(200).all()
    results = []

    for det, obs, survey, site in rows:
        lat, lon = coords_from_point(site.location)
        species_obj = None
        if det.species_id:
            species_obj = db.query(Species).filter(Species.id == det.species_id).first()

        results.append(
            {
                "id": det.id,
                "species_id": det.species_id,
                "species_name": species_obj.common_name if species_obj else (det.raw_label or "Unknown"),
                "species_scientific_name": species_obj.scientific_name if species_obj else None,
                "site_id": site.id,
                "site_name": site.name,
                "latitude": lat,
                "longitude": lon,
                "confidence": det.confidence,
                "count": det.count,
                "detected_at": det.created_at.isoformat(),
                "is_endangered": species_obj.is_endangered if species_obj else False,
                "conservation_status": species_obj.conservation_status.value if species_obj else "unknown",
            }
        )

    return results
