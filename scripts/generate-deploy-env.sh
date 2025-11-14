#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-"$ROOT_DIR/.env.deploy"}"
TF_DIR="${TF_DIR:-"$ROOT_DIR/infra"}"
TF_VARS="${TF_VARS:-"$TF_DIR/terraform.tfvars"}"
AWS_PROFILE="${AWS_PROFILE:-conviveiteso}"

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

require_cmd aws
require_cmd python3
require_file "$TF_VARS"

extract_tfvar() {
  local key="$1"
  sed -n -E "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*\"(.*)\"[[:space:]]*$/\1/p" "$TF_VARS" | head -n1
}

existing_env_value() {
  local key="$1"
  if [ -f "$ENV_FILE" ]; then
    local line
    line=$(grep -m1 "^${key}=" "$ENV_FILE" || true)
    if [ -n "$line" ]; then
      printf '%s\n' "${line#*=}"
    fi
  fi
}

project_name=$(extract_tfvar project_name)
if [ -z "$project_name" ]; then
  echo "project_name missing in $TF_VARS" >&2
  exit 1
fi

aws_region=$(extract_tfvar aws_region)
aws_region=${aws_region:-us-east-1}
aws_args=(--region "$aws_region" --profile "$AWS_PROFILE")

rds_identifier="${project_name}-postgres"
rds_endpoint=$(aws rds describe-db-instances \
  --db-instance-identifier "$rds_identifier" \
  "${aws_args[@]}" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text 2>/dev/null || true)
if [ -z "$rds_endpoint" ] || [ "$rds_endpoint" = "None" ]; then
  echo "Unable to resolve RDS endpoint for ${rds_identifier}. Ensure the Learner Lab is active and terraform has created the database." >&2
  exit 1
fi

db_host="$rds_endpoint"
db_port="5432"

db_user=$(extract_tfvar app_db_username)
db_pass_raw=$(extract_tfvar app_db_password)
db_name=$(extract_tfvar db_name)

if [ -z "$db_user" ] || [ -z "$db_pass_raw" ] || [ -z "$db_name" ]; then
  echo "Database credentials missing in $TF_VARS" >&2
  exit 1
fi

db_pass_enc=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$db_pass_raw")
database_url="postgres://${db_user}:${db_pass_enc}@${db_host}:${db_port}/${db_name}"

frontend_repo_url=$(aws ecr describe-repositories \
  --repository-names convive-frontend \
  "${aws_args[@]}" \
  --query 'repositories[0].repositoryUri' \
  --output text 2>/dev/null || true)
backend_repo_url=$(aws ecr describe-repositories \
  --repository-names convive-backend \
  "${aws_args[@]}" \
  --query 'repositories[0].repositoryUri' \
  --output text 2>/dev/null || true)

if [ -z "$frontend_repo_url" ] || [ "$frontend_repo_url" = "None" ]; then
  echo "Unable to resolve the convive-frontend ECR repository. Ensure terraform created it in this Learner Lab session." >&2
  exit 1
fi

if [ -z "$backend_repo_url" ] || [ "$backend_repo_url" = "None" ]; then
  echo "Unable to resolve the convive-backend ECR repository. Ensure terraform created it in this Learner Lab session." >&2
  exit 1
fi

frontend_asg_name="${project_name}-frontend-asg"
backend_asg_name="${project_name}-backend-asg"

aws_account_id=$(aws sts get-caller-identity "${aws_args[@]}" --query 'Account' --output text 2>/dev/null || true)
if [ -z "$aws_account_id" ] || [ "$aws_account_id" = "None" ]; then
  aws_account_id="${frontend_repo_url%%.*}"
fi

frontend_repo_name="${frontend_repo_url##*/}"
backend_repo_name="${backend_repo_url##*/}"

alb_dns_name=$(aws elbv2 describe-load-balancers \
  --names "${project_name}-alb" \
  "${aws_args[@]}" \
  --query 'LoadBalancers[0].DNSName' \
  --output text 2>/dev/null || true)

alb_url=""
if [ -n "$alb_dns_name" ] && [ "$alb_dns_name" != "None" ]; then
  alb_url="https://${alb_dns_name}"
fi

migration_host=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=${project_name}-migrations" "Name=instance-state-name,Values=running" \
  "${aws_args[@]}" \
  --query 'Reservations[].Instances[].PublicIpAddress' \
  --output text 2>/dev/null | tr '\t' '\n' | head -n1)
migration_user=$(existing_env_value MIGRATIONS_SSH_USER)
migration_key_path=$(existing_env_value MIGRATIONS_SSH_PRIVATE_KEY_PATH)

aws_access_key_id=$(existing_env_value AWS_ACCESS_KEY_ID)
aws_secret_access_key=$(existing_env_value AWS_SECRET_ACCESS_KEY)
aws_session_token=$(existing_env_value AWS_SESSION_TOKEN)

cat <<EOF >"${ENV_FILE}.tmp"
# Populate each entry with the value used for the corresponding GitHub secret.
DATABASE_URL=${database_url}
AWS_REGION=${aws_region}
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
# Migration runner SSH configuration
MIGRATIONS_HOST=${migration_host}
MIGRATIONS_SSH_USER=${migration_user:-ec2-user}
# Provide a local path to the PEM file; push-deploy-secrets.sh will read it and upload the key.
MIGRATIONS_SSH_PRIVATE_KEY_PATH=${migration_key_path}
EOF

mv "${ENV_FILE}.tmp" "$ENV_FILE"
echo "Updated $ENV_FILE with Terraform-derived values. Manual AWS credentials preserved."
