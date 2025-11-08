# AWS Learner Lab Infrastructure Migration Plan

## 🎯 Executive Summary

Migrate from single-AZ, single-EC2 architecture to a **budget-optimized, multi-AZ architecture** designed specifically for AWS Learner Lab constraints.

**Key Optimizations:**

- ✅ Stays within 9 EC2 instance limit (max 6 instances)
- ✅ Uses public subnets (no NAT Gateway costs ~$66/month savings)
- ✅ Uses Systems Manager (no bastion host needed)
- ✅ Redis co-located on backend (saves instance slot)
- ✅ Uses only LabRole (no IAM permission issues)
- ✅ Supports 2 availability zones for resilience
- ✅ Single ALB with host-based routing (~$16/month additional savings)

---

## 📊 New Architecture Overview

### Instance Count Budget

| Component                | Min   | Desired | Max   | Notes                          |
| ------------------------ | ----- | ------- | ----- | ------------------------------ |
| Frontend ASG             | 1     | 2       | 3     | One per AZ normally            |
| Backend ASG (with Redis) | 1     | 2       | 3     | Redis installed on each        |
| **Total EC2 Instances**  | **2** | **4**   | **6** | Well under 9 limit ✅          |
| RDS PostgreSQL           | 1     | 1       | 1     | Doesn't count toward EC2 limit |

### AWS Resources to Create

#### Networking (VPC)

- New VPC: 10.0.0.0/16 (us-east-1 or us-west-2)
- **Public Subnets Only** (no private subnets = no NAT needed)
  - Public Subnet AZ1: 10.0.1.0/24
  - Public Subnet AZ2: 10.0.2.0/24
  - Database Subnet AZ1: 10.0.11.0/24
  - Database Subnet AZ2: 10.0.12.0/24
- Internet Gateway
- Route tables with IGW routes
- **S3 VPC Gateway Endpoint** (free, faster S3 access)

#### Load Balancer

- **Single Application Load Balancer** with host-based routing:
  - Routes `conviveitesofront.ricardonavarro.mx` → Frontend Target Group (Next.js)
  - Routes `conviveitesoback.ricardonavarro.mx` → Backend Target Group (NestJS)
  - Inspects HTTP `Host` header to determine routing

#### Auto Scaling Groups

- **Frontend ASG**: t3.small instances (Min: 1, Desired: 2, Max: 3)
- **Backend ASG**: t3.small instances with Redis (Min: 1, Desired: 2, Max: 3)

#### Security

- ALB Security Group (ingress: 80, 443 from 0.0.0.0/0)
- Frontend Instances SG (ingress: 3000 from ALB SG)
- Backend Instances SG (ingress: 8080 from ALB SG, 6379 from Backend SG)
- RDS SG (ingress: 5432 from Backend Instances SG)

#### Database

- RDS PostgreSQL db.t3.small
- Single-AZ deployment
- 20GB gp2 storage
- No automated backups
- Enhanced monitoring disabled

#### IAM

- Use existing **LabRole** and **LabInstanceProfile**

#### CI/CD & Container Registry

- **2 ECR Repositories**: `convive-frontend` and `convive-backend`
- **Image Tagging**: `:latest` (auto-deploy) + `:sha-<commit>` (traceability)
- **Deployment Method**: GitHub Actions builds images → Push to ECR → ASG instance refresh
- **Zero-downtime**: Rolling updates via ASG with MinHealthyPercentage: 90%
- **Fast scaling**: Instances pull pre-built images (2 min boot vs 10+ min build)

**Deployment Flow:**

```
Code Push → Build Images → Push to ECR → ASG Instance Refresh → New Instances Launch → Old Instances Terminate
```

---

## 💰 Estimated Monthly Costs

| Resource                     | Cost/month     | Notes                              |
| ---------------------------- | -------------- | ---------------------------------- |
| 4x t3.small EC2 (6hrs/day)   | ~$24           | Assuming 6 hours daily usage       |
| 1x Application Load Balancer | ~$16           | Single ALB with host-based routing |
| RDS db.t3.small (24/7)       | ~$25           | Single-AZ                          |
| S3 storage (10GB)            | ~$0.23         | Plus transfer costs                |
| ECR storage (2 repos, ~5GB)  | ~$0.50         | $0.10/GB/month, minimal cost       |
| ECR data transfer            | ~$0.20         | Pulls from EC2 (same region)       |
| **Total**                    | **~$66/month** | Optimized for Learner Lab!         |

**Savings from optimizations:**

- No NAT Gateways: ~$66/month saved
- Single ALB vs 2 ALBs: ~$16/month saved
- ECR deployment: Faster scaling, less compute time
- **Total savings: ~$82/month!**

**ECR Costs Breakdown:**

- Storage: ~$0.50/month (5GB of images at $0.10/GB)
- Data transfer: ~$0.20/month (pulls from EC2 in same region, minimal cost)
- **Total ECR cost: ~$0.70/month** (negligible!)

---

## ⚠️ AWS Learner Lab Constraints

### Hard Limits

- ✅ **Region**: us-east-1 or us-west-2 ONLY
- ✅ **Max concurrent instances**: 9 (our max: 6)
- ✅ **Max vCPUs**: 32 (our usage: 24 vCPUs with 6x t3.small)
- ✅ **Instance types**: nano, micro, small, medium, large only
- ✅ **EBS**: Max 100GB per volume, gp2/gp3/sc1/standard only
- ✅ **IAM**: Cannot create custom roles, use LabRole only
- ✅ **Key pair**: Use vockey in us-east-1
- ✅ **Session behavior**: Instances stop at session end, restart on next session

### Budget Management Tips

- Stop ASG instances when not in use (set min/desired to 0)
- Use AWS Budgets to monitor spending
- Delete unused resources regularly
- Use smaller instances for testing

---

## 🏛️ Architecture Decision: Single ALB with Host-Based Routing

### Why Single ALB?

We're using **1 ALB with host-based routing** instead of 2 separate ALBs to optimize costs for AWS Learner Lab.

### How It Works

```
Internet Request
     │
     ├── Host: conviveitesofront.ricardonavarro.mx
     │        ↓
     │   ┌─────────────────────────────────┐
     │   │  Application Load Balancer      │
     │   │  (inspects Host header)         │
     │   └─────────────────────────────────┘
     │        │                    │
     │   Host Rule 1          Host Rule 2
     │   (frontend)           (backend)
     │        ↓                    ↓
     │   Frontend TG          Backend TG
     │   (port 3000)          (port 8080)
     │        ↓                    ↓
     │   Frontend ASG        Backend ASG
     └
```

### DNS Configuration

**Both domains point to the SAME ALB DNS name:**

```
conviveitesofront.ricardonavarro.mx  →  CNAME  →  conviveiteso-alb-xxxxx.elb.amazonaws.com
conviveitesoback.ricardonavarro.mx   →  CNAME  →  conviveiteso-alb-xxxxx.elb.amazonaws.com
```

