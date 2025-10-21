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

variable "s3_bucket_name" {
  description = "Name of the S3 bucket used for file storage"
  type        = string
  default     = ""
}

variable "s3_enable_versioning" {
  description = "Enable versioning on the S3 bucket"
  type        = bool
  default     = true
}

variable "client_id" {
  description = "OAuth client ID for production"
  type        = string
}

variable "client_secret" {
  description = "OAuth client secret for production"
  type        = string
  sensitive   = true
}

variable "redirect_uri" {
  description = "OAuth redirect URI"
  type        = string
}

variable "aws_region" {
  description = "AWS region for S3 access"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key_id" {
  description = "AWS access key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
  sensitive   = true
}

variable "aws_session_token" {
  description = "AWS session token (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "aws_endpoint_url" {
  description = "Custom AWS endpoint URL (useful for LocalStack)"
  type        = string
  default     = ""
}
