# ConviveITESO

Web application ConviveITESO. An app that aims to connect the students of ITESO to see, review and assist to different events.

## 🏗️ Monorepo Structure

This project is built as a monorepo using [Turborepo](https://turbo.build/) to efficiently manage multiple applications and shared packages.

### Applications

- **`apps/api`** - NestJS backend API server with database integration
- **`apps/web`** - Next.js frontend application with modern UI components

### Packages

- **`packages/schemas`** - Shared TypeScript schemas and validation logic
- **`packages/typescript-config`** - Shared TypeScript configurations for consistent builds

## 🚀 Development Setup

### Prerequisites

- Node.js (v18 or higher)
- [pnpm package manager](https://pnpm.io/installation)
- Docker and Docker Compose

### Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start the database**
   ```bash
   docker compose up -d
   ```

3. **Configure environment variables**
   Create a `.env` file in the `apps/api` directory with your database connection:
   ```bash
   DATABASE_URL="postgresql://user:unsafe@localhost:5432/convive-iteso-db"
   ```

4. **Sync database schema**
   ```bash
   pnpm db:push
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```

This will start both the API server and web application in development mode with hot reloading.

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
