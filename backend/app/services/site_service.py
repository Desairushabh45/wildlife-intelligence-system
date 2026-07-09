from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import MonitoringSite


def site_coordinates(db: Session, site_id: str) -> tuple[float, float]:
    return (
        db.query(func.ST_Y(MonitoringSite.location), func.ST_X(MonitoringSite.location))
        .filter(MonitoringSite.id == site_id)
        .one()
    )
