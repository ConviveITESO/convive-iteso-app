#!/bin/bash

# =============================================================================
# AWS Infrastructure Cleanup Script
# =============================================================================
# This script destroys ALL AWS resources created by Terraform.
# Use this to clean up and preserve your AWS Learner Lab budget.
#
# Usage:
#   ./scripts/cleanup-infrastructure.sh
#   ./scripts/cleanup-infrastructure.sh --force  # Skip confirmation
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
FORCE=false
if [[ "$1" == "--force" ]]; then
    FORCE=true
fi

# =============================================================================
# Header
# =============================================================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AWS Infrastructure Cleanup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# =============================================================================
# Warning
# =============================================================================

echo -e "${RED}⚠️  WARNING: This will DESTROY all resources!${NC}"
echo ""
echo "Resources to be destroyed:"
echo "  ✗ 2 ECR repositories (convive-frontend, convive-backend)"
echo "  ✗ 2 ECR lifecycle policies"
echo "  ✗ 1 Application Load Balancer"
echo "  ✗ 2 Target Groups (Frontend, Backend)"
echo "  ✗ 2 ALB Listeners (HTTP, HTTPS)"
echo "  ✗ 2 ALB Listener Rules (Frontend, Backend)"
echo "  ✗ 4 Security Groups (ALB, Frontend, Backend, RDS)"
echo "  ✗ 1 S3 VPC Endpoint (Gateway)"
echo "  ✗ 1 VPC (10.0.0.0/16)"
echo "  ✗ 4 Subnets (2 public, 2 database)"
echo "  ✗ 1 Internet Gateway"
echo "  ✗ 1 Route Table + 2 Associations"
echo ""
echo -e "${YELLOW}Total: 25 resources${NC}"
echo ""

# =============================================================================
# Confirmation
# =============================================================================

if [ "$FORCE" = false ]; then
    echo -e "${YELLOW}Are you absolutely sure?${NC}"
    read -p "Type 'yes' to confirm destruction: " confirm
    echo ""

    if [ "$confirm" != "yes" ]; then
        echo -e "${GREEN}✓ Cancelled. No resources were destroyed.${NC}"
        echo ""
        exit 0
    fi
fi

# =============================================================================
# Navigate to infra directory
# =============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="$PROJECT_ROOT/infra"

if [ ! -d "$INFRA_DIR" ]; then
    echo -e "${RED}✗ Error: infra directory not found at $INFRA_DIR${NC}"
    exit 1
fi

cd "$INFRA_DIR"
echo -e "${BLUE}📁 Working directory: $INFRA_DIR${NC}"
echo ""

# =============================================================================
# Step 1: Destroy VPC Resources
# =============================================================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1/2: Destroying ALB, VPC, Security Groups, and VPC Endpoint Resources${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

terraform destroy \
  -target=aws_lb_listener_rule.backend \
  -target=aws_lb_listener_rule.frontend \
  -target=aws_lb_listener.https \
  -target=aws_lb_listener.http \
  -target=aws_lb_target_group.backend \
  -target=aws_lb_target_group.frontend \
  -target=aws_lb.main \
  -target=aws_security_group.rds \
  -target=aws_security_group.backend_instances \
  -target=aws_security_group.frontend_instances \
  -target=aws_security_group.alb \
  -target=aws_vpc_endpoint.s3 \
  -target=aws_route_table_association.public_az2 \
  -target=aws_route_table_association.public_az1 \
  -target=aws_route_table.public \
  -target=aws_subnet.database_az2 \
  -target=aws_subnet.database_az1 \
  -target=aws_subnet.public_az2 \
  -target=aws_subnet.public_az1 \
  -target=aws_internet_gateway.main \
  -target=aws_vpc.main \
  -auto-approve

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ VPC resources destroyed successfully${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Failed to destroy VPC resources${NC}"
    echo -e "${RED}Check the errors above and try again${NC}"
    echo ""
    exit 1
fi

# =============================================================================
# Step 2: Destroy ECR Resources
# =============================================================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2/2: Destroying ECR Resources${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

terraform destroy \
  -target=aws_ecr_lifecycle_policy.frontend \
  -target=aws_ecr_lifecycle_policy.backend \
  -target=aws_ecr_repository.frontend \
  -target=aws_ecr_repository.backend \
  -auto-approve

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ ECR resources destroyed successfully${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Failed to destroy ECR resources${NC}"
    echo -e "${RED}Check the errors above and try again${NC}"
    echo ""
    exit 1
fi

# =============================================================================
# Verification
# =============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Checking Terraform state..."
RESOURCE_COUNT=$(terraform show -json 2>/dev/null | jq -r '.values.root_module.resources | length' 2>/dev/null || echo "0")

if [ "$RESOURCE_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ Terraform state is clean (no resources)${NC}"
else
    echo -e "${YELLOW}⚠ Terraform still shows $RESOURCE_COUNT resources${NC}"
    echo "  Run 'terraform show' to see details"
fi

echo ""

# =============================================================================
# Summary
# =============================================================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Cleanup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "All Terraform-managed resources have been destroyed."
echo ""
echo -e "${BLUE}Additional Verification:${NC}"
echo ""
echo "Check AWS Console or run these commands:"
echo ""
echo "  # Check VPCs"
echo "  aws ec2 describe-vpcs --profile conviveiteso"
echo ""
echo "  # Check ECR repositories"
echo "  aws ecr describe-repositories --profile conviveiteso"
echo ""
echo "  # Check Terraform state"
echo "  terraform show"
echo ""
echo -e "${YELLOW}Note:${NC} The terraform.tfstate file still exists locally."
echo "This is normal. It will be updated when you create resources again."
echo ""
