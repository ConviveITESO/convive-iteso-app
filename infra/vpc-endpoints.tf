# =============================================================================
# VPC Endpoints
# =============================================================================
# Gateway endpoints for AWS services to avoid NAT Gateway costs
# Gateway endpoints are FREE and improve performance for S3 access
# =============================================================================

# -----------------------------------------------------------------------------
# S3 Gateway Endpoint
# -----------------------------------------------------------------------------
# Allows instances in private/public subnets to access S3 without going through
# the internet gateway, improving security and performance
# This is FREE - no hourly charges or data transfer charges

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  # Associate with route table(s) to enable access from subnets
  route_table_ids = [
    aws_route_table.public.id
  ]

  tags = {
    Name        = "${var.project_name}-s3-endpoint"
    Application = "ConviveITESO"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# VPC Endpoint Policy (Optional - allows all access by default)
# -----------------------------------------------------------------------------
# You can restrict access to specific S3 buckets if needed
# For now, allowing all S3 access for simplicity

# Example of a restricted policy (commented out):
# resource "aws_vpc_endpoint_policy" "s3" {
#   vpc_endpoint_id = aws_vpc_endpoint.s3.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "AllowS3Access"
#         Effect = "Allow"
#         Principal = "*"
#         Action = [
#           "s3:GetObject",
#           "s3:PutObject",
#           "s3:ListBucket"
#         ]
#         Resource = [
#           "arn:aws:s3:::${var.s3_bucket_name}/*",
#           "arn:aws:s3:::${var.s3_bucket_name}"
#         ]
#       }
#     ]
#   })
# }

# =============================================================================
# Outputs
# =============================================================================

output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "s3_vpc_endpoint_state" {
  description = "State of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.state
}

output "s3_vpc_endpoint_prefix_list_id" {
  description = "Prefix list ID of the S3 VPC endpoint (for use in security group rules)"
  value       = aws_vpc_endpoint.s3.prefix_list_id
}
