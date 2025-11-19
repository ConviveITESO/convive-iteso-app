#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/user-data-runner.log)
exec 2>&1

echo "=== GitHub Actions Runner Bootstrap ==="

dnf update -y
dnf install -y git unzip

# Install Node.js 22 via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

# Enable corepack for pnpm support
corepack enable
echo "pnpm version: $(pnpm --version)"

echo "Configuring workspace..."
RUNNER_HOME="/opt/gha-runner"
REPO_DIR="$RUNNER_HOME/convive-iteso-app"
mkdir -p "$RUNNER_HOME"
chown ec2-user:ec2-user "$RUNNER_HOME"

REPO_URL="${repo_url}"
GITHUB_TOKEN="${github_token}"

sudo -u ec2-user bash <<'EOSU'
set -euo pipefail
RUNNER_HOME="/opt/gha-runner"
REPO_DIR="$RUNNER_HOME/convive-iteso-app"
REPO_URL="${REPO_URL}"
TOKEN="${GITHUB_TOKEN}"
mkdir -p "$RUNNER_HOME"

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  AUTH_URL="https://${TOKEN}@${REPO_URL#https://}"
else
  AUTH_URL="$REPO_URL"
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  git clone "$AUTH_URL" "$REPO_DIR"
else
  cd "$REPO_DIR"
  git remote set-url origin "$AUTH_URL"
  git fetch --all
fi

cd "$REPO_DIR"
corepack enable
pnpm install --frozen-lockfile || true
EOSU

echo "Runner bootstrap complete."
