import { z } from "./zod-openapi.js";

// ==========================================================
// PARAMS schemas
// ==========================================================

export const userIdParamSchema = z.uuid().openapi("UserIdParamSchema", {
	description: "User ID",
	example: "550e8400-e29b-41d4-a716-446655440000",
});

export const userEmailParamSchema = z.string().email().openapi("UserEmailParamSchema", {
	description: "User email",
	example: "john@example.com",
});

// ==========================================================
// QUERY schemas
// ==========================================================

export const userQuerySchema = z
	.object({
		name: z.string().optional().openapi({
			description: "User name",
		}),
		email: z.string().optional().openapi({
			description: "User email",
		}),
		status: z.string().optional().openapi({
			description: "User status",
		}),
		// age: z.number().optional().openapi({
		// 	description: "User age",
		// }),
		// birthDate: z.string().optional().openapi({
		// 	description: "User birth date",
		// }),
	})
	.openapi("UserQuerySchema");

// ==========================================================
// BODY schemas
// ==========================================================

export const createUserSchema = z
	.object({
		name: z
			.string("The name is required")
			.min(3, "The name must be at least 3 characters long")
			.openapi({
				description: "User name",
			}),
		email: z
			.email({
				error: (issue) => {
					if (issue.input) return "The email is invalid";
					return "The email is required";
				},
			})
			.openapi({
				description: "User email",
			}),
		status: z.enum(["active", "deleted"]).openapi({
			description: "User status",
		}),
		// age: z.coerce.number().min(18, "The age must be at least 18").openapi({
		// 	description: "User age",
		// }),
		// birthDate: z
		// 	.codec(
		// 		z.iso.date({
		// 			error: (issue) => {
		// 				if (issue.input) return "The birth date is an invalid date";
		// 				return "The birth date is required";
		// 			},
		// 		}),
		// 		z.date(),
		// 		{
		// 			decode: (value) => new Date(value),
		// 			encode: (value) => {
		// 				const date = value.toISOString();
		// 				const isoDate = date.split("T")[0];
		// 				return isoDate || date;
		// 			},
		// 		},
		// 	)
		// 	.openapi({
		// 		description: "User birth date",
		// 	}),

		// password: z
		// 	.string()
		// 	.min(8, "The password must be at least 8 characters long")
		// 	.max(100, "The password cannot exceed 100 characters")
		// 	.regex(/[a-z]/, "The password must contain at least one lowercase letter")
		// 	.regex(/[A-Z]/, "The password must contain at least one uppercase letter")
		// 	.regex(/[0-9]/, "The password must contain at least one number")
		// 	.regex(/[^a-zA-Z0-9]/, "The password must contain at least one special character")
		// 	.openapi({
		// 		description: "User password",
		// 	}),
	})
	.openapi("CreateUserSchema", {
		example: {
			name: "Doe, John",
			email: "john@example.com",
			status: "active",
			// age: 25,
			// birthDate: "2000-01-01",
			// password: "Password123!",
		},
	});

export const updateUserSchema = createUserSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	})
	.openapi("UpdateUserSchema", {
		example: {
			name: "Smith, Jane",
			email: "jane@example.com",
		},
	});

// ==========================================================
// RESPONSE schemas
// ==========================================================

export const userResponseSchemaExample = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "John Doe",
	email: "john@example.com",
	age: 25,
	birthDate: "2000-01-01",
	password: "Password123!",
	createdAt: "20XX-01-01T12:00:00Z",
};

export const userResponseSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		email: z.string(),
		status: z.string(),
		role: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
		deletedAt: z.string(),
	})
	.openapi("UserResponseSchema", {
		example: {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Doe, John",
			email: "john@example.com",
			//birthDate: "2000-01-01",
			status: "active",
			role: "student",
			createdAt: "20XX-01-01T12:00:00Z",
			updatedAt: "20XX-01-02T12:00:00Z",
			deletedAt: "20XX-03-01T12:00:00Z",
		},
	});

export const userResponseArraySchema = z
	.array(userResponseSchema)
	.openapi("UserResponseArraySchema", {
		example: [
			{
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Doe, John",
				email: "john@example.com",
				// birthDate: "2000-01-01",
				status: "active",
				role: "student",
				createdAt: "2024-01-01T12:00:00Z",
				updatedAt: "2024-01-02T12:00:00Z",
				deletedAt: "2024-03-01T12:00:00Z",
			},
			{
				id: "550e8400-e29b-41d4-a716-446655440001",
				name: "Smith, Jane",
				email: "jane@example.com",
				// birthDate: "1996-05-15",
				status: "active",
				role: "student",
				createdAt: "2024-01-02T10:30:00Z",
				updatedAt: "2024-01-03T10:30:00Z",
				deletedAt: "2024-03-02T10:30:00Z",
			},
		],
	});

// ==========================================================
// TYPE schemas
// ==========================================================
export type UserIdParamSchema = z.infer<typeof userIdParamSchema>;
export type UserQuerySchema = z.infer<typeof userQuerySchema>;
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type UserResponseSchema = z.infer<typeof userResponseSchema>;
export type UserResponseArraySchema = z.infer<typeof userResponseArraySchema>;
