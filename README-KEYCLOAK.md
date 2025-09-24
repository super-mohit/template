# Keycloak Setup and Configuration

This project uses Keycloak for authentication and authorization. The Keycloak realm configuration has been imported from `keycloak/import/supervity-realm.json`.

## Quick Start

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file with your Keycloak client secret:**
   The realm comes with a pre-configured client `super-client-dnh-dev-0001`. You'll need to get the client secret from the Keycloak admin console after starting the services.

3. **Start the services:**
   ```bash
   docker-compose up -d
   ```

4. **Access Keycloak Admin Console:**
   - URL: http://localhost:8080
   - Username: admin
   - Password: admin

5. **Get the client secret:**
   - Navigate to Realms → supervity → Clients → super-client-dnh-dev-0001 → Credentials
   - Copy the secret and update your `.env` file

## Realm Details

- **Realm Name:** supervity
- **Main Client:** super-client-dnh-dev-0001
- **Client Type:** Confidential client with authorization code flow
- **Redirect URIs:** Configured for `*` (update in production)
- **Web Origins:** Configured for `*` (update in production)

## Users and Roles

The realm includes pre-configured roles:
- `uma_authorization`
- `offline_access`
- `default-roles-supervity`
- Client-specific roles in `super-client-dnh-dev-0001`

## Client Configuration

The client `super-client-dnh-dev-0001` is configured with:
- **Standard Flow Enabled:** Yes (Authorization Code Flow)
- **Direct Access Grants:** Disabled
- **Service Accounts:** Disabled
- **Public Client:** No (requires client secret)
- **Full Scope Allowed:** Yes

## Security Notes

- The realm is configured for development with relaxed security settings
- Update redirect URIs and web origins for production deployment
- Enable additional security features as needed
- Consider setting up proper user federation for production

## Troubleshooting

1. **Realm not importing:** Check that the file is in `keycloak/import/supervity-realm.json`
2. **Client secret issues:** Get the secret from Keycloak admin console
3. **CORS issues:** Update web origins in the client configuration
4. **Token validation errors:** Ensure JWKS endpoint is accessible from backend
