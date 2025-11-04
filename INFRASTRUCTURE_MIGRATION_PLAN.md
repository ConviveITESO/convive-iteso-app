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

#### Load Balancers

- **Frontend ALB**: Routes to Next.js web application
- **Backend API ALB**: Routes to NestJS API

#### Auto Scaling Groups

- **Frontend ASG**: t3.small instances (Min: 1, Desired: 2, Max: 3)
- **Backend ASG**: t3.small instances with Redis (Min: 1, Desired: 2, Max: 3)

#### Security

- ALB Frontend SG (ingress: 80, 443 from 0.0.0.0/0)
- ALB Backend SG (ingress: 80, 443 from 0.0.0.0/0)
- Frontend Instances SG (ingress: 3000 from Frontend ALB SG)
- Backend Instances SG (ingress: 8080 from Backend ALB SG, 6379 from Backend SG)
- RDS SG (ingress: 5432 from Backend Instances SG)

#### Database

- RDS PostgreSQL db.t3.small
- Single-AZ deployment
- 20GB gp2 storage
- No automated backups
- Enhanced monitoring disabled

#### IAM

- Use existing **LabRole** and **LabInstanceProfile**

---

## 💰 Estimated Monthly Costs

| Resource                     | Cost/month     | Notes                        |
| ---------------------------- | -------------- | ---------------------------- |
| 4x t3.small EC2 (6hrs/day)   | ~$24           | Assuming 6 hours daily usage |
| 2x Application Load Balancer | ~$32           | ~$16 each                    |
| RDS db.t3.small (24/7)       | ~$25           | Single-AZ                    |
| S3 storage (10GB)            | ~$0.23         | Plus transfer costs          |
| **Total**                    | **~$81/month** | Without NAT Gateway!         |

**Savings from optimizations:** ~$66/month (no NAT Gateways)

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

## 🏗️ Implementation Checklist

### Phase 1: Pre-Migration Preparation

#### Backup Current Environment

- [ ] Create RDS database snapshot
- [ ] Export environment variables and secrets to secure location
- [ ] Document current DNS configuration
- [ ] Take note of current Elastic IP
- [ ] Backup any data stored on current EC2 instance

#### Documentation

- [ ] Document all environment variables needed for new environment
- [ ] List all domains and their current DNS records
- [ ] Document current application configurations
- [ ] Create rollback plan documentation

#### DNS Preparation

- [ ] Lower DNS TTL to 60 seconds for quick cutover
  - [ ] conviveitesofront.ricardonavarro.mx
  - [ ] conviveitesoback.ricardonavarro.mx
- [ ] Wait 24 hours for TTL change to propagate

---

### Phase 2: Terraform Infrastructure Code

#### Core Infrastructure Files (NEW)

- [ ] **infra/vpc.tf** - Custom VPC Configuration

  - [ ] VPC with 10.0.0.0/16 CIDR
  - [ ] 2 Public subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs
  - [ ] 2 Database subnets (10.0.11.0/24, 10.0.12.0/24) in different AZs
  - [ ] Internet Gateway
  - [ ] Public route table with IGW route
  - [ ] Subnet associations
  - [ ] Tags for all resources

- [ ] **infra/security-groups.tf** - Security Groups (replaces security.tf)

  - [ ] Frontend ALB Security Group (80, 443 from 0.0.0.0/0)
  - [ ] Backend ALB Security Group (80, 443 from 0.0.0.0/0)
  - [ ] Frontend Instance Security Group (3000 from Frontend ALB SG)
  - [ ] Backend Instance Security Group (8080 from Backend ALB SG, 6379 from Backend SG)
  - [ ] RDS Security Group (5432 from Backend Instance SG)

- [ ] **infra/alb-frontend.tf** - Frontend Application Load Balancer

  - [ ] ALB resource (internet-facing)
  - [ ] Target group (port 3000, health check /health or /)
  - [ ] HTTP listener (port 80)
  - [ ] HTTPS listener (port 443) - configure after Let's Encrypt setup
  - [ ] ALB subnet associations

