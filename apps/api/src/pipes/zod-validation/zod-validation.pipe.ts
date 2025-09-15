import { generateSchema } from "@anatine/zod-openapi";
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiCreatedResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
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

export function ZodBody<T extends ZodType>(schema: T, example?: unknown) {
	const openApiSchema = generateSchema(schema) as SchemaObject;
	if (example !== undefined) {
		openApiSchema.example = example;
	}
	return ApiBody({ schema: openApiSchema });
}

export function ZodOk<T extends ZodType>(schema: T, example?: unknown) {
	const openApiSchema = generateSchema(schema) as SchemaObject;
	if (example !== undefined) {
		openApiSchema.example = example;
	}
	return ApiOkResponse({ schema: openApiSchema });
}

export function ZodCreated<T extends ZodType>(schema: T, example?: unknown) {
	const openApiSchema = generateSchema(schema) as SchemaObject;
	if (example !== undefined) {
		openApiSchema.example = example;
	}
	return ApiCreatedResponse({ schema: openApiSchema });
}
