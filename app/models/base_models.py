# app/models/base_models.py
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class BusinessObject(Base):
    __tablename__ = "business_objects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, default="new", index=True)
    data = Column(JSON) # Flexible field for domain-specific data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    audit_logs = relationship("AuditLog", back_populates="business_object")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="pending", index=True)
    summary_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_email = Column(String, default="System")
    action = Column(String, index=True)
    entity_type = Column(String, index=True)
    entity_id = Column(Integer, index=True)
    summary = Column(String, nullable=True)
    details_json = Column(JSON, nullable=True)
    
    business_object_id = Column(Integer, ForeignKey("business_objects.id"), nullable=True)
    business_object = relationship("BusinessObject", back_populates="audit_logs")