The ALB inspects the `Host` HTTP header and routes to the appropriate target group.

### Pros & Cons

| ✅ Advantages                            | ⚠️ Trade-offs                         |
| ---------------------------------------- | ------------------------------------- |
| Saves ~$16/month (20% cost reduction)    | Single point of failure for both apps |
| Simpler infrastructure (fewer resources) | Shared capacity between services      |
| Single place for SSL/TLS management      | Slightly more complex routing rules   |
| Easier monitoring (one ALB)              | Risk of misconfiguration              |
| Perfect for separate domain names        | Both apps affected if ALB has issues  |

### Verdict

For AWS Learner Lab with budget constraints, **single ALB is the right choice** because:

- Significant cost savings (20% reduction)
- You already have separate domains (perfect for host-based routing)
- Risk of ALB failure is low (AWS managed service)
- Easier to manage for a development/learning environment

---

## 🏗️ Implementation Checklist

### Phase 1: Pre-Migration Preparation

#### Backup Current Environment

- [x] Create RDS database snapshot
- [x] Export environment variables and secrets to secure location
- [x] Document current DNS configuration
- [x] Take note of current Elastic IP
- [x] Backup any data stored on current EC2 instance

#### Documentation

- [x] Document all environment variables needed for new environment
- [x] List all domains and their current DNS records
- [x] Document current application configurations
- [x] Create rollback plan documentation

##### Environment variable inventory

| Service  | Variable                                                      | Purpose                              | Notes                                                              |
| -------- | ------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Backend  | NODE_ENV                                                      | Runtime mode                         | `production` in Terraform user data                                |
| Backend  | PORT                                                          | API port                             | Default `8080`                                                     |
| Backend  | BACKEND_URL                                                   | Public API URL                       | `https://conviveitesoback.ricardonavarro.mx`                       |
| Backend  | FRONTEND_URL                                                  | Public frontend URL                  | `https://conviveitesofront.ricardonavarro.mx`                      |
| Backend  | DATABASE_URL                                                  | Primary PostgreSQL connection string | Injected via Terraform (`postgresql://<cred>@<rds-endpoint>/<db>`) |
| Backend  | REDIS_HOST / REDIS_PORT                                       | Redis connection                     | Local Redis on backend instance (`127.0.0.1:6379`)                 |
| Backend  | CLIENT_ID / CLIENT_SECRET                                     | OAuth credentials                    | Store in secrets manager before deploy                             |
| Backend  | REDIRECT_URI                                                  | OAuth callback URL                   | `https://conviveitesoback.ricardonavarro.mx/auth/oauth-callback`   |
| Backend  | ADMIN_TOKEN                                                   | Admin auth token                     | Rotate per deployment                                              |
| Backend  | AWS_REGION                                                    | AWS region                           | `us-east-1` (Learner Lab)                                          |
| Backend  | AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN | Temporary Learner Lab credentials    | Update each session before CI/CD runs                              |
| Backend  | AWS_ENDPOINT_URL                                              | Optional LocalStack endpoint         | Leave unset in production                                          |
| Backend  | S3_BUCKET_NAME                                                | Asset bucket                         | `convive-iteso-prod` (create during Terraform)                     |
| Frontend | NEXT_PUBLIC_API_URL                                           | Base URL for API calls               | `https://conviveitesoback.ricardonavarro.mx`                       |

Store all non-public values in the team password vault; mirror them in GitHub Actions secrets once ECR pipeline is ready.

##### Domain and DNS inventory

| Domain                              | Record type | Current target                                      | Purpose                           |
| ----------------------------------- | ----------- | --------------------------------------------------- | --------------------------------- |
| conviveitesofront.ricardonavarro.mx | CNAME       | `conviveiteso-alb-<id>.elb.amazonaws.com` (planned) | Routes public web traffic via ALB |
| conviveitesoback.ricardonavarro.mx  | CNAME       | `conviveiteso-alb-<id>.elb.amazonaws.com` (planned) | Routes API traffic via ALB        |

TTL will be lowered to 60s immediately before cutover (Phase 6). Document DNS updates in this table as they occur.

##### Current application configuration snapshot

- Single EC2 instance in default VPC running Docker Compose for frontend/backend with Nginx reverse proxy and Certbot automation (see existing `infra/user_data.sh.tpl`).
- PostgreSQL RDS instance shared by both services, accessed over public internet via security group.
- Redis absent in production today (local only); backend uses in-memory queue.

This baseline will be replaced by dedicated ASGs, ALB, and co-located Redis once Terraform stack is applied.

##### Rollback plan reference

- High-level rollback flow captured in **🚨 Rollback Plan (If Migration Fails)** section below. Link this document from deployment runbooks so operators can revert DNS to legacy EC2 or destroy Terraform stack if required.

#### DNS Preparation

- [x] Lower DNS TTL to 60 seconds for quick cutover
  - [x] conviveitesofront.ricardonavarro.mx
  - [x] conviveitesoback.ricardonavarro.mx
- [ ] Wait 24 hours for TTL change to propagate

---

### Phase 2: Terraform Infrastructure Code

#### Core Infrastructure Files (NEW)

- [x] **infra/vpc.tf** - Custom VPC Configuration

  - [x] VPC with 10.0.0.0/16 CIDR
  - [x] 2 Public subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs
  - [x] 2 Database subnets (10.0.11.0/24, 10.0.12.0/24) in different AZs
  - [x] Internet Gateway
  - [x] Public route table with IGW route
  - [x] Subnet associations
  - [x] Tags for all resources

- [x] **infra/security-groups.tf** - Security Groups (replaces security.tf)

  - [x] Single ALB Security Group (80, 443 from 0.0.0.0/0)
  - [x] Frontend Instance Security Group (3000 from ALB SG)
  - [x] Backend Instance Security Group (8080 from ALB SG, 6379 from Backend SG for Redis)
  - [x] RDS Security Group (5432 from Backend Instance SG)
  - [x] All egress rules configured (allow all outbound)
  - [x] Proper tagging for all security groups
  - [x] **Status**: Successfully created and tested (4 security groups)
  - [x] **Security Group IDs**:
    - ALB: `sg-02f8e0ac426d568b8`
    - Frontend Instances: `sg-0f2cfc374ad97184d`
    - Backend Instances: `sg-0e1aeca19cd0a34d3`
    - RDS Database: `sg-0f5ebd4e79e099ce7`

