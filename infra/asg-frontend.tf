# =============================================================================
# Frontend Auto Scaling Group
# =============================================================================
# Manages frontend EC2 instances running Next.js in Docker containers
# Pulls pre-built images from ECR for fast deployment
# =============================================================================

# -----------------------------------------------------------------------------
# Launch Template
# -----------------------------------------------------------------------------
resource "aws_launch_template" "frontend" {
  name_prefix   = "${var.project_name}-frontend-"
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
    security_groups             = [aws_security_group.frontend_instances.id]
    delete_on_termination       = true
  }

  # User data script (pulls Docker image from ECR and starts container)
  # Note: NEXT_PUBLIC_API_URL is now baked into the Docker image at build time
  user_data = base64encode(templatefile("${path.module}/user-data-frontend.sh.tpl", {
    ecr_registry   = split("/", aws_ecr_repository.frontend.repository_url)[0]
    frontend_image = aws_ecr_repository.frontend.repository_url
  }))

  # Monitoring
  monitoring {
    enabled = true
  }

  # Tag specifications for instances launched from this template
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-frontend"
      Application = "ConviveITESO"
      Component   = "frontend"
      ManagedBy   = "terraform"
      AutoScaling = "true"
    }
  }

  tag_specifications {
    resource_type = "volume"
    tags = {
      Name        = "${var.project_name}-frontend-volume"
      Application = "ConviveITESO"
      Component   = "frontend"
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
    Name        = "${var.project_name}-frontend-lt"
    Application = "ConviveITESO"
    Component   = "frontend"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# Auto Scaling Group
# -----------------------------------------------------------------------------
resource "aws_autoscaling_group" "frontend" {
  name                = "${var.project_name}-frontend-asg"
  vpc_zone_identifier = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]

  # Capacity configuration (aligned with AWS Learner Lab constraints)
  min_size         = var.frontend_asg_min_size
  max_size         = var.frontend_asg_max_size
  desired_capacity = var.frontend_asg_desired_capacity

  # Health check configuration
  health_check_type         = "ELB" # Use ALB health checks
  health_check_grace_period = 300   # 5 minutes for instance to become healthy

  # Launch template
  launch_template {
    id      = aws_launch_template.frontend.id
    version = "$Latest"
  }

  # Target group attachment (for ALB)
  target_group_arns = [aws_lb_target_group.frontend.arn]

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
      min_healthy_percentage = 50                           # Keep at least 50% healthy during refresh
      instance_warmup        = var.asg_instance_warmup_demo # Reduced for faster demo scaling
    }
  }

  # Tags
  tag {
    key                 = "Name"
    value               = "${var.project_name}-frontend-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Application"
    value               = "ConviveITESO"
    propagate_at_launch = true
  }

  tag {
    key                 = "Component"
    value               = "frontend"
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
resource "aws_autoscaling_policy" "frontend_cpu" {
  name                      = "${var.project_name}-frontend-cpu-scaling"
  autoscaling_group_name    = aws_autoscaling_group.frontend.name
  policy_type               = "TargetTrackingScaling"
  estimated_instance_warmup = var.asg_instance_warmup_demo # Reduced for faster demo response

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value     = var.frontend_cpu_target
    disable_scale_in = false # Enable scale-in for demo
  }
}

# Target tracking scaling policy (Request Count-based)
resource "aws_autoscaling_policy" "frontend_request_count" {
  name                      = "${var.project_name}-frontend-request-count-scaling"
  autoscaling_group_name    = aws_autoscaling_group.frontend.name
  policy_type               = "TargetTrackingScaling"
  estimated_instance_warmup = var.asg_instance_warmup_demo # Reduced for faster demo response

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.frontend.arn_suffix}"
    }
    target_value     = var.frontend_request_count_target
    disable_scale_in = false # Enable scale-in for demo
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "frontend_asg_name" {
  description = "Name of the frontend Auto Scaling Group"
  value       = aws_autoscaling_group.frontend.name
}

output "frontend_asg_arn" {
  description = "ARN of the frontend Auto Scaling Group"
  value       = aws_autoscaling_group.frontend.arn
}

output "frontend_launch_template_id" {
  description = "ID of the frontend launch template"
  value       = aws_launch_template.frontend.id
}

output "frontend_launch_template_latest_version" {
  description = "Latest version of the frontend launch template"
  value       = aws_launch_template.frontend.latest_version
}
