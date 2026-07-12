from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ObservationOut(BaseModel):
    id: str
    survey_id: str
    observation_type: str
    file_path: str
    mongo_metadata_id: Optional[str]
    notes: Optional[str]
    uploaded_by: str
    captured_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
