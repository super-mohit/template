# app/schemas/base_schemas.py
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# --- BusinessObject Schemas ---
class BusinessObjectBase(BaseModel):
    name: str
    status: Optional[str] = "new"
    data: Optional[Dict[str, Any]] = None

class BusinessObjectCreate(BusinessObjectBase):
    pass

class BusinessObject(BusinessObjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Job Schemas ---
class JobBase(BaseModel):
    status: str
    summary_json: Optional[Dict[str, Any]] = None

class Job(JobBase):
    id: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# --- AuditLog Schemas ---
class AuditLogBase(BaseModel):
    user_email: str
    action: str
    entity_type: str
    entity_id: int
    summary: Optional[str] = None
    details_json: Optional[Dict[str, Any]] = None

class AuditLog(AuditLogBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

