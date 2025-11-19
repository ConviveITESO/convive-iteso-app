# =============================================================================
# Amazon S3 Bucket for File Uploads
# =============================================================================
# This bucket stores user-uploaded files (profile pictures, event images, etc.)
# Uses VPC Gateway Endpoint for free access from EC2 instances
# =============================================================================

# -----------------------------------------------------------------------------
# S3 Bucket
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "uploads" {
  bucket        = var.s3_bucket_name
  force_destroy = true # Allow deletion even if bucket contains objects (for dev/test)

  tags = {
    Name        = var.s3_bucket_name
    Environment = "production"
    ManagedBy   = "terraform"
    Application = "ConviveITESO"
    Component   = "storage"
  }
}

# -----------------------------------------------------------------------------
# S3 Bucket Versioning
# -----------------------------------------------------------------------------
# Disabled for cost savings (can be enabled for production if needed)
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Disabled"
  }
}

# -----------------------------------------------------------------------------
# S3 Bucket Public Access Block
# -----------------------------------------------------------------------------
# Allow public read access to objects via bucket policy (but block public ACLs)
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true  # Block public ACLs
  block_public_policy     = false # Allow bucket policy for public reads
  ignore_public_acls      = true  # Ignore any existing public ACLs
  restrict_public_buckets = false # Allow public bucket policy
}

# -----------------------------------------------------------------------------
# S3 Bucket Policy
# -----------------------------------------------------------------------------
# Allow public read access to all objects (images, etc.)
# Uploads still require AWS credentials (IAM role)
resource "aws_s3_bucket_policy" "uploads_public_read" {
  bucket = aws_s3_bucket.uploads.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.uploads.arn}/*"
      }
    ]
  })

  # Ensure public access block is configured first
  depends_on = [aws_s3_bucket_public_access_block.uploads]
}

# -----------------------------------------------------------------------------
# S3 Bucket Server-Side Encryption
# -----------------------------------------------------------------------------
# Enable encryption at rest using AWS managed keys (SSE-S3)
resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# -----------------------------------------------------------------------------
# S3 Bucket Lifecycle Policy
# -----------------------------------------------------------------------------
# Automatically transition old objects to cheaper storage classes
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    # Apply to all objects
    filter {}

    # Move objects to Infrequent Access after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Move objects to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete objects after 365 days (optional - adjust as needed)
    # expiration {
    #   days = 365
    # }
  }

  rule {
    id     = "delete-incomplete-multipart-uploads"
    status = "Enabled"

    # Apply to all objects
    filter {}

    # Clean up incomplete multipart uploads after 7 days
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# -----------------------------------------------------------------------------
# S3 Bucket CORS Configuration
# -----------------------------------------------------------------------------
# Allow frontend to upload files directly to S3 (if using presigned URLs)
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [
      "http://${var.frontend_domain}",
      "https://${var.frontend_domain}",
      "http://localhost:3000" # For local development
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "s3_bucket_name" {
  description = "S3 bucket name for file uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.uploads.arn
}

output "s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  value       = aws_s3_bucket.uploads.bucket_regional_domain_name
}
