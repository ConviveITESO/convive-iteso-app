# =============================================================================
# AMI Data Sources
# =============================================================================
# Data sources to find the latest Amazon Linux 2023 AMI for EC2 instances
# Used by Auto Scaling Group launch templates
# =============================================================================

# Amazon Linux 2023 - x86_64 architecture
# This is the recommended AMI for production workloads
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["137112412989"] # Amazon

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  # Ensure we only get active/available AMIs
  filter {
    name   = "state"
    values = ["available"]
  }
}

# =============================================================================
# Outputs (for debugging and reference)
# =============================================================================

# Output the AMI ID for reference
output "amazon_linux_2023_ami_id" {
  description = "ID of the latest Amazon Linux 2023 AMI"
  value       = data.aws_ami.amazon_linux_2023.id
}

# Output the AMI name for verification
output "amazon_linux_2023_ami_name" {
  description = "Name of the latest Amazon Linux 2023 AMI"
  value       = data.aws_ami.amazon_linux_2023.name
}

# Output the creation date
output "amazon_linux_2023_ami_creation_date" {
  description = "Creation date of the Amazon Linux 2023 AMI"
  value       = data.aws_ami.amazon_linux_2023.creation_date
}
