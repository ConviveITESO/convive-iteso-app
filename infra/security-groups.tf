# =============================================================================
# Security Groups
# =============================================================================
# Security groups for ALB, EC2 instances, and RDS database
# Follow principle of least privilege - only allow required traffic
# =============================================================================

# -----------------------------------------------------------------------------
# Application Load Balancer Security Group
# -----------------------------------------------------------------------------
# Allows inbound HTTP (80) and HTTPS (443) from the internet
# Allows outbound traffic to frontend and backend instances

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # Inbound HTTP from internet
  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound HTTPS from internet
  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound to anywhere (required for health checks and forwarding)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-alb-sg"
    Application = "ConviveITESO"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# Frontend Instances Security Group
# -----------------------------------------------------------------------------
# Allows inbound traffic on port 3000 from ALB only
# Allows outbound traffic to internet (for package downloads, etc.)

resource "aws_security_group" "frontend_instances" {
  name        = "${var.project_name}-frontend-instances-sg"
  description = "Security group for frontend EC2 instances"
  vpc_id      = aws_vpc.main.id

  # Inbound from ALB on port 3000 (Next.js)
  ingress {
    description     = "HTTP from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Outbound to internet (for apt updates, npm packages, etc.)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-frontend-instances-sg"
    Application = "ConviveITESO"
    Component   = "frontend"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# Backend Instances Security Group
# -----------------------------------------------------------------------------
# Allows inbound traffic on port 8080 from ALB
# Allows inbound Redis traffic (6379) from other backend instances
# Allows outbound traffic to internet and RDS

resource "aws_security_group" "backend_instances" {
  name        = "${var.project_name}-backend-instances-sg"
  description = "Security group for backend EC2 instances (with Redis)"
  vpc_id      = aws_vpc.main.id

  # Inbound from ALB on port 8080 (NestJS API)
  ingress {
    description     = "HTTP from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Inbound Redis traffic from other backend instances (for Redis clustering if needed)
  ingress {
    description = "Redis from backend instances"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    self        = true # Allow traffic from instances in the same security group
  }

  # Outbound to internet (for apt updates, npm packages, ECR pulls, etc.)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-backend-instances-sg"
    Application = "ConviveITESO"
    Component   = "backend"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# RDS Database Security Group
# -----------------------------------------------------------------------------
# Allows inbound PostgreSQL traffic (5432) from backend instances only
# No outbound rules needed (RDS doesn't initiate outbound connections)

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS PostgreSQL database"
  vpc_id      = aws_vpc.main.id

  # Inbound PostgreSQL from backend instances only
  ingress {
    description     = "PostgreSQL from backend instances"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_instances.id]
  }

  # Outbound traffic (minimal, RDS manages this)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-rds-sg"
    Application = "ConviveITESO"
    Component   = "database"
    ManagedBy   = "terraform"
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "frontend_instances_security_group_id" {
  description = "ID of the frontend instances security group"
  value       = aws_security_group.frontend_instances.id
}

output "backend_instances_security_group_id" {
  description = "ID of the backend instances security group"
  value       = aws_security_group.backend_instances.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}
