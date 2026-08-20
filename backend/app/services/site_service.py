from sqlalchemy.orm import Session

from app.models.models import MonitoringSite


def site_coordinates(db: Session, site_id: str) -> tuple[float, float]:
    """Returns (latitude, longitude) for the given site."""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if site is None:
        return (0.0, 0.0)
    return (site.latitude or 0.0, site.longitude or 0.0)
