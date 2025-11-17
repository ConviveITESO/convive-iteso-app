#!/bin/bash
# =============================================================================
# Backend EC2 Instance User Data Script (Amazon Linux 2023)
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
echo "[1/10] Updating system packages..."
dnf update -y

# =============================================================================
# Install Docker
# =============================================================================
echo "[2/10] Installing Docker..."
dnf install -y docker

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group (optional, for manual debugging)
usermod -a -G docker ec2-user

echo "Docker installed successfully: $(docker --version)"

# Ensure docker socket has correct group ownership and permissions for immediate use
# This helps when manually debugging as ec2-user without re-login
if [ -S /var/run/docker.sock ]; then
  chgrp docker /var/run/docker.sock || true
  chmod 660 /var/run/docker.sock || true
fi

# =============================================================================
# Install Redis Server
# =============================================================================
echo "[3/10] Installing Redis server..."
dnf install -y redis6

# Configure Redis
echo "[4/10] Configuring Redis..."

# Backup original config
cp /etc/redis6/redis6.conf /etc/redis6/redis6.conf.backup

# Configure Redis to bind to localhost only (security)
sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis6/redis6.conf

# Set maxmemory policy (evict least recently used keys when memory limit reached)
echo "maxmemory 256mb" >> /etc/redis6/redis6.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis6/redis6.conf

# Disable protected mode since we're binding to localhost only
sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis6/redis6.conf

# Enable Redis to start on boot
systemctl enable redis6

# Restart Redis to apply configuration changes
systemctl restart redis6

# Verify Redis is running with retry logic
echo "Verifying Redis is ready..."
REDIS_READY=false
for i in {1..30}; do
  if redis6-cli ping 2>/dev/null | grep -q PONG; then
    echo "✓ Redis server started successfully"
    REDIS_READY=true
    break
  fi
  echo "Waiting for Redis to be ready... (attempt $i/30)"
  sleep 2
done

if [ "$REDIS_READY" = false ]; then
  echo "✗ Redis server failed to start after 60 seconds"
  systemctl status redis6 --no-pager || true
  journalctl -u redis6 --no-pager -n 50 || true
  exit 1
fi

echo "Waiting for Redis to fully initialize..."
sleep 5

# =============================================================================
# Install AWS CLI v2 (if not already installed)
# =============================================================================
echo "[5/10] Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
  echo "Installing AWS CLI v2..."
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
  dnf install -y unzip
  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install
  rm -rf /tmp/aws /tmp/awscliv2.zip
fi

echo "AWS CLI version: $(aws --version)"

# =============================================================================
# Configure AWS Region (use instance metadata)
# =============================================================================
echo "[6/10] Configuring AWS region..."
TOKEN=$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
REGION=$(curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/placement/region)
export AWS_REGION="$REGION"
export AWS_DEFAULT_REGION="$REGION"
echo "AWS Region: $REGION"
echo "AWS Default Region: $AWS_DEFAULT_REGION"

# Download RDS CA bundle for SSL verification
RDS_CA_PATH="/etc/ssl/certs/rds-ca-bundle.pem"
echo "Downloading RDS CA bundle to $RDS_CA_PATH..."
curl -fsSL "https://truststore.pki.rds.amazonaws.com/$AWS_REGION/$AWS_REGION-bundle.pem" -o "$RDS_CA_PATH"
chmod 644 "$RDS_CA_PATH"
export PGSSLROOTCERT="$RDS_CA_PATH"
export PGSSLMODE="verify-full"

# Resolve backend_image (if not templated) and ecr_registry
if [ -z "$${backend_image:-}" ] || [ "$${backend_image}" = "null" ]; then
  echo "Resolving backend_image from ECR..."
  backend_image=$(aws ecr describe-repositories --region "$AWS_REGION" \
    --repository-names convive-backend \
    --query 'repositories[0].repositoryUri' --output text)
fi

ecr_registry="$(echo "$backend_image" | cut -d'/' -f1)"

# =============================================================================
# Install PostgreSQL client & ensure application user exists
# =============================================================================
echo "[7/10] Installing PostgreSQL client and applying database grants..."
dnf install -y postgresql15

PG_ADMIN_URI="postgresql://${db_master_username}:${db_master_password}@${db_address}:${db_port}/postgres?sslmode=verify-full&sslrootcert=%2Fetc%2Fssl%2Fcerts%2Frds-ca-bundle.pem"

