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
	SMTP_NAME: z.string(),
	SMTP_ADDRESS: z.email(),
	LOCAL_SMTP_HOST: z.string(),
	LOCAL_SMTP_PORT: z.coerce.number().int(),
	MAILTRAP_API_KEY: z.string(),
	REDIS_HOST: z.string().default("127.0.0.1"),
	REDIS_PORT: z.coerce.number().int().default(6379),
	AWS_REGION: z.string().default("us-east-1"),
	// AWS credentials are optional - EC2 instances use IAM roles (LabRole) instead
	AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
	AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
	AWS_SESSION_TOKEN: z.string().optional(), // Required for AWS Learner Lab
	AWS_ENDPOINT_URL: z.string().optional(),
	S3_BUCKET_NAME: z.string().min(1),
});

export type ConfigSchema = z.infer<typeof configSchema>;
