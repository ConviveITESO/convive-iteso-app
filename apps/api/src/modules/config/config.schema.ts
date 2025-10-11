/** biome-ignore-all lint/style/useNamingConvention: env variables need to be uppercase */
import { z } from "@repo/schemas";

export const configSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.coerce.number().default(8080),
	BACKEND_URL: z.url(),
	FRONTEND_URL: z.url(),
	DATABASE_URL: z.url(),
	CLIENT_ID: z.string().min(1),
	CLIENT_SECRET: z.string().min(1),
	APP_VERSION: z.string().default("1.0.0"),
	REDIRECT_URI: z.url().default("http://localhost:8080/auth/oauth-callback"),
	ADMIN_TOKEN: z.string().min(1),
});

export type ConfigSchema = z.infer<typeof configSchema>;
