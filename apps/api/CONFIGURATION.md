# NestJS Configuration Implementation

This project now implements NestJS configuration following best practices from the [official documentation](https://docs.nestjs.com/techniques/configuration).

## 📁 Structure

```
src/modules/config/
├── config.module.ts       # Main configuration module
├── config.schema.ts       # Zod validation schema
├── config.validation.ts   # Validation function
├── configuration.ts       # Configuration factory
├── index.ts              # Barrel exports
└── README.md             # Usage documentation
```

## ✨ Features

1. **Type-Safe Configuration**: Full TypeScript support with type inference
2. **Schema Validation**: Zod-based validation ensures all required env vars are present
3. **Namespaced Configuration**: Organized into logical groups (app, database, auth)
4. **Global Module**: Available throughout the application without imports
5. **Multiple .env Files**: Supports `.env.local` and `.env` files
6. **Caching**: Configuration is cached for performance

## 📝 Environment Variables

Update your `.env` file with all required variables:

```env
# === Environment ===
NODE_ENV=development
PORT=8080

# === URLs ===
BACKEND_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000

# === Database ===
DATABASE_URL=postgresql://user:password@localhost:5432/db

# === OAuth ===
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:8080/auth/oauth-callback
```

## 💡 Usage Examples

### Basic Usage in a Service

```typescript
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MyService {
	constructor(private configService: ConfigService) {}

	getConfig() {
		// Access with type safety
		const dbUrl = this.configService.get<string>("database.url");
		const port = this.configService.get<number>("port");

		// With default value
		const env = this.configService.get<string>("nodeEnv", "development");

		// Throw if missing (recommended for required values)
		const clientId = this.configService.getOrThrow<string>("auth.clientId");
	}
}
```

### Using in Module Configuration

```typescript
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Module({
	imports: [
		SomeModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				apiKey: config.getOrThrow<string>("auth.clientId"),
				apiSecret: config.getOrThrow<string>("auth.clientSecret"),
			}),
		}),
	],
})
export class AppModule {}
```

### Accessing All Configuration

```typescript
const allConfig = this.configService.get("app");
// Returns: { backendUrl: '...', frontendUrl: '...' }
```

## 🔧 Configuration Namespaces

The configuration is organized into the following namespaces:

| Namespace  | Key            | Type   | Description                |
| ---------- | -------------- | ------ | -------------------------- |
| Root       | `nodeEnv`      | string | Application environment    |
| Root       | `port`         | number | Server port                |
| `app`      | `backendUrl`   | string | Backend URL                |
| `app`      | `frontendUrl`  | string | Frontend URL               |
| `database` | `url`          | string | Database connection string |
| `auth`     | `clientId`     | string | OAuth client ID            |
| `auth`     | `clientSecret` | string | OAuth client secret        |
| `auth`     | `redirectUri`  | string | OAuth redirect URI         |

## ✅ Validation

The configuration is validated on application startup using Zod schemas defined in `config.schema.ts`. If validation fails:

1. The application will **not start**
2. Detailed error messages will be displayed
3. Missing or invalid environment variables will be clearly indicated

Example error:

```
Config validation error: CLIENT_ID: String must contain at least 1 character(s)
```

## 🔄 Migration Guide

### Before (Direct env access)

```typescript
const dbUrl = process.env.DATABASE_URL;
```

### After (Using ConfigService)

```typescript
constructor(private configService: ConfigService) {}

const dbUrl = this.configService.getOrThrow<string>('database.url');
```

## 📚 Additional Resources

- [NestJS Configuration Documentation](https://docs.nestjs.com/techniques/configuration)
- [Zod Documentation](https://zod.dev)
- Module README: `src/modules/config/README.md`

## 🎯 Next Steps

1. Run `pnpm install` to install the `zod` dependency
2. Update your `.env` file with all required variables
3. Start migrating existing modules to use the typed configuration
4. Add any additional environment variables to `config.schema.ts`
