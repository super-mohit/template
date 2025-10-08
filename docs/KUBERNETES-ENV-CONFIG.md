# Kubernetes Environment Variables Configuration

## Overview

This project uses a centralized configuration approach for managing environment variables in Kubernetes deployments. Instead of hardcoding environment variables in multiple places, we maintain them in a single source of truth.

## How It Works

### Configuration File: `config/k8s-env-config.txt`

The pipeline reads environment variables from `config/k8s-env-config.txt` located in the config directory. This file contains two sections:

- **[FRONTEND]**: Environment variables for the Next.js frontend
- **[BACKEND]**: Environment variables for the FastAPI backend

### Example Structure

```ini
# Comments start with #
[FRONTEND]
NEXT_PUBLIC_API_URL
KEYCLOAK_SERVER_URL
NODE_ENV

[BACKEND]
DATABASE_URL
POSTGRES_USER
APP_ENV
```

## Adding New Environment Variables

### Option 1: Update config/k8s-env-config.txt (Recommended)

1. Open `config/k8s-env-config.txt`
2. Add the variable name under the appropriate section
3. Commit and push

The Azure Pipeline will automatically include these variables in the Kubernetes deployment.

### Option 2: Update docker-compose.yml

The environment variables are also synchronized with `docker-compose.yml`:
- **Frontend**: Check the `args` section under `frontend.build`
- **Backend**: Check the `env_file` reference (variables come from `.env`)

## How the Pipeline Uses This

The Azure Pipeline (`azure-pipeline.yml`) does the following:

1. **Reads the config file** during Step 2 (Generate Kubernetes Resources)
2. **Parses sections** to separate frontend and backend variables
3. **Dynamically generates** Kubernetes deployment YAML with these variables
4. **Falls back to defaults** if the config file is not found

## Benefits

✅ **Single Source of Truth**: Update environment variables in one place  
✅ **No Duplication**: Same variables used in docker-compose.yml and K8s  
✅ **Easy Maintenance**: Just edit a simple text file  
✅ **Automatic Sync**: Pipeline automatically picks up changes  
✅ **Version Controlled**: All env var changes are tracked in git  

## Related Files

- `config/k8s-env-config.txt` - Environment variables configuration
- `docker-compose.yml` - Local development compose file (uses .env)
- `azure-pipeline.yml` - CI/CD pipeline that generates K8s manifests
- `.env` - Local environment values (not committed to git)

## Important Notes

⚠️ **Security**: The `config/k8s-env-config.txt` file only contains **variable names**, not values. Actual values should be:
- Stored in Azure DevOps Pipeline Variables
- Or in Kubernetes Secrets/ConfigMaps
- Never commit sensitive values to git

⚠️ **Format**: Keep one variable per line, no `=` signs, just the variable name

## Example Workflow

1. Developer needs to add a new API key variable
2. Add `NEW_API_KEY` to `config/k8s-env-config.txt` under `[BACKEND]`
3. Add the actual value to Azure Pipeline Variables in DevOps
4. Commit and push to trigger deployment
5. K8s deployment automatically includes the new variable

