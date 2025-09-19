import { z } from "@repo/schemas";
import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
	it("should be defined", () => {
		const schema = z.string();
		expect(new ZodValidationPipe(schema)).toBeDefined();
	});
});
