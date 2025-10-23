#!/bin/bash
set -euo pipefail

# ==== Vars expected from Terraform templatefile() ====
front_domain="${front_domain:-conviveitesofront.ricardonavarro.mx}"
back_domain="${back_domain:-conviveitesoback.ricardonavarro.mx}"
project_name="${project_name:?project_name required}"
github_org="${github_org:?github_org required}"
github_user="${github_user:?github_user required}"
github_token="${github_token:?github_token required}"
admin_email="${admin_email:-ops@example.com}"
enable_tls="${enable_tls:-false}"             # "true" to run certbot now
# Optionally reuse same credentials for second repo; set to empty to skip.
second_repo_org="${second_repo_org:-ConviveITESO}"
second_repo_name="${second_repo_name:-convive-iteso-app}"
second_repo_user="${second_repo_user:-$github_user}"
second_repo_token="${second_repo_token:-$github_token}"

# ==== System packages ====
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y git curl nginx ufw unzip snapd ca-certificates

# ==== Docker ====
curl -fsSL https://get.docker.com -o /root/get-docker.sh
sh /root/get-docker.sh
rm /root/get-docker.sh
usermod -aG docker ubuntu
systemctl enable --now docker

# ==== Docker Compose v2 plugin (arch-safe) ====
DOCKER_PLUGIN_DIR=/usr/lib/docker/cli-plugins
mkdir -p "$DOCKER_PLUGIN_DIR"
ARCH="$(dpkg --print-architecture)"
case "$ARCH" in
  amd64)   COMPOSE_URL="https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-x86_64" ;;
  arm64)   COMPOSE_URL="https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-aarch64" ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac
curl -fsSL "$COMPOSE_URL" -o "$DOCKER_PLUGIN_DIR/docker-compose"
chmod +x "$DOCKER_PLUGIN_DIR/docker-compose"

# ==== Certbot (optional later) ====
snap install core && snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# ==== Clone repos ====
cd /home/ubuntu
git clone "https://${github_user}:${github_token}@github.com/${github_org}/${project_name}.git"
if [ -n "${second_repo_org}" ] && [ -n "${second_repo_name}" ] && [ -n "${second_repo_user}" ] && [ -n "${second_repo_token}" ]; then
  git clone "https://${second_repo_user}:${second_repo_token}@github.com/${second_repo_org}/${second_repo_name}.git" || true
fi

chown -R ubuntu:ubuntu "/home/ubuntu/${project_name}" || true
[ -d "/home/ubuntu/${second_repo_name}" ] && chown -R ubuntu:ubuntu "/home/ubuntu/${second_repo_name}" || true
sudo -u ubuntu git config --global --add safe.directory "/home/ubuntu/${project_name}"
[ -d "/home/ubuntu/${second_repo_name}" ] && sudo -u ubuntu git config --global --add safe.directory "/home/ubuntu/${second_repo_name}" || true

# ==== App env files ====
# Frontend should call the BACKEND; leave placeholder if backend not ready yet.
cat >/home/ubuntu/${project_name}/apps/web/.env.prod <<EOF
NEXT_PUBLIC_API_URL=https://${back_domain}
EOF

# Keep API .env present for later, but do not bring backend online here.
cat >/home/ubuntu/${project_name}/apps/api/.env.prod <<'EOF'
NODE_ENV=production
BACKEND_URL=https://${back_domain}
FRONTEND_URL=https://${front_domain}
DATABASE_URL=postgresql://${db_username}:${db_password}@${db_host}:5432/${db_name}
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
CLIENT_ID=${client_id}
CLIENT_SECRET=${client_secret}
REDIRECT_URI=${redirect_uri}
SMTP_NAME="Convive ITESO"
SMTP_ADDRESS=convive-iteso-noreply@iteso.mx
LOCAL_SMTP_HOST=127.0.0.1
LOCAL_SMTP_PORT=1025
MAILTRAP_API_KEY=your-mailtrap-token
ADMIN_TOKEN=your_admin_token_here
AWS_REGION=${aws_region}
AWS_ACCESS_KEY_ID=${aws_access_key_id}
AWS_SECRET_ACCESS_KEY=${aws_secret_access_key}
AWS_SESSION_TOKEN=${aws_session_token}
AWS_ENDPOINT_URL=${aws_endpoint_url}
S3_BUCKET_NAME=${s3_bucket_name}
EOF
chown -R ubuntu:ubuntu "/home/ubuntu/${project_name}/apps"

# ==== Bring up only the FRONT (backend intentionally not configured now) ====
# Adjust make target as needed; this assumes front starts on 3000 and publishes 3000->3000
sudo -u ubuntu -H bash -lc "cd /home/ubuntu/${project_name} && make prod-up"

# ==== Nginx hardening and front vhost ====
# Only include *.conf to avoid 'Is a directory' issues
sed -i 's#sites-enabled/\*#sites-enabled/*.conf#' /etc/nginx/nginx.conf || true

# Disable the default site
rm -f /etc/nginx/sites-enabled/default

# FRONT vhost (only)
cat >/etc/nginx/sites-available/conviveitesofront.conf <<EOF
server {
  listen 80;
  server_name ${front_domain};

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host              \$host;
    proxy_set_header X-Real-IP         \$remote_addr;
    proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF

ln -sfn /etc/nginx/sites-available/conviveitesofront.conf /etc/nginx/sites-enabled/conviveitesofront.conf

# (Backend vhost omitted on purpose. Add later when ready.)

nginx -t
systemctl restart nginx

# ==== Firewall (safe defaults) ====
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ==== Optional: obtain cert for FRONT when DNS is ready ====
if [ "${enable_tls}" = "true" ]; then
  # Try once; do not fail the instance if DNS isn't ready yet.
  certbot --nginx --non-interactive --agree-tos --redirect \
    -m "${admin_email}" -d "${front_domain}" || true
fi

echo "✅ Setup complete. Nginx serving ${front_domain} -> 127.0.0.1:3000. Backend intentionally not configured."
