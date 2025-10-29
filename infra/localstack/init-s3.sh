#!/usr/bin/env bash
set -euo pipefail

BUCKET_NAME="${S3_BUCKET_NAME:-convive-iteso-dev}"

echo "Creating local S3 bucket '${BUCKET_NAME}' in LocalStack..."
awslocal s3 mb "s3://${BUCKET_NAME}" >/dev/null 2>&1 || true
echo "Ensured bucket '${BUCKET_NAME}' exists."
