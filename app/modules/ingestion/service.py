# File: app/modules/ingestion/service.py
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from . import extractor
from app.models import Job, BusinessObject, ExtractionConfiguration
from app.modules.ai_policies import service as ai_policy_service

log = logging.getLogger(__name__)

def build_dynamic_prompt(db: Session) -> str:
    """Builds the AI prompt with all known schemas from the database."""
    base_prompt = "You are a data extraction engine. Analyze the attached file and return a single JSON object. First, identify the document type from the available schemas, then extract the data according to that schema. The `document_type` field in your JSON output MUST match one of the schema names provided. Schemas:\n"
    
    configs = db.query(ExtractionConfiguration).all()
    if not configs:
        return base_prompt + "No schemas defined."
        
    for config in configs:
        base_prompt += f"\n- Schema Name: '{config.name}'\n"
        base_prompt += f"  Description: {config.natural_language_description}\n"
        base_prompt += f"  JSON Structure: {json.dumps(config.schema_json)}\n"
        
    return base_prompt

def process_and_save_file(db: Session, file_content: bytes, file_mime_type: str):
    """Orchestrates the extraction and saving of a single file."""
    prompt = build_dynamic_prompt(db)
    extracted_data = extractor.extract_data_from_file(file_content, file_mime_type, prompt)

    if not extracted_data or "document_type" not in extracted_data:
        log.error("Extraction failed or did not return a document type.")
        # Here you would create a FailedIngestion record
        return

    doc_type = extracted_data.pop("document_type", "unknown")
    
    # Create a new BusinessObject
    new_object = BusinessObject(
        name=f"{doc_type} - {datetime.utcnow().isoformat()}",
        status="ingested",
        data={"document_type": doc_type, "extracted_fields": extracted_data}
    )
    db.add(new_object)
    db.commit()
    db.refresh(new_object)  # Get the ID after commit
    
    log.info(f"Successfully ingested BusinessObject ID: {new_object.id}. Triggering AI analysis...")

    # Trigger the AI brain to analyze the new object
    ai_policy_service.get_ai_decision(db, new_object)

