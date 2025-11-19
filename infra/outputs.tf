# =============================================================================
# Infrastructure Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# Load Balancer Outputs
# -----------------------------------------------------------------------------
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

# -----------------------------------------------------------------------------
# Target Group Outputs
# -----------------------------------------------------------------------------
output "frontend_target_group_arn" {
  description = "ARN of the frontend target group"
  value       = aws_lb_target_group.frontend.arn
}

output "backend_target_group_arn" {
  description = "ARN of the backend target group"
  value       = aws_lb_target_group.backend.arn
}

# -----------------------------------------------------------------------------
# Database Outputs
# -----------------------------------------------------------------------------
output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Migration Runner Outputs
# -----------------------------------------------------------------------------
output "migrations_instance_id" {
  description = "ID of the dedicated migration EC2 instance"
  value       = aws_instance.migrations.id
}

output "migrations_instance_public_ip" {
  description = "Public IP of the migration instance for SSH access"
  value       = aws_instance.migrations.public_ip
}
