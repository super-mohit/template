# app/security.py
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os
from functools import lru_cache

# --- Configuration ---
KEYCLOAK_SERVER_URL = os.getenv("KEYCLOAK_SERVER_URL", "http://localhost:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "myrealm")
KEYCLOAK_ALGORITHM = os.getenv("KEYCLOAK_ALGORITHM", "RS256")
KEYCLOAK_AUDIENCE = os.getenv("KEYCLOAK_AUDIENCE")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID") # Used for role checking

jwks_url = f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- JWKS Caching and Fetching ---
@lru_cache(maxsize=1)
def get_jwks():
    """
    Fetches the JSON Web Key Set (JWKS) from Keycloak.
    Uses lru_cache for robust, in-memory caching.
    """
    try:
        response = requests.get(jwks_url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        # This is a critical failure, as the app cannot verify any tokens.
        # This will cause the readiness probe to fail.
        raise RuntimeError(f"Could not fetch JWKS from Keycloak: {e}")

# --- Main Authentication Dependency ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        jwks = get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {"kty": key["kty"], "kid": key["kid"], "use": key["use"], "n": key["n"], "e": key["e"]}
                break
        
        if not rsa_key:
            raise credentials_exception

        payload = jwt.decode(
            token, rsa_key, algorithms=[KEYCLOAK_ALGORITHM],
            audience=KEYCLOAK_AUDIENCE, issuer=f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}"
        )
        return payload
    except JWTError:
        raise credentials_exception

# --- Authorization (RBAC) Dependency ---
def require_role(required_role: str):
    """
    A dependency factory for checking user roles.
    """
    def role_checker(current_user: dict = Depends(get_current_user)):
        # Keycloak roles can be in 'realm_access' or 'resource_access'
        realm_roles = current_user.get("realm_access", {}).get("roles", [])
        
        resource_access = current_user.get("resource_access", {})
        client_roles = resource_access.get(KEYCLOAK_CLIENT_ID, {}).get("roles", [])

        if required_role not in realm_roles and required_role not in client_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have the required '{required_role}' role."
            )
        return current_user
    return role_checker
