locals {
  resolved_s3_bucket_name = var.s3_bucket_name != "" ? var.s3_bucket_name : "${var.project_name}-assets"
}

resource "aws_s3_bucket" "app" {
  bucket = local.resolved_s3_bucket_name

  tags = {
    Name        = "${var.project_name}-s3"
    Environment = terraform.workspace
  }
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id

  versioning_configuration {
    status = var.s3_enable_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_public_access_block" "app" {
  bucket = aws_s3_bucket.app.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
