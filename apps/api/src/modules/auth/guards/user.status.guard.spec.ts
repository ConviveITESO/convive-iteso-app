import { UserStatusGuard } from "./user.status.guard";

describe("UserStatusGuard", () => {
	it("should be defined", () => {
		expect(new UserStatusGuard()).toBeDefined();
	});
});
