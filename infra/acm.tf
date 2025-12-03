# =============================================================================
# ACM Certificate for HTTPS
# =============================================================================
# Creates SSL/TLS certificate for both frontend and backend domains
# Requires manual DNS validation - Terraform will output the records to add
# =============================================================================

# -----------------------------------------------------------------------------
# ACM Certificate Request
# -----------------------------------------------------------------------------
resource "aws_acm_certificate" "main" {
  domain_name               = var.frontend_domain
  subject_alternative_names = [var.backend_domain]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-certificate"
    Application = "ConviveITESO"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# Certificate Validation
# -----------------------------------------------------------------------------
# This resource waits for the certificate to be validated
# You must add the DNS records (shown in outputs) to your DNS provider first
resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn

  # Timeout after 45 minutes if DNS records aren't added
  timeouts {
    create = "45m"
  }
}

# =============================================================================
# Outputs - DNS Validation Records
# =============================================================================

output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.main.arn
}

output "certificate_status" {
  description = "Status of the ACM certificate"
  value       = aws_acm_certificate.main.status
}

output "certificate_dns_validation_records" {
  description = "DNS records that must be added to validate the certificate"
  value = [
    for dvo in aws_acm_certificate.main.domain_validation_options : {
      domain = dvo.domain_name
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      value  = dvo.resource_record_value
    }
  ]
}

output "certificate_validation_instructions" {
  description = "Instructions for validating the certificate"
  value = <<-EOT

  ========================================
  ACM Certificate DNS Validation Required
  ========================================

  To complete certificate validation, add these DNS records to your domain:

  ${join("\n  ", [for dvo in aws_acm_certificate.main.domain_validation_options :
"Domain: ${dvo.domain_name}\n  Type: ${dvo.resource_record_type}\n  Name: ${dvo.resource_record_name}\n  Value: ${dvo.resource_record_value}\n"])}

  Steps:
  1. Log in to your DNS provider (GoDaddy, Cloudflare, etc.)
  2. Add CNAME records as shown above for ricardonavarro.mx
  3. Wait 5-10 minutes for DNS propagation
  4. Terraform will automatically detect validation and continue

  ========================================
  EOT
}
