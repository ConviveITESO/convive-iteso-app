# === VPC ===

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# === Internet Gateway ===

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# === Public Subnets ===

resource "aws_subnet" "public_az1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[0]
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${var.availability_zones[0]}"
  }
}

resource "aws_subnet" "public_az2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[1]
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${var.availability_zones[1]}"
  }
}

# === Database Subnets ===

resource "aws_subnet" "database_az1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[0]
  availability_zone = var.availability_zones[0]

  tags = {
    Name = "${var.project_name}-database-${var.availability_zones[0]}"
  }
}

resource "aws_subnet" "database_az2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[1]
  availability_zone = var.availability_zones[1]

  tags = {
    Name = "${var.project_name}-database-${var.availability_zones[1]}"
  }
}

# === Route Table for Public Subnets ===

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# === Route Table Associations ===

resource "aws_route_table_association" "public_az1" {
  subnet_id      = aws_subnet.public_az1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_az2" {
  subnet_id      = aws_subnet.public_az2.id
  route_table_id = aws_route_table.public.id
}
