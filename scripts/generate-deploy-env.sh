#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-"$ROOT_DIR/deply.env"}"
TF_DIR="${TF_DIR:-"$ROOT_DIR/infra"}"
TF_STATE="${TF_STATE:-"$TF_DIR/terraform.tfstate"}"
TF_VARS="${TF_VARS:-"$TF_DIR/terraform.tfvars"}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_file() {
  if [ ! -f "$1" ]; then
    echo "Required file not found: $1" >&2
    exit 1
  fi
}

require_cmd jq
require_cmd python3
require_file "$TF_STATE"
require_file "$TF_VARS"

extract_tfvar() {
  local key="$1"
  sed -n -E "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*\"(.*)\"[[:space:]]*$/\1/p" "$TF_VARS" | head -n1
}

existing_env_value() {
  local key="$1"
  if [ -f "$ENV_FILE" ]; then
    grep -m1 "^${key}=" "$ENV_FILE" | cut -d'=' -f2-
  fi
}

rds_endpoint=$(jq -r '.outputs.rds_endpoint.value' "$TF_STATE")
if [ -z "$rds_endpoint" ] || [ "$rds_endpoint" = "null" ]; then
  echo "rds_endpoint output missing in $TF_STATE" >&2
  exit 1
fi

db_host="$rds_endpoint"
db_port="5432"
if [[ "$rds_endpoint" == *:* ]]; then
  db_host="${rds_endpoint%:*}"
  db_port="${rds_endpoint##*:}"
fi

db_user=$(extract_tfvar app_db_username)
db_pass_raw=$(extract_tfvar app_db_password)
db_name=$(extract_tfvar db_name)

if [ -z "$db_user" ] || [ -z "$db_pass_raw" ] || [ -z "$db_name" ]; then
  echo "Database credentials missing in $TF_VARS" >&2
  exit 1
fi

db_pass_enc=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$db_pass_raw")
database_url="postgres://${db_user}:${db_pass_enc}@${db_host}:${db_port}/${db_name}"

frontend_repo_url=$(jq -r '.outputs.frontend_ecr_repository_url.value' "$TF_STATE")
backend_repo_url=$(jq -r '.outputs.backend_ecr_repository_url.value' "$TF_STATE")
frontend_asg_name=$(jq -r '.outputs.frontend_asg_name.value' "$TF_STATE")
backend_asg_name=$(jq -r '.outputs.backend_asg_name.value' "$TF_STATE")
alb_dns_name=$(jq -r '.outputs.alb_dns_name.value' "$TF_STATE")

if [ -z "$frontend_repo_url" ] || [ -z "$backend_repo_url" ]; then
  echo "ECR repository URLs missing in $TF_STATE" >&2
  exit 1
fi

aws_account_id="${frontend_repo_url%%.*}"
frontend_repo_name="${frontend_repo_url##*/}"
backend_repo_name="${backend_repo_url##*/}"

alb_url=""
if [ -n "$alb_dns_name" ] && [ "$alb_dns_name" != "null" ]; then
  alb_url="https://${alb_dns_name}"
fi

aws_access_key_id=$(existing_env_value AWS_ACCESS_KEY_ID)
aws_secret_access_key=$(existing_env_value AWS_SECRET_ACCESS_KEY)
aws_session_token=$(existing_env_value AWS_SESSION_TOKEN)

cat <<EOF >"${ENV_FILE}.tmp"
# Populate each entry with the value used for the corresponding GitHub secret.
DATABASE_URL=${database_url}
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=${aws_account_id}
FRONTEND_ECR_REPOSITORY=${frontend_repo_name}
BACKEND_ECR_REPOSITORY=${backend_repo_name}
AWS_ACCESS_KEY_ID=${aws_access_key_id}
AWS_SECRET_ACCESS_KEY=${aws_secret_access_key}
AWS_SESSION_TOKEN=${aws_session_token}
FRONTEND_ASG_NAME=${frontend_asg_name}
BACKEND_ASG_NAME=${backend_asg_name}
# Optional: only required when enabling ALB smoke tests
ALB_SMOKE_TEST_URL=${alb_url}
EOF

mv "${ENV_FILE}.tmp" "$ENV_FILE"
echo "Updated $ENV_FILE with Terraform-derived values. Manual AWS credentials preserved."
