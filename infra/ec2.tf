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
