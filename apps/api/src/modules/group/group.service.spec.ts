import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { Group, User } from "../database/schemas";
import { UserService } from "../user/user.service";
import { GroupService } from "./group.service";

describe("GroupService", () => {
	let service: GroupService;
	const mockDb = {
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		returning: jest.fn(),
	};
	const mockUserService = {
		formatUser: jest.fn(),
	};

	beforeEach(async () => {
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

	describe("createEventGroup", () => {
		it("should call createGroup and return the group id", async () => {
			const id = "groupId";
			const group = {
				name: "Test group",
				description: "This is a test group",
			};
			mockDb.returning.mockResolvedValue([{ id }]);
			const result = await service.createEventGroup(group);
			expect(mockDb.values).toHaveBeenCalledWith(group);
			expect(result).toBe(id);
		});
	});

	describe("formatGroup", () => {
		it("should format a group without creator", () => {
			const id = "groupId";
			const name = "Test group";
			const description = "This is a test group";
			const createdBy = null;
			const group: Group = {
				id,
				name,
				description,
				createdBy,
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: new Date(),
			};
			const result = service.formatGroup(group);
			expect(result).toEqual({
				id,
				name,
				description,
			});
		});

		it("should format a group with creator", () => {
			const id = "groupId";
			const name = "Test group";
			const description = "This is a test group";
			const createdBy = "userId";
			const group: Group = {
				id,
				name,
				description,
				createdBy,
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: new Date(),
			};
			const mockUser = { id: "userId1" };
			const mockFormattedUser = { id: "userId2" };
			mockUserService.formatUser.mockReturnValue(mockFormattedUser);
			const result = service.formatGroup(group, mockUser as User);
			expect(mockUserService.formatUser).toHaveBeenCalledWith(mockUser);
			expect(result).toEqual({
				id,
				name,
				description,
				createdBy: mockFormattedUser,
			});
		});
	});
});
