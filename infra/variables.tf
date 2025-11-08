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
