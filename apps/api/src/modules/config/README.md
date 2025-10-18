# Configuration Module

This module implements NestJS configuration with validation using Zod.

## Features

- ✅ Type-safe configuration
- ✅ Environment variable validation
- ✅ Schema-based validation with Zod
- ✅ Global configuration access
- ✅ Support for multiple .env files

## Usage

### In a Service

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    // Access configuration values
    const dbUrl = this.configService.get<string>('database.url');
    const port = this.configService.get<number>('port');
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    
    // With default value
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
  }
}
```

### In a Module

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.get<string>('database.url'),
      }),
    }),
  ],
})
export class AppModule {}
```

## Configuration Structure

The configuration is organized into namespaces:

- `nodeEnv`: Application environment (development, production, test)
- `port`: Server port
- `app`: Application-specific settings
  - `backendUrl`: Backend URL
  - `frontendUrl`: Frontend URL
- `database`: Database settings
  - `url`: Database connection URL
- `auth`: Authentication settings
  - `clientId`: OAuth client ID
  - `clientSecret`: OAuth client secret
  - `redirectUri`: OAuth redirect URI
- `queue`: Background job queue settings
  - `redis.host`: Redis hostname
  - `redis.port`: Redis port

## Environment Variables

Required environment variables (see `.env.example`):

```env
NODE_ENV=development
PORT=8080
BACKEND_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/db
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:8080/auth/oauth-callback
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Validation

The configuration is validated on application startup using Zod schemas. If validation fails, the application will not start and will display detailed error messages.
