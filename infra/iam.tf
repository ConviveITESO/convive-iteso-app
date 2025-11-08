# =============================================================================
# IAM Configuration
# =============================================================================
# AWS Learner Lab provides pre-created LabRole and LabInstanceProfile
# We cannot create new IAM roles, but we can attach policies to LabRole
# This file adds ECR pull permissions for instances to pull Docker images
# =============================================================================

# -----------------------------------------------------------------------------
# Data Sources for Existing Lab Resources
# -----------------------------------------------------------------------------
# Reference the existing LabRole (created by AWS Learner Lab)

data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

# Reference the existing LabInstanceProfile (created by AWS Learner Lab)
data "aws_iam_instance_profile" "lab_instance_profile" {
  name = "LabInstanceProfile"
}

# =============================================================================
# ✅ ECR PERMISSIONS - ALREADY CONFIGURED IN LEARNER LAB
# =============================================================================
# AWS Learner Lab LabRole already has the "AmazonEC2ContainerRegistryReadOnly"
# managed policy attached, which provides all necessary permissions for EC2
# instances to pull Docker images from ECR.
#
# Included permissions:
#   - ecr:GetAuthorizationToken (on resource: *)
#   - ecr:BatchCheckLayerAvailability (on ECR repositories)
#   - ecr:GetDownloadUrlForLayer (on ECR repositories)
#   - ecr:BatchGetImage (on ECR repositories)
#   - ecr:DescribeRepositories (on ECR repositories)
#   - ecr:ListImages (on ECR repositories)
#
# Note: AWS Learner Lab does NOT allow modifying LabRole via Terraform:
#   - No iam:AttachRolePolicy permission
#   - No iam:PutRolePolicy permission
#   - No iam:TagPolicy permission
#
# This is acceptable since the required permissions are already in place.
# =============================================================================

# Define the policy document for reference (not applied via Terraform)
# Copy this JSON to AWS Console if creating a custom inline policy
data "aws_iam_policy_document" "ecr_pull_permissions" {
  # Allow ECR authentication token retrieval
  statement {
    sid    = "ECRGetAuthorizationToken"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken"
    ]
    resources = ["*"]
  }

  # Allow pulling images from our ECR repositories
  statement {
    sid    = "ECRPullImages"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage"
    ]
    resources = [
      aws_ecr_repository.frontend.arn,
      aws_ecr_repository.backend.arn
    ]
  }

  # Allow listing ECR repositories (optional, for debugging)
  statement {
    sid    = "ECRListRepositories"
    effect = "Allow"
    actions = [
      "ecr:DescribeRepositories",
      "ecr:ListImages"
    ]
    resources = [
      aws_ecr_repository.frontend.arn,
      aws_ecr_repository.backend.arn
    ]
  }
}

# Commented out: Cannot be applied via Terraform in AWS Learner Lab
# Kept for documentation purposes
#
# resource "aws_iam_role_policy" "ecr_pull_inline_policy" {
#   name   = "${var.project_name}-ecr-pull-policy"
#   role   = data.aws_iam_role.lab_role.name
#   policy = data.aws_iam_policy_document.ecr_pull_permissions.json
# }

# =============================================================================
# Outputs
# =============================================================================

output "lab_role_arn" {
  description = "ARN of the LabRole"
  value       = data.aws_iam_role.lab_role.arn
}

output "lab_instance_profile_arn" {
  description = "ARN of the LabInstanceProfile"
  value       = data.aws_iam_instance_profile.lab_instance_profile.arn
}

output "lab_instance_profile_name" {
  description = "Name of the LabInstanceProfile (for use in launch templates)"
  value       = data.aws_iam_instance_profile.lab_instance_profile.name
}

output "ecr_pull_policy_json" {
  description = "ECR pull policy JSON (for manual attachment via AWS Console)"
  value       = data.aws_iam_policy_document.ecr_pull_permissions.json
}
