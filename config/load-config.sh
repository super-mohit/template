#!/bin/bash
# ============================================
# Configuration Loader Script
# ============================================
# This script parses deployment.yaml and exports variables
# for use in Azure Pipeline steps

set -e

CONFIG_FILE="${1:-config/deployment.yaml}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ ERROR: Configuration file not found: $CONFIG_FILE"
  exit 1
fi

echo "📋 Loading deployment configuration from: $CONFIG_FILE"

# Function to parse YAML and extract values (simplified for key: "value" format)
get_yaml_value() {
  local key="$1"
  local file="$2"
  # Extract value, remove quotes, trim whitespace
  grep "^[[:space:]]*${key}:" "$file" | sed 's/^[^:]*:[[:space:]]*//' | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/" | xargs
}

# Parse and export configuration values
echo "Parsing configuration..."

# Project
export PROJECT_NAME=$(get_yaml_value "name" "$CONFIG_FILE")
export PROJECT_SHORT_NAME=$(get_yaml_value "short_name" "$CONFIG_FILE")

# Docker/ACR
export ACR_SERVICE_CONNECTION=$(get_yaml_value "acr_service_connection" "$CONFIG_FILE")
export REPOSITORY=$(get_yaml_value "repository" "$CONFIG_FILE")

# Kubernetes/AKS
export K8S_SUBSCRIPTION_ENDPOINT=$(get_yaml_value "subscription_endpoint" "$CONFIG_FILE")
export K8S_RESOURCE_GROUP=$(get_yaml_value "resource_group" "$CONFIG_FILE")
export K8S_CLUSTER_NAME=$(get_yaml_value "cluster_name" "$CONFIG_FILE")
export K8S_NAMESPACE=$(get_yaml_value "namespace" "$CONFIG_FILE")
export K8S_IMAGE_PULL_SECRET=$(get_yaml_value "image_pull_secret" "$CONFIG_FILE")

# Deployment
export FRONTEND_SUFFIX=$(get_yaml_value "frontend_suffix" "$CONFIG_FILE")
export BACKEND_SUFFIX=$(get_yaml_value "backend_suffix" "$CONFIG_FILE")
export FRONTEND_REPLICAS=$(get_yaml_value "frontend_replicas" "$CONFIG_FILE")
export BACKEND_REPLICAS=$(get_yaml_value "backend_replicas" "$CONFIG_FILE")
export FRONTEND_IMAGE_PULL_POLICY=$(get_yaml_value "frontend_image_pull_policy" "$CONFIG_FILE")
export BACKEND_IMAGE_PULL_POLICY=$(get_yaml_value "backend_image_pull_policy" "$CONFIG_FILE")
export MAX_UNAVAILABLE=$(get_yaml_value "max_unavailable" "$CONFIG_FILE")
export MAX_SURGE=$(get_yaml_value "max_surge" "$CONFIG_FILE")
export REVISION_HISTORY_LIMIT=$(get_yaml_value "revision_history_limit" "$CONFIG_FILE")
export PROGRESS_DEADLINE_SECONDS=$(get_yaml_value "progress_deadline_seconds" "$CONFIG_FILE")
export TERMINATION_GRACE_PERIOD=$(get_yaml_value "termination_grace_period" "$CONFIG_FILE")

# Service
export SERVICE_TYPE=$(get_yaml_value "type" "$CONFIG_FILE")
export FRONTEND_PORT=$(get_yaml_value "frontend_port" "$CONFIG_FILE")
export BACKEND_PORT=$(get_yaml_value "backend_port" "$CONFIG_FILE")
export SESSION_AFFINITY=$(get_yaml_value "session_affinity" "$CONFIG_FILE")
export IP_FAMILY_POLICY=$(get_yaml_value "ip_family_policy" "$CONFIG_FILE")
export INTERNAL_TRAFFIC_POLICY=$(get_yaml_value "internal_traffic_policy" "$CONFIG_FILE")

# Ingress
export INGRESS_CLASS_NAME=$(get_yaml_value "class_name" "$CONFIG_FILE")
export INGRESS_HOST=$(get_yaml_value "host" "$CONFIG_FILE")
export INGRESS_PATH_PREFIX=$(get_yaml_value "path_prefix" "$CONFIG_FILE")
export INGRESS_TLS_ENABLED=$(get_yaml_value "enabled" "$CONFIG_FILE")
export INGRESS_TLS_SECRET=$(get_yaml_value "secret_name" "$CONFIG_FILE")
export INGRESS_PATH_TYPE=$(get_yaml_value "path_type" "$CONFIG_FILE")
export INGRESS_API_PATH_SUFFIX=$(get_yaml_value "api_path_suffix" "$CONFIG_FILE")

# Build paths
export BACKEND_DOCKERFILE=$(get_yaml_value "backend_dockerfile" "$CONFIG_FILE")
export BACKEND_CONTEXT=$(get_yaml_value "backend_context" "$CONFIG_FILE")
export BACKEND_VALIDATION_DIR=$(get_yaml_value "backend_validation_dir" "$CONFIG_FILE")
export FRONTEND_DOCKERFILE=$(get_yaml_value "frontend_dockerfile" "$CONFIG_FILE")
export FRONTEND_CONTEXT=$(get_yaml_value "frontend_context" "$CONFIG_FILE")

