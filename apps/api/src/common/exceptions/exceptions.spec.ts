import { HttpStatus } from "@nestjs/common";
import {
	BadRequest,
	Conflict,
	Forbidden,
	InternalServerError,
	NotFound,
	Unauthorized,
	UnprocessableEntity,
} from "./index";

describe("Custom Exception Classes", () => {
	describe("NotFound", () => {
		it("should create NotFound exception with default message", () => {
			const exception = new NotFound();
			expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
			expect(exception.message).toBe("Resource not found");
		});

		it("should create NotFound exception with custom message", () => {
			const customMessage = "User not found";
			const exception = new NotFound(customMessage);
			expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
			expect(exception.message).toBe(customMessage);
		});
	});

	describe("BadRequest", () => {
		it("should create BadRequest exception with default message", () => {
			const exception = new BadRequest();
			expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
			expect(exception.message).toBe("Bad request");
		});

		it("should create BadRequest exception with custom message", () => {
			const customMessage = "Invalid input data";
			const exception = new BadRequest(customMessage);
			expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
			expect(exception.message).toBe(customMessage);
		});
	});

	describe("Unauthorized", () => {
		it("should create Unauthorized exception with default message", () => {
			const exception = new Unauthorized();
			expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
			expect(exception.message).toBe("Unauthorized");
		});
	});

	describe("Forbidden", () => {
		it("should create Forbidden exception with default message", () => {
			const exception = new Forbidden();
			expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
			expect(exception.message).toBe("Forbidden");
		});
	});

	describe("Conflict", () => {
		it("should create Conflict exception with default message", () => {
			const exception = new Conflict();
			expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
			expect(exception.message).toBe("Conflict");
		});
	});

	describe("UnprocessableEntity", () => {
		it("should create UnprocessableEntity exception with default message", () => {
			const exception = new UnprocessableEntity();
			expect(exception.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
			expect(exception.message).toBe("Unprocessable entity");
		});
	});

	describe("InternalServerError", () => {
		it("should create InternalServerError exception with default message", () => {
			const exception = new InternalServerError();
			expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
			expect(exception.message).toBe("Internal server error");
		});
	});
});
