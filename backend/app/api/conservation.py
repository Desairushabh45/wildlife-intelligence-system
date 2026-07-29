"""
conservation.py
===============
FastAPI router for Conservation Recommendation Engine:
- GET /api/conservation/site/{site_id}/recommendations
- GET /api/conservation/recommendations/all
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import MonitoringSite, User
from app.services import conservation_service

router = APIRouter(prefix="/api/conservation", tags=["conservation"])


@router.get("/site/{site_id}/recommendations")
def get_site_recommendations(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get rule-based conservation recommendations for a specific site."""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    return conservation_service.generate_recommendations(site_id, db)


@router.get("/recommendations/all")
def get_all_conservation_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get all conservation recommendations across all sites, sorted by priority."""
    return conservation_service.get_all_recommendations(db)
