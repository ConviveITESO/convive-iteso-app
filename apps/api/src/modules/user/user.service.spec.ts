import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { UserService } from "./user.service";

describe("UserService", () => {
	let service: UserService;

	const mockDb = {
		query: {
			users: {
				findMany: jest.fn(),
				findFirst: jest.fn(),
			},
		},
		insert: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		delete: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		returning: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [UserService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<UserService>(UserService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getUsers", () => {
		it("should return all users if no query provided", async () => {
			const users = [{ id: "1" }, { id: "2" }];
			mockDb.query.users.findMany.mockResolvedValueOnce(users);

			const result = await service.getUsers();
			expect(result).toEqual(users);
			expect(mockDb.query.users.findMany).toHaveBeenCalledWith();
		});

		it("should apply filters when query provided", async () => {
			const filtered = [{ id: "1" }];
			mockDb.query.users.findMany.mockResolvedValueOnce(filtered);

			const query = { name: "Alice", email: "alice@iteso.mx" };
			const result = await service.getUsers(query);

			expect(result).toEqual(filtered);
			expect(mockDb.query.users.findMany).toHaveBeenCalledWith({
				where: expect.anything(),
			});
		});
	});

	describe("getUserById", () => {
		it("should return a single user by id", async () => {
			const user = { id: "1", name: "Alice" };
			mockDb.query.users.findFirst.mockResolvedValueOnce(user);

			const result = await service.getUserById("1");
			expect(result).toEqual(user);
			expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
				where: expect.anything(),
			});
		});
	});

	describe("createUser", () => {
		it("should insert a user and return it", async () => {
			const newUser = { id: "1", name: "Bob" };
			mockDb.returning.mockResolvedValueOnce([newUser]);

			const result = await service.createUser({
				name: "Bob",
				email: "bob@iteso.mx",
				status: "active",
			});
			expect(result).toEqual(newUser);
			expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.values).toHaveBeenCalledWith({
				name: "Bob",
				email: "bob@iteso.mx",
				status: "active",
			});
			expect(mockDb.returning).toHaveBeenCalled();
		});
	});

	describe("updateUser", () => {
		it("should update a user and return it", async () => {
			const updated = { id: "1", name: "Charlie" };
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.updateUser("1", { name: "Charlie" });
			expect(result).toEqual(updated);
			expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.set).toHaveBeenCalledWith({ name: "Charlie" });
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.returning).toHaveBeenCalled();
		});
	});

	describe("deleteUser", () => {
		it("should delete a user and return it if exists", async () => {
			const user = {
				id: "1",
				name: "Dave",
				email: "dave@iteso.mx",
				status: "active" as const,
				role: "student",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};
			jest.spyOn(service, "getUserById").mockResolvedValueOnce(user);
			mockDb.delete.mockReturnThis();
			mockDb.where.mockReturnThis();

			const result = await service.deleteUser("1");
			expect(result).toEqual(user);
			expect(mockDb.delete).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
		});

		it("should return undefined if user does not exist", async () => {
			jest.spyOn(service, "getUserById").mockResolvedValueOnce(undefined);

			const result = await service.deleteUser("nonexistent");
			expect(result).toBeUndefined();
			expect(mockDb.delete).not.toHaveBeenCalled();
		});
	});
});
