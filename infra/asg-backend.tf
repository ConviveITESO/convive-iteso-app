# =============================================================================
# Backend Auto Scaling Group
# =============================================================================
# Manages backend EC2 instances running NestJS API + Redis in Docker containers
# Pulls pre-built images from ECR for fast deployment
# Redis is co-located on each instance for cost savings
# =============================================================================

# -----------------------------------------------------------------------------
# Launch Template
# -----------------------------------------------------------------------------
resource "aws_launch_template" "backend" {
  name_prefix   = "${var.project_name}-backend-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.small"
  key_name      = var.key_name

  # IAM instance profile for ECR access
  iam_instance_profile {
    name = data.aws_iam_instance_profile.lab_instance_profile.name
  }

  # Network configuration
  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.backend_instances.id]
    delete_on_termination       = true
  }

  # User data script (installs Redis, pulls Docker image from ECR, starts container)
  user_data = base64encode(templatefile("${path.module}/user-data-backend.sh.tpl", {
    ecr_registry       = split("/", aws_ecr_repository.backend.repository_url)[0]
    backend_image      = aws_ecr_repository.backend.repository_url
    database_url       = "postgresql://${var.app_db_username}:${var.app_db_password}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}?sslmode=verify-full&sslrootcert=%2Fetc%2Fssl%2Fcerts%2Frds-ca-bundle.pem"
    backend_url        = "http://${var.backend_domain}"  # Using HTTP for testing (change to HTTPS after certificate validation)
    frontend_url       = "http://${var.frontend_domain}" # Using HTTP for testing (change to HTTPS after certificate validation)
    db_master_username = var.db_username
    db_master_password = var.db_password
    app_db_username    = var.app_db_username
    app_db_password    = var.app_db_password
    db_address         = aws_db_instance.postgres.address
    db_port            = aws_db_instance.postgres.port
    db_name            = var.db_name

    # OAuth Configuration
    client_id     = var.oauth_client_id
    client_secret = var.oauth_client_secret
    redirect_uri  = "http://${var.backend_domain}/auth/oauth-callback"

    # Admin Configuration
    admin_token = var.admin_token

    # SMTP Configuration
    smtp_name        = var.smtp_name
    smtp_address     = var.smtp_address
    local_smtp_host  = var.local_smtp_host
    local_smtp_port  = var.local_smtp_port
    mailtrap_api_key = var.mailtrap_api_key

    # AWS Configuration
    aws_region            = var.aws_region
    aws_access_key_id     = var.aws_access_key_id
    aws_secret_access_key = var.aws_secret_access_key
    s3_bucket_name        = var.s3_bucket_name
  }))

  # Monitoring
  monitoring {
    enabled = true
  }

  # Tag specifications for instances launched from this template
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-backend"
      Application = "ConviveITESO"
      Component   = "backend"
      ManagedBy   = "terraform"
      AutoScaling = "true"
    }
  }

  tag_specifications {
    resource_type = "volume"
    tags = {
      Name        = "${var.project_name}-backend-volume"
      Application = "ConviveITESO"
      Component   = "backend"
      ManagedBy   = "terraform"
    }
  }

  # Metadata options (IMDSv2 required for better security)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # Require IMDSv2
    http_put_response_hop_limit = 1
  }

  # Latest version
  update_default_version = true

  tags = {
    Name        = "${var.project_name}-backend-lt"
    Application = "ConviveITESO"
    Component   = "backend"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# Auto Scaling Group
# -----------------------------------------------------------------------------
resource "aws_autoscaling_group" "backend" {
  name                = "${var.project_name}-backend-asg"
  vpc_zone_identifier = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]

  # Capacity configuration (aligned with AWS Learner Lab constraints)
  min_size         = 1
  max_size         = 4
  desired_capacity = 2

  # Health check configuration
  health_check_type         = "ELB" # Use ALB health checks
  health_check_grace_period = 300   # 5 minutes for instance to become healthy

  # Launch template
  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  # Target group attachment (for ALB)
  target_group_arns = [aws_lb_target_group.backend.arn]

  # Termination policies
  termination_policies = ["OldestLaunchTemplate", "OldestInstance"]

  # Enable metrics collection
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  # Instance refresh configuration (for zero-downtime deployments)
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50  # Keep at least 50% healthy during refresh
      instance_warmup        = 300 # Wait 5 min before considering instance healthy
    }
  }

  # Tags
  tag {
    key                 = "Name"
    value               = "${var.project_name}-backend-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Application"
    value               = "ConviveITESO"
    propagate_at_launch = true
  }

  tag {
    key                 = "Component"
    value               = "backend"
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "terraform"
    propagate_at_launch = true
  }

  # Prevent issues during destroy
  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# Auto Scaling Policies
# -----------------------------------------------------------------------------

# Target tracking scaling policy (CPU-based)
resource "aws_autoscaling_policy" "backend_cpu" {
  name                   = "${var.project_name}-backend-cpu-scaling"
  autoscaling_group_name = aws_autoscaling_group.backend.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0 # Scale when average CPU > 70%
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "backend_asg_name" {
  description = "Name of the backend Auto Scaling Group"
  value       = aws_autoscaling_group.backend.name
}

output "backend_asg_arn" {
  description = "ARN of the backend Auto Scaling Group"
  value       = aws_autoscaling_group.backend.arn
}

output "backend_launch_template_id" {
  description = "ID of the backend launch template"
  value       = aws_launch_template.backend.id
}

output "backend_launch_template_latest_version" {
  description = "Latest version of the backend launch template"
  value       = aws_launch_template.backend.latest_version
}
