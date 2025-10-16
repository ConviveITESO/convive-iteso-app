/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { EventResponseSchema } from "@repo/schemas";
import { BadgeService } from "../badge/badge.service";
import { CategoryService } from "../category/category.service";
import { DATABASE_CONNECTION } from "../database/connection";
import { Event, Group, Location, User } from "../database/schemas";
import { GroupService } from "../group/group.service";
import { LocationService } from "../location/location.service";
import { UserService } from "../user/user.service";
import { EventService } from "./event.service";

describe("EventService", () => {
	let service: EventService;
	const mockDb = {
		select: jest.fn(),
		insert: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		transaction: jest.fn((cb) => cb()),
	};
	const mockUserService = { formatUser: jest.fn() };
	const mockGroupService = {
		formatGroup: jest.fn(),
		createEventGroup: jest.fn(),
		createSubscription: jest.fn(),
	};
	const mockLocationService = { formatLocation: jest.fn(), getLocationByIdOrThrow: jest.fn() };
	const mockCategoryService = { formatCategory: jest.fn(), assertCategoriesExist: jest.fn() };
	const mockBadgeService = { formatBadge: jest.fn(), assertBadgesExist: jest.fn() };
	const mockConfigService = { get: jest.fn() };

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
				{ provide: ConfigService, useValue: mockConfigService },
			],
		}).compile();
		service = module.get<EventService>(EventService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getEvents", () => {
		it("should return all active events when no filters provided", async () => {
			const event1 = { id: "event1" };
			const event2 = { id: "event2" };
			const creator = { id: "userId" };
			const group = { id: "groupId" };
			const location = { id: "locationId" };
			const categories = [{ id: "categoryId" }];
			const badges = [{ id: "badgeId" }];
			const mockDbResults = [
				{ event: event1, creator, group, location, categories, badges },
				{ event: event2, creator, group, location, categories, badges },
			];
			const mockFormattedEvent1 = { name: "Event 1" };
			const mockFormattedEvent2 = { name: "Event 2" };
			jest
				.spyOn(service, "formatEvent")
				.mockReturnValueOnce(mockFormattedEvent1 as EventResponseSchema)
				.mockReturnValueOnce(mockFormattedEvent2 as EventResponseSchema);
			mockDb.select.mockReturnValue({
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				leftJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockResolvedValue(mockDbResults),
			});
			const result = await service.getEvents({});
			expect(result).toEqual([mockFormattedEvent1, mockFormattedEvent2]);
			expect(service.formatEvent).toHaveBeenCalledTimes(2);
		});

		it("should return filtered events by name", async () => {
			const event = { id: "event1", name: "Test Event" };
			const creator = { id: "userId" };
			const group = { id: "groupId" };
			const location = { id: "locationId" };
			const categories = [];
			const badges = [];
			const mockDbResults = [{ event, creator, group, location, categories, badges }];
			const mockFormattedEvent = { name: "Test Event" };
			jest.spyOn(service, "formatEvent").mockReturnValue(mockFormattedEvent as EventResponseSchema);
			mockDb.select.mockReturnValue({
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				leftJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockResolvedValue(mockDbResults),
			});
			const result = await service.getEvents({ name: "Test Event" });
			expect(result).toEqual([mockFormattedEvent]);
		});

		it("should return filtered events by locationId", async () => {
			const event = { id: "event1" };
			const creator = { id: "userId" };
			const group = { id: "groupId" };
			const location = { id: "loc123" };
			const categories = [];
			const badges = [];
			const mockDbResults = [{ event, creator, group, location, categories, badges }];
			const mockFormattedEvent = { name: "Location Event" };
			jest.spyOn(service, "formatEvent").mockReturnValue(mockFormattedEvent as EventResponseSchema);
			mockDb.select.mockReturnValue({
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				leftJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockResolvedValue(mockDbResults),
			});
			const result = await service.getEvents({ locationId: "loc123" });
			expect(result).toEqual([mockFormattedEvent]);
		});

		it("should return filtered events by categoryId", async () => {
			const event = { id: "event1" };
			const creator = { id: "userId" };
			const group = { id: "groupId" };
			const location = { id: "locationId" };
			const categories = [{ id: "cat123" }];
			const badges = [];
			const mockDbResults = [{ event, creator, group, location, categories, badges }];
			const mockFormattedEvent = { name: "Category Event" };
			jest.spyOn(service, "formatEvent").mockReturnValue(mockFormattedEvent as EventResponseSchema);
			mockDb.select.mockReturnValue({
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				leftJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockResolvedValue(mockDbResults),
			});
			const result = await service.getEvents({ categoryId: "cat123" });
			expect(result).toEqual([mockFormattedEvent]);
		});

		it("should return filtered events by badgeId", async () => {
			const event = { id: "event1" };
			const creator = { id: "userId" };
			const group = { id: "groupId" };
			const location = { id: "locationId" };
			const categories = [];
			const badges = [{ id: "badge123" }];
			const mockDbResults = [{ event, creator, group, location, categories, badges }];
			const mockFormattedEvent = { name: "Badge Event" };
			jest.spyOn(service, "formatEvent").mockReturnValue(mockFormattedEvent as EventResponseSchema);
			mockDb.select.mockReturnValue({
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				leftJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockResolvedValue(mockDbResults),
			});
			const result = await service.getEvents({ badgeId: "badge123" });
			expect(result).toEqual([mockFormattedEvent]);
		});

		it("should return empty array when no events match filters", async () => {
			mockDb.select.mockReturnValue({
				from: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				leftJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockResolvedValue([]),
			});
			const result = await service.getEvents({ name: "Nonexistent Event" });
			expect(result).toEqual([]);
		});
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
				opensAt: new Date(),
				closesAt: new Date(),
				unregisterClosesAt: new Date(),
				createdBy: "userId",
				groupId: "groupId",
				locationId: "locationId",
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};
			const mockUser = { id: "userId" } as User;
			const mockGroup = { id: "groupId" } as Group;
			const mockLocation = { id: "locationId" } as Location;
			const mockCategories = [
				{
					id: "categoryId1",
					name: "Category 1",
					createdBy: "userId",
					status: "active" as const,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					deletedAt: null,
				},
				{
					id: "categoryId2",
					name: "Category 2",
					createdBy: "userId",
					status: "active" as const,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					deletedAt: null,
				},
			];
			const mockBadges = [
				{
					id: "badgeId1",
					name: "Badge 1",
					description: "Badge 1 description",
					createdBy: "userId",
					status: "active" as const,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					deletedAt: null,
				},
				{
					id: "badgeId2",
					name: "Badge 2",
					description: "Badge 2 description",
					createdBy: "userId",
					status: "active" as const,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					deletedAt: null,
				},
			];
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

	describe("updateEvent", () => {
		it("should call required services and update event", async () => {
			const id = "eventId";
			const userId = "userId";
			const name = "Updated event";
			const description = "Updated description";
			const startDate = new Date();
			const endDate = new Date();
			const quota = 20;
			const categoryIds = ["categoryId3", "categoryId4"];
			const badgeIds = ["badgeId3", "badgeId4"];
			const locationId = "newLocationId";

			jest
				.spyOn(service, "getEventByIdOrThrow")
				.mockResolvedValue({ id, createdBy: { id: userId } } as EventResponseSchema);
			mockLocationService.getLocationByIdOrThrow.mockResolvedValue({ locationId });
			mockCategoryService.assertCategoriesExist.mockResolvedValue(undefined);
			mockBadgeService.assertBadgesExist.mockResolvedValue(undefined);
			mockDb.update = jest.fn().mockReturnValue({
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockResolvedValue(undefined),
			});
			mockDb.delete = jest.fn().mockReturnValue({
				where: jest.fn().mockResolvedValue(undefined),
			});
			mockDb.insert.mockReturnValue({
				values: jest.fn().mockResolvedValue(undefined),
			});

			await service.updateEvent(
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
				id,
				userId,
			);

			expect(service.getEventByIdOrThrow).toHaveBeenCalledWith(id);
			expect(mockLocationService.getLocationByIdOrThrow).toHaveBeenCalledWith(locationId);
			expect(mockCategoryService.assertCategoriesExist).toHaveBeenCalledWith(categoryIds);
			expect(mockBadgeService.assertBadgesExist).toHaveBeenCalledWith(badgeIds);
			expect(mockDb.update().set).toHaveBeenCalledWith({
				name,
				description,
				startDate,
				endDate,
				quota,
				locationId,
			});
			expect(mockDb.delete().where).toHaveBeenCalledTimes(2);
			expect(mockDb.insert().values).toHaveBeenCalledWith(
				categoryIds.map((categoryId) => ({ categoryId, eventId: id })),
			);
			expect(mockDb.insert().values).toHaveBeenCalledWith(
				badgeIds.map((badgeId) => ({ badgeId, eventId: id })),
			);
		});

		it("should throw ForbiddenException if the user is not the event creator", async () => {
			const id = "eventId";
			const userId = "wrongUserId";
			jest.spyOn(service, "getEventByIdOrThrow").mockResolvedValue({
				id,
				createdBy: { id: "realCreatorId" },
			} as any);
			await expect(service.updateEvent({ name: "New event name" }, id, userId)).rejects.toThrow(
				ForbiddenException,
			);
			await expect(service.updateEvent({}, id, userId)).rejects.toThrow(
				"You do not have permission to edit this event",
			);
			expect(service.getEventByIdOrThrow).toHaveBeenCalledWith(id);
		});
	});
});
