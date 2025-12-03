import { Test, TestingModule } from "@nestjs/testing";
import {
	CreateSubscriptionSchema,
	EventIdParamSchema,
	EventStatsResponseSchema,
	SubscriptionIdParamSchema,
	SubscriptionQuerySchema,
	SubscriptionResponseSchema,
	UpdateSubscriptionSchema,
} from "@repo/schemas";
import { UserRequest } from "@/types/user.request";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";

type MockedSubscriptionsService = jest.Mocked<
	Pick<
		SubscriptionsService,
		| "getUserSubscriptions"
		| "getUserSubscribedEvents"
		| "getSubscriptionById"
		| "getEventStats"
		| "getEventAlreadyRegistered"
		| "createSubscription"
		| "updateSubscription"
		| "deleteSubscription"
		| "getQrCode"
		| "checkIn"
	>
>;

describe("SubscriptionsController", () => {
	let controller: SubscriptionsController;
	let service: MockedSubscriptionsService;

	beforeEach(async () => {
		service = {
			getUserSubscriptions: jest.fn(),
			getUserSubscribedEvents: jest.fn(),
			getSubscriptionById: jest.fn(),
			getEventStats: jest.fn(),
			getEventAlreadyRegistered: jest.fn(),
			createSubscription: jest.fn(),
			updateSubscription: jest.fn(),
			deleteSubscription: jest.fn(),
			getQrCode: jest.fn(),
			checkIn: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [SubscriptionsController],
			providers: [{ provide: SubscriptionsService, useValue: service }],
		}).compile();

		controller = module.get<SubscriptionsController>(SubscriptionsController);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("getQrCode", () => {
		it("uses authenticated user id when available", async () => {
			const req = { user: { id: "user-123" } } as UserRequest;
			const body: CreateSubscriptionSchema = { eventId: "event-1" } as CreateSubscriptionSchema;
			service.getQrCode.mockResolvedValue({ id: "qr" } as never);

			await controller.getQrCode(body, req);

			expect(service.getQrCode).toHaveBeenCalledWith("event-1", "user-123");
		});

		it("falls back to empty user id when request is missing", async () => {
			service.getQrCode.mockResolvedValue({ id: "qr" } as never);

			await controller.getQrCode({ eventId: "event-1" } as CreateSubscriptionSchema, undefined);

			expect(service.getQrCode).toHaveBeenCalledWith("event-1", "");
		});
	});

	describe("checkIn", () => {
		it("delegates to the service", async () => {
			const body = {
				eventId: "event-1",
				subscriptionId: "sub-1",
			} as SubscriptionCheckInRequestSchema;
			service.checkIn.mockResolvedValue({ status: "ok" } as never);

			const result = await controller.checkIn(body);

			expect(service.checkIn).toHaveBeenCalledWith("event-1", "sub-1");
			expect(result).toEqual({ status: "ok" });
		});
	});

	describe("getUserSubscriptions", () => {
		it("should return subscriptions for the authenticated user", async () => {
			const query: SubscriptionQuerySchema = { status: "registered" } as SubscriptionQuerySchema;
			const req = { user: { id: "user-123" } } as UserRequest;
			const subscriptions = [{ id: "sub-1" }] as unknown as Awaited<
				ReturnType<SubscriptionsService["getUserSubscriptions"]>
			>;
			service.getUserSubscriptions.mockResolvedValue(subscriptions);

			const result = await controller.getUserSubscriptions(req, query);

			expect(service.getUserSubscriptions).toHaveBeenCalledWith(req.user.id, query);
			expect(result).toBe(subscriptions);
		});
	});

	describe("getUserSubscribedEvents", () => {
		it("should return subscribed events for the authenticated user", async () => {
			const req = { user: { id: "user-987" } } as UserRequest;
			const events = [{ id: "event-1" }];
			service.getUserSubscribedEvents.mockResolvedValue(events as never);

			const result = await controller.getUserSubscribedEvents(req);

			expect(service.getUserSubscribedEvents).toHaveBeenCalledWith(req.user.id);
			expect(result).toBe(events);
		});
	});

	describe("getSubscriptionById", () => {
		it("should return subscription by id for the authenticated user", async () => {
			const subscriptionId = "subscription-id";
			const params = { id: subscriptionId } as SubscriptionIdParamSchema;
			const req = { user: { id: "user-456" } } as UserRequest;
			const subscription = { id: subscriptionId } as unknown as Awaited<
				ReturnType<SubscriptionsService["getSubscriptionById"]>
			>;
			service.getSubscriptionById.mockResolvedValue(subscription);

			const result = await controller.getSubscriptionById(params, req);

			expect(service.getSubscriptionById).toHaveBeenCalledWith(subscriptionId, req.user.id);
			expect(result).toBe(subscription);
		});
	});

	describe("getEventStats", () => {
		it("should return event statistics for the given event id", async () => {
			const eventId = "event-123";
			const id = { id: eventId } as EventIdParamSchema;
			const stats: EventStatsResponseSchema = {
				eventId,
				registeredCount: 18,
				waitlistedCount: 5,
				spotsLeft: 32,
			};
			service.getEventStats.mockResolvedValue(stats);

			const result = await controller.getEventStats(id);

			expect(service.getEventStats).toHaveBeenCalledWith(eventId);
			expect(result).toBe(stats);
		});
	});

	describe("getEventAlreadyRegistered", () => {
		it("should return subscription id when user is already registered for event", async () => {
			const eventId = "event-123";
			const subscriptionId = "sub-456";
			const id = { id: eventId } as EventIdParamSchema;
			const req = { user: { id: "user-789" } } as UserRequest;
			const response = { id: subscriptionId };
			service.getEventAlreadyRegistered.mockResolvedValue(response);

			const result = await controller.getEventAlreadyRegistered(id, req);

			expect(service.getEventAlreadyRegistered).toHaveBeenCalledWith(eventId, req.user.id);
			expect(result).toBe(response);
		});
	});

	describe("createSubscription", () => {
		it("should create a subscription for the authenticated user", async () => {
			const req = { user: { id: "user-789" } } as UserRequest;
			const data = { eventId: "event-1" } as CreateSubscriptionSchema;
			const subscription = {
				id: "sub-created",
				userId: req.user.id,
				eventId: data.eventId,
				status: "registered",
				position: null,
			} as SubscriptionResponseSchema;
			service.createSubscription.mockResolvedValue(subscription);

			const result = await controller.createSubscription(data, req);

			expect(service.createSubscription).toHaveBeenCalledWith(req.user.id, data);
			expect(result).toBe(subscription);
		});
	});

	describe("updateSubscription", () => {
		it("should update subscription for the authenticated user", async () => {
			const subscriptionId = "subscription-id";
			const params = { id: subscriptionId } as SubscriptionIdParamSchema;
			const req = { user: { id: "user-321" } } as UserRequest;
			const data = { status: "cancelled" } as UpdateSubscriptionSchema;
			const subscription = {
				id: subscriptionId,
				userId: req.user.id,
				eventId: "event-1",
				status: data.status,
				position: null,
			} as SubscriptionResponseSchema;
			service.updateSubscription.mockResolvedValue(subscription);

			const result = await controller.updateSubscription(data, params, req);

			expect(service.updateSubscription).toHaveBeenCalledWith(subscriptionId, req.user.id, data);
			expect(result).toBe(subscription);
		});
	});

	describe("deleteSubscription", () => {
		it("should delete subscription for the authenticated user", async () => {
			const subscriptionId = "subscription-id";
			const params = { id: subscriptionId } as SubscriptionIdParamSchema;
			const req = { user: { id: "user-654" } } as UserRequest;
			const message = { message: "Subscription cancelled successfully" };
			service.deleteSubscription.mockResolvedValue(message);

			const result = await controller.deleteSubscription(params, req);

			expect(service.deleteSubscription).toHaveBeenCalledWith(subscriptionId, req.user.id);
			expect(result).toBe(message);
		});
	});
});
