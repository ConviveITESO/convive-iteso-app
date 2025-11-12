variable "project_name" {
  description = "The project name prefix for resources and the github repo"
  type        = string
}

variable "db_username" {
  description = "The database admin username"
  type        = string
}

variable "db_password" {
  description = "The RDS password (sensitive)"
  type        = string
  sensitive   = true
}

variable "app_db_username" {
  description = "Database application user for the backend service"
  type        = string
}

variable "app_db_password" {
  description = "Password for the database application user"
  type        = string
  sensitive   = true
}
variable "db_name" {
  description = "The database name"
  type        = string
}

variable "instance_type" {
  type        = string
  default     = "t4g.micro"
  description = "EC2 instance type"
}

variable "ami_id" {
  type        = string
  default     = "ami-010755a3881216bba"
  description = "ARM64 Ubuntu 22.04 LTS AMI for us-east-2"
}

variable "key_name" {
  type        = string
  description = "Name of the EC2 key pair"
}

variable "availability_zone" {
  type        = string
  description = "Availability zone for the EC2 instance"
}

variable "github_user" {
  description = "Your GitHub username or org name"
  type        = string
}

variable "github_org" {
  description = "Your GitHub Organization name"
  type        = string
}

variable "admin_email" {
  description = "Email used for Let's Encrypt certs"
  type        = string
}

variable "github_token" {
  description = "GitHub token with repo access"
  type        = string
  sensitive   = true
}

# === VPC Configuration ===

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "aws_region" {
  description = "AWS region for resources (Learner Lab: us-east-1 or us-west-2)"
  type        = string
  default     = "us-east-1"
}

# === Domain Configuration ===

variable "frontend_domain" {
  description = "Domain name for frontend (e.g., conviveitesofront.ricardonavarro.mx)"
  type        = string
}

variable "backend_domain" {
  description = "Domain name for backend API (e.g., conviveitesoback.ricardonavarro.mx)"
  type        = string
}

# === SSL/TLS Configuration ===

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS (must be created and validated first)"
  type        = string
}

# === OAuth Configuration ===

variable "oauth_client_id" {
  description = "OAuth client ID for authentication"
  type        = string
  sensitive   = true
}

variable "oauth_client_secret" {
  description = "OAuth client secret for authentication"
  type        = string
  sensitive   = true
}

# === Admin Configuration ===

variable "admin_token" {
  description = "Admin API token for backend"
  type        = string
  sensitive   = true
}

# === SMTP Configuration ===

variable "smtp_name" {
  description = "SMTP sender name"
  type        = string
  default     = "ConviveITESO"
}

variable "smtp_address" {
  description = "SMTP sender email address"
  type        = string
}

variable "local_smtp_host" {
  description = "Local SMTP server host"
  type        = string
  default     = "localhost"
}

variable "local_smtp_port" {
  description = "Local SMTP server port"
  type        = number
  default     = 1025
}

variable "mailtrap_api_key" {
  description = "Mailtrap API key for email service"
  type        = string
  sensitive   = true
}

# === AWS Credentials Configuration ===
# Note: EC2 instances use IAM roles (LabRole) for actual AWS access
# These are placeholder values required for config validation only

variable "aws_access_key_id" {
  description = "AWS access key ID (placeholder for config validation, IAM role used in production)"
  type        = string
  default     = "not-used-iam-role"
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS secret access key (placeholder for config validation, IAM role used in production)"
  type        = string
  default     = "not-used-iam-role"
  sensitive   = true
}

# === S3 Configuration ===

variable "s3_bucket_name" {
  description = "S3 bucket name for file uploads"
  type        = string
  default     = "convive-iteso-prod"
}