# Output loaded configuration
echo ""
echo "✅ Configuration loaded successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project: $PROJECT_NAME ($PROJECT_SHORT_NAME)"
echo "ACR Service Connection: $ACR_SERVICE_CONNECTION"
echo "Repository: $REPOSITORY"
echo "K8s Namespace: $K8S_NAMESPACE"
echo "K8s Cluster: $K8S_CLUSTER_NAME"
echo "Ingress Host: $INGRESS_HOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Export variables for Azure Pipeline
echo "##vso[task.setvariable variable=PROJECT_NAME]$PROJECT_NAME"
echo "##vso[task.setvariable variable=PROJECT_SHORT_NAME]$PROJECT_SHORT_NAME"
echo "##vso[task.setvariable variable=ACR_SERVICE_CONNECTION]$ACR_SERVICE_CONNECTION"
echo "##vso[task.setvariable variable=REPOSITORY]$REPOSITORY"
echo "##vso[task.setvariable variable=K8S_SUBSCRIPTION_ENDPOINT]$K8S_SUBSCRIPTION_ENDPOINT"
echo "##vso[task.setvariable variable=K8S_RESOURCE_GROUP]$K8S_RESOURCE_GROUP"
echo "##vso[task.setvariable variable=K8S_CLUSTER_NAME]$K8S_CLUSTER_NAME"
echo "##vso[task.setvariable variable=K8S_NAMESPACE]$K8S_NAMESPACE"
echo "##vso[task.setvariable variable=K8S_IMAGE_PULL_SECRET]$K8S_IMAGE_PULL_SECRET"
echo "##vso[task.setvariable variable=FRONTEND_SUFFIX]$FRONTEND_SUFFIX"
echo "##vso[task.setvariable variable=BACKEND_SUFFIX]$BACKEND_SUFFIX"
echo "##vso[task.setvariable variable=FRONTEND_REPLICAS]$FRONTEND_REPLICAS"
echo "##vso[task.setvariable variable=BACKEND_REPLICAS]$BACKEND_REPLICAS"
echo "##vso[task.setvariable variable=FRONTEND_IMAGE_PULL_POLICY]$FRONTEND_IMAGE_PULL_POLICY"
echo "##vso[task.setvariable variable=BACKEND_IMAGE_PULL_POLICY]$BACKEND_IMAGE_PULL_POLICY"
echo "##vso[task.setvariable variable=MAX_UNAVAILABLE]$MAX_UNAVAILABLE"
echo "##vso[task.setvariable variable=MAX_SURGE]$MAX_SURGE"
echo "##vso[task.setvariable variable=REVISION_HISTORY_LIMIT]$REVISION_HISTORY_LIMIT"
echo "##vso[task.setvariable variable=PROGRESS_DEADLINE_SECONDS]$PROGRESS_DEADLINE_SECONDS"
echo "##vso[task.setvariable variable=TERMINATION_GRACE_PERIOD]$TERMINATION_GRACE_PERIOD"
echo "##vso[task.setvariable variable=SERVICE_TYPE]$SERVICE_TYPE"
echo "##vso[task.setvariable variable=FRONTEND_PORT]$FRONTEND_PORT"
echo "##vso[task.setvariable variable=BACKEND_PORT]$BACKEND_PORT"
echo "##vso[task.setvariable variable=SESSION_AFFINITY]$SESSION_AFFINITY"
echo "##vso[task.setvariable variable=IP_FAMILY_POLICY]$IP_FAMILY_POLICY"
echo "##vso[task.setvariable variable=INTERNAL_TRAFFIC_POLICY]$INTERNAL_TRAFFIC_POLICY"
echo "##vso[task.setvariable variable=INGRESS_CLASS_NAME]$INGRESS_CLASS_NAME"
echo "##vso[task.setvariable variable=INGRESS_HOST]$INGRESS_HOST"
echo "##vso[task.setvariable variable=INGRESS_PATH_PREFIX]$INGRESS_PATH_PREFIX"
echo "##vso[task.setvariable variable=INGRESS_TLS_ENABLED]$INGRESS_TLS_ENABLED"
echo "##vso[task.setvariable variable=INGRESS_TLS_SECRET]$INGRESS_TLS_SECRET"
echo "##vso[task.setvariable variable=INGRESS_PATH_TYPE]$INGRESS_PATH_TYPE"
echo "##vso[task.setvariable variable=INGRESS_API_PATH_SUFFIX]$INGRESS_API_PATH_SUFFIX"
echo "##vso[task.setvariable variable=BACKEND_DOCKERFILE]$BACKEND_DOCKERFILE"
echo "##vso[task.setvariable variable=BACKEND_CONTEXT]$BACKEND_CONTEXT"
echo "##vso[task.setvariable variable=BACKEND_VALIDATION_DIR]$BACKEND_VALIDATION_DIR"
echo "##vso[task.setvariable variable=FRONTEND_DOCKERFILE]$FRONTEND_DOCKERFILE"
echo "##vso[task.setvariable variable=FRONTEND_CONTEXT]$FRONTEND_CONTEXT"

echo "✅ All variables exported to Azure Pipeline"