- [x] **infra/alb.tf** - Single Application Load Balancer with Host-Based Routing

  - [x] ALB resource (internet-facing, spans both AZs)
  - [x] Frontend target group (port 3000, health check on `/`)
  - [x] Backend target group (port 8080, health check on `/health`)
  - [x] HTTP listener (port 80, redirect to HTTPS with HTTP 301)
  - [x] HTTPS listener (port 443, TLS 1.3, default action to frontend)
  - [x] Host-based listener rule for frontend (conviveitesofront.ricardonavarro.mx)
  - [x] Host-based listener rule for backend (conviveitesoback.ricardonavarro.mx)
  - [x] ALB subnet associations (both public subnets)
  - [x] Sticky sessions (24h cookie duration for WebSocket support)
  - [x] Deregistration delay: 30 seconds
  - [x] Cross-zone load balancing enabled
  - [x] Tags for all resources
  - [x] **Status**: Configuration complete, **ACM certificate required before deployment**

**⚠️ PREREQUISITE - ACM Certificate Required:**

Before deploying the ALB, you must create and validate an SSL certificate in AWS Certificate Manager (ACM):

**Step 1: Create Certificate in ACM**
- Go to AWS Console → Certificate Manager
- Click "Request certificate" → "Request a public certificate"
- Add domain names:
  - `conviveitesofront.ricardonavarro.mx`
  - `conviveitesoback.ricardonavarro.mx`
- Validation method: DNS validation (recommended)

**Step 2: Validate Certificate**
- Follow ACM instructions to add DNS records to your domain
- Wait for validation (can take 5-30 minutes)
- Certificate status must be "Issued"

**Step 3: Update terraform.tfvars**
- Copy the certificate ARN from ACM
- Replace `acm_certificate_arn` value in `infra/terraform.tfvars`
- Example: `arn:aws:acm:us-east-1:215350372069:certificate/abc12345-...`

**Step 4: Deploy ALB**
- `terraform apply` (ALB and related resources)

**Architecture:** Both domains point to the same ALB DNS. The ALB inspects the HTTP `Host` header and routes:
- `conviveitesofront.ricardonavarro.mx` → Frontend Target Group (port 3000)
- `conviveitesoback.ricardonavarro.mx` → Backend Target Group (port 8080)

- [x] **infra/asg-frontend.tf** - Frontend Auto Scaling Group

  - [x] Launch template with user data reference
  - [x] AMI data source (latest Ubuntu 22.04 LTS x86_64)
  - [x] Instance type: t3.small
  - [x] IAM instance profile: LabInstanceProfile
  - [x] Security group association (frontend_instances)
  - [x] Public IP assignment enabled
  - [x] Auto Scaling Group (min: 1, desired: 2, max: 4)
  - [x] Target group attachment (frontend TG)
  - [x] Subnet associations (both public subnets for multi-AZ)
  - [x] Health check type: ELB (uses ALB health checks)
  - [x] Health check grace period: 300 seconds (5 min)
  - [x] Instance refresh configuration (rolling, 50% min healthy)
  - [x] CPU-based scaling policy (target 70%)
  - [x] Enhanced monitoring enabled
  - [x] IMDSv2 required (security best practice)
  - [x] Termination policies configured
  - [x] **Status**: Configuration complete, ready for deployment

- [x] **infra/asg-backend.tf** - Backend Auto Scaling Group

  - [x] Launch template with user data reference
  - [x] AMI data source (latest Ubuntu 22.04 LTS x86_64)
  - [x] Instance type: t3.small
  - [x] IAM instance profile: LabInstanceProfile
  - [x] Security group association (backend_instances)
  - [x] Public IP assignment enabled
  - [x] Auto Scaling Group (min: 1, desired: 2, max: 4)
  - [x] Target group attachment (backend TG)
  - [x] Subnet associations (both public subnets for multi-AZ)
  - [x] Health check type: ELB (uses ALB health checks)
  - [x] Health check grace period: 300 seconds (5 min)
  - [x] Instance refresh configuration (rolling, 50% min healthy)
  - [x] CPU-based scaling policy (target 70%)
  - [x] Enhanced monitoring enabled
  - [x] IMDSv2 required (security best practice)
  - [x] Termination policies configured
  - [x] RDS connection string configured in user data
  - [x] **Status**: Configuration complete, ready for deployment

- [x] **infra/vpc-endpoints.tf** - VPC Endpoints

  - [x] S3 Gateway Endpoint (FREE - no charges)
  - [x] Route table associations (associated with public route table)
  - [x] **Status**: Successfully created and tested
  - [x] **VPC Endpoint ID**: `vpce-06b2256f0c75c0d17`
  - [x] **State**: Available
  - [x] **Benefits**: Faster S3 access, no data transfer charges, improved security

- [x] **infra/ami.tf** - AMI Data Sources

  - [x] Data source for Ubuntu 22.04 LTS x86_64
  - [x] Filters for most recent AMI
  - [x] Owner filter for Canonical (Ubuntu official account)
  - [x] Architecture filter (x86_64)
  - [x] Virtualization type filter (hvm)
  - [x] Root device type filter (ebs)
  - [x] State filter (available)
  - [x] **Status**: Successfully created and tested
  - [x] **Current AMI**: ami-0c398cb65a93047f2 (ubuntu-jammy-22.04-amd64-server-20251015)

- [x] **infra/ecr.tf** - Elastic Container Registry (NEW for ECR Deployment)

  - [x] Frontend ECR repository (convive-frontend)
  - [x] Backend ECR repository (convive-backend)
  - [x] Lifecycle policies (keep last 10 images, remove untagged after 7 days)
  - [x] Image scanning on push (enabled)
  - [x] Tags for all repositories
  - [x] **Status**: Successfully deployed and tested (4 resources created)

**ECR Repository Names:**

- `convive-frontend` - Next.js web application images
- `convive-backend` - NestJS API application images

**Image Tagging Strategy:**

- `:latest` - Always points to most recent deployment
- `:sha-<git-commit-sha>` - Traceable to specific git commit
- Example: `convive-frontend:latest` and `convive-frontend:sha-abc123`

#### User Data Templates (NEW)

- [x] **infra/user-data-frontend.sh.tpl** - Frontend Instance Initialization (ECR-based)

  - [x] System updates (apt-get update && upgrade)
  - [x] Install Docker and Docker Compose
  - [x] Install AWS CLI v2
  - [x] Configure AWS region from instance metadata
  - [x] Authenticate Docker with ECR (aws ecr get-login-password)
  - [x] Pull frontend image from ECR: ${ecr_frontend_repository_url}:latest
  - [x] Configure environment variables (NEXT_PUBLIC_API_URL)
  - [x] Start frontend container (Next.js on port 3000)
  - [x] Container health check and logging
  - [x] Setup log rotation for Docker and application logs
  - [x] **Status**: Template created and ready for use

**Key Feature:** No Git cloning or building! Instances pull pre-built images from ECR for fast boot times (~2 min vs 10+ min).

