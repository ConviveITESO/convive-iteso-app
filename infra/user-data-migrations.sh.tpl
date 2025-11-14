#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/user-data-migrations.log)
exec 2>&1

echo "=== ConviveITESO migration runner bootstrap ==="

echo "[1/6] Updating base system packages..."
dnf update -y
dnf install -y git unzip

echo "[2/6] Installing Node.js 22 via NodeSource..."
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

echo "[3/6] Enabling Corepack/PNPM..."
corepack enable
corepack prepare pnpm@latest --activate
echo "Node version: $(node -v)"
echo "PNPM version: $(pnpm -v)"

echo "[4/6] Installing PostgreSQL client tools..."
dnf install -y postgresql15

MIGRATIONS_HOME="/opt/convive-migrations"
REPO_DIR="$MIGRATIONS_HOME/convive-iteso-app"
REPO_URL="${repo_url}"
GITHUB_TOKEN="${github_token}"

mkdir -p "$MIGRATIONS_HOME"
chown ec2-user:ec2-user "$MIGRATIONS_HOME"

echo "[5/6] Cloning repository into $REPO_DIR ..."
sudo -u ec2-user REPO_URL="$REPO_URL" TOKEN="$GITHUB_TOKEN" MIGRATIONS_HOME="$MIGRATIONS_HOME" REPO_DIR="$REPO_DIR" bash <<'EOSU'
set -euo pipefail
mkdir -p "$MIGRATIONS_HOME"

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  AUTH_URL="https://$${TOKEN}@$${REPO_URL#https://}"
else
  AUTH_URL="$REPO_URL"
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  git clone "$AUTH_URL" "$REPO_DIR"
else
  cd "$REPO_DIR"
  git remote set-url origin "$AUTH_URL"
  git fetch --all --prune
fi

cd "$REPO_DIR"
corepack enable
pnpm install --frozen-lockfile || pnpm install
EOSU

echo "[6/6] Creating helper script /usr/local/bin/convive-migrate.sh ..."
cat <<'EOS' >/usr/local/bin/convive-migrate.sh
#!/bin/bash
set -euo pipefail
REPO_DIR="/opt/convive-migrations/convive-iteso-app"
BRANCH="$${1:-main}"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Repository not initialized at $REPO_DIR" >&2
  exit 1
fi

cd "$REPO_DIR"
corepack enable >/dev/null 2>&1 || true

echo "Fetching latest changes..."
git fetch --all --prune

echo "Checking out branch $BRANCH ..."
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "Installing dependencies..."
pnpm install --frozen-lockfile || pnpm install

echo "Running database migrations..."
pnpm db:migrate

echo "Migrations completed for branch $BRANCH"
EOS

chmod +x /usr/local/bin/convive-migrate.sh

echo "Bootstrap finished. Connect via SSH and run 'sudo convive-migrate.sh <branch>'."
