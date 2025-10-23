# EC2 Instance in default VPC/subnet
resource "aws_instance" "web_server" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = var.key_name
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.api.id]

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    github_user   = var.github_user
    github_org    = var.github_org
    github_token  = var.github_token
    project_name  = var.project_name
    db_host       = aws_db_instance.postgres.endpoint
    db_username   = var.db_username
    db_password   = var.db_password
    db_name       = var.db_name
    admin_email   = var.admin_email
    client_id     = var.client_id
    client_secret = var.client_secret
    redirect_uri  = var.redirect_uri
    aws_region            = var.aws_region
    aws_access_key_id     = var.aws_access_key_id
    aws_secret_access_key = var.aws_secret_access_key
    aws_session_token     = var.aws_session_token
    aws_endpoint_url      = var.aws_endpoint_url != "" ? var.aws_endpoint_url : format("https://%s", aws_s3_bucket.app.bucket_regional_domain_name)
    s3_bucket_name        = aws_s3_bucket.app.bucket
  })

  tags = {
    Name = "${var.project_name}-ec2"
  }
}

# Static Elastic IP for EC2
resource "aws_eip" "web_ip" {
  instance                  = aws_instance.web_server.id
  associate_with_private_ip = aws_instance.web_server.private_ip

  depends_on = [aws_instance.web_server]

  tags = {
    Name = "${var.project_name}-eip"
  }
}
