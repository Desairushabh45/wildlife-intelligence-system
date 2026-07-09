from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.models import DeviceType


class SiteCreate(BaseModel):
    name: str
    habitat_type: Optional[str] = None
    protected_area: Optional[str] = None
    device_type: DeviceType
    latitude: float
    longitude: float


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    habitat_type: Optional[str] = None
    protected_area: Optional[str] = None
    device_type: Optional[DeviceType] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SiteOut(BaseModel):
    id: str
    name: str
    habitat_type: Optional[str]
    protected_area: Optional[str]
    device_type: DeviceType
    latitude: float
    longitude: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
