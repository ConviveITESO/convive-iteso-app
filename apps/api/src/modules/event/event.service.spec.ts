/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateEventSchema, EventResponseSchema, UpdateEventSchema } from "@repo/schemas";
import { BadgeService } from "../badge/badge.service";
import { CategoryService } from "../category/category.service";
import { DATABASE_CONNECTION } from "../database/connection";
import { GroupService } from "../group/group.service";
import { LocationService } from "../location/location.service";
import { RatingsService } from "../ratings/ratings.service";
import { S3Service } from "../s3/s3.service";
import { UserService } from "../user/user.service";
import { EventService } from "./event.service";

describe("EventService", () => {
	let service: EventService;
	const mockDb = {
		select: jest.fn(),
		insert: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		transaction: jest.fn(async (cb) => cb()),
		query: {
			events: {
				findFirst: jest.fn(),
			},
		},
	};
	const mockUserService = { formatUser: jest.fn() };
	const mockGroupService = {
		formatGroup: jest.fn(),
		createEventGroup: jest.fn(),
		createSubscription: jest.fn(),
	};
	const mockLocationService = { formatLocation: jest.fn(), getLocationByIdOrThrow: jest.fn() };
	const mockCategoryService = { assertCategoriesExist: jest.fn() };
	const mockBadgeService = { assertBadgesExist: jest.fn() };
	const mockRatingsService = { getRatingByPrimaryKey: jest.fn() };
	const mockConfigService = { get: jest.fn() };
	const mockS3Service = {
		uploadFile: jest.fn(),
		getFileUrl: jest.fn(),
		deleteFile: jest.fn(),
	};

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
				{ provide: RatingsService, useValue: mockRatingsService },
				{ provide: ConfigService, useValue: mockConfigService },
				{ provide: S3Service, useValue: mockS3Service },
			],
		}).compile();

		service = module.get<EventService>(EventService);
		jest.clearAllMocks();
	});

	const buildSelect = (rows: any[]) => ({
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		innerJoin: jest.fn().mockReturnThis(),
		leftJoin: jest.fn().mockReturnThis(),
		groupBy: jest.fn().mockResolvedValue(rows),
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getEvents", () => {
		it("returns formatted events according to the filters", async () => {
			const rows = [
				{
					event: {
						id: "event-1",
						name: "E1",
						description: "Desc",
						startDate: new Date(),
						endDate: new Date(Date.now() + 3_600_000),
						quota: 10,
						status: "active",
						createdBy: "user-1",
						groupId: "group-1",
						locationId: "loc-1",
						imageUrl: "url",
					},
					creator: { id: "user-1" },
					group: { id: "group-1" },
					location: { id: "loc-1" },
					categories: [],
					badges: [],
				},
			];
			const formatted = { id: "event-1" } as EventResponseSchema;
			jest.spyOn(service, "formatEvent").mockReturnValue(formatted);
			mockDb.select.mockReturnValue(buildSelect(rows));

			const result = await service.getEvents({ pastEvents: "false" } as any);

			expect(result).toEqual([formatted]);
			expect(service.formatEvent).toHaveBeenCalledWith(
				rows[0]?.event,
				rows[0]?.creator,
				rows[0]?.group,
				rows[0]?.location,
				rows[0]?.categories,
				rows[0]?.badges,
				undefined,
			);
		});

		it("applies all filters when provided", async () => {
			const rows = [
				{
					event: {
						id: "event-2",
						name: "Filtered",
						description: "Desc",
						startDate: new Date(),
						endDate: new Date(),
						quota: 15,
						status: "active",
						createdBy: "creator",
						groupId: "group-2",
						locationId: "loc-2",
						imageUrl: "img",
					},
					creator: { id: "creator" },
					group: { id: "group-2" },
					location: { id: "loc-2" },
					categories: [],
					badges: [],
				},
			];
			const formatted = { id: "event-2" } as EventResponseSchema;
			jest.spyOn(service, "formatEvent").mockReturnValue(formatted);
			mockDb.select.mockReturnValue(buildSelect(rows));

			const result = await service.getEvents({
				pastEvents: "true",
				name: "Filtered",
				locationId: "loc-2",
				categoryId: "cat-1",
				badgeId: "badge-1",
			} as any);

			expect(result).toEqual([formatted]);
			expect(service.formatEvent).toHaveBeenCalledWith(
				rows[0]?.event,
				rows[0]?.creator,
				rows[0]?.group,
				rows[0]?.location,
				rows[0]?.categories,
				rows[0]?.badges,
				undefined,
			);
		});
	});

	describe("getEventById", () => {
		it("returns formatted event along with rating info", async () => {
			const now = new Date();
			const past = new Date(now.getTime() - 3_600_000);
			const row = {
				event: {
					id: "event-1",
					name: "Name",
					description: "Desc",
					startDate: past,
					endDate: past,
					quota: 10,
					status: "active",
					imageUrl: "url",
					createdBy: "user-1",
					groupId: "group-1",
					locationId: "loc-1",
				},
				creator: { id: "user-1" },
				group: { id: "group-1" },
				location: { id: "loc-1" },
				categories: [],
				badges: [],
				ratings: 4,
			};
			const formatted = { id: "event-1" } as EventResponseSchema;
			jest.spyOn(service, "formatEvent").mockReturnValue(formatted);
			mockDb.select.mockReturnValue(buildSelect([row]));
			mockRatingsService.getRatingByPrimaryKey.mockResolvedValue({ id: "rating-1" });

			const result = await service.getEventById("event-1", "user-2");

			expect(result).toBe(formatted);
			expect(service.formatEvent).toHaveBeenCalledWith(
				row.event,
				row.creator,
				row.group,
				row.location,
				row.categories,
				row.badges,
				expect.objectContaining({ ratingAverage: expect.any(Number), userHasRated: true }),
			);
			expect(mockRatingsService.getRatingByPrimaryKey).toHaveBeenCalledWith("user-2", "event-1");
		});

		it("returns undefined when the event does not exist", async () => {
			mockDb.select.mockReturnValue(buildSelect([]));

			const result = await service.getEventById("missing", "user-1");

			expect(result).toBeUndefined();
		});
	});

	describe("getEventByIdOrThrow", () => {
		it("throws when the event cannot be found", async () => {
			jest.spyOn(service, "getEventById").mockResolvedValue(undefined);

			await expect(service.getEventByIdOrThrow("missing", "user-1")).rejects.toThrow(
				NotFoundException,
			);
		});

		it("returns the event when it exists", async () => {
			const event = { id: "event-1" } as EventResponseSchema;
			jest.spyOn(service, "getEventById").mockResolvedValue(event);

			const result = await service.getEventByIdOrThrow("event-1", "user-1");

			expect(result).toBe(event);
		});
	});

	describe("getEventsCreatedByUser", () => {
		it("formats rows and normalizes dates", async () => {
			const rows = [
				{
					id: "1",
					name: "A",
					startDate: new Date(),
					endDate: new Date(),
					status: "active",
					groupId: "g1",
					imageUrl: "img",
					locationName: "HQ",
					registeredCount: 2,
					waitlistedCount: 1,
				},
				{
					id: "2",
					name: "B",
					startDate: "2024-01-01T00:00:00.000Z",
					endDate: "2024-01-02T00:00:00.000Z",
					status: "deleted",
					groupId: "g2",
					imageUrl: "img2",
					locationName: "Remote",
					registeredCount: null,
					waitlistedCount: null,
				},
			];
			const builder = {
				from: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				leftJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockResolvedValue(rows),
			};
			mockDb.select.mockReturnValue(builder);

			const result = await service.getEventsCreatedByUser("user-1", { status: "active" } as any);

			expect(result).toHaveLength(2);
			const expectedStart =
				rows[0]?.startDate instanceof Date ? rows[0]?.startDate.toISOString() : rows[0]?.startDate;
			expect(result[0]?.startDate).toBe(expectedStart);
			expect(result[1]?.startDate).toBe("2024-01-01T00:00:00.000Z");
			expect(result[0]?.attendance).toEqual({ registered: 2, waitlisted: 1 });
			expect(result[1]?.attendance).toEqual({ registered: 0, waitlisted: 0 });
		});
	});

	describe("getEventById (rating check)", () => {
		it("skips rating lookup for future events", async () => {
			const future = new Date(Date.now() + 3_600_000);
			const row = {
				event: {
					id: "future-event",
					name: "Future",
					description: "Desc",
					startDate: future,
					endDate: future,
					quota: 5,
					status: "active",
					imageUrl: "url",
					createdBy: "user-1",
					groupId: "group-1",
					locationId: "loc-1",
				},
				creator: { id: "user-1" },
				group: { id: "group-1" },
				location: { id: "loc-1" },
				categories: [],
				badges: [],
				ratings: 5,
			};
			mockDb.select.mockReturnValue(buildSelect([row]));

			const result = await service.getEventById("future-event", "user-2");

			expect(result?.ratingInfo?.userHasRated).toBe(false);
			expect(mockRatingsService.getRatingByPrimaryKey).not.toHaveBeenCalled();
		});
	});

	describe("createEvent", () => {
		it("uploads the image, validates relations, and returns the new id", async () => {
			const data: CreateEventSchema = {
				name: "Event",
				description: "Desc",
				startDate: new Date().toISOString(),
				endDate: new Date().toISOString(),
				quota: 20,
				locationId: "loc-1",
				categoryIds: ["cat-1"],
				badgeIds: ["badge-1"],
			};
			const file = {
				originalname: "image.png",
				buffer: Buffer.from("file"),
				mimetype: "image/png",
			} as Express.Multer.File;
			const assertSpy = jest
				.spyOn(service as any, "assertLocationCategoriesBadgesExist")
				.mockResolvedValue(undefined);
			const createGroupSpy = jest
				.spyOn(service as any, "createEventGroup")
				.mockResolvedValue("group-1");
			const createEventSpy = jest
				.spyOn(service as any, "_createEvent")
				.mockResolvedValue("event-1");
			const relationsSpy = jest
				.spyOn(service as any, "createCategoryBadgeRelations")
				.mockResolvedValue(undefined);
			mockGroupService.createSubscription.mockResolvedValue(undefined);
			mockS3Service.uploadFile.mockResolvedValue(undefined);
			mockS3Service.getFileUrl.mockResolvedValue("https://image");

			const result = await service.createEvent(data, "user-1", file);

			expect(mockS3Service.uploadFile).toHaveBeenCalled();
			expect(mockS3Service.getFileUrl).toHaveBeenCalled();
			expect(assertSpy).toHaveBeenCalledWith(data);
			expect(createGroupSpy).toHaveBeenCalledWith(data);
			expect(mockGroupService.createSubscription).toHaveBeenCalledWith("group-1", "user-1");
			expect(createEventSpy).toHaveBeenCalledWith(data, "user-1", "group-1", "https://image");
			expect(relationsSpy).toHaveBeenCalledWith(data, "event-1");
			expect(result).toBe("event-1");
		});
	});

	describe("updateEvent", () => {
		it("validates ownership and updates relations", async () => {
			const event = { id: "event-1", createdBy: { id: "user-1" }, status: "active" } as any;
			jest.spyOn(service, "getEventByIdOrThrow").mockResolvedValue(event);
			const assertSpy = jest
				.spyOn(service as any, "assertLocationCategoriesBadgesExist")
				.mockResolvedValue(undefined);
			const updateSpy = jest.spyOn(service as any, "_updateEvent").mockResolvedValue(undefined);
			const relationsSpy = jest
				.spyOn(service as any, "updateCategoryBadgeRelations")
				.mockResolvedValue(undefined);

			await service.updateEvent({ name: "Updated" } as UpdateEventSchema, "event-1", "user-1");

			expect(mockDb.transaction).toHaveBeenCalled();
			expect(assertSpy).toHaveBeenCalled();
			expect(updateSpy).toHaveBeenCalledWith({ name: "Updated" }, "event-1");
			expect(relationsSpy).toHaveBeenCalledWith({ name: "Updated" }, "event-1");
		});

		it("throws when the user is not the creator", async () => {
			const event = { id: "event-1", createdBy: { id: "owner" }, status: "active" } as any;
			jest.spyOn(service, "getEventByIdOrThrow").mockResolvedValue(event);

			await expect(service.updateEvent({ name: "Updated" }, "event-1", "intruder")).rejects.toThrow(
				ForbiddenException,
			);
		});

		it("throws when updating a cancelled event", async () => {
			const event = { id: "event-1", createdBy: { id: "user-1" }, status: "deleted" } as any;
			jest.spyOn(service, "getEventByIdOrThrow").mockResolvedValue(event);

			await expect(service.updateEvent({ name: "Updated" }, "event-1", "user-1")).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe("changeEventStatus", () => {
		it("toggles the event status for the owner", async () => {
			const future = new Date(Date.now() + 3_600_000);
			const event = {
				id: "event-1",
				createdBy: { id: "user-1" },
				status: "active",
				startDate: future.toISOString(),
			} as any;
			jest.spyOn(service, "getEventByIdOrThrow").mockResolvedValue(event);
			const updateBuilder = {
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockResolvedValue(undefined),
			};
			mockDb.update.mockReturnValue(updateBuilder);

			await service.changeEventStatus("event-1", { id: "user-1", role: "user" } as any);

			expect(updateBuilder.set).toHaveBeenCalledWith({ status: "deleted" });
			expect(updateBuilder.where).toHaveBeenCalled();
		});

		it("throws when non-owner non-admin tries to change status", async () => {
			const future = new Date(Date.now() + 3_600_000);
			const event = {
				id: "event-1",
				createdBy: { id: "owner" },
				status: "active",
				startDate: future.toISOString(),
			} as any;
			jest.spyOn(service, "getEventByIdOrThrow").mockResolvedValue(event);

			await expect(
				service.changeEventStatus("event-1", { id: "intruder", role: "user" } as any),
			).rejects.toThrow(ForbiddenException);
		});

		it("throws when cancelling an already started event", async () => {
			const past = new Date(Date.now() - 3_600_000);
			const event = {
				id: "event-2",
				createdBy: { id: "user-1" },
				status: "active",
				startDate: past.toISOString(),
			} as any;
			jest.spyOn(service, "getEventByIdOrThrow").mockResolvedValue(event);

			await expect(
				service.changeEventStatus("event-2", { id: "user-1", role: "user" } as any),
			).rejects.toThrow(BadRequestException);
		});

		it("reactivates an event when admin changes status", async () => {
			const event = {
				id: "event-3",
				createdBy: { id: "owner" },
				status: "deleted",
				startDate: new Date().toISOString(),
			} as any;
			jest.spyOn(service, "getEventByIdOrThrow").mockResolvedValue(event);
			const updateBuilder = {
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockResolvedValue(undefined),
			};
			mockDb.update.mockReturnValue(updateBuilder);

			await service.changeEventStatus("event-3", { id: "admin", role: "admin" } as any);

			expect(updateBuilder.set).toHaveBeenCalledWith({ status: "active" });
			expect(updateBuilder.where).toHaveBeenCalled();
		});
	});

	describe("assertLocationCategoriesBadgesExist", () => {
		it("checks every relation when provided", async () => {
			mockLocationService.getLocationByIdOrThrow.mockResolvedValue(undefined);
			mockCategoryService.assertCategoriesExist.mockResolvedValue(undefined);
			mockBadgeService.assertBadgesExist.mockResolvedValue(undefined);

			await (service as any).assertLocationCategoriesBadgesExist({
				locationId: "loc-1",
				categoryIds: ["cat-1"],
				badgeIds: ["badge-1"],
			});

			expect(mockLocationService.getLocationByIdOrThrow).toHaveBeenCalledWith("loc-1");
			expect(mockCategoryService.assertCategoriesExist).toHaveBeenCalledWith(["cat-1"]);
			expect(mockBadgeService.assertBadgesExist).toHaveBeenCalledWith(["badge-1"]);
		});

		it("skips checks when nothing provided", async () => {
			await (service as any).assertLocationCategoriesBadgesExist({});

			expect(mockLocationService.getLocationByIdOrThrow).not.toHaveBeenCalled();
			expect(mockCategoryService.assertCategoriesExist).not.toHaveBeenCalled();
			expect(mockBadgeService.assertBadgesExist).not.toHaveBeenCalled();
		});
	});

	describe("_updateEvent", () => {
		it("ignores empty payloads", async () => {
			const updateBuilder = { set: jest.fn(), where: jest.fn() };
			mockDb.update.mockReturnValue(updateBuilder);

			await (service as any)._updateEvent({} as any, "event-1");

			expect(updateBuilder.set).not.toHaveBeenCalled();
			expect(updateBuilder.where).not.toHaveBeenCalled();
		});

		it("updates provided fields", async () => {
			const updateBuilder = {
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockResolvedValue(undefined),
			};
			mockDb.update.mockReturnValue(updateBuilder);
			const startDate = new Date().toISOString();

			await (service as any)._updateEvent({ name: "New", startDate } as any, "event-1");

			expect(updateBuilder.set).toHaveBeenCalledWith({
				name: "New",
				startDate: expect.any(Date),
			});
			expect(updateBuilder.where).toHaveBeenCalled();
		});
	});

	describe("category/badge relations", () => {
		it("creates relations for categories and badges", async () => {
			const categoryInsert = { values: jest.fn() };
			const badgeInsert = { values: jest.fn() };
			mockDb.insert.mockReturnValueOnce(categoryInsert).mockReturnValueOnce(badgeInsert);

			await (service as any).createCategoryBadgeRelations(
				{ categoryIds: ["cat-1"], badgeIds: ["badge-1"] } as any,
				"event-1",
			);

			expect(categoryInsert.values).toHaveBeenCalledWith([
				{ eventId: "event-1", categoryId: "cat-1" },
			]);
			expect(badgeInsert.values).toHaveBeenCalledWith([{ eventId: "event-1", badgeId: "badge-1" }]);
		});

		it("skips inserts when relations are empty", async () => {
			const insertBuilder = { values: jest.fn() };
			mockDb.insert.mockReturnValue(insertBuilder);

			await (service as any).createCategoryBadgeRelations(
				{ categoryIds: [], badgeIds: [] } as any,
				"event-1",
			);

			expect(insertBuilder.values).not.toHaveBeenCalled();
		});

		it("updates relations when arrays are present", async () => {
			const deleteBuilder = { where: jest.fn().mockReturnThis() };
			const categoryInsert = { values: jest.fn() };
			const badgeInsert = { values: jest.fn() };
			mockDb.delete.mockReturnValueOnce(deleteBuilder).mockReturnValueOnce(deleteBuilder);
			mockDb.insert.mockReturnValueOnce(categoryInsert).mockReturnValueOnce(badgeInsert);

			await (service as any).updateCategoryBadgeRelations(
				{ categoryIds: ["cat-1"], badgeIds: ["badge-1"] } as any,
				"event-1",
			);

			expect(deleteBuilder.where).toHaveBeenCalledTimes(2);
			expect(categoryInsert.values).toHaveBeenCalledWith([
				{ eventId: "event-1", categoryId: "cat-1" },
			]);
			expect(badgeInsert.values).toHaveBeenCalledWith([{ eventId: "event-1", badgeId: "badge-1" }]);
		});

		it("does nothing when relations are undefined", async () => {
			const deleteBuilder = { where: jest.fn() };
			mockDb.delete.mockReturnValue(deleteBuilder);

			await (service as any).updateCategoryBadgeRelations({}, "event-1");

			expect(deleteBuilder.where).not.toHaveBeenCalled();
			expect(mockDb.insert).not.toHaveBeenCalled();
		});
	});

	describe("updateEventImage", () => {
		it("deletes old image and uploads a new one", async () => {
			(mockDb as any).query.events.findFirst.mockResolvedValue({
				imageUrl: "https://bucket.s3.region.amazonaws.com/events/old-key",
			});
			mockS3Service.deleteFile.mockResolvedValue(undefined);
			mockS3Service.uploadFile.mockResolvedValue(undefined);
			mockS3Service.getFileUrl.mockResolvedValue("https://bucket/events/new-key");
			const updateBuilder = {
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				returning: jest.fn().mockResolvedValue([{ imageUrl: "https://bucket/events/new-key" }]),
			};
			mockDb.update.mockReturnValue(updateBuilder);
			const file = {
				originalname: "image.png",
				buffer: Buffer.from("file"),
				mimetype: "image/png",
			} as Express.Multer.File;

			const result = await service.updateEventImage("event-1", file);

			expect(mockS3Service.deleteFile).toHaveBeenCalledWith("events/old-key");
			expect(mockS3Service.uploadFile).toHaveBeenCalled();
			expect(mockS3Service.getFileUrl).toHaveBeenCalled();
			expect(result).toMatchObject({ imageUrl: "https://bucket/events/new-key" });
		});

		it("uploads when there is no previous image", async () => {
			(mockDb as any).query.events.findFirst.mockResolvedValue({ imageUrl: null });
			mockS3Service.uploadFile.mockResolvedValue(undefined);
			mockS3Service.getFileUrl.mockResolvedValue("https://bucket/events/new-key");
			const updateBuilder = {
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				returning: jest.fn().mockResolvedValue([{ imageUrl: "https://bucket/events/new-key" }]),
			};
			mockDb.update.mockReturnValue(updateBuilder);
			const file = {
				originalname: "image.png",
				buffer: Buffer.from("file"),
				mimetype: "image/png",
			} as Express.Multer.File;

			await service.updateEventImage("event-2", file);

			expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
			expect(mockS3Service.uploadFile).toHaveBeenCalled();
		});
	});

	describe("extractKeyFromUrl", () => {
		it("returns null when url does not contain a key", () => {
			const result = (service as any).extractKeyFromUrl("invalid-url");
			expect(result).toBeNull();
		});
	});

	describe("helper methods", () => {
		it("creates event group names and descriptions", async () => {
			mockGroupService.createEventGroup.mockResolvedValue("group-id");

			const groupId = await (service as any).createEventGroup({ name: "My Event" });

			expect(groupId).toBe("group-id");
			expect(mockGroupService.createEventGroup).toHaveBeenCalledWith({
				name: expect.stringContaining("My Event"),
				description: expect.stringContaining("My Event"),
			});
			expect((service as any).eventGroupName("Name")).toContain("Group for the event: Name");
			expect((service as any).eventGroupDescription("Name")).toContain(
				"interact with other event attendees of: Name",
			);
		});

		it("creates an event record", async () => {
			const insertBuilder = {
				values: jest.fn().mockReturnThis(),
				returning: jest.fn().mockResolvedValue([{ id: "created-event" }]),
			};
			mockDb.insert.mockReturnValue(insertBuilder);
			const data = {
				name: "Title",
				description: "Desc",
				startDate: new Date().toISOString(),
				endDate: new Date().toISOString(),
				quota: 10,
				locationId: "loc-1",
			} as CreateEventSchema;

			const id = await (service as any)._createEvent(data, "user-1", "group-1", "image-url");

			expect(id).toBe("created-event");
			expect(insertBuilder.values).toHaveBeenCalledWith(
				expect.objectContaining({ name: "Title", createdBy: "user-1", groupId: "group-1" }),
			);
			expect(insertBuilder.returning).toHaveBeenCalled();
		});
	});
});