- [x] **infra/user-data-backend.sh.tpl** - Backend Instance Initialization (ECR-based)
  - [x] System updates (apt-get update && upgrade)
  - [x] Install Docker and Docker Compose
  - [x] Install Redis server
  - [x] Configure Redis (bind to localhost, 256MB maxmemory, LRU eviction policy)
  - [x] Start and enable Redis service
  - [x] Install AWS CLI v2
  - [x] Configure AWS region from instance metadata
  - [x] Authenticate Docker with ECR (aws ecr get-login-password)
  - [x] Pull backend image from ECR: ${ecr_backend_repository_url}:latest
  - [x] Configure environment variables (DATABASE_URL, REDIS_HOST=127.0.0.1, etc.)
  - [x] Start backend container (NestJS on port 8080) with host network mode
  - [x] Container health check and logging
  - [x] Setup log rotation for Docker, application, and Redis logs
  - [x] **Status**: Template created and ready for use

**Key Feature:** No Git cloning or building! Instances pull pre-built images from ECR. Redis co-located on same instance for cost savings.

#### Modified Terraform Files

- [ ] **infra/rds.tf** - Update RDS Configuration

  - [ ] Create DB subnet group using database subnets
  - [ ] Update instance to use new subnet group
  - [ ] Change instance class to db.t3.small (if needed)
  - [ ] Update security group reference
  - [ ] Ensure publicly_accessible = false
  - [ ] Confirm enhanced_monitoring disabled
  - [ ] Set backup_retention_period = 0
  - [ ] Update tags

- [x] **infra/iam.tf** - IAM Role References and ECR Permissions

  - [x] Add data source for LabRole
  - [x] Add data source for LabInstanceProfile
  - [x] Reference available for Launch Templates
  - [x] Verified ECR pull permissions already attached to LabRole
  - [x] **Status**: Complete - No additional setup required ✅

**✅ AWS Learner Lab Configuration Verified:**
- LabRole already has `AmazonEC2ContainerRegistryReadOnly` policy attached
- EC2 instances will have all necessary permissions to pull Docker images from ECR
- No manual configuration needed

**Note:** AWS Learner Lab doesn't allow modifying LabRole via Terraform, but this is acceptable since the required permissions are already in place.

- [ ] **infra/outputs.tf** - Update Outputs

  - [ ] Remove: EC2 public IP
  - [ ] Remove: Elastic IP
  - [ ] Add: ALB DNS name (single DNS for both domains)
  - [ ] Add: Frontend target group ARN
  - [ ] Add: Backend target group ARN
  - [ ] Add: **Frontend ECR repository URL**
  - [ ] Add: **Backend ECR repository URL**
  - [ ] Add: RDS endpoint (keep existing)
  - [ ] Add: Frontend ASG name
  - [ ] Add: Backend ASG name
  - [ ] Add: VPC ID
  - [ ] Add: Public subnet IDs

  **Note:** Both frontend and backend domains will use the same ALB DNS name. ECR URLs needed for CI/CD pipeline.

- [ ] **infra/variables.tf** - Add New Variables

  - [ ] VPC CIDR block (default: "10.0.0.0/16")
  - [ ] Public subnet CIDRs (list)
  - [ ] Database subnet CIDRs (list)
  - [ ] Frontend instance type (default: "t3.small")
  - [ ] Backend instance type (default: "t3.small")
  - [ ] Frontend ASG min/desired/max counts
  - [ ] Backend ASG min/desired/max counts
  - [ ] **ECR repository names** (frontend & backend)
  - [ ] **ECR image retention count** (default: 10)
  - [ ] Domain names (frontend & backend)
  - [ ] Region (us-east-1 or us-west-2)

  **Removed (no longer needed for ECR-based deployment):**

  - ~~GitHub repository URL~~
  - ~~GitHub token~~ (not needed in Terraform, only in CI/CD)

- [ ] **infra/terraform.tfvars.example** - Update Example Variables

  - [ ] Add all new variables from variables.tf
  - [ ] Update comments with Learner Lab constraints
  - [ ] Document required vs optional variables

- [ ] **infra/main.tf** - Verify Provider Configuration
  - [ ] Confirm region is us-east-1 or us-west-2
  - [ ] Update profile if needed
  - [ ] Add required_version constraint
  - [ ] Add required_providers block

#### Files to Delete

- [ ] Delete **infra/ec2.tf** (replaced by ASGs)
- [ ] Delete **infra/security.tf** (replaced by security-groups.tf)
- [ ] Delete **infra/user_data.sh.tpl** (replaced by role-specific templates)
- [ ] Delete **infra/secrets.tf** (empty, not needed)
- [ ] Update **infra/vpc.tf** references if any other files import it

---

### Phase 3: ECR-Based CI/CD Pipeline (Complete Rewrite)

This phase completely replaces the old SSH-based deployment with a modern ECR + ASG instance refresh approach.

#### New Deployment Flow

```
Developer pushes to main
         ↓
GitHub Actions Triggered
         ↓
┌────────────────────────────────────┐
│  1. Build Stage                    │
│  - Build frontend Docker image     │
│  - Build backend Docker image      │
│  - Run tests in containers         │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│  2. Push to ECR Stage              │
│  - Tag: latest + sha-<commit>      │
│  - Push frontend to ECR            │
│  - Push backend to ECR             │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│  3. Deploy Stage                   │
│  - Trigger ASG instance refresh    │
│  - Frontend ASG launches new       │
│    instances with new image        │
│  - Backend ASG launches new        │
│    instances with new image        │
│  - Health checks pass              │
│  - Old instances terminated        │
└────────────────────────────────────┘
         ↓
  Zero-downtime deployment complete!
```

#### GitHub Actions Workflows

- [ ] **Complete rewrite of .github/workflows/deploy.yml**

  **Job 1: Build and Push Images**

  - [ ] Checkout code
  - [ ] Set up Docker Buildx
  - [ ] Configure AWS credentials (Learner Lab)
  - [ ] Login to Amazon ECR
  - [ ] Extract commit SHA for tagging
  - [ ] Build frontend Docker image
    - [ ] Tag with `:latest`
    - [ ] Tag with `:sha-<commit-sha>`
    - [ ] Use cache layers for faster builds
  - [ ] Push frontend image to ECR
  - [ ] Build backend Docker image
    - [ ] Tag with `:latest`
    - [ ] Tag with `:sha-<commit-sha>`
    - [ ] Use cache layers for faster builds
  - [ ] Push backend image to ECR
  - [ ] Output image digests and tags

  **Job 2: Deploy via ASG Instance Refresh**

  - [ ] Depends on: build-and-push job
  - [ ] Configure AWS credentials
  - [ ] Get current ASG details (frontend & backend)
  - [ ] Start instance refresh for frontend ASG
    - [ ] MinHealthyPercentage: 90 (for rolling updates)
    - [ ] Wait for refresh to complete
    - [ ] Timeout: 15 minutes
  - [ ] Start instance refresh for backend ASG
    - [ ] MinHealthyPercentage: 90
    - [ ] Wait for refresh to complete
    - [ ] Timeout: 15 minutes
  - [ ] Verify all instances healthy
  - [ ] Verify ALB target groups healthy
  - [ ] Run smoke tests against ALB endpoints

  **Job 3: Notification**

  - [ ] Send deployment notification (Slack, Discord, or GitHub Issue comment)
  - [ ] Include deployed commit SHA
  - [ ] Include deployment duration

