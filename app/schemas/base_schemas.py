# app/schemas/base_schemas.py
import warnings
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field

# Suppress the specific Pydantic warning about schema_json
warnings.filterwarnings(
    "ignore", message=".*schema_json.*shadows.*", category=UserWarning
)


# --- BusinessObject Schemas ---
class BusinessObjectBase(BaseModel):
    name: str
    status: Optional[str] = "new"
    data: Optional[Dict[str, Any]] = None


class BusinessObjectCreate(BusinessObjectBase):
    pass


class BusinessObject(BusinessObjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# --- Job Schemas ---
class JobBase(BaseModel):
    status: str
    summary_json: Optional[Dict[str, Any]] = None


class Job(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    completed_at: Optional[datetime] = None


# --- AuditLog Schemas ---
class AuditLogBase(BaseModel):
    user_email: str
    action: str
    entity_type: str
    entity_id: int
    summary: Optional[str] = None
    details_json: Optional[Dict[str, Any]] = None


class AuditLog(AuditLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime


# --- ExtractionConfiguration Schemas ---
class ExtractionConfigurationBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: str
    schema_json: Dict[str, Any]
    natural_language_description: str


class ExtractionConfiguration(ExtractionConfigurationBase):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int


# --- AiPolicy Schemas ---
class AiPolicyBase(BaseModel):
    name: str
    policy_type: str = "BASE"
    context_field: Optional[str] = None
    natural_language_rule: str
    is_active: bool = True


class AiPolicyCreate(AiPolicyBase):
    pass


class AiPolicy(AiPolicyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
