import z from "zod";

export const createTodoSchema = z.object({
	title: z.string({ error: "El título del TODO es requerido" }),
	description: z.string({ error: "La descripción es requerida" }),
	status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
});

export const updateTodoSchema = z.object({
	title: z.string({ error: "El título del TODO es requerido" }).optional(),
	description: z.string({ error: "La descripción es requerida" }).optional(),
	status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
});

export const selectTodoSchema = z.object({
	title: z.string(),
	description: z.string(),
	status: z.enum(["todo", "in_progress", "done", "cancelled"]),
	id: z.string(),
	createdAt: z.string(),
});

export type CreateTodoSchema = z.infer<typeof createTodoSchema>;
export type UpdateTodoSchema = z.infer<typeof updateTodoSchema>;
export type SelectTodoSchema = z.infer<typeof selectTodoSchema>;