- [ ] **Create scripts/deploy-asg-refresh.sh** - ASG Instance Refresh Script

  ```bash
  #!/bin/bash
  # Script to trigger ASG instance refresh

  - [ ] Accept parameters: ASG name, region, min healthy percentage
  - [ ] Start instance refresh using AWS CLI
  - [ ] Poll refresh status every 30 seconds
  - [ ] Show progress (instances refreshed / total)
  - [ ] Wait for completion (success or failure)
  - [ ] Return exit code 0 for success, 1 for failure
  - [ ] Log all actions with timestamps
  - [ ] Support rollback on failure
  ```

- [ ] **Create scripts/verify-deployment.sh** - Deployment Verification Script

  ```bash
  #!/bin/bash
  # Script to verify deployment health

  - [ ] Check ALB target group health
  - [ ] Test frontend endpoint via ALB
  - [ ] Test backend API health endpoint via ALB
  - [ ] Verify correct Docker image tags on instances (via SSM)
  - [ ] Return exit code 0 for success, 1 for failure
  ```

- [ ] **Update .github/workflows/validate.yml** (Optional Enhancement)

  - [ ] Add Docker build test (ensure images build successfully)
  - [ ] Run tests inside Docker containers (not on runner)
  - [ ] Validate Dockerfiles with hadolint

- [ ] **Create .github/workflows/ecr-cleanup.yml** (Optional Maintenance)

  - [ ] Scheduled workflow (weekly)
  - [ ] Delete untagged images older than 7 days
  - [ ] Delete images older than 30 days (except :latest and recent SHAs)
  - [ ] Respect lifecycle policies

#### Required GitHub Secrets (Updated for ECR)

- [ ] **Remove old secrets:**

  - [ ] ~~EC2_SSH_KEY~~ (no longer needed)
  - [ ] ~~EC2_PUBLIC_IP~~ (no longer needed)

- [ ] **Add new secrets:**

  - [ ] `AWS_ACCESS_KEY_ID` (from Learner Lab AWS Details)
  - [ ] `AWS_SECRET_ACCESS_KEY` (from Learner Lab AWS Details)
  - [ ] `AWS_SESSION_TOKEN` (from Learner Lab AWS Details - **refreshes every session!**)
  - [ ] `AWS_ACCOUNT_ID` (for ECR repository URLs)
  - [ ] `AWS_REGION` (us-east-1 or us-west-2)
  - [ ] `FRONTEND_ECR_REPOSITORY` (convive-frontend)
  - [ ] `BACKEND_ECR_REPOSITORY` (convive-backend)
  - [ ] `FRONTEND_ASG_NAME` (from Terraform outputs)
  - [ ] `BACKEND_ASG_NAME` (from Terraform outputs)

- [ ] **Keep existing secrets:**
  - [ ] `SNYK_TOKEN` (for security scanning)
  - [ ] `GITHUB_TOKEN` (auto-provided)

**⚠️ Important Note for Learner Lab:** The AWS credentials (ACCESS_KEY, SECRET_KEY, SESSION_TOKEN) expire when your Learner Lab session ends. You'll need to update these secrets before each deployment. Consider automating this with a script.

#### Docker Configuration Updates

- [ ] **Verify apps/api/Dockerfile is optimized for ECR**

  - [ ] Multi-stage build (builder + runner)
  - [ ] Minimize image size (use Alpine)
  - [ ] Don't include unnecessary files (.dockerignore)
  - [ ] Use layer caching effectively
  - [ ] Non-root user for security
  - [ ] Health check instruction

- [ ] **Verify apps/web/Dockerfile is optimized for ECR**

  - [ ] Multi-stage build (builder + runner)
  - [ ] Next.js standalone output
  - [ ] Minimize image size (use Alpine)
  - [ ] Don't include unnecessary files (.dockerignore)
  - [ ] Use layer caching effectively
  - [ ] Non-root user for security
  - [ ] Health check instruction

- [ ] **Create/Update .dockerignore files**

  ```
  - [ ] apps/api/.dockerignore (exclude node_modules, .git, tests, etc.)
  - [ ] apps/web/.dockerignore (exclude node_modules, .git, .next, etc.)
  ```

#### Documentation Updates

- [ ] **Create docs/DEPLOYMENT.md** - Comprehensive Deployment Guide

  - [ ] Prerequisites (AWS credentials, Terraform applied)
  - [ ] How to update GitHub secrets for Learner Lab
  - [ ] How deployments work (ECR + ASG refresh)
  - [ ] How to manually trigger deployment
  - [ ] How to rollback to previous version
  - [ ] Troubleshooting common issues
  - [ ] How to check deployment status
  - [ ] How to access instance logs via SSM

- [ ] **Update README.md**

  - [ ] Add section on deployment architecture
  - [ ] Link to DEPLOYMENT.md
  - [ ] Add badge for deployment status (optional)
  - [ ] Document ECR repositories

- [ ] **Update CLAUDE.md**

  - [ ] Document ECR-based deployment strategy
  - [ ] Update development workflow
  - [ ] Add commands for local Docker testing

#### Rollback and Manual Deployment Procedures

**Rollback to Previous Version:**

- [ ] **Option 1: Redeploy Previous Commit SHA**

  ```bash
  # 1. Find previous successful deployment SHA from GitHub Actions history
  # 2. Manually trigger workflow with that commit
  # 3. Or update Launch Template to use previous image tag
  ```

- [ ] **Option 2: Update Launch Template Image Tag**

  ```bash
  # 1. Update user data in Launch Template to pull specific SHA
  # 2. Trigger ASG instance refresh
  # Example: docker pull <account>.dkr.ecr.us-east-1.amazonaws.com/convive-frontend:sha-abc123
  ```

- [ ] **Option 3: Emergency SSH via SSM**
  ```bash
  # 1. Connect to instances via Systems Manager Session Manager
  # 2. Manually pull previous image: docker pull <ecr-url>:sha-<old-commit>
  # 3. Restart containers: docker-compose down && docker-compose up -d
  # 4. Repeat for all instances (not recommended, use ASG refresh instead)
  ```

**Manual Deployment (without GitHub Actions):**

- [ ] **Using AWS CLI**

  ```bash
  # 1. Build images locally
  docker build -t convive-frontend:latest ./apps/web
  docker build -t convive-backend:latest ./apps/api

  # 2. Tag for ECR
  docker tag convive-frontend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/convive-frontend:latest
  docker tag convive-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/convive-backend:latest

  # 3. Login to ECR
  aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

  # 4. Push to ECR
  docker push <account>.dkr.ecr.us-east-1.amazonaws.com/convive-frontend:latest
  docker push <account>.dkr.ecr.us-east-1.amazonaws.com/convive-backend:latest

  # 5. Trigger ASG instance refresh
  aws autoscaling start-instance-refresh --auto-scaling-group-name <frontend-asg-name> --region us-east-1
  aws autoscaling start-instance-refresh --auto-scaling-group-name <backend-asg-name> --region us-east-1
  ```

