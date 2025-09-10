# ConviveITESO

Web application ConviveITESO. An app that aims to connect the students of ITESO to see, review and assist to different events.

## 🏗️ Monorepo Structure

This project is built as a monorepo using [Turborepo](https://turbo.build/) with pnpm workspaces to efficiently manage multiple applications and shared packages.

### Applications

- **`apps/api`** - NestJS backend API server
  - Built with NestJS framework
  - PostgreSQL database integration with Drizzle ORM
  - Health check endpoints for monitoring
- **`apps/web`** - Next.js frontend application
  - Next.js 15.5.2 with React 19.1.0 and Turbopack
  - Tailwind CSS v4 for styling
  - Radix UI components with shadcn/ui
  - React Hook Form with Zod validation
  - TanStack Query for data fetching

### Packages

- **`packages/schemas`** - Shared TypeScript schemas and validation logic using Zod
- **`packages/typescript-config`** - Shared TypeScript configurations for consistent builds across apps

### Infrastructure

- **Docker Compose** setup for local development
- PostgreSQL database service
- LocalStack for AWS services simulation (S3)
- Production-ready Docker configuration with multi-stage builds

## 🚀 Development Setup

### Prerequisites

- Node.js (v22 or higher)
- [pnpm package manager](https://pnpm.io/installation) (v10.15.1 or higher)
- Docker and Docker Compose

### Getting Started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

   this will install all dependencies for all packages and build the packages of the monorepo

2. **Start the database**

   ```bash
   docker compose up -d
   ```

3. **Configure environment variables**

   - Create a `.env` file in the `apps/api` directory with your database connection:

     ```bash
     DATABASE_URL="postgresql://user:unsafe@localhost:5432/convive-iteso-db"
     ```

   - Create a `.env` file in the `apps/web` directory with your API URL:

     ```bash
     NEXT_PUBLIC_API_URL="http://localhost:8080"
     ```

4. **Sync database schema**

   ```bash
   pnpm run db:push
   ```

5. **Start development servers**
   ```bash
   pnpm run dev
   ```

This will start both the API server and web application in development mode with hot reloading.

## 🚀 Production Deployment

### Docker Production Setup

The project includes a production-ready Docker configuration with `docker-compose.prod.yaml` for deployment.

**Key Features:**

- Multi-stage Docker builds for optimized image sizes
- Health checks for both API and web services
- Environment variable configuration
- External PostgreSQL database support (AWS RDS)
- Automatic restart policies

**Usage:**

1. **Configure production environment variables**
   Create a `.env.prod` file with your production settings:

   ```env
   DATABASE_URL="postgresql://user:password@your-rds-endpoint:5432/convive-iteso-db"
   NEXT_PUBLIC_API_URL="https://your-api-domain.com"
   API_PORT=8080
   WEB_PORT=3000
   ```

2. **Build and deploy**

   ```bash
   # Build and start production services with environment file
   docker compose -f docker-compose.prod.yaml --env-file .env.prod up -d --build

   # View logs
   docker compose -f docker-compose.prod.yaml logs -f

   # Stop services
   docker compose -f docker-compose.prod.yaml down
   ```

**Services:**

- **API Service**: NestJS backend running on port 8080 with health checks
- **Web Service**: Next.js frontend running on port 3000 with health checks
- **Database**: External PostgreSQL (AWS RDS) - not containerized for production

## 🛠️ Development Tools

### API Module Generator

The project includes a development script to streamline the creation of new NestJS modules with proper structure and organization.

**Location**: `scripts/dev/add_api_module.py`

This Python script allows for structured modularization of the NestJS application by automatically generating:

- Module files
- Controller files (optional)
- Service files (optional)

**Usage:**

```bash
# Interactive mode
python scripts/dev/add_api_module.py <module_name>

# Default mode (creates module with controller and service)
python scripts/dev/add_api_module.py <module_name> --default
```

**Example:**

```bash
# Creates a complete user module with controller and service
python scripts/dev/add_api_module.py user --default

# Interactive mode for custom configuration
python scripts/dev/add_api_module.py auth
```

The script automatically places generated files in the correct directory structure (`apps/api/src/modules/`) and follows NestJS best practices for module organization.
