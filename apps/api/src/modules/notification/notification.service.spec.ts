/* eslint-disable @typescript-eslint/no-explicit-any */
import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateNotificationTestSchema } from "@repo/schemas";
import { DATABASE_CONNECTION } from "@/modules/database/connection";
import { notifications } from "@/modules/database/schemas/notifications";
import { NotificationService } from "./notification.service";

describe("NotificationService", () => {
	let service: NotificationService;

	// --- Fake SELECT chain ---
	const mockSelect = {
		from: jest.fn(),
		where: jest.fn(),
		orderBy: jest.fn(),
		limit: jest.fn(),
	};

	// --- Fake INSERT chain ---
	const mockInsert = {
		values: jest.fn(),
		returning: jest.fn(),
	};

	// --- Fake DELETE chain ---
	const mockDelete = {
		where: jest.fn(),
	};

	// --- Root DB mock ---
	const mockDb = {
		select: jest.fn(() => mockSelect),
		insert: jest.fn(() => mockInsert),
		delete: jest.fn(() => mockDelete),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [NotificationService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get(NotificationService);

		jest.clearAllMocks();

		// Encadenamiento correcto
		mockSelect.from.mockReturnValue(mockSelect);
		mockSelect.where.mockReturnValue(mockSelect);
		mockSelect.orderBy.mockReturnValue(mockSelect);
		mockSelect.limit.mockReturnValue([]);

		mockInsert.values.mockReturnValue(mockInsert);
		mockInsert.returning.mockReturnValue([]);

		mockDelete.where.mockResolvedValue(undefined);
	});

	// -------------------------------------------------------
	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	// -------------------------------------------------------
	// listForUser
	// -------------------------------------------------------
	describe("listForUser", () => {
		it("should return mapped notifications", async () => {
			const mockRow = {
				id: "n1",
				kind: "info",
				title: "Hello",
				body: "World",
				eventId: "ev1",
				userId: "u1",
				createdAt: new Date(),
				readAt: null,
				metaOriginalDate: null,
				metaNewDate: null,
				metaLocation: null,
			};

			mockSelect.orderBy.mockResolvedValueOnce([mockRow]);

			const result = await service.listForUser("u1");

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: "n1",
				title: "Hello",
				body: "World",
				userId: "u1",
			});
		});
	});

	// -------------------------------------------------------
	// getById
	// -------------------------------------------------------
	describe("getById", () => {
		it("should return notification when found", async () => {
			const mockRow = {
				id: "n1",
				userId: "u1",
				eventId: "ev1",
				kind: "info",
				title: "Hola",
				body: "Texto",
				createdAt: new Date(),
				readAt: null,
				metaOriginalDate: null,
				metaNewDate: null,
				metaLocation: null,
			};

			mockSelect.limit.mockResolvedValueOnce([mockRow]);

			const result = await service.getById("n1", "u1");

			expect(result).toMatchObject({
				id: "n1",
				title: "Hola",
			});
		});

		it("should throw NotFoundException when not found", async () => {
			mockSelect.limit.mockResolvedValueOnce([]);

			await expect(service.getById("n1", "u1")).rejects.toThrow(NotFoundException);
		});
	});

	// -------------------------------------------------------
	// clearAll
	// -------------------------------------------------------
	describe("clearAll", () => {
		it("should call delete with correct where clause", async () => {
			await service.clearAll("u1");

			expect(mockDb.delete).toHaveBeenCalledWith(notifications);
			expect(mockDelete.where).toHaveBeenCalled();
		});
	});

	// -------------------------------------------------------
	// create
	// -------------------------------------------------------
	describe("create", () => {
		it("should insert and return created notification", async () => {
			const now = new Date();

			const insertedRow = {
				id: "n1",
				userId: "u1",
				eventId: "ev1",
				kind: "location",
				title: "test",
				body: "body",
				createdAt: now,
				readAt: null,
				metaOriginalDate: null,
				metaNewDate: null,
				metaLocation: null,
			};

			mockInsert.returning.mockResolvedValueOnce([insertedRow]);

			const input: CreateNotificationTestSchema = {
				eventId: "ev1",
				kind: "location",
				title: "test",
				body: "body",
				meta: {},
			};

			const result = await service.create(input, "u1");

			expect(mockDb.insert).toHaveBeenCalledWith(notifications);
			expect(mockInsert.values).toHaveBeenCalled();
			expect(result).toMatchObject({
				id: "n1",
				title: "test",
				userId: "u1",
			});
		});

		it("should throw InternalServerErrorException when insert fails", async () => {
			mockInsert.returning.mockResolvedValueOnce([]);

			const input: CreateNotificationTestSchema = {
				eventId: "ev1",
				kind: "reminder", // ✔ válido
				title: "x",
				body: "x",
				meta: {},
			};

			await expect(service.create(input, "u1")).rejects.toThrow(InternalServerErrorException);
		});
	});
});
