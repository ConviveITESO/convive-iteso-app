#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-"$ROOT_DIR/deply.env"}"
REPO="${REPO:-ConviveITESO/convive-iteso-app}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Missing required command: gh" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

push_secret() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ]; then
    echo "Skipping $name (empty)"
    return
  fi
  echo "Updating $name"
  gh secret set "$name" --repo "$REPO" --body "$value"
}

push_secret DATABASE_URL "${DATABASE_URL:-}"
push_secret AWS_REGION "${AWS_REGION:-}"
push_secret AWS_ACCOUNT_ID "${AWS_ACCOUNT_ID:-}"
push_secret FRONTEND_ECR_REPOSITORY "${FRONTEND_ECR_REPOSITORY:-}"
push_secret BACKEND_ECR_REPOSITORY "${BACKEND_ECR_REPOSITORY:-}"
push_secret FRONTEND_ASG_NAME "${FRONTEND_ASG_NAME:-}"
push_secret BACKEND_ASG_NAME "${BACKEND_ASG_NAME:-}"
push_secret ALB_SMOKE_TEST_URL "${ALB_SMOKE_TEST_URL:-}"
push_secret AWS_ACCESS_KEY_ID "${AWS_ACCESS_KEY_ID:-}"
push_secret AWS_SECRET_ACCESS_KEY "${AWS_SECRET_ACCESS_KEY:-}"
push_secret AWS_SESSION_TOKEN "${AWS_SESSION_TOKEN:-}"

echo "GitHub secrets updated for $REPO using $ENV_FILE."
