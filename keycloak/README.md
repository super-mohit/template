# Keycloak Import Directory

This directory contains Keycloak realm configurations that will be automatically imported when the Keycloak container starts.

## Files

- `supervity-realm.json`: Complete realm configuration for the "supervity" realm

## How it works

The docker-compose.yml configuration mounts this directory to `/opt/keycloak/data/import` inside the Keycloak container and uses the `--import-realm` flag to automatically import any realm files found in this directory during startup.

## Realm Details

The supervity realm includes:
- Pre-configured client: `super-client-dnh-dev-0001`
- Authentication flows and security policies
- User roles and permissions
- Client scopes and protocol mappers

## Important Notes

- Realm import only happens if the realm doesn't already exist
- To re-import a realm, you must first delete the existing realm from Keycloak admin console
- Client secrets are masked in the export and will be regenerated on import
- After import, you'll need to retrieve the actual client secret from the Keycloak admin console
