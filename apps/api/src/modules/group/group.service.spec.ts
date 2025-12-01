import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { Group, User } from "../database/schemas";
import { UserService } from "../user/user.service";
import { GroupService } from "./group.service";

type FakeSelect = {
	from?: jest.Mock;
	where?: jest.Mock;
	limit?: jest.Mock;
	innerJoin?: jest.Mock;
	orderBy?: jest.Mock;
};

type FakeInsert = {
	values: jest.Mock;
	returning: jest.Mock;
};

describe("GroupService", () => {
	let service: GroupService;

	let mockGroupSelect: FakeSelect;
	let mockMessageSelect: FakeSelect;
	let mockUserSelect: FakeSelect;
	let mockInsertResult: FakeInsert;

	let mockDb: {
		select: jest.Mock;
		insert: jest.Mock;
	};

	const mockUserService = {
		formatUser: jest.fn(),
	};

	beforeEach(async () => {
		// SELECT #1 → validar grupo
		mockGroupSelect = {
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn(),
		};

		// SELECT #2 → messages (innerJoin)
		mockMessageSelect = {
			from: jest.fn().mockReturnThis(),
			innerJoin: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn(),
		};

		// SELECT #3 → user
		mockUserSelect = {
			from: jest.fn().mockReturnThis(),
			where: jest.fn(),
		};

		// INSERT chain
		mockInsertResult = {
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
		};

		// Inteligencia para decidir SELECT correcto (sin any)
		mockDb = {
			select: jest.fn((arg: unknown) => {
				if (typeof arg === "object" && arg !== null) {
					const obj = arg as Record<string, unknown>;

					if ("name" in obj && "profile" in obj) return mockUserSelect;

					if ("id" in obj && "userId" in obj && "content" in obj) return mockMessageSelect;
				}

				return mockGroupSelect;
			}),
			insert: jest.fn(() => mockInsertResult),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GroupService,
				{ provide: UserService, useValue: mockUserService },
				{ provide: DATABASE_CONNECTION, useValue: mockDb },
			],
		}).compile();

		service = module.get<GroupService>(GroupService);

		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	// createEventGroup
	describe("createEventGroup", () => {
		it("should call createGroup and return id", async () => {
			mockInsertResult.returning.mockResolvedValue([{ id: "groupId" }]);

			const result = await service.createEventGroup({
				name: "Test group",
				description: "This is a test",
			});

			expect(result).toBe("groupId");
		});
	});

	// createSubscription
	describe("createSubscription", () => {
		it("should insert relation", async () => {
			await service.createSubscription("g1", "u1");

			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockInsertResult.values).toHaveBeenCalledWith({
				groupId: "g1",
				userId: "u1",
			});
		});
	});

	// formatGroup
	describe("formatGroup", () => {
		it("should format without creator", () => {
			const group: Group = {
				id: "g1",
				name: "Test",
				description: "Desc",
				createdBy: null,
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: new Date(),
			};

			const result = service.formatGroup(group);

			expect(result).toEqual({
				id: "g1",
				name: "Test",
				description: "Desc",
			});
		});

		it("should format with creator", () => {
			const creator = { id: "u1" } as User;
			mockUserService.formatUser.mockReturnValue({ id: "u1", name: "Daniel" });

			const group: Group = {
				id: "g1",
				name: "Test",
				description: "Desc",
				createdBy: "u1",
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: new Date(),
			};

			const result = service.formatGroup(group, creator);

			expect(result).toMatchObject({
				createdBy: { id: "u1", name: "Daniel" },
			});
		});
	});

	// getMessages
	describe("getMessages", () => {
		it("should throw if group does not exist", async () => {
			mockGroupSelect.limit?.mockResolvedValue([]);

			await expect(service.getMessages("g1")).rejects.toThrow(NotFoundException);
		});

		it("should return formatted messages", async () => {
			mockGroupSelect.limit?.mockResolvedValue([{ id: "g1" }]);

			mockMessageSelect.orderBy?.mockResolvedValue([
				{
					id: "m1",
					userId: "u1",
					content: "Hola",
					createdAt: new Date(),
					username: "Daniel",
					profile: "foto.png",
				},
			]);

			const result = await service.getMessages("g1");

			expect(result[0]).toMatchObject({
				id: "m1",
				content: "Hola",
			});
		});
	});

	// sendMessage
	describe("sendMessage", () => {
		it("should throw if group does not exist", async () => {
			mockGroupSelect.limit?.mockResolvedValue([]);

			await expect(service.sendMessage("g1", "u1", "hola")).rejects.toThrow(NotFoundException);
		});

		it("should throw when insert fails", async () => {
			mockGroupSelect.limit?.mockResolvedValue([{ id: "g1" }]);
			mockInsertResult.returning.mockResolvedValue([]);

			await expect(service.sendMessage("g1", "u1", "hola")).rejects.toThrow(
				"Failed to send message",
			);
		});

		it("should throw if user does not exist", async () => {
			mockGroupSelect.limit?.mockResolvedValue([{ id: "g1" }]);

			mockInsertResult.returning.mockResolvedValue([
				{ id: "m1", userId: "u1", content: "hola", createdAt: new Date() },
			]);

			mockUserSelect.where?.mockResolvedValue([]);

			await expect(service.sendMessage("g1", "u1", "hola")).rejects.toThrow("User not found");
		});

		it("should send message successfully", async () => {
			mockGroupSelect.limit?.mockResolvedValue([{ id: "g1" }]);

			mockInsertResult.returning.mockResolvedValue([
				{
					id: "m1",
					userId: "u1",
					content: "hola",
					createdAt: new Date(),
				},
			]);

			mockUserSelect.where?.mockResolvedValue([{ name: "Daniel", profile: "foto.png" }]);

			const result = await service.sendMessage("g1", "u1", "hola");

			expect(result).toMatchObject({
				content: "hola",
				username: "Daniel",
			});
		});
	});
});
