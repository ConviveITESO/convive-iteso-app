#!/bin/bash

# =============================================================================
# AWS Learner Lab Credentials Setup Script
# =============================================================================
# This script reads AWS credentials from a local file and updates the
# ~/.aws/credentials file with the conviveiteso profile.
#
# Usage:
#   ./scripts/setup-aws-credentials.sh
#   ./scripts/setup-aws-credentials.sh --env-file path/to/.env
#   ./scripts/setup-aws-credentials.sh --json-file path/to/credentials.json
#
# Supported file formats:
#   .env file:  AWS_ACCESS_KEY_ID=xxx
#   JSON file:  {"aws_access_key_id": "xxx", ...}
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROFILE_NAME="conviveiteso"
AWS_REGION="us-east-1"
CREDENTIALS_FILE="$HOME/.aws/credentials"
CONFIG_FILE="$HOME/.aws/config"
DEFAULT_ENV_FILE=".env.aws"
DEFAULT_JSON_FILE="aws-credentials.json"

# =============================================================================
# Helper Functions
# =============================================================================

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# =============================================================================
# Parse command line arguments
# =============================================================================

ENV_FILE=""
JSON_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --json-file)
            JSON_FILE="$2"
            shift 2
            ;;
        --profile)
            PROFILE_NAME="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env-file FILE      Path to .env file (default: .env.aws)"
            echo "  --json-file FILE     Path to JSON file (default: aws-credentials.json)"
            echo "  --profile NAME       AWS profile name (default: conviveiteso)"
            echo "  --help               Show this help message"
            echo ""
            echo "Example .env file format:"
            echo "  AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE"
            echo "  AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            echo "  AWS_SESSION_TOKEN=FwoGZXIvYXdzEBYaD..."
            echo ""
            echo "Example JSON file format:"
            echo "  {"
            echo "    \"aws_access_key_id\": \"AKIAIOSFODNN7EXAMPLE\","
            echo "    \"aws_secret_access_key\": \"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\","
            echo "    \"aws_session_token\": \"FwoGZXIvYXdzEBYaD...\""
            echo "  }"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# =============================================================================
# Main Script
# =============================================================================

print_header "AWS Learner Lab Credentials Setup"

# Determine which file to use
if [[ -n "$ENV_FILE" ]]; then
    INPUT_FILE="$ENV_FILE"
    FILE_TYPE="env"
elif [[ -n "$JSON_FILE" ]]; then
    INPUT_FILE="$JSON_FILE"
    FILE_TYPE="json"
elif [[ -f "$DEFAULT_ENV_FILE" ]]; then
    INPUT_FILE="$DEFAULT_ENV_FILE"
    FILE_TYPE="env"
    print_info "Using default .env file: $DEFAULT_ENV_FILE"
elif [[ -f "$DEFAULT_JSON_FILE" ]]; then
    INPUT_FILE="$DEFAULT_JSON_FILE"
    FILE_TYPE="json"
    print_info "Using default JSON file: $DEFAULT_JSON_FILE"
else
    print_error "No credentials file found!"
    echo ""
    echo "Please create one of the following files:"
    echo "  1. .env.aws (in current directory)"
    echo "  2. aws-credentials.json (in current directory)"
    echo ""
    echo "Or specify a file with --env-file or --json-file"
    echo ""
    echo "Run with --help for more information"
    exit 1
fi

# Check if file exists
if [[ ! -f "$INPUT_FILE" ]]; then
    print_error "File not found: $INPUT_FILE"
    exit 1
fi

print_success "Found credentials file: $INPUT_FILE"

# =============================================================================
# Read credentials from file
# =============================================================================

print_info "Reading credentials..."

if [[ "$FILE_TYPE" == "env" ]]; then
    # Read from .env file
    # shellcheck disable=SC1090
    source "$INPUT_FILE"

    ACCESS_KEY="${AWS_ACCESS_KEY_ID}"
    SECRET_KEY="${AWS_SECRET_ACCESS_KEY}"
    SESSION_TOKEN="${AWS_SESSION_TOKEN}"
    ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"

elif [[ "$FILE_TYPE" == "json" ]]; then
    # Read from JSON file (requires jq)
    if ! command -v jq &> /dev/null; then
        print_error "jq is required to parse JSON files"
        echo "Install with: brew install jq"
        exit 1
    fi

    ACCESS_KEY=$(jq -r '.aws_access_key_id // .AWS_ACCESS_KEY_ID' "$INPUT_FILE")
    SECRET_KEY=$(jq -r '.aws_secret_access_key // .AWS_SECRET_ACCESS_KEY' "$INPUT_FILE")
    SESSION_TOKEN=$(jq -r '.aws_session_token // .AWS_SESSION_TOKEN' "$INPUT_FILE")
    ACCOUNT_ID=$(jq -r '.aws_account_id // .AWS_ACCOUNT_ID // ""' "$INPUT_FILE")
fi

# Validate credentials
if [[ -z "$ACCESS_KEY" || "$ACCESS_KEY" == "null" ]]; then
    print_error "AWS_ACCESS_KEY_ID not found in $INPUT_FILE"
    exit 1
fi

if [[ -z "$SECRET_KEY" || "$SECRET_KEY" == "null" ]]; then
    print_error "AWS_SECRET_ACCESS_KEY not found in $INPUT_FILE"
    exit 1
