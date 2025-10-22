#!/bin/bash
set -o pipefail

LOG_DIR="/var/log/convive-setup"
LOG_FILE="$LOG_DIR/setup.log"
STATUS_FILE="$LOG_DIR/status.log"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE" "$STATUS_FILE"
chmod 644 "$LOG_FILE" "$STATUS_FILE"

log_message() {
  local level="$1"
  shift
  local message="$*"
  local timestamp
  timestamp=$(date --iso-8601=seconds)
  echo "$timestamp [$level] $message" | tee -a "$LOG_FILE"
}

run_step() {
  local step="$1"
  shift
  log_message INFO "START: $step"
  if "$@"; then
    log_message INFO "SUCCESS: $step"
    echo "$step|SUCCESS" >> "$STATUS_FILE"
  else
    local code=$?
    log_message ERROR "FAIL: $step (exit $code)"
    echo "$step|FAIL|$code" >> "$STATUS_FILE"
    exit "$code"
  fi
}

export DEBIAN_FRONTEND=noninteractive

run_step "Update package index" bash -c "apt-get update -y"
run_step "Upgrade packages" bash -c "apt-get upgrade -y"
run_step "Install base packages" bash -c "apt-get install -y git curl nginx ufw unzip snapd"
run_step "Install Docker" bash -c "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && rm get-docker.sh"
run_step "Add ubuntu to docker group" usermod -aG docker ubuntu
run_step "Enable Docker service" bash -c "systemctl enable docker && systemctl start docker"
DOCKER_PLUGIN_DIR="/usr/lib/docker/cli-plugins"
run_step "Install Docker Compose plugin" bash -c "mkdir -p $DOCKER_PLUGIN_DIR && curl -SL https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-aarch64 -o $DOCKER_PLUGIN_DIR/docker-compose && chmod +x $DOCKER_PLUGIN_DIR/docker-compose"
run_step "Install Certbot" bash -c "snap install core && snap refresh core && snap install --classic certbot && ln -sf /snap/bin/certbot /usr/bin/certbot"

export LOG_DIR LOG_FILE STATUS_FILE

sudo su - ubuntu <<EOF_SUB
set -o pipefail

log_message() {
  local level="\$1"
  shift
  local message="\$*"
  local timestamp
  timestamp=\$(date --iso-8601=seconds)
  echo "\$timestamp [\$level] \$message" | tee -a "\$LOG_FILE"
}

run_step() {
  local step="\$1"
  shift
  log_message INFO "START: \${step}"
  if "\$@"; then
    log_message INFO "SUCCESS: \${step}"
    echo "\${step}|SUCCESS" >> "\$STATUS_FILE"
  else
    local code=\$?
    log_message ERROR "FAIL: \${step} (exit \${code})"
    echo "\${step}|FAIL|\${code}" >> "\$STATUS_FILE"
    exit "\${code}"
  fi
}

run_step "Clone repository" bash -c "cd /home/ubuntu && if [ ! -d \"${project_name}\" ]; then git clone \"https://${github_user}:${github_token}@github.com/${github_org}/${project_name}.git\"; else git -C /home/ubuntu/${project_name} fetch --all && git -C /home/ubuntu/${project_name} reset --hard origin/main; fi"
run_step "Configure git safe directory" git config --global --add safe.directory "/home/ubuntu/${project_name}"
run_step "Write web env" bash -c "cat <<'EOW' > /home/ubuntu/${project_name}/apps/web/.env.local
# API Configuration
NEXT_PUBLIC_API_URL=http://conviveitesofront.ricardonavarro.mx
EOW"
run_step "Write API env" bash -c "cat <<'EOA' > /home/ubuntu/${project_name}/apps/api/.env
# === Environment variables ===
NODE_ENV=production
PORT=8080
BACKEND_URL=http://conviveitesoback.ricardonavarro.mx
FRONTEND_URL=http://conviveitesofront.ricardonavarro.mx
# === Database ===
DATABASE_URL=postgresql://${db_username}:${db_password}@${db_host}:5432/${db_name}
# === Cache ===
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# === OAuth ===
CLIENT_ID=${client_id}
CLIENT_SECRET=${client_secret}
REDIRECT_URI=${redirect_uri}
# === SMTP server ===
SMTP_NAME=\"Convive ITESO\"
SMTP_ADDRESS=convive-iteso-noreply@iteso.mx
LOCAL_SMTP_HOST=127.0.0.1
LOCAL_SMTP_PORT=1025
MAILTRAP_API_KEY=your-mailtrap-token
# === Admin  ===
ADMIN_TOKEN=your_admin_token_here
# === AWS S3 Configuration ===
AWS_REGION=${aws_region}
AWS_ACCESS_KEY_ID=${aws_access_key_id}
AWS_SECRET_ACCESS_KEY=${aws_secret_access_key}
AWS_SESSION_TOKEN=${aws_session_token}
AWS_ENDPOINT_URL=${aws_endpoint_url}
S3_BUCKET_NAME=${s3_bucket_name}
EOA"
run_step "Start application stack" bash -c "cd /home/ubuntu/${project_name} && make prod-up"
EOF_SUB

run_step "Configure nginx frontend" bash -c "cat <<'NGINX' | tee /etc/nginx/sites-available/conviveitesofront > /dev/null
server {
    listen 80;
    server_name conviveitesofront.ricardonavarro.mx;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}
NGINX"

run_step "Configure nginx backend" bash -c "cat <<'NGINX' | tee /etc/nginx/sites-available/conviveitesoback > /dev/null
server {
    listen 80;
    server_name conviveitesoback.ricardonavarro.mx;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}
NGINX"

run_step "Enable nginx sites" bash -c "ln -sf /etc/nginx/sites-available/conviveitesofront /etc/nginx/sites-enabled/conviveitesofront && ln -sf /etc/nginx/sites-available/conviveitesoback /etc/nginx/sites-enabled/conviveitesoback"
run_step "Reload nginx" bash -c "nginx -t && systemctl reload nginx"
run_step "Obtain HTTPS certificate (frontend)" bash -c "certbot --nginx --non-interactive --agree-tos --redirect -m ${admin_email} -d conviveitesofront.ricardonavarro.mx"
run_step "Obtain HTTPS certificate (backend)" bash -c "certbot --nginx --non-interactive --agree-tos --redirect -m ${admin_email} -d conviveitesoback.ricardonavarro.mx"

log_message INFO "EC2 setup complete."
