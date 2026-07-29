"""
habitat.py
==========
FastAPI router for Habitat Intelligence Engine:
- GET /api/habitat/site/{site_id}/score
- GET /api/habitat/sites/rankings
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import MonitoringSite, User
from app.services import habitat_service

router = APIRouter(prefix="/api/habitat", tags=["habitat"])


@router.get("/site/{site_id}/score")
def get_habitat_score(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Compute 5-component weighted habitat score and classification for a monitoring site."""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    return habitat_service.compute_habitat_score(site_id, db)


@router.get("/sites/rankings")
def get_all_sites_rankings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get all monitoring sites ranked by habitat score descending."""
    return habitat_service.get_site_rankings(db)
