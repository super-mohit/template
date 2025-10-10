# File: app/routers/ai_policies.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import AiPolicy
from app import schemas

router = APIRouter()

@router.get("/ai-policies/", response_model=List[schemas.AiPolicy], tags=["AI Policies"])
def read_policies(db: Session = Depends(get_db)):
    return db.query(AiPolicy).all()

@router.post("/ai-policies/", response_model=schemas.AiPolicy, tags=["AI Policies"])
def create_policy(policy: schemas.AiPolicyCreate, db: Session = Depends(get_db)):
    db_policy = AiPolicy(**policy.model_dump())
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.put("/ai-policies/{policy_id}", response_model=schemas.AiPolicy, tags=["AI Policies"])
def update_policy(policy_id: int, policy: schemas.AiPolicyCreate, db: Session = Depends(get_db)):
    db_policy = db.query(AiPolicy).filter(AiPolicy.id == policy_id).first()
    if not db_policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    for var, value in vars(policy).items():
        setattr(db_policy, var, value) if value else None
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.delete("/ai-policies/{policy_id}", status_code=204, tags=["AI Policies"])
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    db_policy = db.query(AiPolicy).filter(AiPolicy.id == policy_id).first()
    if not db_policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(db_policy)
    db.commit()
    return

