from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SurveyCreate(BaseModel):
    site_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    notes: Optional[str] = None


class SurveyUpdate(BaseModel):
    site_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    notes: Optional[str] = None


class SurveyOut(BaseModel):
    id: str
    site_id: str
    created_by: str
    start_date: datetime
    end_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
