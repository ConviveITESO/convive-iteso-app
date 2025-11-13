/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { ForbiddenException, NotFoundException } from "@nestjs/common";
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
	});
});
