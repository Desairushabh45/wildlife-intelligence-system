from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.models import Species, User
from app.schemas.species_schemas import SpeciesCreate, SpeciesOut, SpeciesUpdate
from app.services.species_service import ensure_unique_scientific_name, get_species_or_404

router = APIRouter(prefix="/api/species", tags=["species"])

ADMIN_ONLY = ("administrator",)


@router.post("/", response_model=SpeciesOut, status_code=201)
def create_species(
    payload: SpeciesCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ONLY)),
):
    ensure_unique_scientific_name(db, payload.scientific_name)
    species = Species(
        scientific_name=payload.scientific_name,
        common_name=payload.common_name,
        taxonomic_class=payload.taxonomic_class,
        conservation_status=payload.conservation_status,
        is_endangered=payload.is_endangered,
    )
    db.add(species)
    db.commit()
    db.refresh(species)
    return species


@router.get("/", response_model=List[SpeciesOut])
def list_species(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Species).order_by(Species.common_name).all()


@router.get("/{species_id}", response_model=SpeciesOut)
def get_species(
    species_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_species_or_404(db, species_id)


@router.put("/{species_id}", response_model=SpeciesOut)
def update_species(
    species_id: str,
    payload: SpeciesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ONLY)),
):
    species = get_species_or_404(db, species_id)
    updates = payload.model_dump(exclude_unset=True)

    if "scientific_name" in updates:
        ensure_unique_scientific_name(db, updates["scientific_name"], exclude_id=species_id)

    for field, value in updates.items():
        setattr(species, field, value)

    db.commit()
    db.refresh(species)
    return species


@router.delete("/{species_id}", status_code=204)
def delete_species(
    species_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ONLY)),
):
    species = get_species_or_404(db, species_id)
    db.delete(species)
    db.commit()