- [ ] **infra/alb-backend.tf** - Backend API Application Load Balancer

  - [ ] ALB resource (internet-facing)
  - [ ] Target group (port 8080, health check /health)
  - [ ] HTTP listener (port 80)
  - [ ] HTTPS listener (port 443) - configure after Let's Encrypt setup
  - [ ] ALB subnet associations

- [ ] **infra/asg-frontend.tf** - Frontend Auto Scaling Group

  - [ ] Launch template with user data reference
  - [ ] AMI data source (latest Ubuntu 22.04 LTS x86)
  - [ ] Instance type: t3.small
  - [ ] IAM instance profile: LabInstanceProfile
  - [ ] Key pair: vockey (us-east-1)
  - [ ] Security group association
  - [ ] Auto Scaling Group (min: 1, desired: 2, max: 3)
  - [ ] Target group attachment
  - [ ] Subnet associations (both public subnets)
  - [ ] Health check type: ELB
  - [ ] Instance refresh configuration
  - [ ] CPU-based scaling policy (target 70%)

- [ ] **infra/asg-backend.tf** - Backend Auto Scaling Group

  - [ ] Launch template with user data reference
  - [ ] AMI data source (latest Ubuntu 22.04 LTS x86)
  - [ ] Instance type: t3.small
  - [ ] IAM instance profile: LabInstanceProfile
  - [ ] Key pair: vockey (us-east-1)
  - [ ] Security group association
  - [ ] Auto Scaling Group (min: 1, desired: 2, max: 3)
  - [ ] Target group attachment
  - [ ] Subnet associations (both public subnets)
  - [ ] Health check type: ELB
  - [ ] Instance refresh configuration
  - [ ] CPU-based scaling policy (target 70%)

- [ ] **infra/vpc-endpoints.tf** - VPC Endpoints

  - [ ] S3 Gateway Endpoint
  - [ ] Route table associations

- [ ] **infra/ami.tf** - AMI Data Sources
  - [ ] Data source for Ubuntu 22.04 LTS x86_64
  - [ ] Filters for most recent AMI

#### User Data Templates (NEW)

- [ ] **infra/user-data-frontend.sh.tpl** - Frontend Instance Initialization

  ```bash
  - [ ] System updates (apt-get update && upgrade)
  - [ ] Install Docker and Docker Compose
  - [ ] Install AWS CLI
  - [ ] Configure Systems Manager agent
  - [ ] Clone GitHub repository with token
  - [ ] Configure environment variables
  - [ ] Build/pull Docker images
  - [ ] Start frontend container (Next.js on port 3000)
  - [ ] Configure application health check
  - [ ] Setup log rotation
  ```

- [ ] **infra/user-data-backend.sh.tpl** - Backend Instance Initialization
  ```bash
  - [ ] System updates (apt-get update && upgrade)
  - [ ] Install Docker and Docker Compose
  - [ ] Install Redis server
  - [ ] Configure Redis (bind to private IP, maxmemory policy)
  - [ ] Start Redis service
  - [ ] Install AWS CLI
  - [ ] Configure Systems Manager agent
  - [ ] Clone GitHub repository with token
  - [ ] Configure environment variables (including Redis localhost)
  - [ ] Build/pull Docker images
  - [ ] Start backend container (NestJS on port 8080)
  - [ ] Configure application health check
  - [ ] Setup log rotation
  ```

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

- [ ] **infra/iam.tf** - IAM Role References

  - [ ] Add data source for LabRole
  - [ ] Add data source for LabInstanceProfile
  - [ ] Reference in Launch Templates
  - [ ] Document that no new roles can be created

- [ ] **infra/outputs.tf** - Update Outputs

  - [ ] Remove: EC2 public IP
  - [ ] Remove: Elastic IP
  - [ ] Add: Frontend ALB DNS name
  - [ ] Add: Backend ALB DNS name
  - [ ] Add: RDS endpoint (keep existing)
  - [ ] Add: Frontend ASG name
  - [ ] Add: Backend ASG name
  - [ ] Add: VPC ID
  - [ ] Add: Public subnet IDs

