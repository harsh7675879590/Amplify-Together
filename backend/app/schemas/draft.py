from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime


class DraftSaveRequest(BaseModel):
    current_step: int = Field(default=1, ge=1, le=5)
    data: Dict[str, Any] = Field(default_factory=dict)


class DraftResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    current_step: int
    data: Dict[str, Any]
    updated_at: datetime

    class Config:
        from_attributes = True


class AIDraftFromTextRequest(BaseModel):
    prompt: str
