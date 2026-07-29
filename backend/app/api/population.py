"""
population.py
=============
FastAPI router for Population Estimation Engine:
- GET /api/population/site/{site_id}/summary
- GET /api/population/site/{site_id}/density
- GET /api/population/site/{site_id}/trends
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import MonitoringSite, User
from app.services import population_service

router = APIRouter(prefix="/api/population", tags=["population"])


@router.get("/site/{site_id}/summary")
def get_site_population_summary(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get per-species population counts, last detected dates, and 30d trends for a site."""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    return population_service.get_species_population_by_site(site_id, db)


@router.get("/site/{site_id}/density")
def get_site_population_density(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get per-species population density (detections per survey) for a site."""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    return population_service.get_population_density(site_id, db)


@router.get("/site/{site_id}/trends")
def get_site_population_trends(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get 6-month monthly population trend time-series per species for a site."""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    return population_service.get_population_trends(site_id, db)
