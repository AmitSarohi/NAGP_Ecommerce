#!/bin/bash

# E-Commerce Platform Deployment Script
# This script automates the deployment of the entire platform

set -e

# Configuration
PROJECT_NAME="ecommerce-platform"
AWS_REGION=${AWS_REGION:-"us-east-1"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

echo "🚀 Starting deployment of $PROJECT_NAME to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init
    
    # Plan deployment
    log_info "Creating Terraform plan..."
    terraform plan -var-file="environments/${ENVIRONMENT}.tfvars" -out=tfplan
    
    # Apply changes
    log_info "Applying Terraform changes..."
    terraform apply tfplan
    
    # Get outputs
    log_info "Getting infrastructure outputs..."
    EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
    ECR_REPOSITORY_URLS=$(terraform output -json ecr_repository_urls)
    
    cd ../..
    
    log_success "Infrastructure deployed successfully"
}

# Configure kubectl
configure_kubectl() {
    log_info "Configuring kubectl for EKS cluster..."
    
    # Update kubeconfig
    aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER_NAME
    
    # Verify cluster access
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot access EKS cluster"
        exit 1
    fi
    
    log_success "kubectl configured successfully"
}

# Deploy Kubernetes resources
deploy_kubernetes() {
    log_info "Deploying Kubernetes resources..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace ecommerce --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets (you need to create these first)
    log_warning "Please ensure secrets are configured in infrastructure/kubernetes/secrets.yaml"
    
    # Apply all Kubernetes manifests
    kubectl apply -f infrastructure/kubernetes/
    
    # Wait for deployments to be ready
    log_info "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/user-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/product-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/search-service -n ecommerce
    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n ecommerce
    
    log_success "Kubernetes resources deployed successfully"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Get ECR login password
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build and push each service
    services=("user-service" "product-service" "search-service" "frontend")
    
    for service in "${services[@]}"; do
        log_info "Building $service..."
        
        cd $service
        
        # Generate deployment GUID for frontend
        DEPLOYMENT_GUID="PROD-$(date +%s)"
        export REACT_APP_DEPLOYMENT_GUID=$DEPLOYMENT_GUID
        
        # Build image
        docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-$service:latest .
        
        # Push image
        docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-$service:latest
        
        cd ..
        
        log_success "$service built and pushed successfully"
    done
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check service health
    services=("user-service:3001" "product-service:3002" "search-service:3003" "frontend:80")
    
    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)
        
        log_info "Checking $service_name health..."
        
        # Wait for service to be ready
        kubectl wait --for=condition=ready --timeout=120s pod -l app=$service_name -n ecommerce
        
        # Check health endpoint
        if kubectl port-forward -n ecommerce deployment/$service_name $port:$port &> /dev/null; then
            sleep 5
            if curl -f http://localhost:$port/api/health/live &> /dev/null; then
                log_success "$service_name is healthy"
            else
                log_warning "$service_name health check failed"
            fi
            pkill -f "port-forward.*$port:$port" || true
        else
            log_warning "Could not establish port forward for $service_name"
        fi
    done
}

# Display deployment information
display_deployment_info() {
    log_info "Deployment completed successfully!"
    echo ""
    echo "🎉 E-Commerce Platform Deployment Summary"
    echo "=========================================="
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo "EKS Cluster: $EKS_CLUSTER_NAME"
    echo ""
    echo "📋 Access Information:"
    echo "Frontend URL: https://app.ecommerce.example.com"
    echo "API URL: https://api.ecommerce.example.com"
    echo ""
    echo "🔧 Useful Commands:"
    echo "kubectl get pods -n ecommerce"
    echo "kubectl get services -n ecommerce"
    echo "kubectl logs -f deployment/user-service -n ecommerce"
    echo ""
    echo "📊 Monitoring:"
    echo "Check CloudWatch for logs and metrics"
    echo "Access Kubernetes dashboard if configured"
    echo ""
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Kill any background processes
    pkill -f "kubectl port-forward" || true
}

# Main deployment flow
main() {
    trap cleanup EXIT
    
    log_info "Starting deployment process..."
    
    check_prerequisites
    deploy_infrastructure
    configure_kubectl
    build_and_push_images
    deploy_kubernetes
    run_health_checks
    display_deployment_info
    
    log_success "Deployment completed successfully! 🚀"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "infrastructure")
        deploy_infrastructure
        ;;
    "kubernetes")
        configure_kubectl
        deploy_kubernetes
        ;;
    "images")
        build_and_push_images
        ;;
    "health")
        configure_kubectl
        run_health_checks
        ;;
    "cleanup")
        log_info "Cleaning up infrastructure..."
        cd infrastructure/terraform
        terraform destroy -var-file="environments/${ENVIRONMENT}.tfvars"
        ;;
    *)
        echo "Usage: $0 {deploy|infrastructure|kubernetes|images|health|cleanup}"
        echo "  deploy        - Full deployment (default)"
        echo "  infrastructure - Deploy only infrastructure"
        echo "  kubernetes    - Deploy only Kubernetes resources"
        echo "  images        - Build and push Docker images only"
        echo "  health        - Run health checks"
        echo "  cleanup       - Destroy all resources"
        exit 1
        ;;
esac
