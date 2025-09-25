import { HttpException, HttpStatus } from "@nestjs/common";

export class NotFound extends HttpException {
	constructor(message = "Resource not found") {
		super(message, HttpStatus.NOT_FOUND);
	}
}

export class BadRequest extends HttpException {
	constructor(message = "Bad request") {
		super(message, HttpStatus.BAD_REQUEST);
	}
}

export class Unauthorized extends HttpException {
	constructor(message = "Unauthorized") {
		super(message, HttpStatus.UNAUTHORIZED);
	}
}

export class Forbidden extends HttpException {
	constructor(message = "Forbidden") {
		super(message, HttpStatus.FORBIDDEN);
	}
}

export class Conflict extends HttpException {
	constructor(message = "Conflict") {
		super(message, HttpStatus.CONFLICT);
	}
}

export class UnprocessableEntity extends HttpException {
	constructor(message = "Unprocessable entity") {
		super(message, HttpStatus.UNPROCESSABLE_ENTITY);
	}
}

export class InternalServerError extends HttpException {
	constructor(message = "Internal server error") {
		super(message, HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
