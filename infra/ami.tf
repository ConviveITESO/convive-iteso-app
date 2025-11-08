# =============================================================================
# AMI Data Sources
# =============================================================================
# Data sources to find the latest Ubuntu 22.04 LTS AMI for EC2 instances
# Used by Auto Scaling Group launch templates
# =============================================================================

# Ubuntu 22.04 LTS (Jammy Jellyfish) - x86_64 architecture
# This is the recommended AMI for production workloads
data "aws_ami" "ubuntu_22_04" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Ubuntu's official AWS account)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
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
output "ubuntu_22_04_ami_id" {
  description = "ID of the latest Ubuntu 22.04 LTS AMI"
  value       = data.aws_ami.ubuntu_22_04.id
}

# Output the AMI name for verification
output "ubuntu_22_04_ami_name" {
  description = "Name of the latest Ubuntu 22.04 LTS AMI"
  value       = data.aws_ami.ubuntu_22_04.name
}

# Output the creation date
output "ubuntu_22_04_ami_creation_date" {
  description = "Creation date of the Ubuntu 22.04 LTS AMI"
  value       = data.aws_ami.ubuntu_22_04.creation_date
}
