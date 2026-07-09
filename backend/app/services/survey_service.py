from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import MonitoringSite


def ensure_site_exists(db: Session, site_id: str) -> MonitoringSite:
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Referenced site does not exist")
    return site