cat <<SQL >/tmp/app-user.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${app_db_username}') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', '${app_db_username}', '${app_db_password}');
  ELSE
    EXECUTE format('ALTER ROLE %I WITH PASSWORD %L', '${app_db_username}', '${app_db_password}');
  END IF;
END
$$;
GRANT ALL PRIVILEGES ON DATABASE ${db_name} TO ${app_db_username};
ALTER DATABASE ${db_name} OWNER TO ${app_db_username};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${app_db_username};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${app_db_username};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${app_db_username};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ${app_db_username};
SQL

psql "$PG_ADMIN_URI" -f /tmp/app-user.sql

echo "✓ Database user ${app_db_username} ensured"

# =============================================================================
# Authenticate Docker with ECR
# =============================================================================
echo "[8/10] Authenticating Docker with ECR ($ecr_registry)..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ecr_registry"

echo "Docker authenticated with ECR successfully"

# =============================================================================
# Pull Backend Docker Image from ECR
# =============================================================================
echo "[9/10] Pulling backend Docker image from ECR: ${backend_image}:latest"
docker pull "${backend_image}:latest"

echo "Backend image pulled successfully"

# =============================================================================
# Start Backend Container
# =============================================================================
echo "[10/10] Starting backend container..."

# Stop and remove any existing container
docker stop convive-backend 2>/dev/null || true
docker rm convive-backend 2>/dev/null || true

# Run backend container
docker run -d \
  --name convive-backend \
  --restart unless-stopped \
  --network host \
  -v /etc/ssl/certs/rds-ca-bundle.pem:/etc/ssl/certs/rds-ca-bundle.pem:ro \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e PGSSLMODE=verify-full \
  -e PGSSLROOTCERT=/etc/ssl/certs/rds-ca-bundle.pem \
  -e DATABASE_URL="${database_url}" \
  -e REDIS_HOST=127.0.0.1 \
  -e REDIS_PORT=6379 \
  -e BACKEND_URL="${backend_url}" \
  -e FRONTEND_URL="${frontend_url}" \
  -e CLIENT_ID="${client_id}" \
  -e CLIENT_SECRET="${client_secret}" \
  -e REDIRECT_URI="${redirect_uri}" \
  -e ADMIN_TOKEN="${admin_token}" \
  -e SMTP_NAME="${smtp_name}" \
  -e SMTP_ADDRESS="${smtp_address}" \
  -e LOCAL_SMTP_HOST="${local_smtp_host}" \
  -e LOCAL_SMTP_PORT="${local_smtp_port}" \
  -e MAILTRAP_API_KEY="${mailtrap_api_key}" \
  -e AWS_REGION="$AWS_REGION" \
  -e S3_BUCKET_NAME="${s3_bucket_name}" \
  "${backend_image}:latest"

# Wait for container to be healthy with retry logic
echo "Waiting for backend container to be healthy..."
CONTAINER_READY=false
for i in {1..30}; do
  sleep 2
  if docker ps | grep -q convive-backend; then
    if timeout 2 bash -c "echo > /dev/tcp/localhost/8080" 2>/dev/null; then
      echo "✓ Backend container is running and listening on port 8080"
      CONTAINER_READY=true
      break
    else
      echo "Container running but not yet listening on port 8080... (attempt $i/30)"
    fi
  else
    echo "Container not running, checking logs..."
    docker logs convive-backend 2>&1 | tail -10 || true
    if [ $i -ge 5 ]; then
      echo "✗ Backend container failed to start"
      exit 1
    fi
  fi
done

if [ "$CONTAINER_READY" = false ]; then
  echo "✗ Backend container failed to become healthy after 60 seconds"
  echo "Container logs:"
  docker logs convive-backend || true
  exit 1
fi

docker ps --filter name=convive-backend

# =============================================================================
# Configure Log Rotation
# =============================================================================
cat > /etc/logrotate.d/docker-containers <<EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  missingok
  delaycompress
  copytruncate
}
EOF

# =============================================================================
# Cleanup and Final Status
# =============================================================================
echo "=========================================="
echo "Backend Instance Initialization Complete"
echo "=========================================="
echo "Timestamp: $(date)"
echo "Container Status:"
docker ps --filter name=convive-backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Redis Status:"
systemctl status redis6 --no-pager | head -5 || true
echo ""
echo "User Data script completed successfully!"
