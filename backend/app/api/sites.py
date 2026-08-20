from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.models import MonitoringSite, User
from app.schemas.site_schemas import SiteCreate, SiteOut, SiteUpdate

router = APIRouter(prefix="/api/sites", tags=["monitoring-sites"])

WRITE_ROLES = ("administrator", "forest_department_officer")


def _build_site_out(site: MonitoringSite) -> SiteOut:
    return SiteOut(
        id=str(site.id),
        name=site.name,
        habitat_type=site.habitat_type,
        protected_area=site.protected_area,
        device_type=site.device_type,
        latitude=site.latitude,
        longitude=site.longitude,
        created_at=site.created_at,
    )


def _get_site_or_404(db: Session, site_id: str) -> MonitoringSite:
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


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
        latitude=payload.latitude,
        longitude=payload.longitude,
        created_by=current_user.id,
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    return _build_site_out(site)


@router.get("/", response_model=List[SiteOut])
def list_sites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sites = db.query(MonitoringSite).order_by(MonitoringSite.created_at.desc()).all()
    return [_build_site_out(site) for site in sites]


@router.get("/{site_id}", response_model=SiteOut)
def get_site(site_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = _get_site_or_404(db, site_id)
    return _build_site_out(site)


@router.put("/{site_id}", response_model=SiteOut)
def update_site(
    site_id: str,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*WRITE_ROLES)),
):
    site = _get_site_or_404(db, site_id)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(site, field, value)

    db.commit()
    db.refresh(site)
    return _build_site_out(site)


@router.delete("/{site_id}", status_code=204)
def delete_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrator")),
):
    site = _get_site_or_404(db, site_id)
    db.delete(site)
    db.commit()
