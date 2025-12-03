import { ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { z } from "@repo/schemas";
import {
	ZodBody,
	ZodCreated,
	ZodOk,
	ZodParam,
	ZodQuery,
	ZodValidationPipe,
} from "./zod-validation.pipe";

const apiParamMock = jest.fn();
const apiQueryMock = jest.fn();
const apiBodyMock = jest.fn();
const apiOkMock = jest.fn();
const apiCreatedMock = jest.fn();

jest.mock("@nestjs/swagger", () => ({
	/* biome-ignore lint/style/useNamingConvention: Swagger decorators are PascalCase */
	ApiParam: (options: unknown) => {
		apiParamMock(options);
		return "param-decorator";
	},
	/* biome-ignore lint/style/useNamingConvention: Swagger decorators are PascalCase */
	ApiQuery: (options: unknown) => {
		apiQueryMock(options);
		return "query-decorator";
	},
	/* biome-ignore lint/style/useNamingConvention: Swagger decorators are PascalCase */
	ApiBody: (options: unknown) => {
		apiBodyMock(options);
		return "body-decorator";
	},
	/* biome-ignore lint/style/useNamingConvention: Swagger decorators are PascalCase */
	ApiOkResponse: (options: unknown) => {
		apiOkMock(options);
		return "ok-decorator";
	},
	/* biome-ignore lint/style/useNamingConvention: Swagger decorators are PascalCase */
	ApiCreatedResponse: (options: unknown) => {
		apiCreatedMock(options);
		return "created-decorator";
	},
}));

jest.mock("@asteasolutions/zod-to-openapi", () => {
	const OpenApiRegistry = jest.fn().mockImplementation(() => ({
		definitions: {},
		register: jest.fn(),
	}));
	const OpenApiGeneratorV3 = jest.fn().mockImplementation(() => ({
		generateComponents: jest.fn().mockReturnValue({
			components: { schemas: { schema: { type: "object" } } },
		}),
	}));
	const extendZodWithOpenApi = (zodLib: typeof z) => {
		if (!zodLib?.ZodType?.prototype?.openapi) {
			// eslint-disable-next-line no-param-reassign
			zodLib.ZodType.prototype.openapi = function () {
				return this;
			};
		}
	};
	return {
		// biome-ignore lint/style/useNamingConvention: mocking external API names
		OpenAPIRegistry: OpenApiRegistry,
		// biome-ignore lint/style/useNamingConvention: mocking external API names
		OpenApiGeneratorV3,
		extendZodWithOpenApi,
	};
});

describe("ZodValidationPipe", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("parses valid payloads", () => {
		const schema = z.object({ name: z.string() });
		const pipe = new ZodValidationPipe(schema);

		const result = pipe.transform({ name: "Alice" }, {} as ArgumentMetadata);

		expect(result).toEqual({ name: "Alice" });
	});

	it("throws BadRequestException with treeified errors", () => {
		const schema = z.object({ name: z.string() });
		const pipe = new ZodValidationPipe(schema);

		expect(() => pipe.transform({}, {} as ArgumentMetadata)).toThrow(BadRequestException);
	});
});

describe("Zod decorator helpers", () => {
	const schema = z.object({ id: z.string() });

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("attaches the provided example to schemas", () => {
		const example = { id: "123" };

		ZodParam(schema, "id", example);
		ZodQuery(schema, "id", example);
		ZodBody(schema, example);
		ZodOk(schema, example);
		ZodCreated(schema, example);

		expect(apiParamMock).toHaveBeenCalledWith(
			expect.objectContaining({ name: "id", schema: expect.objectContaining({ example }) }),
		);
		expect(apiQueryMock).toHaveBeenCalledWith(
			expect.objectContaining({ name: "id", schema: expect.objectContaining({ example }) }),
		);
		expect(apiBodyMock).toHaveBeenCalledWith(
			expect.objectContaining({ schema: expect.objectContaining({ example }) }),
		);
		expect(apiOkMock).toHaveBeenCalledWith(
			expect.objectContaining({ schema: expect.objectContaining({ example }) }),
		);
		expect(apiCreatedMock).toHaveBeenCalledWith(
			expect.objectContaining({ schema: expect.objectContaining({ example }) }),
		);
	});

	it("leaves schemas untouched when example is omitted", () => {
		ZodParam(schema, "id");
		ZodQuery(schema, "id");
		ZodBody(schema);
		ZodOk(schema);
		ZodCreated(schema);

		expect(apiParamMock).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "id",
				schema: expect.not.objectContaining({ example: expect.anything() }),
			}),
		);
		expect(apiQueryMock).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "id",
				schema: expect.not.objectContaining({ example: expect.anything() }),
			}),
		);
		expect(apiBodyMock).toHaveBeenCalledWith(
			expect.objectContaining({
				schema: expect.not.objectContaining({ example: expect.anything() }),
			}),
		);
		expect(apiOkMock).toHaveBeenCalledWith(
			expect.objectContaining({
				schema: expect.not.objectContaining({ example: expect.anything() }),
			}),
		);
		expect(apiCreatedMock).toHaveBeenCalledWith(
			expect.objectContaining({
				schema: expect.not.objectContaining({ example: expect.anything() }),
			}),
		);
	});
});
