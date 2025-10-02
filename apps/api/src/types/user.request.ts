import { UserResponseSchema } from "@repo/schemas";

export interface UserRequest extends Request {
	user: UserResponseSchema;
}