#### Benefits of ECR-Based Deployment

| Benefit                 | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| **Faster Deployments**  | No build time on instances (1-2 min vs 10-15 min)    |
| **Consistency**         | Same image across all instances, no build variations |
| **Faster Auto-Scaling** | New instances boot in ~2 minutes vs 10+ minutes      |
| **Easy Rollbacks**      | Change image tag, no code rebuild needed             |
| **CI/CD Integration**   | Automated testing before images are pushed           |
| **Storage Efficiency**  | Images stored centrally, not on each instance        |
| **Traceability**        | Each image tagged with commit SHA for tracking       |
| **Cost Savings**        | Less EC2 compute time (important for Learner Lab!)   |
| **Zero Downtime**       | ASG instance refresh ensures rolling updates         |

---

### Phase 4: Testing Infrastructure Locally

#### Terraform Validation

- [ ] Run `terraform fmt` to format all files
- [ ] Run `terraform validate` to check syntax
- [ ] Run `terraform plan` to preview changes
- [ ] Review plan output for correctness
- [ ] Verify no unexpected deletions
- [ ] Check resource counts (should stay under limits)

#### Cost Estimation

- [ ] Use AWS Pricing Calculator to estimate costs
- [ ] Verify estimated costs fit within budget
- [ ] Document estimated monthly cost
- [ ] Plan for cost monitoring and alerts

---

### Phase 5: Infrastructure Deployment (Migration Day)

#### Pre-Deployment Checklist

- [ ] Verify Learner Lab session is active
- [ ] Verify sufficient budget remaining
- [ ] Confirm all team members are aware of deployment
- [ ] Set maintenance window/expected downtime
- [ ] Have rollback plan ready
- [ ] Verify RDS snapshot exists and is recent

#### Terraform Deployment

- [ ] Initialize Terraform: `terraform init`
- [ ] Create Terraform workspace (optional): `terraform workspace new prod`
- [ ] Review execution plan: `terraform plan -out=tfplan`
- [ ] Apply infrastructure: `terraform apply tfplan`
- [ ] Monitor resource creation in AWS Console
- [ ] Verify all resources created successfully
- [ ] Save Terraform state file securely

#### Post-Deployment Verification

- [ ] Verify VPC created with correct CIDR
- [ ] Verify subnets created in correct AZs
- [ ] Verify Internet Gateway attached
- [ ] Verify route tables configured correctly
- [ ] Verify security groups have correct rules
- [ ] Verify ALB is active and healthy (single ALB)
- [ ] Verify both target groups registered and healthy
- [ ] Verify host-based routing rules configured correctly
- [ ] Verify ASG instances launched (should be 4 total: 2 frontend + 2 backend)
- [ ] Verify RDS database accessible from backend instances
- [ ] Verify S3 VPC endpoint working

#### Application Health Checks

- [ ] SSH into frontend instance via Systems Manager

  - [ ] Verify Docker is running
  - [ ] Verify frontend container is running
  - [ ] Check application logs
  - [ ] Test health endpoint: `curl http://localhost:3000`
  - [ ] Exit session

- [ ] SSH into backend instance via Systems Manager

  - [ ] Verify Docker is running
  - [ ] Verify Redis is running: `redis-cli ping`
  - [ ] Verify backend container is running
  - [ ] Check application logs
  - [ ] Test health endpoint: `curl http://localhost:8080/health`
  - [ ] Test Redis connection from app
  - [ ] Exit session

- [ ] Test ALB endpoints with host-based routing

  - [ ] Get ALB DNS from outputs (single DNS for both services)
  - [ ] Test frontend: `curl -H "Host: conviveitesofront.ricardonavarro.mx" http://<alb-dns>`
  - [ ] Test backend: `curl -H "Host: conviveitesoback.ricardonavarro.mx" http://<alb-dns>/health`
  - [ ] Verify correct routing to each target group

- [ ] Test database connectivity
  - [ ] From backend instance, test RDS connection
  - [ ] Run database migration if needed
  - [ ] Verify data accessible

---

### Phase 6: DNS Cutover

#### DNS Updates

- [ ] Get ALB DNS name from Terraform outputs (e.g., `conviveiteso-alb-xxxxx.us-east-1.elb.amazonaws.com`)
- [ ] Log into DNS provider (ricardonavarro.mx domain)
- [ ] Update CNAME records (both domains point to SAME ALB):
  - [ ] `conviveitesofront.ricardonavarro.mx` → ALB DNS (CNAME)
  - [ ] `conviveitesoback.ricardonavarro.mx` → ALB DNS (CNAME)
- [ ] Save DNS changes
- [ ] Wait for DNS propagation (5-10 minutes with 60s TTL)
- [ ] Verify DNS resolution: `nslookup conviveitesofront.ricardonavarro.mx`
- [ ] Verify DNS resolution: `nslookup conviveitesoback.ricardonavarro.mx`
- [ ] Confirm both resolve to the same ALB IP addresses

**Note:** The ALB will use host-based routing to send traffic to the correct target group based on the domain name in the HTTP request.

#### Post-Cutover Testing

- [ ] Test frontend via domain: `https://conviveitesofront.ricardonavarro.mx`
- [ ] Test backend via domain: `https://conviveitesoback.ricardonavarro.mx/health`
- [ ] Test full user workflows:
  - [ ] User registration
  - [ ] User login
  - [ ] Event browsing
  - [ ] Event registration
  - [ ] File uploads to S3
  - [ ] Chat functionality (Redis queue)
- [ ] Monitor application logs for errors
- [ ] Monitor ALB access logs
- [ ] Monitor RDS connections

---

### Phase 7: SSL/TLS Configuration

#### Let's Encrypt Setup on ALBs

**Note:** ALBs don't directly support Let's Encrypt. Options:

1. Continue using instance-level SSL (current approach)
2. Use AWS Certificate Manager (requires domain validation)
3. Terminate SSL at instances, ALB forwards HTTP

#### Option 1: Instance-Level SSL (Current Approach)

- [ ] Update user data scripts to install Certbot
- [ ] Configure Certbot for automatic renewal
- [ ] Update ALB listeners to forward 443 to instances
- [ ] Test HTTPS on both domains
- [ ] Verify certificate auto-renewal works

#### Option 2: AWS Certificate Manager (Recommended for Production)

- [ ] Request certificate in ACM for both domains
- [ ] Complete domain validation (DNS or email)
- [ ] Wait for certificate issuance
- [ ] Update ALB listeners to use ACM certificate
- [ ] Force HTTPS redirect (80 → 443)
- [ ] Test HTTPS on both domains

