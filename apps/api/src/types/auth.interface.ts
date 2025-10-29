import { CreateUserSchema, UserResponseSchema } from "@repo/schemas";

export interface AuthRequest extends Request {
	user?: CreateUserSchema;
}

export interface AzureAuthResult {
	user: UserResponseSchema;
	idToken: string;
	refreshToken?: string;
	expiresIn: number;
}

export interface AzureProfile {
	oid?: string;
	email?: string;
	name?: string;
	upn?: string;
}
