#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
NAMESPACE="crm-${ENVIRONMENT}"
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry"}
IMAGE_TAG=${IMAGE_TAG:-$(git rev-parse --short HEAD)}

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
    fi
    
    if ! command -v docker &> /dev/null; then
        error "docker is not installed"
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
    fi
    
    log "Prerequisites check passed"
}

# Build and push Docker image
build_and_push() {
    log "Building Docker image..."
    
    docker build -t ${DOCKER_REGISTRY}/crm-system:${IMAGE_TAG} .
    docker tag ${DOCKER_REGISTRY}/crm-system:${IMAGE_TAG} ${DOCKER_REGISTRY}/crm-system:latest
    
    log "Pushing Docker image..."
    docker push ${DOCKER_REGISTRY}/crm-system:${IMAGE_TAG}
    docker push ${DOCKER_REGISTRY}/crm-system:latest
    
    log "Docker image pushed successfully"
}

# Deploy to Kubernetes
deploy() {
    log "Deploying to ${ENVIRONMENT} environment..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets and configmaps
    if [ -f ".env.${ENVIRONMENT}" ]; then
        kubectl create secret generic crm-secrets \
            --from-env-file=".env.${ENVIRONMENT}" \
            --namespace=${NAMESPACE} \
            --dry-run=client -o yaml | kubectl apply -f -
    fi
    
    # Deploy using kustomize
    kubectl kustomize k8s/overlays/${ENVIRONMENT} | \
        sed "s|\${DOCKER_REGISTRY}|${DOCKER_REGISTRY}|g" | \
        sed "s|latest|${IMAGE_TAG}|g" | \
        kubectl apply -f -
    
    log "Deployment completed"
}

# Wait for deployment to be ready
wait_for_deployment() {
    log "Waiting for deployment to be ready..."
    
    kubectl rollout status deployment/crm-system -n ${NAMESPACE} --timeout=300s
    
    if [ $? -eq 0 ]; then
        log "Deployment is ready"
    else
        error "Deployment failed to become ready"
    fi
}

# Run health checks
health_check() {
    log "Running health checks..."
    
    # Get service URL
    SERVICE_URL=$(kubectl get service crm-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$SERVICE_URL" ]; then
        SERVICE_URL=$(kubectl get service crm-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    fi
    
    if [ -z "$SERVICE_URL" ]; then
        warn "Could not determine service URL, skipping health check"
        return
    fi
    
    # Wait for service to be available
    for i in {1..30}; do
        if curl -f http://${SERVICE_URL}/api/health &> /dev/null; then
            log "Health check passed"
            return
        fi
        sleep 2
    done
    
    error "Health check failed"
}

# Rollback deployment
rollback() {
    log "Rolling back deployment..."
    
    kubectl rollout undo deployment/crm-system -n ${NAMESPACE}
    kubectl rollout status deployment/crm-system -n ${NAMESPACE} --timeout=300s
    
    log "Rollback completed"
}

# Main deployment process
main() {
    log "Starting deployment to ${ENVIRONMENT} environment"
    
    check_prerequisites
    build_and_push
    deploy
    wait_for_deployment
    health_check
    
    log "Deployment to ${ENVIRONMENT} completed successfully!"
}

# Handle errors
trap 'error "Deployment failed. Rolling back..." && rollback' ERR

# Run main function
main "$@"