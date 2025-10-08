# app/security.py
import requests
import logging
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os
import re
import json
from functools import lru_cache
from .authz import AuthzEngine

# --- Logger Setup ---
log = logging.getLogger(__name__)

# --- Configuration ---
KEYCLOAK_SERVER_URL = os.getenv("KEYCLOAK_SERVER_URL")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM")
KEYCLOAK_AUDIENCE = os.getenv("KEYCLOAK_AUDIENCE")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID")
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET")
IS_AUTH_DEBUG = os.getenv("SUPERVITY_AUTH_DEBUG", "false").lower() == "true"
jwks_url = f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
introspection_url = f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token/introspect"

# auto_error=False is critical. It makes the "Authorization" header optional.
# This allows the same dependency (`verify_access`) to process requests for
# both public and protected routes without immediately failing if a token is not present.
# The decision to require a token is deferred to the authorization engine.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# --- Singleton Engine Instance ---
# We create one instance of the engine when the application starts.
# This is efficient as policies are loaded from disk only once.
# This instance is imported by main.py for manual, context-aware checks.
authz_engine = AuthzEngine()


@lru_cache(maxsize=1)
def get_jwks():
    """Fetches and caches the JSON Web Key Set (JWKS) from Keycloak."""
    log.info(f"Fetching JWKS from: {jwks_url}")
    try:
        response = requests.get(jwks_url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Could not fetch JWKS from Keycloak: {e}")

def introspect_token(token: str) -> dict:
    """Makes a back-channel call to Keycloak's introspection endpoint to validate the token."""
    payload = {"client_id": KEYCLOAK_CLIENT_ID, "client_secret": KEYCLOAK_CLIENT_SECRET, "token": token}
    try:
        response = requests.post(introspection_url, data=payload)
        response.raise_for_status()
        introspection_result = response.json()
        if not introspection_result.get("active"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is not active")
        return introspection_result
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token introspection failed: {e}")

def get_current_user(token: str | None = Depends(oauth2_scheme)) -> dict | None:
    """
    This is the primary AUTHENTICATION dependency.
    Its only job is to validate the JWT and return its claims.
    It does NOT perform any authorization.
    """
    if token is None:
        return None
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        unverified_header = jwt.get_unverified_header(token)
        jwks = get_jwks()
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {k: key[k] for k in ("kty", "kid", "use", "n", "e")}
                break
        if not rsa_key:
            raise credentials_exception
        
        jwt.decode(token, rsa_key, algorithms=[unverified_header["alg"]], audience=KEYCLOAK_AUDIENCE, issuer=f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}")
        
        return introspect_token(token)
    except JWTError as e:
        log.warning(f"JWT validation error: {e}")
        raise credentials_exception

def verify_access(request: Request, current_user: dict | None = Depends(get_current_user)):
    """
    This is the global AUTHORIZATION dependency, applied to the main router.
    It acts as a "first pass" filter. It automatically protects simple endpoints.
    If it detects a rule that requires runtime context, it "steps aside" and lets the
    endpoint perform the check manually.
    """
    request_path = request.url.path
    
    if any(re.fullmatch(p, request_path) for p in authz_engine._public_paths):
        return

    for rule_path, rule in authz_engine._authz_rules.items():
        if re.fullmatch(rule_path, request_path):
            rule_str = json.dumps(rule)
            # If the rule contains placeholders, it's a "context-aware" rule.
            # Its logic depends on runtime data (e.g., the owner of a document).
            # We cannot decide now, so we "step aside" and delegate the final check
            # to the endpoint function, which is responsible for fetching the data
            # and building the context.
            if '{context' in rule_str or '{path' in rule_str:
                if IS_AUTH_DEBUG:
                    log.debug(f"Rule for '{request_path}' requires context. Deferring check to endpoint.")
                return
            else:
                # This is a "simple" rule that only depends on the user's token (e.g., roles).
                # The engine has all the information it needs, so it can make the final
                # authorization decision right now, before the endpoint code is ever executed.
                if IS_AUTH_DEBUG:
                    log.debug(f"Performing automatic check for simple rule at '{request_path}'.")
                authz_engine.check(request, current_user)
                return

    # If the path is not public and no rule is found, deny access by default.
    if current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to this resource is not configured in authz.map.")
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")