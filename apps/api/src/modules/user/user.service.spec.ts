import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { User } from "../database/schemas";
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
			const users: User[] = [
				{
					id: "1",
					name: "Alice",
					email: "alice@iteso.mx",
					role: "student",
					status: "active",
					profile: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					deletedAt: null,
				},
			];
			mockDb.query.users.findMany.mockResolvedValueOnce(users);

			const result = await service.getUsers();
			expect(result).toEqual(users);
			expect(mockDb.query.users.findMany).toHaveBeenCalledWith();
		});

		it("should apply filters when query provided", async () => {
			const filtered: User[] = [
				{
					id: "2",
					name: "Alice",
					email: "alice@iteso.mx",
					role: "student",
					status: "active",
					profile: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					deletedAt: null,
				},
			];
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
			const user: User = {
				id: "1",
				name: "Alice",
				email: "alice@iteso.mx",
				role: "student",
				status: "active",
				profile: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};
			mockDb.query.users.findFirst.mockResolvedValueOnce(user);

			const result = await service.getUserById({ id: "1" });
			expect(result).toEqual(user);
			expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
				where: expect.anything(),
			});
		});
	});

	describe("createUser", () => {
		it("should insert a user and return it", async () => {
			const newUser: User = {
				id: "1",
				name: "Bob",
				email: "bob@iteso.mx",
				role: "student",
				status: "active",
				profile: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};
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
			const updated: User = {
				id: "1",
				name: "Charlie",
				email: "charlie@iteso.mx",
				role: "student",
				status: "active",
				profile: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.updateUser({ id: "1" }, { name: "Charlie" });
			expect(result).toEqual(updated);
			expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.set).toHaveBeenCalledWith({ name: "Charlie" });
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.returning).toHaveBeenCalled();
		});
	});

	describe("deleteUser", () => {
		it("should soft delete a user and return it if exists", async () => {
			const user: User = {
				id: "1",
				name: "Dave",
				email: "dave@iteso.mx",
				status: "active",
				role: "student",
				profile: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};
			jest.spyOn(service, "getUserById").mockResolvedValueOnce(user);

			const result = await service.deleteUser({ id: "1" });
			expect(result).toEqual(user);
			expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.set).toHaveBeenCalledWith({
				status: "deleted",
				deletedAt: expect.any(Date),
			});
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
		});

		it("should return undefined if user does not exist", async () => {
			jest.spyOn(service, "getUserById").mockResolvedValueOnce(undefined);

			const result = await service.deleteUser({ id: "nonexistent" });
			expect(result).toBeUndefined();
			expect(mockDb.update).not.toHaveBeenCalled();
		});
	});

	describe("formatUser", () => {
		it("should format a User entity into a response schema", () => {
			const user: User = {
				id: "1",
				name: "Eve",
				email: "eve@iteso.mx",
				status: "active",
				role: "student",
				profile: null,
				createdAt: new Date("2023-01-01T00:00:00Z"),
				updatedAt: new Date("2023-01-02T00:00:00Z"),
				deletedAt: null,
			};

			const result = service.formatUser(user);

			expect(result).toEqual({
				id: "1",
				name: "Eve",
				email: "eve@iteso.mx",
				status: "active",
				role: "student",
				createdAt: "2023-01-01T00:00:00.000Z",
				updatedAt: "2023-01-02T00:00:00.000Z",
				deletedAt: null,
			});
		});
	});
});
