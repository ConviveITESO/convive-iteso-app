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

AWS_REGION="${aws_region}"
DATABASE_URL_VALUE="${database_url}"
DB_MASTER_USERNAME="${db_master_username}"
DB_MASTER_PASSWORD="${db_master_password}"
DB_ADDRESS="${db_address}"
DB_PORT="${db_port}"
APP_DB_USERNAME="${app_db_username}"
APP_DB_PASSWORD="${app_db_password}"
DB_NAME="${db_name}"

if [ -z "$AWS_REGION" ] || [ "$AWS_REGION" = "null" ]; then
  TOKEN=$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
  AWS_REGION=$(curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/placement/region)
fi

export AWS_REGION
export AWS_DEFAULT_REGION="$AWS_REGION"

RDS_CA_PATH="/etc/ssl/certs/rds-ca-bundle.pem"
echo "Downloading RDS CA bundle to $RDS_CA_PATH..."
curl -fsSL "https://truststore.pki.rds.amazonaws.com/$${AWS_REGION}/$${AWS_REGION}-bundle.pem" -o "$RDS_CA_PATH"
chmod 644 "$RDS_CA_PATH"

MIGRATIONS_ENV_FILE="/etc/convive-migrations.env"
cat <<EOF >"$MIGRATIONS_ENV_FILE"
export DATABASE_URL="${database_url}"
export PGSSLROOTCERT="/etc/ssl/certs/rds-ca-bundle.pem"
export PGSSLMODE="verify-full"
EOF
chmod 600 "$MIGRATIONS_ENV_FILE"

MASTER_URI="postgresql://${db_master_username}:${db_master_password}@${db_address}:${db_port}/postgres?sslmode=verify-full&sslrootcert=%2Fetc%2Fssl%2Fcerts%2Frds-ca-bundle.pem"

echo "Ensuring database role ${app_db_username} exists..."
cat <<SQL >/tmp/ensure-app-user.sql
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${app_db_username}') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', '${app_db_username}', '${app_db_password}');
  ELSE
    EXECUTE format('ALTER ROLE %I WITH PASSWORD %L', '${app_db_username}', '${app_db_password}');
  END IF;
END
\$\$;
GRANT ALL PRIVILEGES ON DATABASE ${db_name} TO ${app_db_username};
ALTER DATABASE ${db_name} OWNER TO ${app_db_username};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${app_db_username};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${app_db_username};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${app_db_username};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ${app_db_username};
SQL

psql "$MASTER_URI" -f /tmp/ensure-app-user.sql

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
CI=1 pnpm install --frozen-lockfile --force --reporter=silent || CI=1 pnpm install --force --reporter=silent
EOSU

echo "[6/6] Creating helper script /usr/local/bin/convive-migrate.sh ..."
cat <<'EOS' >/usr/local/bin/convive-migrate.sh
#!/bin/bash
set -euo pipefail
REPO_DIR="/opt/convive-migrations/convive-iteso-app"
BRANCH="$${1:-main}"
ENV_FILE="/etc/convive-migrations.env"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Repository not initialized at $REPO_DIR" >&2
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1091
  source "$ENV_FILE"
fi

if [ -z "$${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not configured in $ENV_FILE" >&2
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
CI=1 pnpm install --frozen-lockfile --force --reporter=silent || CI=1 pnpm install --force --reporter=silent

echo "Running database migrations..."
pnpm db:migrate

echo "Migrations completed for branch $BRANCH"
EOS

chmod +x /usr/local/bin/convive-migrate.sh

echo "Bootstrap finished. Connect via SSH and run 'sudo convive-migrate.sh <branch>'."
