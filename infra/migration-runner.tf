# =============================================================================
# Dedicated Migration Runner Instance
# =============================================================================
# Provides a long-lived EC2 host that can reach the RDS database and has the
# repository pre-cloned so engineers can SSH in, sync the desired branch, and
# execute pnpm migrations.
# =============================================================================

resource "aws_instance" "migrations" {
  ami                         = data.aws_ami.amazon_linux_2023.id
  instance_type               = var.migrations_instance_type
  subnet_id                   = aws_subnet.public_az1.id
  vpc_security_group_ids      = [aws_security_group.migrations.id]
  associate_public_ip_address = true
  key_name                    = var.key_name
  iam_instance_profile        = data.aws_iam_instance_profile.lab_instance_profile.name

  user_data = base64encode(templatefile("${path.module}/user-data-migrations.sh.tpl", {
    repo_url           = var.migrations_repo_url
    github_token       = var.github_token
    database_url       = "postgresql://${var.app_db_username}:${var.app_db_password}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}?sslmode=verify-full&sslrootcert=%2Fetc%2Fssl%2Fcerts%2Frds-ca-bundle.pem"
    aws_region         = var.aws_region
    db_master_username = var.db_username
    db_master_password = var.db_password
    db_address         = aws_db_instance.postgres.address
    db_port            = aws_db_instance.postgres.port
    db_name            = var.db_name
    app_db_username    = var.app_db_username
    app_db_password    = var.app_db_password
  }))

  root_block_device {
    volume_size = var.migrations_volume_size
    volume_type = "gp3"

    tags = {
      Name        = "${var.project_name}-migrations-root"
      Application = "ConviveITESO"
      Component   = "migrations"
      ManagedBy   = "terraform"
    }
  }

  monitoring = true

  tags = {
    Name        = "${var.project_name}-migrations"
    Application = "ConviveITESO"
    Component   = "migrations"
    ManagedBy   = "terraform"
  }
}
