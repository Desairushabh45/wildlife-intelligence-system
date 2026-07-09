from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.geo import point_from_coords
from app.models.models import MonitoringSite, User
from app.schemas.site_schemas import SiteCreate, SiteOut, SiteUpdate
from app.services.site_service import site_coordinates

router = APIRouter(prefix="/api/sites", tags=["monitoring-sites"])

WRITE_ROLES = ("administrator", "forest_department_officer")


def _site_row_query(db: Session):
    return db.query(
        MonitoringSite,
        func.ST_Y(MonitoringSite.location).label("latitude"),
        func.ST_X(MonitoringSite.location).label("longitude"),
    )


def _to_out(site: MonitoringSite, latitude: float, longitude: float) -> SiteOut:
    return SiteOut(
        id=site.id,
        name=site.name,
        habitat_type=site.habitat_type,
        protected_area=site.protected_area,
        device_type=site.device_type,
        latitude=latitude,
        longitude=longitude,
        created_at=site.created_at,
    )


def _get_site_out(db: Session, site_id: str) -> SiteOut:
    row = _site_row_query(db).filter(MonitoringSite.id == site_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Site not found")
    site, latitude, longitude = row
    return _to_out(site, latitude, longitude)


@router.post("/", response_model=SiteOut, status_code=201)
def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*WRITE_ROLES)),
):
    site = MonitoringSite(
        name=payload.name,
        habitat_type=payload.habitat_type,
        protected_area=payload.protected_area,
        device_type=payload.device_type,
        location=point_from_coords(payload.latitude, payload.longitude),
        created_by=current_user.id,
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    return _get_site_out(db, site.id)


@router.get("/", response_model=List[SiteOut])
def list_sites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = _site_row_query(db).order_by(MonitoringSite.created_at.desc()).all()
    return [_to_out(site, latitude, longitude) for site, latitude, longitude in rows]


@router.get("/{site_id}", response_model=SiteOut)
def get_site(site_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_site_out(db, site_id)


@router.put("/{site_id}", response_model=SiteOut)
def update_site(
    site_id: str,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*WRITE_ROLES)),
):
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    updates = payload.model_dump(exclude_unset=True)
    latitude = updates.pop("latitude", None)
    longitude = updates.pop("longitude", None)
    for field, value in updates.items():
        setattr(site, field, value)

    if latitude is not None or longitude is not None:
        current_lat, current_lng = site_coordinates(db, site_id)
        site.location = point_from_coords(
            latitude if latitude is not None else current_lat,
            longitude if longitude is not None else current_lng,
        )

    db.commit()
    db.refresh(site)
    return _get_site_out(db, site.id)


@router.delete("/{site_id}", status_code=204)
def delete_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrator")),
):
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(site)
    db.commit()
