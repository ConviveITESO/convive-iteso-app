#!/bin/bash
# =============================================================================
# Frontend EC2 Instance User Data Script (Amazon Linux 2023)
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
dnf update -y

# =============================================================================
# Install Docker
# =============================================================================
echo "[2/7] Installing Docker..."
dnf install -y docker

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group (optional, for manual debugging)
usermod -a -G docker ec2-user

echo "Docker installed successfully: $(docker --version)"

# =============================================================================
# Install AWS CLI v2 (if not already installed)
# =============================================================================
echo "[3/7] Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
  echo "Installing AWS CLI v2..."
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
  dnf install -y unzip
  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install
  rm -rf /tmp/aws /tmp/awscliv2.zip
fi

echo "AWS CLI version: $(aws --version)"

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
# Note: NEXT_PUBLIC_API_URL is compiled into the bundle at build time via Docker build args
docker run -d \
  --name convive-frontend \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  ${frontend_image}:latest

# Wait for container to be healthy
echo "Waiting for frontend container to be healthy..."
CONTAINER_READY=false
for i in {1..20}; do
  sleep 2
  if docker ps | grep -q convive-frontend; then
    # Container is running, check if it's actually healthy by testing the port
    if timeout 2 bash -c "echo > /dev/tcp/localhost/3000" 2>/dev/null; then
      echo "✓ Frontend container is running and listening on port 3000"
      CONTAINER_READY=true
      break
    else
      echo "Container running but not yet listening on port 3000... (attempt $i/20)"
    fi
  else
    echo "Container not running, checking logs..."
    docker logs convive-frontend 2>&1 | tail -10
  fi
done

# Check container status
if [ "$CONTAINER_READY" = true ]; then
  echo "✓ Frontend container started successfully"
  docker ps --filter name=convive-frontend
else
  echo "✗ Frontend container failed to start or become healthy"
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
