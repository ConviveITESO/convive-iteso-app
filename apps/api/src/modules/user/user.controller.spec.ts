import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController", () => {
	let controller: UserController;

	const mockUserService = {
		getUsers: jest.fn(),
		getUserById: jest.fn(),
		createUser: jest.fn(),
		updateUser: jest.fn(),
		deleteUser: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [{ provide: UserService, useValue: mockUserService }],
		}).compile();

		controller = module.get<UserController>(UserController);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("getAllUsers", () => {
		it("should call userService.getUsers and return the result", async () => {
			const result = [{ id: "1" }];
			mockUserService.getUsers.mockResolvedValueOnce(result);

			const query = { name: "Alice" };
			const response = await controller.getAllUsers(query);

			expect(mockUserService.getUsers).toHaveBeenCalledWith(query);
			expect(response).toEqual(result);
		});
	});

	describe("getUserById", () => {
		it("should call userService.getUserById and return the result", async () => {
			const user = { id: "1", name: "Alice" };
			mockUserService.getUserById.mockResolvedValueOnce(user);

			const response = await controller.getUserById({ id: "1" });

			expect(mockUserService.getUserById).toHaveBeenCalledWith({ id: "1" });
			expect(response).toEqual(user);
		});
	});

	describe("createUser", () => {
		it("should call userService.createUser and return the result", async () => {
			const data = { name: "Bob", email: "bob@iteso.mx", status: "active" as const };
			const createdUser = { id: "1", ...data };
			mockUserService.createUser.mockResolvedValueOnce(createdUser);

			const response = await controller.createUser(data);

			expect(mockUserService.createUser).toHaveBeenCalledWith(data);
			expect(response).toEqual(createdUser);
		});
	});

	describe("updateFullUser", () => {
		it("should call userService.updateUser and return the result", async () => {
			const data = { name: "Charlie", email: "charlie@iteso.mx", status: "active" as const };
			const updatedUser = { id: "1", ...data };
			mockUserService.updateUser.mockResolvedValueOnce(updatedUser);

			const response = await controller.updateFullUser(data, { id: "1" });

			expect(mockUserService.updateUser).toHaveBeenCalledWith({ id: "1" }, data);
			expect(response).toEqual(updatedUser);
		});
	});

	describe("updateUser", () => {
		it("should call userService.updateUser and return the result", async () => {
			const data = { name: "Dave", status: "active" as const };
			const updatedUser = {
				id: "1",
				name: "Dave",
				email: "dave@iteso.mx",
				status: "active" as const,
			};
			mockUserService.updateUser.mockResolvedValueOnce(updatedUser);

			const response = await controller.updateUser(data, { id: "1" });

			expect(mockUserService.updateUser).toHaveBeenCalledWith({ id: "1" }, data);
			expect(response).toEqual(updatedUser);
		});
	});

	describe("deleteUser", () => {
		it("should call userService.deleteUser and return the result", async () => {
			const user = { id: "1", name: "Eve", status: "active" as const };
			mockUserService.deleteUser.mockResolvedValueOnce(user);

			const response = await controller.deleteUser({ id: "1" });

			expect(mockUserService.deleteUser).toHaveBeenCalledWith({ id: "1" });
			expect(response).toEqual(user);
		});
	});
});
