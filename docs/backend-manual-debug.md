---

# Backend ASG Manual Simulation & Debug Guide

Run these steps on the manually created debug node to mimic the backend Auto Scaling Group launch.

## 1. Instance info

| Item           | Value                                              |
| -------------- | -------------------------------------------------- |
| Instance ID    | `i-03e588e8960c3c625`                              |
| Public DNS     | `ec2-54-204-171-106.compute-1.amazonaws.com`       |
| Private IP     | `10.0.1.77`                                        |
| Subnet         | `subnet-0859de7a4586aca98`                         |
| Security Group | `sg-0521702d3d24b0ce3`                             |
| IAM profile    | `LabInstanceProfile`                               |
| AMI            | `ami-03c870feb7c37e4ff` (Amazon Linux 2023 x86_64) |

## 2. Connect

```bash
chmod 400 mac_pepe.pem
ssh -i mac_pepe.pem ec2-user@ec2-54-204-171-106.compute-1.amazonaws.com
```

Use `-vvv` if SSH troubleshooting is needed.

## 3. Replay user-data manually

Work as `root` so commands match user-data.

### 3.1 Prep

```bash
sudo su -
dnf update -y
```

### 3.2 Docker

```bash
dnf install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user
if [ -S /var/run/docker.sock ]; then
  chgrp docker /var/run/docker.sock
  chmod 660 /var/run/docker.sock
fi
```

### 3.3 Redis

```bash
dnf install -y redis6
cp /etc/redis6/redis6.conf /etc/redis6/redis6.conf.backup
sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis6/redis6.conf
sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis6/redis6.conf
echo "maxmemory 256mb" >> /etc/redis6/redis6.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis6/redis6.conf
systemctl enable redis6
systemctl restart redis6
redis6-cli ping
```

### 3.4 AWS CLI + region

```bash
if ! command -v aws >/dev/null; then
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
  dnf install -y unzip
  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install
  rm -rf /tmp/aws /tmp/awscliv2.zip
fi
TOKEN=$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
REGION=$(curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
export AWS_REGION="$REGION"
export AWS_DEFAULT_REGION="$REGION"
echo "AWS Region: $AWS_REGION"
echo "AWS Default Region: $AWS_DEFAULT_REGION"
```

### 3.5 ECR auth + pull

```bash
ecr_registry=$(aws ecr describe-repositories \
  --repository-names convive-backend \
  --query 'repositories[0].repositoryUri' --output text | cut -d'/' -f1)
backend_image=$(aws ecr describe-repositories \
  --repository-names convive-backend \
  --query 'repositories[0].repositoryUri' --output text)
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ecr_registry"
docker pull "${backend_image}:latest"
```

### 3.6 Env vars

Install `jq` if missing: `dnf install -y jq`.

```bash
export DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/<db>"
export BACKEND_URL="http://<backend-domain>"
export FRONTEND_URL="http://<frontend-domain>"
export CLIENT_ID="<oauth-client-id>"
export CLIENT_SECRET="<oauth-client-secret>"
export REDIRECT_URI="http://<backend-domain>/auth/oauth-callback"
export ADMIN_TOKEN="<admin-token>"
export SMTP_NAME="ConviveITESO"
export SMTP_ADDRESS="<smtp-email>"
export LOCAL_SMTP_HOST="localhost"
export LOCAL_SMTP_PORT="1025"
export MAILTRAP_API_KEY="<mailtrap-key>"
export AWS_REGION="$AWS_REGION"
creds=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/iam/security-credentials/LabRole)
export AWS_ACCESS_KEY_ID="$(echo "$creds" | jq -r '.AccessKeyId')"
export AWS_SECRET_ACCESS_KEY="$(echo "$creds" | jq -r '.SecretAccessKey')"
export AWS_SESSION_TOKEN="$(echo "$creds" | jq -r '.Token')"
export S3_BUCKET_NAME="convive-iteso-prod"
```

Replace placeholders before proceeding.

### 3.7 Run backend container

```bash
docker stop convive-backend 2>/dev/null || true
docker rm convive-backend 2>/dev/null || true

docker run -d \
  --name convive-backend \
  --restart unless-stopped \
  --network host \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e REDIS_HOST=127.0.0.1 \
  -e REDIS_PORT=6379 \
  -e BACKEND_URL="$BACKEND_URL" \
  -e FRONTEND_URL="$FRONTEND_URL" \
  -e CLIENT_ID="$CLIENT_ID" \
  -e CLIENT_SECRET="$CLIENT_SECRET" \
  -e REDIRECT_URI="$REDIRECT_URI" \
  -e ADMIN_TOKEN="$ADMIN_TOKEN" \
  -e SMTP_NAME="$SMTP_NAME" \
  -e SMTP_ADDRESS="$SMTP_ADDRESS" \
  -e LOCAL_SMTP_HOST="$LOCAL_SMTP_HOST" \
  -e LOCAL_SMTP_PORT="$LOCAL_SMTP_PORT" \
  -e MAILTRAP_API_KEY="$MAILTRAP_API_KEY" \
  -e AWS_REGION="$AWS_REGION" \
  -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  -e AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN" \
  -e S3_BUCKET_NAME="$S3_BUCKET_NAME" \
  "${backend_image}:latest"
```

### 3.8 Validate

```bash
# Wait for port 8080
until timeout 2 bash -c 'echo > /dev/tcp/127.0.0.1/8080'; do sleep 2; done

docker ps --filter name=convive-backend
journalctl -u redis6 --no-pager -n 50
docker logs convive-backend --tail 100
```

### 3.9 Optional logrotate

```bash
cat >/etc/logrotate.d/docker-containers <<'EOF'
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  missingok
  delaycompress
  copytruncate
}
EOF
```

## 4. Debug checklist

1. `systemctl status redis6` & `redis-cli ping`.
2. Confirm every env var matches production.
3. Re-run ECR login/pull if image errors.
4. Inspect `docker logs convive-backend` for stack traces.
5. `curl -i http://127.0.0.1:8080/health` to verify service.
6. Re-run individual sections to isolate failures.

## 5. Cleanup

Terminate the debug node once finished:

```bash
aws ec2 terminate-instances --instance-ids i-03e588e8960c3c625 --profile conviveiteso --region us-east-1
```

Wait for `terminated` state before retrying the ASG refresh.