---

### Phase 8: Monitoring & Optimization

#### Monitoring Setup (Optional - No CloudWatch for now)

- [ ] Set up AWS Budgets alert at 50% of budget
- [ ] Set up AWS Budgets alert at 75% of budget
- [ ] Set up AWS Budgets alert at 90% of budget
- [ ] Create dashboard to monitor resource usage
- [ ] Document how to check instance count
- [ ] Document how to check vCPU usage

#### Auto Scaling Validation

- [ ] Trigger load test to verify ASG scales up
- [ ] Verify new instances launch correctly
- [ ] Verify instances join target group
- [ ] Verify ALB distributes traffic to new instances
- [ ] Verify ASG scales down after load decreases
- [ ] Document scaling behavior

#### Cost Optimization

- [ ] Review actual costs after 24 hours
- [ ] Identify any unexpected charges
- [ ] Optimize if over budget:
  - [ ] Reduce ASG desired count
  - [ ] Stop instances during off-hours
  - [ ] Consider smaller instance types for dev/test

---

### Phase 9: Cleanup Old Infrastructure

**Wait 24-48 hours after successful migration before cleanup!**

#### Infrastructure Cleanup Script

- [x] **scripts/cleanup-infrastructure.sh** - Automated cleanup script (COMPLETED)
  - [x] Destroys all Terraform-managed resources
  - [x] Two-step destruction (VPC first, then ECR)
  - [x] Confirmation prompt (can skip with --force flag)
  - [x] Verifies cleanup completion
  - [x] Full logging with colored output
  - [x] Error handling and rollback prevention
  - [x] **Status**: Script created, tested, and working correctly

**Usage:**
```bash
# With confirmation prompt
./scripts/cleanup-infrastructure.sh

# Skip confirmation (auto-approve)
./scripts/cleanup-infrastructure.sh --force
```

#### Verify New Infrastructure Stable

- [ ] Confirm no critical issues for 24-48 hours
- [ ] Confirm all features working correctly
- [ ] Confirm acceptable performance
- [ ] Team approval to proceed with cleanup

#### Remove Old Resources

- [ ] Stop old EC2 instance
- [ ] Wait 1 hour, verify no issues
- [ ] Terminate old EC2 instance
- [ ] Release Elastic IP
- [ ] Delete old security groups (if unused)
- [ ] Update Terraform state if needed
- [ ] Remove old instance from any monitoring

#### Documentation Updates

- [ ] Update architecture diagrams
- [ ] Update deployment documentation
- [ ] Update troubleshooting guides
- [ ] Update team runbooks
- [ ] Archive old configuration files

---

### Phase 10: Post-Migration Tasks

#### Documentation

- [ ] Create architecture diagram for new infrastructure
- [ ] Document new deployment process
- [ ] Document how to access instances via SSM
- [ ] Document scaling procedures
- [ ] Document cost management procedures
- [ ] Document incident response procedures
- [ ] Update CLAUDE.md with new infrastructure details

#### Team Training

- [ ] Train team on new deployment process
- [ ] Train team on accessing instances via Systems Manager
- [ ] Train team on ASG management
- [ ] Train team on monitoring and cost management
- [ ] Document common troubleshooting scenarios

#### Contingency Planning

- [ ] Document rollback procedure
- [ ] Create disaster recovery plan
- [ ] Schedule regular backup verification
- [ ] Document incident escalation procedures
- [ ] Create runbook for common issues

---

## 🚨 Rollback Plan (If Migration Fails)

### Emergency Rollback Steps

1. [ ] Revert DNS changes back to old Elastic IP
2. [ ] Start old EC2 instance if stopped
3. [ ] Verify old infrastructure working
4. [ ] Notify team of rollback
5. [ ] Investigate failure cause
6. [ ] Document issues encountered
7. [ ] Plan remediation before retry

### Terraform Rollback

1. [ ] `terraform destroy` - to remove all new resources
2. [ ] Verify all new resources deleted in AWS Console
3. [ ] Check for any orphaned resources
4. [ ] Verify old infrastructure still intact

---

## 📝 Notes & Learnings

### Implementation Progress

**Phase 1: Pre-Migration Preparation** ✅
- Completed environment variable inventory
- Completed domain and DNS inventory
- Documented current application configuration
- Documented rollback plan

**Phase 2: Terraform Infrastructure Code** 🚧 (In Progress)
- ✅ **ECR Repositories**: Successfully created and tested (4 resources)
  - Frontend repository: `215350372069.dkr.ecr.us-east-1.amazonaws.com/convive-frontend`
  - Backend repository: `215350372069.dkr.ecr.us-east-1.amazonaws.com/convive-backend`
  - Lifecycle policies configured for both repositories
  - Image scanning enabled
- ✅ **VPC Infrastructure**: Successfully created and tested (9 resources)
  - VPC: `vpc-08931ef3c8e2bb471` (10.0.0.0/16)
  - 2 Public subnets in us-east-1a and us-east-1b
  - 2 Database subnets in us-east-1a and us-east-1b
  - Internet Gateway, Route Table, and Associations
- ✅ **AMI Data Sources**: Successfully created and tested
  - Data source for Ubuntu 22.04 LTS (Jammy)
  - Latest AMI: `ami-0c398cb65a93047f2` (20251015)
  - Owner: Canonical (099720109477)
  - Architecture: x86_64, Virtualization: HVM, Root: EBS
- ✅ **Security Groups**: Successfully created and tested (4 security groups)
  - ALB Security Group: Allows HTTP/HTTPS from internet
  - Frontend Instances SG: Allows port 3000 from ALB only
  - Backend Instances SG: Allows port 8080 from ALB, port 6379 from self (Redis)
  - RDS Security Group: Allows port 5432 from backend instances only
  - All security groups properly tagged and configured
- ✅ **IAM Configuration**: Complete and verified
  - Successfully configured data sources for LabRole and LabInstanceProfile
  - Verified LabRole already has `AmazonEC2ContainerRegistryReadOnly` policy attached
  - EC2 instances ready to pull Docker images from ECR
  - LabRole ARN: `arn:aws:iam::215350372069:role/LabRole`
  - LabInstanceProfile: `LabInstanceProfile` (ready for use in Launch Templates)
- ✅ **VPC Endpoints**: Successfully created and tested (1 resource)
  - S3 Gateway Endpoint: `vpce-06b2256f0c75c0d17`
  - Type: Gateway (FREE - no hourly or data transfer charges)
  - State: Available
  - Associated with public route table for subnet access
  - Benefits: Faster S3 access, improved security, cost savings
- ✅ **User Data Scripts**: Created and ready for ASG launch templates
  - Frontend script: `infra/user-data-frontend.sh.tpl`
    - Installs Docker, AWS CLI
    - Authenticates with ECR and pulls frontend image
    - Starts Next.js container on port 3000
    - Configured log rotation
  - Backend script: `infra/user-data-backend.sh.tpl`
    - Installs Docker, Redis, AWS CLI
    - Configures Redis (localhost, 256MB, LRU eviction)
    - Authenticates with ECR and pulls backend image
    - Starts NestJS container on port 8080
    - Configured log rotation for all services
