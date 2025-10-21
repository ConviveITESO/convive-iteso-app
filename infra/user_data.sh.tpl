#!/bin/bash
set -euxo pipefail

# === System packages (as root) ===
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y git curl nginx ufw unzip snapd

# === Install Docker (as root) ===
# Run the script as root via sudo - not piping
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Allow ubuntu to use docker without sudo
sudo usermod -aG docker ubuntu

# Enable Docker service (will require reboot or re-login to apply docker group)
sudo systemctl enable docker
sudo systemctl start docker

# === Install Docker Compose v2 plugin (as root) ===
DOCKER_PLUGIN_DIR=/usr/lib/docker/cli-plugins
sudo mkdir -p $DOCKER_PLUGIN_DIR
sudo curl -SL https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-aarch64 \
  -o $DOCKER_PLUGIN_DIR/docker-compose
sudo chmod +x $DOCKER_PLUGIN_DIR/docker-compose

# === Install Certbot via snap (as root) ===
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# === Clone private repo using GitHub token ===
cd /home/ubuntu
git clone https://${github_user}:${github_token}@github.com/${github_org}/${project_name}.git

sudo chown -R ubuntu:ubuntu /home/ubuntu/${project_name}
git config --global --add safe.directory /home/ubuntu/${project_name}

cd /home/ubuntu/${project_name}

# === Create .env file ===
cat <<'EOF' > /home/ubuntu/${project_name}/apps/web/.env.local
# API Configuration
NEXT_PUBLIC_API_URL=http://conviveitesofront.ricardonavarro.mx
EOF

cat <<'EOF' > /home/ubuntu/${project_name}/apps/api/.env
# === Environment variables ===
NODE_ENV=production
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
SMTP_NAME="Convive ITESO"
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
EOF

# === Start container ===
sudo -u ubuntu -H bash -lc "cd /home/ubuntu/${project_name} && make prod-up"

# === Nginx reverse proxy ===
sudo bash -c 'cat <<EOF > /etc/nginx/sites-available/conviveitesofront
server {
    listen 80;
    server_name conviveitesofront.ricardonavarro.mx;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

sudo bash -c 'cat <<EOF > /etc/nginx/sites-available/conviveitesoback
server {
    listen 80;
    server_name conviveitesoback.ricardonavarro.mx;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

sudo ln -sf /etc/nginx/sites-available/conviveitesofront /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/conviveitesoback /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# === HTTPS with Certbot ===
sudo certbot --nginx --non-interactive --agree-tos --redirect \
  -m ${admin_email} -d conviveitesofront.ricardonavarro.mx

sudo certbot --nginx --non-interactive --agree-tos --redirect \
  -m ${admin_email} -d conviveitesoback.ricardonavarro.mx

echo "✅ EC2 setup complete (safe ownership)."
