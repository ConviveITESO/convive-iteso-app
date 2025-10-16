import { configSchema } from "./config.schema";

export function validate(config: Record<string, unknown>) {
	const result = configSchema.safeParse(config);

	if (!result.success) {
		const errors = result.error.issues
			.map((err) => `${err.path.join(".")}: ${err.message}`)
			.join(", ");
		throw new Error(`Config validation error: ${errors}`);
	}

	return result.data;
}
