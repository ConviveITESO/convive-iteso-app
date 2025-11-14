# =============================================================================
# RDS PostgreSQL Database
# =============================================================================
# Single-AZ deployment optimized for AWS Learner Lab cost constraints
# Multi-AZ would be recommended for production
# =============================================================================

resource "aws_db_subnet_group" "postgres" {
  name       = "${var.project_name}-postgres-subnet-group"
  subnet_ids = [aws_subnet.database_az1.id, aws_subnet.database_az2.id]

  tags = {
    Name        = "${var.project_name}-postgres-subnet-group"
    Application = "ConviveITESO"
    ManagedBy   = "terraform"
  }
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-postgres"
  engine            = "postgres"
  engine_version    = "16.10"
  instance_class    = "db.t4g.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Availability
  multi_az          = false # Single-AZ for cost savings
  availability_zone = var.availability_zone

  # Backup configuration (disabled for cost savings)
  backup_retention_period = 0
  skip_final_snapshot     = true

  # Maintenance
  auto_minor_version_upgrade = true

  # Monitoring (disabled for cost savings)
  enabled_cloudwatch_logs_exports = []

  tags = {
    Name        = "${var.project_name}-postgres"
    Application = "ConviveITESO"
    ManagedBy   = "terraform"
  }
}
