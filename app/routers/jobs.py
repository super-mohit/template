# File: app/routers/jobs.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Job
from app import schemas

router = APIRouter()

@router.get("/jobs/{job_id}", response_model=schemas.Job, tags=["Jobs"])
def get_job_status(job_id: int, db: Session = Depends(get_db)):
    """Get the status of a specific job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

