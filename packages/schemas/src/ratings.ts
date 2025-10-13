import z from "zod";

function isWholeOrHalf(value: number) {
	const remainder = value % 1;
	return remainder === 0 || remainder === 0.5;
}

const createRatingExample = {
	score: 4.5,
};

const scoreRules = z.coerce
	.number({ error: "The rating value is required" })
	.min(1, {
		error: "The rating value must be at least 1",
	})
	.max(5, { error: "The rating value can't be greater than 5" })
	.refine((s) => isWholeOrHalf(s), {
		error: "Rating value can only be a whole number or a half number",
	});

export const createRatingSchema = z.object({
	score: scoreRules.openapi("CreateRatingSchema", { example: createRatingExample }),
});

export const updateRatingSchema = z.object({
	score: scoreRules.openapi("UpdateRatingSchema", {
		example: createRatingExample /** Use the same example since it's the same */,
	}),
});

export type CreateRatingSchema = z.infer<typeof createRatingSchema>;
export type UpdateRatingSchema = z.infer<typeof updateRatingSchema>;
