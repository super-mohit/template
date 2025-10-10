# File: app/routers/ingestion.py
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.modules.ingestion import service as ingestion_service

router = APIRouter()

def background_process_files(db: Session, files: List[UploadFile]):
    """Wrapper to be run in the background."""
    for file in files:
        content = file.file.read()
        ingestion_service.process_and_save_file(db, content, file.content_type)

@router.post("/ingestion/upload", status_code=202, tags=["Ingestion"])
def upload_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    background_tasks.add_task(background_process_files, db, files)
    return {"message": f"{len(files)} files received and queued for processing."}

