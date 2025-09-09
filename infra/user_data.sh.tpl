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
git clone https://${github_user}:${github_token}@github.com/${github_user}/${project_name}.git
sudo chown -R ubuntu:ubuntu /home/ubuntu/${project_name}
git config --global --add safe.directory /home/ubuntu/${project_name}

# === Create .env file ===
cat <<EOF > .env
# === Environment variables ===
NODE_ENV=production
# === Database ===
DB_HOST=${db_host}
DB_PORT=5432
DB_USER=${db_username}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}
EOF

# === Start container ===
docker compose up --build -d

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
  -m ricardog.navi20@gmail.com -d conviveitesofront.ricardonavarro.mx

sudo certbot --nginx --non-interactive --agree-tos --redirect \
  -m ricardog.navi20@gmail.com -d conviveitesoback.ricardonavarro.mx

echo "✅ EC2 setup complete (safe ownership)."
