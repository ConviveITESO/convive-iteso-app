import { ExecutionContext, Logger, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";

interface MockUser {
	id?: string;
	status?: string;
}

interface MockRequest {
	user: MockUser | null;
}

function createMockContext(user: MockUser | null): ExecutionContext {
	const httpArgumentsHost = {
		getRequest: (): MockRequest => ({ user }),
		getResponse: () => ({}),
		getNext: () => ({}),
	};

	return {
		switchToHttp: () => httpArgumentsHost,
	} as unknown as ExecutionContext;
}

describe("AuthGuard", () => {
	let guard: AuthGuard;

	beforeEach(() => {
		guard = new AuthGuard();
		jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
		jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
	});

	it("should allow access when user exists and is active", async () => {
		const context = createMockContext({ id: "123", status: "active" });

		await expect(guard.canActivate(context)).resolves.toBe(true);
	});

	it("should throw UnauthorizedException when user is missing", async () => {
		const context = createMockContext(null);

		await expect(guard.canActivate(context)).rejects.toThrow(
			new UnauthorizedException("User not found"),
		);
	});

	it("should throw UnauthorizedException when user is not active", async () => {
		const context = createMockContext({ id: "123", status: "inactive" });

		await expect(guard.canActivate(context)).rejects.toThrow(
			new UnauthorizedException("User is not active"),
		);
	});
});
