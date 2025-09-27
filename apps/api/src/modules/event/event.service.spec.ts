import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { EventResponseSchema } from "@repo/schemas";
import { BadgeService } from "../badge/badge.service";
import { CategoryService } from "../category/category.service";
import { DATABASE_CONNECTION } from "../database/connection";
import { Badge, Category, Event, Group, Location, User } from "../database/schemas";
import { GroupService } from "../group/group.service";
import { LocationService } from "../location/location.service";
import { UserService } from "../user/user.service";
import { EventService } from "./event.service";

describe("EventService", () => {
	let service: EventService;
	const mockDb = {
		select: jest.fn(),
		insert: jest.fn(),
		transaction: jest.fn((cb) => cb()),
	};
	const mockUserService = { formatUser: jest.fn() };
	const mockGroupService = { formatGroup: jest.fn(), createEventGroup: jest.fn() };
	const mockLocationService = { formatLocation: jest.fn(), getLocationByIdOrThrow: jest.fn() };
	const mockCategoryService = { formatCategory: jest.fn(), assertCategoriesExist: jest.fn() };
	const mockBadgeService = { formatBadge: jest.fn(), assertBadgesExist: jest.fn() };

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EventService,
				{ provide: DATABASE_CONNECTION, useValue: mockDb },
				{ provide: UserService, useValue: mockUserService },
				{ provide: GroupService, useValue: mockGroupService },
				{ provide: LocationService, useValue: mockLocationService },
				{ provide: CategoryService, useValue: mockCategoryService },
				{ provide: BadgeService, useValue: mockBadgeService },
			],
		}).compile();
		service = module.get<EventService>(EventService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getEventById", () => {
		it("should return a formatted event when found", async () => {
			const event = { id: "eventId" };
			const creator = { id: "userId" };
			const group = { id: "groupId" };
			const location = { id: "locationId" };
			const categories = [{ id: "categoryId" }];
			const badges = [{ id: "badgeId" }];
			const mockDbData = {
				event,
				creator,
				group,
				location,
				categories,
				badges,
			};
			const mockFormattedEvent = { name: "mockFormattedEvent" };
			jest.spyOn(service, "formatEvent").mockReturnValue(mockFormattedEvent as EventResponseSchema);
			mockDb.select.mockReturnValue({
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				leftJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockResolvedValue([mockDbData]),
			});
			const result = await service.getEventById("eventId");
			expect(service.formatEvent).toHaveBeenCalledWith(
				event,
				creator,
				group,
				location,
				categories,
				badges,
			);
			expect(result).toBe(mockFormattedEvent);
		});

		it("should return undefined when no event found", async () => {
			mockDb.select.mockReturnValue({
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				leftJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockResolvedValue([]),
			});
			const result = await service.getEventById("eventId");
			expect(result).toBeUndefined();
		});
	});

	describe("getEventByIdOrThrow", () => {
		it("should throw NotFoundException if event does not exist", async () => {
			jest.spyOn(service, "getEventById").mockResolvedValue(undefined);
			await expect(service.getEventByIdOrThrow("eventId")).rejects.toThrow(NotFoundException);
		});

		it("should return event if exists", async () => {
			const mockEvent = { name: "Test event" };
			jest.spyOn(service, "getEventById").mockResolvedValue(mockEvent as EventResponseSchema);
			const result = await service.getEventByIdOrThrow("eventId");
			expect(result).toEqual(mockEvent);
		});
	});

	describe("formatEvent", () => {
		it("should format event correctly", () => {
			const id = "eventId";
			const name = "Test event";
			const description = "This is a test event";
			const startDate = new Date();
			const endDate = new Date();
			const quota = 10;
			const mockEvent: Event = {
				id,
				name,
				description,
				startDate,
				endDate,
				quota,
				createdBy: "userId",
				groupId: "groupId",
				locationId: "locationId",
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: new Date(),
			};
			const mockUser = { id: "userId" } as User;
			const mockGroup = { id: "groupId" } as Group;
			const mockLocation = { id: "locationId" } as Location;
			const mockCategories = [{ id: "categoryId1" }, { id: "categoryId2" }] as Category[];
			const mockBadges = [{ id: "badgeId1" }, { id: "badgeId2" }] as Badge[];
			mockUserService.formatUser.mockReturnValue(mockUser);
			mockGroupService.formatGroup.mockReturnValue(mockGroup);
			mockLocationService.formatLocation.mockReturnValue(mockLocation);
			mockCategoryService.formatCategory
				.mockReturnValueOnce(mockCategories[0])
				.mockReturnValueOnce(mockCategories[1]);
			mockBadgeService.formatBadge
				.mockReturnValueOnce(mockBadges[0])
				.mockReturnValueOnce(mockBadges[1]);
			const result = service.formatEvent(
				mockEvent,
				mockUser,
				mockGroup,
				mockLocation,
				mockCategories,
				mockBadges,
			);
			expect(result).toEqual({
				id,
				name,
				description,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				quota,
				createdBy: mockUser,
				group: mockGroup,
				location: mockLocation,
				categories: mockCategories,
				badges: mockBadges,
			});
		});
	});

	describe("createEvent", () => {
		it("should call required services and return event id", async () => {
			const id = "eventId";
			const name = "Test event";
			const description = "This is a test event";
			const startDate = new Date();
			const endDate = new Date();
			const quota = 10;
			const categoryIds = ["categoryId1", "categoryId2"];
			const badgeIds = ["badgeId1", "badgeId2"];
			const createdBy = "userId";
			const groupId = "groupId";
			const locationId = "locationId";
			mockLocationService.getLocationByIdOrThrow.mockResolvedValue({ locationId });
			mockCategoryService.assertCategoriesExist.mockResolvedValue(undefined);
			mockBadgeService.assertBadgesExist.mockResolvedValue(undefined);
			mockGroupService.createEventGroup.mockResolvedValue(groupId);
			mockDb.insert.mockReturnValue({
				values: jest.fn().mockReturnThis(),
				returning: jest.fn().mockResolvedValue([{ id }]),
			});
			const result = await service.createEvent(
				{
					name,
					description,
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					quota,
					locationId,
					categoryIds,
					badgeIds,
				},
				createdBy,
			);
			expect(mockLocationService.getLocationByIdOrThrow).toHaveBeenCalledWith(locationId);
			expect(mockCategoryService.assertCategoriesExist).toHaveBeenCalledWith(categoryIds);
			expect(mockBadgeService.assertBadgesExist).toHaveBeenCalledWith(badgeIds);
			expect(mockGroupService.createEventGroup).toHaveBeenCalled();
			expect(mockDb.insert().values).toHaveBeenCalledWith({
				name,
				description,
				startDate,
				endDate,
				quota,
				createdBy,
				groupId,
				locationId,
			});
			expect(mockDb.insert().values).toHaveBeenCalledWith(
				categoryIds.map((categoryId) => ({ categoryId, eventId: id })),
			);
			expect(mockDb.insert().values).toHaveBeenCalledWith(
				badgeIds.map((badgeId) => ({ badgeId, eventId: id })),
			);
			expect(result).toBe(id);
		});
	});
});
