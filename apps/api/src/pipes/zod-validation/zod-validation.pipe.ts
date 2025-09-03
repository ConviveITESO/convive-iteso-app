import {
	ArgumentMetadata,
	BadRequestException,
	Injectable,
	PipeTransform,
} from "@nestjs/common";
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