- [ ] **infra/variables.tf** - Add New Variables

  - [ ] VPC CIDR block (default: "10.0.0.0/16")
  - [ ] Public subnet CIDRs (list)
  - [ ] Database subnet CIDRs (list)
  - [ ] Frontend instance type (default: "t3.small")
  - [ ] Backend instance type (default: "t3.small")
  - [ ] Frontend ASG min/desired/max counts
  - [ ] Backend ASG min/desired/max counts
  - [ ] GitHub repository URL
  - [ ] GitHub token (sensitive)
  - [ ] Domain names (frontend & backend)
  - [ ] Region (us-east-1 or us-west-2)

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

### Phase 3: CI/CD Pipeline Updates

#### GitHub Actions Workflows

- [ ] **Update .github/workflows/deploy.yml**

  - [ ] Remove SSH-based deployment logic
  - [ ] Add new deployment strategy (choose one):
    - Option A: Instance refresh with new AMI
    - Option B: User data git pull on launch (recommended)
  - [ ] Update required secrets documentation
  - [ ] Add ASG instance refresh logic
  - [ ] Add health check verification
  - [ ] Add rollback capability

- [ ] **Create scripts/deploy-to-asg.sh** (if needed)

  - [ ] Script to trigger ASG instance refresh
  - [ ] Verify all instances healthy before completing
  - [ ] Support for rollback on failure

- [ ] **Update documentation for new CI/CD flow**
  - [ ] Document new deployment process
  - [ ] Update README with new infrastructure info
  - [ ] Document required GitHub secrets

#### Required GitHub Secrets (Update)

- [ ] Remove: `EC2_SSH_KEY`
- [ ] Remove: `EC2_PUBLIC_IP`
- [ ] Add: `AWS_ACCESS_KEY_ID` (from Learner Lab)
- [ ] Add: `AWS_SECRET_ACCESS_KEY` (from Learner Lab)
- [ ] Add: `AWS_SESSION_TOKEN` (from Learner Lab - refreshes per session)
- [ ] Keep: `SNYK_TOKEN`
- [ ] Keep: `GITHUB_TOKEN`
- [ ] Add: GitHub token for repository cloning in user data

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
- [ ] Verify ALBs are active and healthy
- [ ] Verify ASG instances launched (should be 4 total)
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

- [ ] Test ALB endpoints

  - [ ] Get Frontend ALB DNS from outputs
  - [ ] Test: `curl http://<frontend-alb-dns>`
  - [ ] Get Backend ALB DNS from outputs
  - [ ] Test: `curl http://<backend-alb-dns>/health`

- [ ] Test database connectivity
  - [ ] From backend instance, test RDS connection
  - [ ] Run database migration if needed
  - [ ] Verify data accessible

---

### Phase 6: DNS Cutover

#### DNS Updates

- [ ] Log into DNS provider (ricardonavarro.mx domain)
- [ ] Update A/CNAME records:
  - [ ] `conviveitesofront.ricardonavarro.mx` → Frontend ALB DNS (CNAME)
  - [ ] `conviveitesoback.ricardonavarro.mx` → Backend ALB DNS (CNAME)
- [ ] Save DNS changes
- [ ] Wait for DNS propagation (5-10 minutes with 60s TTL)
- [ ] Verify DNS resolution: `nslookup conviveitesofront.ricardonavarro.mx`
- [ ] Verify DNS resolution: `nslookup conviveitesoback.ricardonavarro.mx`

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

### Issues Encountered

```
Document any issues here during implementation:

- Issue 1:
  - Problem:
  - Solution:

- Issue 2:
  - Problem:
  - Solution:
```

### Optimization Opportunities

```
Document potential future improvements:

-
-
```

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
- [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

### Terraform Documentation

- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Auto Scaling Group Resource](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/autoscaling_group)
- [ALB Resources](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lb)

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

**Last Updated:** 2025-11-03
**Version:** 1.0
**Status:** Ready for Implementation
