import { Test, TestingModule } from "@nestjs/testing";
import { CreateNotificationTestSchema } from "@repo/schemas";
import { UserRequest } from "@/types/user.request";
import { AuthGuard } from "../auth/guards/auth.guard";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";

describe("NotificationController", () => {
	let controller: NotificationController;

	// Mock NotificationService
	const mockService = {
		listForUser: jest.fn(),
		getById: jest.fn(),
		clearAll: jest.fn(),
		create: jest.fn(),
	};

	// Mock AuthGuard → siempre permite acceso
	const mockAuthGuard = {
		canActivate: jest.fn(() => true),
	};

	// Mock request válido
	const mockReq: UserRequest = {
		user: {
			id: "user-123",
			status: "active",
		},
	} as UserRequest;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [NotificationController],
			providers: [{ provide: NotificationService, useValue: mockService }],
		})
			.overrideGuard(AuthGuard)
			.useValue(mockAuthGuard)
			.compile();

		controller = module.get<NotificationController>(NotificationController);

		jest.clearAllMocks();
	});

	// list()
	describe("list", () => {
		it("should list notifications for the user", async () => {
			const mockNotifications = [{ id: "n1", message: "hola" }];
			mockService.listForUser.mockResolvedValue(mockNotifications);

			const result = await controller.list(mockReq);

			expect(mockService.listForUser).toHaveBeenCalledWith("user-123");
			expect(result).toBe(mockNotifications);
		});
	});

	// getOne()
	describe("getOne", () => {
		it("should return a single notification", async () => {
			const mockNotification = { id: "n1", message: "hola" };
			mockService.getById.mockResolvedValue(mockNotification);

			const result = await controller.getOne({ id: "n1" }, mockReq);

			expect(mockService.getById).toHaveBeenCalledWith("n1", "user-123");
			expect(result).toBe(mockNotification);
		});
	});

	// clearAll()
	describe("clearAll", () => {
		it("should clear all notifications for user", async () => {
			mockService.clearAll.mockResolvedValue(undefined);

			const result = await controller.clearAll(mockReq);

			expect(mockService.clearAll).toHaveBeenCalledWith("user-123");
			expect(result).toEqual({ ok: true });
		});
	});

	// createTest()
	describe("createTest", () => {
		it("should create a test notification", async () => {
			// Tipo correcto requerido por el schema
			const body: CreateNotificationTestSchema = {
				eventId: "ev1",
				kind: "reminder", // ✔ valor permitido
				title: "Test",
				body: "Hello",
				meta: {}, // requerido por schema
			};

			const created = { id: "n1", ...body };
			mockService.create.mockResolvedValue(created);

			const result = await controller.createTest(body, mockReq as UserRequest);

			expect(mockService.create).toHaveBeenCalledWith(body, "user-123");
			expect(result).toBe(created);
		});
	});
});
