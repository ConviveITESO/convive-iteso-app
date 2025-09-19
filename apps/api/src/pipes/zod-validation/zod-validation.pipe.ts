import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import { treeifyError, ZodType } from "@repo/schemas";

/**
 * Parse incoming data with Zod
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
	constructor(private schema: ZodType) {}

	transform(value: unknown, _metadata: ArgumentMetadata) {
		const { error, data } = this.schema.safeParse(value);
		if (!error) return data;
		const errorMessages = treeifyError(error);
		throw new BadRequestException(errorMessages);
	}
}

export function ZodParam<T extends ZodType>(schema: T, name: string, example?: unknown) {
	const registry = new OpenAPIRegistry();
	registry.register("schema", schema);
	const generator = new OpenApiGeneratorV3(registry.definitions);
	const openApiSchema = generator.generateComponents().components?.schemas?.schema as SchemaObject;
	if (example !== undefined && openApiSchema) {
		openApiSchema.example = example;
	}
	return ApiParam({ schema: openApiSchema, name });
}

export function ZodQuery<T extends ZodType>(schema: T, name: string, example?: unknown) {
	const registry = new OpenAPIRegistry();
	registry.register("schema", schema);
	const generator = new OpenApiGeneratorV3(registry.definitions);
	const openApiSchema = generator.generateComponents().components?.schemas?.schema as SchemaObject;
	if (example !== undefined && openApiSchema) {
		openApiSchema.example = example;
	}
	return ApiQuery({ schema: openApiSchema, name });
}

export function ZodBody<T extends ZodType>(schema: T, example?: unknown) {
	const registry = new OpenAPIRegistry();
	registry.register("schema", schema);
	const generator = new OpenApiGeneratorV3(registry.definitions);
	const openApiSchema = generator.generateComponents().components?.schemas?.schema as SchemaObject;
	if (example !== undefined && openApiSchema) {
		openApiSchema.example = example;
	}
	return ApiBody({ schema: openApiSchema });
}

export function ZodOk<T extends ZodType>(schema: T, example?: unknown) {
	const registry = new OpenAPIRegistry();
	registry.register("schema", schema);
	const generator = new OpenApiGeneratorV3(registry.definitions);
	const openApiSchema = generator.generateComponents().components?.schemas?.schema as SchemaObject;
	if (example !== undefined && openApiSchema) {
		openApiSchema.example = example;
	}
	return ApiOkResponse({ schema: openApiSchema });
}

export function ZodCreated<T extends ZodType>(schema: T, example?: unknown) {
	const registry = new OpenAPIRegistry();
	registry.register("schema", schema);
	const generator = new OpenApiGeneratorV3(registry.definitions);
	const openApiSchema = generator.generateComponents().components?.schemas?.schema as SchemaObject;
	if (example !== undefined && openApiSchema) {
		openApiSchema.example = example;
	}
	return ApiCreatedResponse({ schema: openApiSchema });
}
