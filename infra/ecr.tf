# =============================================================================
# Amazon ECR (Elastic Container Registry) Configuration
# =============================================================================
# This file creates ECR repositories for storing Docker images.
# Images are built in GitHub Actions and pushed to these repositories.
# EC2 instances pull pre-built images instead of building from source.
# =============================================================================

# -----------------------------------------------------------------------------
# Frontend ECR Repository
# -----------------------------------------------------------------------------
resource "aws_ecr_repository" "frontend" {
  name                 = "convive-frontend"
  image_tag_mutability = "MUTABLE" # Allows :latest tag to be updated

  # Enable image scanning for security vulnerabilities
  image_scanning_configuration {
    scan_on_push = true
  }

  # Encryption configuration (default AWS managed key)
  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "convive-frontend"
    Environment = "production"
    ManagedBy   = "terraform"
    Application = "ConviveITESO"
    Component   = "frontend"
  }
}

# -----------------------------------------------------------------------------
# Backend ECR Repository
# -----------------------------------------------------------------------------
resource "aws_ecr_repository" "backend" {
  name                 = "convive-backend"
  image_tag_mutability = "MUTABLE" # Allows :latest tag to be updated

  # Enable image scanning for security vulnerabilities
  image_scanning_configuration {
    scan_on_push = true
  }

  # Encryption configuration (default AWS managed key)
  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "convive-backend"
    Environment = "production"
    ManagedBy   = "terraform"
    Application = "ConviveITESO"
    Component   = "backend"
  }
}

# -----------------------------------------------------------------------------
# Frontend Lifecycle Policy
# -----------------------------------------------------------------------------
# Automatically delete old images to save storage costs
# Keeps:
# - Last 10 images tagged with :sha-* (commit SHAs)
# - Deletes untagged images after 7 days
# -----------------------------------------------------------------------------
resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["sha-", "latest"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Backend Lifecycle Policy
# -----------------------------------------------------------------------------
# Automatically delete old images to save storage costs
# Keeps:
# - Last 10 images tagged with :sha-* (commit SHAs)
# - Deletes untagged images after 7 days
# -----------------------------------------------------------------------------
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["sha-", "latest"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Outputs for CI/CD Pipeline
# -----------------------------------------------------------------------------
# These outputs are used in GitHub Actions to push images
# -----------------------------------------------------------------------------
output "frontend_ecr_repository_url" {
  description = "Frontend ECR repository URL for Docker push/pull"
  value       = aws_ecr_repository.frontend.repository_url
}

output "backend_ecr_repository_url" {
  description = "Backend ECR repository URL for Docker push/pull"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_arn" {
  description = "Frontend ECR repository ARN"
  value       = aws_ecr_repository.frontend.arn
}

output "backend_ecr_repository_arn" {
  description = "Backend ECR repository ARN"
  value       = aws_ecr_repository.backend.arn
}