- ✅ **Application Load Balancer**: Configuration complete, **ACM cert required**
  - Single ALB with host-based routing (saves $16/month vs 2 ALBs)
  - 2 Target groups: Frontend (port 3000) and Backend (port 8080)
  - HTTP listener: Redirects to HTTPS (HTTP 301)
  - HTTPS listener: TLS 1.3, host-based routing
  - Sticky sessions: 24h cookies for WebSocket support
  - Health checks configured for both target groups
  - **Next step**: Create ACM certificate and update terraform.tfvars
- ✅ **Auto Scaling Groups**: Configuration complete, ready for deployment
  - **Frontend ASG**:
    - Min: 1, Desired: 2, Max: 4 instances
    - t3.small instances with Ubuntu 22.04 LTS
    - User data pulls frontend image from ECR
    - CPU-based auto-scaling (target: 70%)
    - Rolling instance refresh (50% min healthy)
  - **Backend ASG**:
    - Min: 1, Desired: 2, Max: 4 instances
    - t3.small instances with Ubuntu 22.04 LTS + Redis
    - User data pulls backend image from ECR
    - CPU-based auto-scaling (target: 70%)
    - Rolling instance refresh (50% min healthy)
    - RDS connection configured
  - Both ASGs use ELB health checks (5 min grace period)
  - IMDSv2 required for enhanced security
  - Enhanced monitoring enabled
- ✅ **Cleanup Script**: Updated `scripts/cleanup-infrastructure.sh`
  - Now destroys 31 resources (including ASGs)
  - Tested and verified working correctly
  - Destroys all resources in proper dependency order
  - Includes verification step

**Phase 9: Infrastructure Cleanup** ✅ (Tools Ready)
- Created automated cleanup script for testing and budget management

### Issues Encountered

**Issue 1: Terraform Variable Requirements**
- **Problem**: Running `terraform apply` with `-target` flags still required all variables to be defined
- **Solution**: Created `infra/terraform.tfvars` with placeholder values for unused variables
- **Status**: Resolved

**Issue 2: Cleanup Script Testing**
- **Problem**: Needed a reliable way to destroy all resources for testing
- **Solution**: Created targeted destruction script that handles dependencies correctly
- **Status**: Resolved and working

**Issue 3: IAM Permissions in AWS Learner Lab**
- **Problem**: AWS Learner Lab doesn't allow modifying LabRole via Terraform (no `iam:AttachRolePolicy` or `iam:PutRolePolicy` permissions)
- **Solution**: Verified that LabRole already has `AmazonEC2ContainerRegistryReadOnly` policy attached by default
- **Status**: Resolved - No additional configuration needed

### Successful Validations

✅ **ECR Creation & Destruction Workflow**
- Successfully created 4 ECR resources
- Successfully destroyed all resources
- Successfully recreated resources (verified workflow repeatability)

✅ **VPC Creation & Destruction Workflow**
- Successfully created 9 VPC resources
- Successfully destroyed all resources
- Successfully recreated resources (verified workflow repeatability)

✅ **IAM Configuration**
- Successfully referenced LabRole and LabInstanceProfile data sources
- Verified LabRole has necessary ECR permissions pre-configured
- Ready for use in EC2 Launch Templates

✅ **VPC Endpoints**
- Successfully created S3 Gateway Endpoint
- State: Available
- Type: Gateway (FREE - no charges)
- Verified in AWS Console and CLI

✅ **User Data Scripts**
- Created frontend initialization template
- Created backend initialization template with Redis
- Both scripts use ECR-based deployment (pull pre-built images)
- Fast boot times: ~2 minutes vs 10+ minutes with git clone + build

✅ **Application Load Balancer**
- Terraform configuration validated successfully
- Single ALB with host-based routing configured
- HTTP to HTTPS redirect configured
- TLS 1.3 security policy
- Awaiting ACM certificate creation before deployment

✅ **Auto Scaling Groups**
- Terraform configuration validated successfully
- Frontend and backend ASGs configured
- Launch templates reference user data scripts
- ECR-based deployment configured
- Auto-scaling policies configured (CPU target: 70%)
- Instance refresh configured for zero-downtime deployments

### Optimization Opportunities

**Future Improvements:**
- Consider adding automated tests for Terraform configurations
- Add cost estimation to cleanup script
- Create a script to quickly spin up/down infrastructure for testing
- Add monitoring for AWS Learner Lab budget usage
- Automate AWS credential refresh for Learner Lab sessions

### Budget Tracking

| Date    | Budget Remaining | Notes          |
| ------- | ---------------- | -------------- |
| Start:  | $XXX             | Initial budget |
| Day 1:  | $XXX             | Post-migration |
| Day 7:  | $XXX             | After 1 week   |
| Day 30: | $XXX             | After 1 month  |

---

## 📚 References

### AWS Documentation

- [EC2 Auto Scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/)
- [Auto Scaling Instance Refresh](https://docs.aws.amazon.com/autoscaling/ec2/userguide/asg-instance-refresh.html)
- [Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/)
- [ECR Image Lifecycle Policies](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html)
- [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [ALB Host-Based Routing](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html#host-conditions)
- [Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

### Terraform Documentation

- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [ECR Repository Resource](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecr_repository)
- [ECR Lifecycle Policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecr_lifecycle_policy)
- [Auto Scaling Group Resource](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/autoscaling_group)
- [ALB Resources](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lb)
- [ALB Listener Rules (Host-Based Routing)](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lb_listener_rule)
- [IAM Policy Attachment](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy_attachment)

### Project Documentation

- [CLAUDE.md](./CLAUDE.md) - Project overview
- [README.md](./README.md) - Project README

---

## ✅ Sign-Off

### Migration Completion

- [ ] All checklist items completed
- [ ] Infrastructure stable for 48+ hours
- [ ] Team trained on new infrastructure
- [ ] Documentation updated
- [ ] Old infrastructure cleaned up
- [ ] Costs within budget
- [ ] **Migration Complete!** 🎉

### Team Sign-Off

| Name | Role      | Date | Signature |
| ---- | --------- | ---- | --------- |
|      | Lead      |      |           |
|      | DevOps    |      |           |
|      | Developer |      |           |

---

**Last Updated:** 2025-11-07
**Version:** 1.3
**Status:** In Progress - Phase 2 (ECR & VPC Complete)
**Updates:**

- v1.0: Initial migration plan
- v1.1: Updated for Single ALB with Host-Based Routing
- v1.2: Added ECR-based CI/CD deployment with ASG instance refresh
- v1.3: ECR and VPC infrastructure deployed and tested; cleanup script created
