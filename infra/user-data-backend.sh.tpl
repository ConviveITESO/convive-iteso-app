#!/bin/bash
# =============================================================================
# Backend EC2 Instance User Data Script
# =============================================================================
# This script runs on instance launch to:
# - Install Docker, Redis, and AWS CLI
# - Configure Redis for co-location with backend
# - Pull the backend Docker image from ECR
# - Start the NestJS backend container
# =============================================================================

set -e  # Exit on error
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "=========================================="
echo "Backend Instance Initialization Started"
echo "=========================================="
echo "Timestamp: $(date)"

# =============================================================================
# System Updates
# =============================================================================
echo "[1/9] Updating system packages..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

# =============================================================================
# Install Docker
# =============================================================================
echo "[2/9] Installing Docker..."
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
# Install Redis Server
# =============================================================================
echo "[3/9] Installing Redis server..."
apt-get install -y redis-server

# Configure Redis
echo "[4/9] Configuring Redis..."

# Backup original config
cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Configure Redis to bind to localhost only (security)
sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf

# Set maxmemory policy (evict least recently used keys when memory limit reached)
echo "maxmemory 256mb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf

# Disable protected mode since we're binding to localhost only
sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis/redis.conf

# Enable Redis to start on boot
systemctl enable redis-server

# Start Redis
systemctl start redis-server

# Verify Redis is running
if redis-cli ping | grep -q PONG; then
  echo "✓ Redis server started successfully"
else
  echo "✗ Redis server failed to start"
  exit 1
fi

# =============================================================================
# Install AWS CLI v2
# =============================================================================
echo "[5/9] Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
apt-get install -y unzip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip

echo "AWS CLI installed successfully: $(aws --version)"

# =============================================================================
# Configure AWS Region (use instance metadata)
# =============================================================================
echo "[6/9] Configuring AWS region..."
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
AWS_REGION=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/placement/region)
export AWS_DEFAULT_REGION=$AWS_REGION

echo "AWS Region: $AWS_REGION"

# =============================================================================
# Authenticate Docker with ECR
# =============================================================================
echo "[7/9] Authenticating Docker with ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ecr_registry}

echo "Docker authenticated with ECR successfully"

# =============================================================================
# Pull Backend Docker Image from ECR
# =============================================================================
echo "[8/9] Pulling backend Docker image from ECR..."
docker pull ${backend_image}:latest

echo "Backend image pulled successfully"

# =============================================================================
# Start Backend Container
# =============================================================================
echo "[9/9] Starting backend container..."

# Stop and remove any existing container
docker stop convive-backend 2>/dev/null || true
docker rm convive-backend 2>/dev/null || true

# Run backend container
docker run -d \
  --name convive-backend \
  --restart unless-stopped \
  --network host \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e DATABASE_URL="${database_url}" \
  -e REDIS_HOST=127.0.0.1 \
  -e REDIS_PORT=6379 \
  -e BACKEND_URL="${backend_url}" \
  -e FRONTEND_URL="${frontend_url}" \
  ${backend_image}:latest

# Wait for container to be healthy
echo "Waiting for backend container to be healthy..."
sleep 10

# Check container status
if docker ps | grep -q convive-backend; then
  echo "✓ Backend container started successfully"
  docker ps --filter name=convive-backend
else
  echo "✗ Backend container failed to start"
  docker logs convive-backend
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

cat > /etc/logrotate.d/redis <<EOF
/var/log/redis/redis-server.log {
  rotate 7
  daily
  compress
  size=10M
  missingok
  delaycompress
  notifempty
  postrotate
    systemctl reload redis-server > /dev/null 2>&1 || true
  endscript
}
EOF

# =============================================================================
# Summary
# =============================================================================
echo "=========================================="
echo "Backend Instance Initialization Complete"
echo "=========================================="
echo "Timestamp: $(date)"
echo ""
echo "Redis Status:"
redis-cli info server | grep -E "redis_version|process_id|uptime_in_seconds"
echo ""
echo "Container Status:"
docker ps --filter name=convive-backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Instance is ready to serve traffic on port 8080"
echo "=========================================="
