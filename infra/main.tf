# =============================================================================
# Terraform Configuration
# =============================================================================

terraform {
  # Require Terraform version 1.0 or higher
  required_version = ">= 1.0"

  # Specify required provider versions
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # AWS provider version 5.x
    }
  }
}

# =============================================================================
# AWS Provider Configuration
# =============================================================================

provider "aws" {
  region  = var.aws_region
  profile = "conviveiteso"
}
