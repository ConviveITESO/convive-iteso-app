#!/bin/bash
# =============================================================================
# Frontend EC2 Instance User Data Script
# =============================================================================
# This script runs on instance launch to:
# - Install Docker and AWS CLI
# - Pull the frontend Docker image from ECR
# - Start the Next.js frontend container
# =============================================================================

set -e  # Exit on error
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "=========================================="
echo "Frontend Instance Initialization Started"
echo "=========================================="
echo "Timestamp: $(date)"

# =============================================================================
# System Updates
# =============================================================================
echo "[1/7] Updating system packages..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

# =============================================================================
# Install Docker
# =============================================================================
echo "[2/7] Installing Docker..."
apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo "Docker installed successfully: $(docker --version)"

# =============================================================================
# Install AWS CLI v2
# =============================================================================
echo "[3/7] Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
apt-get install -y unzip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip

echo "AWS CLI installed successfully: $(aws --version)"

# =============================================================================
# Configure AWS Region (use instance metadata)
# =============================================================================
echo "[4/7] Configuring AWS region..."
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
AWS_REGION=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/placement/region)
export AWS_DEFAULT_REGION=$AWS_REGION

echo "AWS Region: $AWS_REGION"

# =============================================================================
# Authenticate Docker with ECR
# =============================================================================
echo "[5/7] Authenticating Docker with ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ecr_registry}

echo "Docker authenticated with ECR successfully"

# =============================================================================
# Pull Frontend Docker Image from ECR
# =============================================================================
echo "[6/7] Pulling frontend Docker image from ECR..."
docker pull ${frontend_image}:latest

echo "Frontend image pulled successfully"

# =============================================================================
# Start Frontend Container
# =============================================================================
echo "[7/7] Starting frontend container..."

# Stop and remove any existing container
docker stop convive-frontend 2>/dev/null || true
docker rm convive-frontend 2>/dev/null || true

# Run frontend container
docker run -d \
  --name convive-frontend \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="${api_url}" \
  -e NODE_ENV=production \
  ${frontend_image}:latest

# Wait for container to be healthy
echo "Waiting for frontend container to be healthy..."
sleep 10

# Check container status
if docker ps | grep -q convive-frontend; then
  echo "✓ Frontend container started successfully"
  docker ps --filter name=convive-frontend
else
  echo "✗ Frontend container failed to start"
  docker logs convive-frontend
  exit 1
fi

# =============================================================================
# Configure Log Rotation
# =============================================================================
cat > /etc/logrotate.d/docker-containers <<EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=10M
  missingok
  delaycompress
  copytruncate
}
EOF

# =============================================================================
# Summary
# =============================================================================
echo "=========================================="
echo "Frontend Instance Initialization Complete"
echo "=========================================="
echo "Timestamp: $(date)"
echo ""
echo "Container Status:"
docker ps --filter name=convive-frontend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Instance is ready to serve traffic on port 3000"
echo "=========================================="
