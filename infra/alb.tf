# =============================================================================
# Application Load Balancer (ALB)
# =============================================================================
# Single ALB with host-based routing to save costs (~$16/month vs 2 ALBs)
# Routes traffic based on HTTP Host header:
#   - conviveitesofront.ricardonavarro.mx → Frontend Target Group
#   - conviveitesoback.ricardonavarro.mx  → Backend Target Group
# =============================================================================

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets = [
    aws_subnet.public_az1.id,
    aws_subnet.public_az2.id
  ]

  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name        = "${var.project_name}-alb"
    Application = "ConviveITESO"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# Target Groups
# -----------------------------------------------------------------------------

# Frontend Target Group (Next.js on port 3000)
resource "aws_lb_target_group" "frontend" {
  name     = "${var.project_name}-frontend-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  # Health check configuration
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  # Deregistration delay (time to wait before removing instance)
  deregistration_delay = 30

  # Stickiness (session affinity) - optional for frontend
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400 # 24 hours
    enabled         = true
  }

  tags = {
    Name        = "${var.project_name}-frontend-tg"
    Application = "ConviveITESO"
    Component   = "frontend"
    ManagedBy   = "terraform"
  }
}

# Backend Target Group (NestJS on port 8080)
resource "aws_lb_target_group" "backend" {
  name     = "${var.project_name}-backend-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  # Health check configuration
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  # Deregistration delay (time to wait before removing instance)
  deregistration_delay = 30

  # Stickiness (session affinity) - important for WebSocket connections
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400 # 24 hours
    enabled         = true
  }

  tags = {
    Name        = "${var.project_name}-backend-tg"
    Application = "ConviveITESO"
    Component   = "backend"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# HTTP Listener (Port 80) - Host-Based Routing for Testing
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  # Default action: forward to frontend (fallback)
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  tags = {
    Name        = "${var.project_name}-http-listener"
    Application = "ConviveITESO"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# HTTP Host-Based Routing Rules (Port 80) - FOR TESTING WITHOUT DNS
# -----------------------------------------------------------------------------

# Frontend routing rule (conviveitesofront.ricardonavarro.mx)
resource "aws_lb_listener_rule" "frontend_http" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  condition {
    host_header {
      values = [var.frontend_domain]
    }
  }

  tags = {
    Name        = "${var.project_name}-frontend-http-rule"
    Application = "ConviveITESO"
    Component   = "frontend"
    ManagedBy   = "terraform"
  }
}

# Backend routing rule (conviveitesoback.ricardonavarro.mx)
resource "aws_lb_listener_rule" "backend_http" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    host_header {
      values = [var.backend_domain]
    }
  }

  tags = {
    Name        = "${var.project_name}-backend-http-rule"
    Application = "ConviveITESO"
    Component   = "backend"
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# HTTPS Listener (Port 443) - COMMENTED OUT UNTIL CERTIFICATE IS VALIDATED
# -----------------------------------------------------------------------------
# Uncomment this block once ACM certificate DNS validation is complete
# Then update the HTTP listener above to redirect to HTTPS
/*
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  # Default action: forward to frontend (fallback)
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  tags = {
    Name        = "${var.project_name}-https-listener"
    Application = "ConviveITESO"
    ManagedBy   = "terraform"
  }
}

# HTTPS Host-Based Routing Rules
resource "aws_lb_listener_rule" "frontend_https" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  condition {
    host_header {
      values = [var.frontend_domain]
    }
  }

  tags = {
    Name        = "${var.project_name}-frontend-https-rule"
    Application = "ConviveITESO"
    Component   = "frontend"
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_listener_rule" "backend_https" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    host_header {
      values = [var.backend_domain]
    }
  }

  tags = {
    Name        = "${var.project_name}-backend-https-rule"
    Application = "ConviveITESO"
    Component   = "backend"
    ManagedBy   = "terraform"
  }
}
*/
