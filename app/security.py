# app/security.py
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os
from functools import lru_cache
import json

# --- Configuration ---
KEYCLOAK_SERVER_URL = os.getenv("KEYCLOAK_SERVER_URL")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM")
KEYCLOAK_AUDIENCE = os.getenv("KEYCLOAK_AUDIENCE")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID")
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET") # For introspection

IS_AUTH_DEBUG = os.getenv("SUPERVITY_AUTH_DEBUG", "false").lower() == "true"

jwks_url = f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
introspection_url = f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token/introspect"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Debug Logger ---
def log(message: str, data: dict = None):
    """Conditionally prints debug messages."""
    if IS_AUTH_DEBUG:
        log_message = f"[AUTH_DEBUG | FastAPI] {message}"
        if data:
            # Pretty print dicts for readability
            log_message += f"\n{json.dumps(data, indent=2)}"
        print(log_message)

# --- JWKS Caching and Fetching ---
@lru_cache(maxsize=1)
def get_jwks():
    """Fetches and caches the JSON Web Key Set (JWKS) from Keycloak."""
    log(f"Fetching JWKS from: {jwks_url}")
    try:
        response = requests.get(jwks_url)
        response.raise_for_status()
        jwks = response.json()
        log("Successfully fetched JWKS.", {"keys": [key.get("kid") for key in jwks.get("keys", [])]})
        return jwks
    except requests.exceptions.RequestException as e:
        log(f"🔴 CRITICAL: Could not fetch JWKS from Keycloak: {e}")
        raise RuntimeError(f"Could not fetch JWKS from Keycloak: {e}")

# --- Token Introspection ---
def introspect_token(token: str) -> dict:
    """
    Makes a back-channel call to Keycloak's introspection endpoint to validate the token.
    Returns the JSON response from Keycloak.
    """
    log("Performing token introspection...")
    if not KEYCLOAK_CLIENT_SECRET:
        log("🔴 WARNING: KEYCLOAK_CLIENT_SECRET is not set. Skipping introspection.")
        # Return a mock active response to allow local validation to proceed
        return {"active": True}
        
    payload = {
        "client_id": KEYCLOAK_CLIENT_ID,
        "client_secret": KEYCLOAK_CLIENT_SECRET,
        "token": token,
    }
    try:
        response = requests.post(introspection_url, data=payload)
        response.raise_for_status()
        introspection_result = response.json()
        log("Introspection successful.", introspection_result)
        if not introspection_result.get("active"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is not active")
        return introspection_result
    except requests.exceptions.RequestException as e:
        log(f"🔴 ERROR: Introspection request failed: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token introspection failed: {e}")

# --- Main Authentication Dependency ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    log("New request to a protected endpoint received.")
    log(f"Bearer Token Received: {token[:30]}...") # Print first 30 chars for safety

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # --- 1. Get Token Header and Log Details ---
        unverified_header = jwt.get_unverified_header(token)
        token_kid = unverified_header.get("kid")
        token_alg = unverified_header.get("alg")
        log("Token Header Decoded (unverified):", {"kid": token_kid, "alg": token_alg})

        # --- 2. Find Matching Key in JWKS ---
        jwks = get_jwks()
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == token_kid:
                log(f"✅ Matching key found in JWKS for kid: {token_kid}")
                rsa_key = {"kty": key["kty"], "kid": key["kid"], "use": key["use"], "n": key["n"], "e": key["e"]}
                break
        
        if not rsa_key:
            log(f"🔴 ERROR: No matching key found in JWKS for kid: {token_kid}")
            raise credentials_exception

        # --- 3. Local JWT Validation (Signature, Audience, Issuer) ---
        log("Performing local JWT validation (signature, audience, issuer)...")
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=[token_alg], # Use algorithm from the token itself
            audience=KEYCLOAK_AUDIENCE,
            issuer=f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}",
        )
        log("✅ Local JWT validation successful.")

        # --- 4. Keycloak Introspection (Server-to-Server Check) ---
        claims = introspect_token(token)
        log("Claims from Introspection Endpoint:", claims)
        
        return claims # Return the full claims from introspection for consistency
        
    except JWTError as e:
        log(f"🔴 ERROR: JWT validation failed: {e}")
        raise credentials_exception

# --- Authorization (RBAC) Dependency ---
def require_role(required_role: str):
    """A dependency factory for checking user roles."""
    def role_checker(current_user: dict = Depends(get_current_user)):
        log(f"Authorization Check: Verifying user has role -> '{required_role}'")

        # Keycloak roles can be in 'realm_access' or 'resource_access'
        realm_roles = current_user.get("realm_access", {}).get("roles", [])
        
        resource_access = current_user.get("resource_access", {})
        client_roles = resource_access.get(KEYCLOAK_CLIENT_ID, {}).get("roles", [])
        
        all_user_roles = realm_roles + client_roles
        log("Roles found in token:", {"realm_roles": realm_roles, "client_roles": client_roles})

        if required_role not in all_user_roles:
            log(f"🔴 Authorization FAILED. User lacks required role: '{required_role}'")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have the required '{required_role}' role."
            )
        
        log(f"✅ Authorization SUCCEEDED. User has role: '{required_role}'")
        return current_user
        
    return role_checker