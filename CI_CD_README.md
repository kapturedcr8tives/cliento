# CRM System CI/CD Pipeline

This document describes the comprehensive CI/CD pipeline for the CRM system, including automated building, testing, deployment, and monitoring.

## 🚀 Overview

The CI/CD pipeline provides:
- **Automated Testing**: Code quality, security, and performance testing
- **Multi-Environment Deployment**: Staging and production environments
- **Containerization**: Docker-based deployment with Kubernetes
- **Monitoring & Observability**: Prometheus, Grafana, and custom metrics
- **Performance Optimization**: Automated build optimization and caching
- **Security**: Vulnerability scanning and security best practices

## 📁 Pipeline Structure

```
├── .github/workflows/          # GitHub Actions workflows
├── k8s/                       # Kubernetes configurations
│   ├── base/                  # Base Kustomize configurations
│   └── overlays/              # Environment-specific overlays
│       ├── staging/           # Staging environment
│       └── production/        # Production environment
├── monitoring/                # Monitoring configurations
├── scripts/                   # Deployment and optimization scripts
├── docker-compose.yml         # Local development setup
├── Dockerfile                 # Production container configuration
└── .env.*                     # Environment configurations
```

## 🔧 Prerequisites

### Required Tools
- **Docker**: Containerization
- **kubectl**: Kubernetes CLI
- **kustomize**: Kubernetes configuration management
- **pnpm**: Package manager
- **Node.js 20**: Runtime environment

### Required Services
- **Kubernetes Cluster**: For deployment
- **Docker Registry**: For container images
- **Supabase**: Database and authentication
- **Redis**: Caching layer
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd crm-system

# Install dependencies
pnpm install

# Set up environment variables
cp .env.staging.example .env.staging
cp .env.production.example .env.production

# Edit environment files with your configuration
nano .env.staging
nano .env.production
```

### 2. Local Development

```bash
# Start local development environment
docker-compose up -d

# Run development server
pnpm dev

# Access the application
open http://localhost:3000
```

### 3. Build and Deploy

```bash
# Build optimization
node scripts/optimize-build.js

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

## 🔄 CI/CD Workflow

### GitHub Actions Pipeline

The pipeline runs on every push to `main` and `develop` branches:

1. **Code Quality & Security**
   - ESLint code linting
   - TypeScript type checking
   - Security audit with `pnpm audit`

2. **Build & Test**
   - Dependency installation
   - Application build
   - Build artifact upload

3. **Performance Testing**
   - Lighthouse CI performance testing
   - Bundle analysis
   - Performance metrics collection

4. **Docker Build**
   - Multi-stage Docker build
   - Image optimization
   - Push to registry

5. **Deployment**
   - Staging deployment (develop branch)
   - Production deployment (main branch)
   - Health checks and rollback

### Environment Deployment

#### Staging Environment
- **Trigger**: Push to `develop` branch
- **URL**: `staging.crm.yourdomain.com`
- **Features**: Debug logging, beta features enabled
- **Resources**: Lower resource limits

#### Production Environment
- **Trigger**: Push to `main` branch
- **URL**: `crm.yourdomain.com`
- **Features**: Production logging, optimized performance
- **Resources**: Higher resource limits, strict security

## 🐳 Docker Configuration

### Multi-Stage Build
```dockerfile
# Base stage with pnpm
FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner
# Security: non-root user, read-only filesystem
```

### Security Features
- Non-root user execution
- Read-only filesystem
- Dropped capabilities
- Health checks
- Resource limits

## ☸️ Kubernetes Configuration

### Base Configuration
- **Deployment**: 3 replicas with rolling updates
- **Service**: ClusterIP with ingress
- **HPA**: Auto-scaling based on CPU/memory
- **Security**: Pod security policies

### Environment Overlays
- **Staging**: Debug mode, lower resources
- **Production**: Optimized mode, higher resources

### Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and alerts
- **Custom Metrics**: Application-specific metrics

## 📊 Monitoring & Observability

### Metrics Endpoints
- `/api/health`: Health check endpoint
- `/api/metrics`: Prometheus metrics

### Key Metrics
- HTTP request rate and duration
- Memory and CPU usage
- Database connectivity
- Custom business metrics

### Alerts
- High CPU/memory usage
- Service downtime
- High error rates
- Performance degradation

## 🔧 Performance Optimization

### Build Optimization
```bash
# Run optimization script
node scripts/optimize-build.js
```

Features:
- Bundle analysis
- Image optimization
- CSS minification
- Dependency cleanup
- Sitemap generation

### Runtime Optimization
- Redis caching
- Database connection pooling
- CDN integration
- Gzip compression
- HTTP/2 support

## 🔒 Security

### Container Security
- Non-root user execution
- Read-only filesystem
- Dropped capabilities
- Regular security updates

### Application Security
- Environment variable encryption
- JWT token validation
- Rate limiting
- CORS configuration
- Input validation

### Infrastructure Security
- TLS/SSL encryption
- Network policies
- RBAC configuration
- Secret management

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
pnpm build --verbose

# Clear cache
rm -rf .next node_modules
pnpm install
```

#### Deployment Issues
```bash
# Check pod status
kubectl get pods -n crm-staging

# Check logs
kubectl logs -f deployment/crm-system -n crm-staging

# Check events
kubectl get events -n crm-staging
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n crm-staging

# Check metrics
curl http://localhost:3000/api/metrics
```

### Rollback Procedure
```bash
# Rollback deployment
kubectl rollout undo deployment/crm-system -n crm-production

# Check rollback status
kubectl rollout status deployment/crm-system -n crm-production
```

## 📈 Scaling

### Horizontal Scaling
- HPA configured for CPU/memory-based scaling
- Min: 2 replicas, Max: 10 replicas
- Custom scaling policies

### Vertical Scaling
- Resource limits configurable per environment
- Production: 1 CPU, 1GB RAM
- Staging: 0.5 CPU, 512MB RAM

## 🔄 Maintenance

### Regular Tasks
- Security updates
- Dependency updates
- Performance monitoring
- Log rotation
- Backup verification

### Update Procedure
1. Update dependencies
2. Run tests
3. Deploy to staging
4. Verify functionality
5. Deploy to production
6. Monitor metrics

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests locally
4. Submit pull request
5. CI/CD pipeline validates changes
6. Code review and approval
7. Merge to main branch

## 📞 Support

For issues or questions:
- Check troubleshooting section
- Review logs and metrics
- Contact DevOps team
- Create GitHub issue

---

**Last Updated**: $(date)
**Version**: 1.0.0