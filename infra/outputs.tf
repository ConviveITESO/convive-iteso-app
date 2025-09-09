output "ec2_public_ip" {
  value = aws_instance.web_server.public_ip
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "ec2_static_ip" {
  value = aws_eip.web_ip.public_ip
}
