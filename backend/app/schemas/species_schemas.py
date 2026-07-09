from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.models import ConservationStatus


class SpeciesCreate(BaseModel):
    scientific_name: str
    common_name: str
    taxonomic_class: Optional[str] = None
    conservation_status: ConservationStatus = ConservationStatus.LEAST_CONCERN
    is_endangered: bool = False


class SpeciesUpdate(BaseModel):
    scientific_name: Optional[str] = None
    common_name: Optional[str] = None
    taxonomic_class: Optional[str] = None
    conservation_status: Optional[ConservationStatus] = None
    is_endangered: Optional[bool] = None


class SpeciesOut(BaseModel):
    id: str
    scientific_name: str
    common_name: str
    taxonomic_class: Optional[str]
    conservation_status: ConservationStatus
    is_endangered: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
