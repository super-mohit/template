# app/main.py
from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import os
from .security import get_current_user, require_role, get_jwks

# --- App Initialization ---
app = FastAPI()

# --- Create API Router with base path ---
base_path = os.getenv("BASE_PATH", "")  # e.g., "/template"
if base_path:
    api_router = APIRouter(prefix=f"{base_path}/api")
else:
    api_router = APIRouter(prefix="/api")

# --- Middleware ---
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health & Readiness Probes ---
@api_router.get("/health", tags=["Health"])
def read_health():
    """Liveness probe: Checks if the application process is running."""
    return {"status": "ok"}

@api_router.get("/ready", tags=["Health"])
def read_ready():
    """
    Readiness probe: Checks if the application is ready to serve traffic.
    This includes checking its ability to connect to critical dependencies.
    """
    try:
        # Check if we can get public keys from Keycloak
        get_jwks()
        return {"status": "ready"}
    except Exception as e:
        # The readiness probe will fail if get_jwks() throws an error
        raise HTTPException(status_code=503, detail=f"Service Unavailable: {e}")

# --- API Endpoints ---
@api_router.get("/test", tags=["Tests"])
def read_test_data(current_user: dict = Depends(get_current_user)):
    """A protected endpoint available to any authenticated user."""
    username = current_user.get("preferred_username", "user")
    return {"message": f"Hello, {username}! You have accessed a protected resource."}

@api_router.get("/admin", tags=["Tests"])
def read_admin_data(current_user: dict = Depends(require_role("admin"))):
    """A protected endpoint available only to users with the 'admin' role."""
    username = current_user.get("preferred_username", "user")
    return {"message": f"Welcome, Administrator {username}! You have accessed an admin-only resource."}

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the Template CC API"}

# --- Include the API router ---
app.include_router(api_router)