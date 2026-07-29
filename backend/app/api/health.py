"""
health.py
=========
FastAPI router for Wildlife Health Scoring Engine:
- GET /api/health/site/{site_id}
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import MonitoringSite, User
from app.services import health_service

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/site/{site_id}")
def get_site_ecosystem_health(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Compute ecosystem health score and component breakdown for a monitoring site."""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    return health_service.compute_ecosystem_health_score(site_id, db)
