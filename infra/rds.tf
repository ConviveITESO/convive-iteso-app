resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-postgres"
  engine = "postgres"
  instance_class = "db.t4g.micro" # or db.t4g.small
  availability_zone = var.availability_zone
  allocated_storage = 20
  db_name = var.db_name
  username = var.db_username
  password = var.db_password
  skip_final_snapshot = true
  publicly_accessible = false
  vpc_security_group_ids = [aws_security_group.postgres.id]
}
