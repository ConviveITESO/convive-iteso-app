#!/bin/bash
set -euo pipefail

# Hardcoded domains (no extra TF vars required)
front_domain="conviveitesofront.ricardonavarro.mx"
back_domain="conviveitesoback.ricardonavarro.mx"

export DEBIAN_FRONTEND=noninteractive

# ---- System packages ----
apt-get update -y
apt-get upgrade -y
apt-get install -y git curl nginx ufw unzip snapd ca-certificates

# ---- Docker engine ----
curl -fsSL https://get.docker.com -o /root/get-docker.sh
sh /root/get-docker.sh
rm /root/get-docker.sh
usermod -aG docker ubuntu
systemctl enable --now docker

# ---- Docker Compose v2 plugin (arch-aware) ----
DOCKER_PLUGIN_DIR=/usr/lib/docker/cli-plugins
mkdir -p "$DOCKER_PLUGIN_DIR"
ARCH="$(dpkg --print-architecture)"
case "$ARCH" in
  amd64) COMPOSE_URL="https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-x86_64" ;;
  arm64) COMPOSE_URL="https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-aarch64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac
curl -fsSL "$COMPOSE_URL" -o "$DOCKER_PLUGIN_DIR/docker-compose"
chmod +x "$DOCKER_PLUGIN_DIR/docker-compose"

# ---- Certbot (installed; you can run later when DNS is set) ----
snap install core && snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# ---- Clone repo (uses TF vars) ----
cd /home/ubuntu
git clone "https://${github_user}:${github_token}@github.com/${github_org}/${project_name}.git"

chown -R ubuntu:ubuntu "/home/ubuntu/${project_name}" || true
sudo -u ubuntu git config --global --add safe.directory "/home/ubuntu/${project_name}"

# ---- App env files ----
mkdir -p "/home/ubuntu/${project_name}/apps/web" "/home/ubuntu/${project_name}/apps/api"

# Frontend should call the backend domain
cat >"/home/ubuntu/${project_name}/apps/web/.env.local" <<EOF
NEXT_PUBLIC_API_URL=http://${back_domain}
EOF

# Backend env (prepared even if you don't run it yet)
cat >"/home/ubuntu/${project_name}/apps/api/.env" <<EOF
NODE_ENV=production
BACKEND_URL=http://${back_domain}
FRONTEND_URL=http://${front_domain}
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

# ---- Start only the FRONT service ----
# If your Makefile starts everything, prefer composing just 'web' directly:
cd "/home/ubuntu/${project_name}"
docker compose up -d web || true

# ---- Nginx: include only *.conf + FRONT vhost ONLY ----
# Prevent 'Is a directory' by including *.conf and using file symlinks.
sed -i 's#sites-enabled/\*#sites-enabled/*.conf#' /etc/nginx/nginx.conf || true
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/conviveitesofront.conf <<'EOF'
server {
  listen 80;
  server_name __FRONT_DOMAIN__;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF

# Inject the front domain safely
sed -i "s#__FRONT_DOMAIN__#${front_domain}#g" /etc/nginx/sites-available/conviveitesofront.conf

ln -sfn /etc/nginx/sites-available/conviveitesofront.conf /etc/nginx/sites-enabled/conviveitesofront.conf

nginx -t
systemctl restart nginx

# ---- Firewall ----
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Setup complete. Nginx serving ${front_domain} -> 127.0.0.1:3000. Backend intentionally not configured."