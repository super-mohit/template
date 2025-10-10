# app/utils/auditing.py
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.models import AuditLog

def log_audit_event(
    db: Session,
    user_email: str,
    action: str,
    entity_type: str,
    entity_id: int,
    summary: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
):
    """
    Creates and adds an audit log entry to the database session.
    The caller is responsible for committing the session.
    """
    audit_log = AuditLog(
        user_email=user_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        details_json=details or {},
    )
    db.add(audit_log)

