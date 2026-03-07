# E-Commerce Platform - Microservices Architecture

A production-ready microservices-based e-commerce platform deployed on AWS with complete CI/CD pipeline.

## Architecture Overview

This platform implements a microservices architecture with the following components:

### Services
- **User Service**: Manages user profiles and authentication
- **Product Service**: Handles product catalog and inventory
- **Search Service**: Provides search capabilities using OpenSearch
- **API Gateway**: Routes requests and handles cross-cutting concerns

### AWS Infrastructure
- **EKS**: Kubernetes cluster for container orchestration
- **DynamoDB**: NoSQL database for user and product data
- **OpenSearch**: Search engine for product search
- **API Gateway**: REST API management
- **Cognito**: User authentication and authorization
- **ECR**: Container registry
- **S3**: Static hosting for frontend
- **CloudFront**: CDN for global content delivery
- **Route 53**: DNS management
- **CloudWatch**: Monitoring and logging

## Project Structure

```
ecommerce-platform/
├── frontend/                 # React frontend application
├── services/
│   ├── user-service/        # User management microservice
│   ├── product-service/     # Product catalog microservice
│   └── search-service/      # Search microservice
├── infrastructure/
│   ├── terraform/          # AWS infrastructure as code
│   └── kubernetes/         # K8s deployment configurations
├── ci-cd/                   # CI/CD pipeline configurations
└── docker-compose.yml       # Local development setup
```

## Quick Start

### Prerequisites
- AWS CLI configured
- Docker installed
- Node.js 18+
- kubectl
- Terraform

### Local Development

1. Clone the repository
2. Start local services:
```bash
docker-compose up -d
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
npm start
```

### Production Deployment

1. Deploy infrastructure:
```bash
cd infrastructure/terraform
terraform init
terraform apply
```

2. Build and deploy services:
```bash
# CI/CD pipeline will automatically trigger on git push
# Or manual deployment:
./ci-cd/deploy.sh
```

## Environment Variables

See `services/*/config/.env.example` for required environment variables.

## Monitoring

- Application logs: CloudWatch Logs
- Metrics: CloudWatch Metrics
- Health checks: Built into each service

## Security

- JWT tokens for authentication
- API Gateway throttling
- Network policies in Kubernetes
- IAM roles for service-to-service communication

## CI/CD Pipeline

Automated pipeline stages:
1. Code commit triggers pipeline
2. Build and test applications
3. Build Docker images
4. Push to ECR
5. Deploy to EKS
6. Health checks and rollback

## API Documentation

API endpoints are documented using Swagger/OpenAPI and available at:
- User Service: `/api/users/docs`
- Product Service: `/api/products/docs`
- Search Service: `/api/search/docs`

## Contributing

1. Create feature branch
2. Make changes
3. Run tests locally
4. Submit pull request

## License

MIT License
