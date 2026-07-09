from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import Species


def get_species_or_404(db: Session, species_id: str) -> Species:
    """Return a Species by ID or raise 404."""
    species = db.query(Species).filter(Species.id == species_id).first()
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    return species


def ensure_unique_scientific_name(db: Session, scientific_name: str, exclude_id: str | None = None) -> None:
    """Raise 409 if a species with the given scientific_name already exists."""
    query = db.query(Species).filter(Species.scientific_name == scientific_name)
    if exclude_id:
        query = query.filter(Species.id != exclude_id)
    if query.first():
        raise HTTPException(
            status_code=409,
            detail=f"A species with scientific name '{scientific_name}' already exists",
        )
