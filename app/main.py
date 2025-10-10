# app/main.py
import logging
import os
from datetime import datetime, timezone
import geoip2.database
from fastapi import APIRouter, Depends, FastAPI, Header, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio
from contextlib import asynccontextmanager

# Import new models and schemas
from . import schemas
from .models import BusinessObject
from .utils.auditing import log_audit_event

from .core.database import get_db, Base, engine
from .core.logging_config import setup_logging
from .security import authz_engine, get_current_user, verify_access

log = logging.getLogger(__name__)

try:
    geoip_reader = geoip2.database.Reader("/app/app/GeoLite2-Country.mmdb")
except FileNotFoundError:
    geoip_reader = None
    log.warning("GeoLite2-Country.mmdb not found. Geofencing will default to 'US'.")

# --- Scheduler Implementation ---
async def recurring_background_tasks():
    log.info("Proactive Engine Scheduler started.")
    while True:
        log.info("Scheduler running... (Future jobs will be triggered here)")
        await asyncio.sleep(300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Application starting up...")
    # Create all tables on startup if they don't exist
    Base.metadata.create_all(bind=engine)
    task = asyncio.create_task(recurring_background_tasks())
    yield
    log.info("Application shutting down...")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        log.info("Background task scheduler cancelled successfully.")

app = FastAPI(title="AI Command Center API", lifespan=lifespan)

@app.on_event("startup")
async def startup_event():
    setup_logging()
    log.info("Logging configured.")

base_path = os.getenv("BASE_PATH", "")
api_router = APIRouter(prefix=f"{base_path}/api", dependencies=[Depends(verify_access)])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- New, Simplified Endpoints ---

@api_router.get("/health", tags=["Health"])
def read_health():
    """Liveness probe. Made public via public.map.json."""
    return {"status": "ok"}

@api_router.get("/dashboard/data", tags=["Dashboard"])
def get_dashboard_data(user: dict = Depends(get_current_user)):
    """PATTERN A (Simple Auth): Requires the 'user' role."""
    return {"message": f"Dashboard data for {user.get('preferred_username')}"}

@api_router.get("/workbench/{item_id}", tags=["Workbench"])
def get_workbench_item(
    item_id: int,
    request: Request,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """PATTERN B (Context-Aware Auth): This endpoint requires context."""
    item = db.query(BusinessObject).filter(BusinessObject.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # This is a placeholder. In a real scenario, you'd fetch ownership from the item.
    context = {"resource": {"owner_id": "some_other_user_id"}} 
    
    # Manually invoke the authz engine with context. This will fail unless the user is an admin,
    # demonstrating the context-aware check.
    authz_engine.check(request, user, context=context)
    
    return schemas.BusinessObject.from_orm(item)
    
@api_router.post("/business-objects/", response_model=schemas.BusinessObject, tags=["Business Objects"])
def create_business_object(
    item: schemas.BusinessObjectCreate,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new generic business object and logs the event."""
    db_item = BusinessObject(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    log_audit_event(
        db=db,
        user_email=user.get('email', 'unknown'),
        action="CREATE",
        entity_type="BusinessObject",
        entity_id=db_item.id,
        summary=f"Created new object: {db_item.name}"
    )
    db.commit()
    
    return db_item

app.include_router(api_router)
