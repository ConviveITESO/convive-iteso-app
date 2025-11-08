# Scripts Directory

This directory contains utility scripts for managing the ConviveITESO infrastructure.

## 📋 Available Scripts

### `setup-aws-credentials.sh`

Automatically configures AWS credentials for Terraform and AWS CLI from a local file.

**Purpose:** Simplify updating AWS Learner Lab credentials (which expire after each session).

#### Quick Start

1. **Get your AWS Learner Lab credentials:**
   - Go to AWS Learner Lab
   - Click "Start Lab" (wait for green ●)
   - Click "AWS Details"
   - Copy the credentials shown

2. **Create a credentials file** (choose one format):

   **Option A: .env format** (recommended)
   ```bash
   # Copy the example
   cp .env.aws.example .env.aws

   # Edit and add your credentials
   nano .env.aws
   ```

   **Option B: JSON format**
   ```bash
   # Copy the example
   cp aws-credentials.json.example aws-credentials.json

   # Edit and add your credentials
   nano aws-credentials.json
   ```

3. **Run the setup script:**
   ```bash
   ./scripts/setup-aws-credentials.sh
   ```

#### Usage

```bash
# Using default .env.aws file
./scripts/setup-aws-credentials.sh

# Using custom .env file
./scripts/setup-aws-credentials.sh --env-file path/to/custom.env

# Using JSON file
./scripts/setup-aws-credentials.sh --json-file aws-credentials.json

# Using different profile name
./scripts/setup-aws-credentials.sh --profile my-profile

# Show help
./scripts/setup-aws-credentials.sh --help
```

#### What It Does

1. ✅ Reads credentials from `.env.aws` or `aws-credentials.json`
2. ✅ Validates the credentials format
3. ✅ Creates `~/.aws/` directory if needed
4. ✅ Backs up existing credentials
5. ✅ Updates `~/.aws/credentials` with the `conviveiteso` profile
6. ✅ Updates `~/.aws/config` with region settings
7. ✅ Tests the credentials with AWS
8. ✅ Shows your AWS account information

#### File Formats

**.env format** (`.env.aws`):
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SESSION_TOKEN=FwoGZXIvYXdzEBYaD...
AWS_ACCOUNT_ID=123456789012
```

**JSON format** (`aws-credentials.json`):
```json
{
  "aws_access_key_id": "AKIAIOSFODNN7EXAMPLE",
  "aws_secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "aws_session_token": "FwoGZXIvYXdzEBYaD...",
  "aws_account_id": "123456789012"
}
```

#### After Setup

Once credentials are configured, you can use:

**Terraform:**
```bash
cd infra/
terraform init
terraform plan
terraform apply
```

**AWS CLI:**
```bash
aws s3 ls --profile conviveiteso
aws ecr describe-repositories --profile conviveiteso
aws sts get-caller-identity --profile conviveiteso
```

#### Important Notes

⚠️ **Learner Lab Credentials Expire!**
- Credentials expire when your lab session ends
- Re-run this script with fresh credentials when you start a new session
- Consider creating an alias: `alias aws-update="./scripts/setup-aws-credentials.sh"`

🔒 **Security:**
- Never commit `.env.aws` or `aws-credentials.json` to Git
- Both files are in `.gitignore`
- Backup files are also ignored

#### Troubleshooting

**"File not found" error:**
- Make sure you created `.env.aws` or `aws-credentials.json` in the project root
- Check the file path if using `--env-file` or `--json-file`

**"jq is required" error (JSON format only):**
```bash
# Install jq on macOS
brew install jq

# Install jq on Ubuntu/Debian
sudo apt-get install jq
```

**"Failed to validate credentials" error:**
- Check that you copied the correct credentials from Learner Lab
- Make sure your Learner Lab session is active (green ●)
- Verify the session token is included (required for Learner Lab)

**Profile already exists:**
- The script automatically backs up and updates existing profiles
- Backup files are saved as `~/.aws/credentials.backup.TIMESTAMP`

#### Quick Reference

```bash
# Daily workflow when starting Learner Lab:
1. Start Learner Lab session
2. Get new credentials from "AWS Details"
3. Update .env.aws file
4. Run: ./scripts/setup-aws-credentials.sh
5. Continue with Terraform/AWS CLI work
```

## 🔧 Infrastructure Management Scripts

### `cleanup-infrastructure.sh`

Automatically destroys ALL AWS resources created by Terraform. Use this to clean up and preserve your AWS Learner Lab budget.

**Purpose:** Safely destroy all infrastructure resources in the correct dependency order.

#### Quick Start

```bash
# With confirmation prompt
./scripts/cleanup-infrastructure.sh

# Skip confirmation (auto-approve)
./scripts/cleanup-infrastructure.sh --force
```

#### What It Destroys

The script destroys 17 resources in total:
- **ECR Resources (4):**
  - 2 ECR repositories (convive-frontend, convive-backend)
  - 2 ECR lifecycle policies
- **Security Groups (4):**
  - ALB Security Group
  - Frontend Instances Security Group
  - Backend Instances Security Group
  - RDS Security Group
- **VPC Resources (9):**
  - 1 VPC (10.0.0.0/16)
  - 4 Subnets (2 public, 2 database)
  - 1 Internet Gateway
  - 1 Route Table
  - 2 Route Table Associations

#### Destruction Order

The script destroys resources in the correct dependency order:

**Step 1/2: VPC and Security Group Resources**
- Security Groups (RDS, Backend, Frontend, ALB) → Route table associations → Route table → Subnets → Internet Gateway → VPC

**Step 2/2: ECR Resources**
- Lifecycle policies → ECR repositories

#### Verification

After cleanup, the script verifies:
- Terraform state is clean (no resources tracked)
- You can manually verify with:
  ```bash
  # Check VPCs
  aws ec2 describe-vpcs --profile conviveiteso

  # Check ECR repositories
  aws ecr describe-repositories --profile conviveiteso

  # Check Terraform state
  cd infra && terraform show
  ```

#### Important Notes

- ⚠️ **This is destructive!** All resources will be permanently deleted
- The `terraform.tfstate` file is preserved locally
- Resources can be recreated by running `terraform apply` again
- Great for testing and preserving AWS Learner Lab budget

---

## 🔧 Deployment Scripts

### `deploy-asg-refresh.sh` (Coming Soon)
Triggers ASG instance refresh for deployments.

### `verify-deployment.sh` (Coming Soon)
Verifies deployment health and status.

---

For more information, see the [Infrastructure Migration Plan](../INFRASTRUCTURE_MIGRATION_PLAN.md).