fi

if [[ -z "$SESSION_TOKEN" || "$SESSION_TOKEN" == "null" ]]; then
    print_warning "AWS_SESSION_TOKEN not found (optional for Learner Lab)"
fi

print_success "Credentials validated"

# Show masked credentials for verification
print_info "Access Key: ${ACCESS_KEY:0:8}...${ACCESS_KEY: -4}"
print_info "Secret Key: ${SECRET_KEY:0:8}...${SECRET_KEY: -4}"
if [[ -n "$SESSION_TOKEN" && "$SESSION_TOKEN" != "null" ]]; then
    print_info "Session Token: ${SESSION_TOKEN:0:20}..."
fi
if [[ -n "$ACCOUNT_ID" && "$ACCOUNT_ID" != "null" ]]; then
    print_info "Account ID: $ACCOUNT_ID"
fi

# =============================================================================
# Create AWS directory if it doesn't exist
# =============================================================================

if [[ ! -d "$HOME/.aws" ]]; then
    print_info "Creating ~/.aws directory..."
    mkdir -p "$HOME/.aws"
    chmod 700 "$HOME/.aws"
    print_success "Directory created"
fi

# =============================================================================
# Update credentials file
# =============================================================================

print_info "Updating $CREDENTIALS_FILE..."

# Create credentials file if it doesn't exist
if [[ ! -f "$CREDENTIALS_FILE" ]]; then
    touch "$CREDENTIALS_FILE"
    chmod 600 "$CREDENTIALS_FILE"
fi

# Backup existing credentials
BACKUP_FILE="${CREDENTIALS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
if [[ -f "$CREDENTIALS_FILE" && -s "$CREDENTIALS_FILE" ]]; then
    cp "$CREDENTIALS_FILE" "$BACKUP_FILE"
    print_info "Backup created: $BACKUP_FILE"
fi

# Remove existing profile section
if grep -q "\[$PROFILE_NAME\]" "$CREDENTIALS_FILE" 2>/dev/null; then
    # Create temp file without the profile
    awk -v profile="$PROFILE_NAME" '
        /^\[/ { in_profile = ($0 == "["profile"]") }
        !in_profile { print }
        /^\[/ && ($0 != "["profile"]") { in_profile = 0 }
    ' "$CREDENTIALS_FILE" > "${CREDENTIALS_FILE}.tmp"
    mv "${CREDENTIALS_FILE}.tmp" "$CREDENTIALS_FILE"
fi

# Append new profile
{
    echo ""
    echo "[$PROFILE_NAME]"
    echo "aws_access_key_id = $ACCESS_KEY"
    echo "aws_secret_access_key = $SECRET_KEY"
    if [[ -n "$SESSION_TOKEN" && "$SESSION_TOKEN" != "null" ]]; then
        echo "aws_session_token = $SESSION_TOKEN"
    fi
} >> "$CREDENTIALS_FILE"

print_success "Credentials file updated"

# =============================================================================
# Update config file
# =============================================================================

print_info "Updating $CONFIG_FILE..."

# Create config file if it doesn't exist
if [[ ! -f "$CONFIG_FILE" ]]; then
    touch "$CONFIG_FILE"
    chmod 600 "$CONFIG_FILE"
fi

# Remove existing profile section
if grep -q "\[profile $PROFILE_NAME\]" "$CONFIG_FILE" 2>/dev/null; then
    awk -v profile="profile $PROFILE_NAME" '
        /^\[/ { in_profile = ($0 == "["profile"]") }
        !in_profile { print }
        /^\[/ && ($0 != "["profile"]") { in_profile = 0 }
    ' "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
    mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
fi

# Append new profile config
{
    echo ""
    echo "[profile $PROFILE_NAME]"
    echo "region = $AWS_REGION"
    echo "output = json"
} >> "$CONFIG_FILE"

print_success "Config file updated"

# =============================================================================
# Test credentials
# =============================================================================

print_info "Testing credentials..."

if aws sts get-caller-identity --profile "$PROFILE_NAME" &>/dev/null; then
    print_success "Credentials are valid!"

    # Show identity
    echo ""
    aws sts get-caller-identity --profile "$PROFILE_NAME" --output table

else
    print_error "Failed to validate credentials"
    echo "Please check your credentials and try again"
    exit 1
fi

# =============================================================================
# Summary
# =============================================================================

print_header "Setup Complete!"

echo -e "Profile: ${GREEN}$PROFILE_NAME${NC}"
echo -e "Region:  ${GREEN}$AWS_REGION${NC}"
echo ""
echo "You can now use Terraform with this profile:"
echo -e "  ${BLUE}cd infra${NC}"
echo -e "  ${BLUE}terraform init${NC}"
echo -e "  ${BLUE}terraform plan${NC}"
echo -e "  ${BLUE}terraform apply${NC}"
echo ""
echo "Or use AWS CLI:"
echo -e "  ${BLUE}aws s3 ls --profile $PROFILE_NAME${NC}"
echo -e "  ${BLUE}aws ecr describe-repositories --profile $PROFILE_NAME${NC}"
echo ""

print_warning "Note: Learner Lab credentials expire when the session ends!"
print_info "Re-run this script with updated credentials when needed"

echo ""
