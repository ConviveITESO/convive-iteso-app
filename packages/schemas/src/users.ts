import { z } from "./zod-openapi.js";

export const createUserSchema = z
	.object({
		name: z.string("The name is required").min(3, "The name must be at least 3 characters long"),
		email: z.email({
			error: (issue) => {
				if (issue.input) return "The email is invalid";
				return "The email is required";
			},
		}),
		age: z.coerce.number().min(18, "The age must be at least 18"),
		birthDate: z.codec(
			z.iso.date({
				error: (issue) => {
					if (issue.input) return "The birth date is an invalid date";
					return "The birth date is required";
				},
			}),
			z.date(),
			{
				decode: (value) => new Date(value),
				encode: (value) => {
					const date = value.toISOString();
					const isoDate = date.split("T")[0];
					return isoDate || date;
				},
			},
		),
		password: z
			.string()
			.min(8, "The password must be at least 8 characters long")
			.max(100, "The password cannot exceed 100 characters")
			.regex(/[a-z]/, "The password must contain at least one lowercase letter")
			.regex(/[A-Z]/, "The password must contain at least one uppercase letter")
			.regex(/[0-9]/, "The password must contain at least one number")
			.regex(/[^a-zA-Z0-9]/, "The password must contain at least one special character"),
	})
	.openapi("CreateUserSchema");

export const updateUserSchema = createUserSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	})
	.openapi("UpdateUserSchema");

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
