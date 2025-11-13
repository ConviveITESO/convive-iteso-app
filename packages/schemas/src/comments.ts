import z from "zod";

const commentExample = {
	comment:
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
};

export const createCommentSchema = z.object({
	comment: z.string().openapi("CreateCommentSchema", {
		example: { ...commentExample },
	}),
});

export const updateCommentSchema = z.object({
	comment: z.string().openapi("UpdateCommentSchema", {
		example: { ...commentExample },
	}),
});

export const commentByEventResponseSchema = z
	.object({
		id: z.number().min(1),
		createdAt: z.date(),
		updatedAt: z.date(),
		commentText: z.string(),
		user: z.object({
			name: z.string(),
			profile: z.string().optional(),
		}),
	})
	.openapi("CommentByEventResponseSchema");

export type CreateCommentSchema = z.infer<typeof createCommentSchema>;
export type UpdateCommentSchema = CreateCommentSchema;
export type CommentByEventResponseSchema = z.infer<typeof commentByEventResponseSchema>;
