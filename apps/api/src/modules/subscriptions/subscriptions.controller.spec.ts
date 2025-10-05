import { Test, TestingModule } from "@nestjs/testing";
import {
	CreateSubscriptionSchema,
	SubscriptionIdParamSchema,
	SubscriptionQuerySchema,
	SubscriptionResponseSchema,
	UpdateSubscriptionSchema,
} from "@repo/schemas";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";

type MockedSubscriptionsService = jest.Mocked<
	Pick<
		SubscriptionsService,
		| "getUserSubscriptions"
		| "getSubscriptionById"
		| "createSubscription"
		| "updateSubscription"
		| "deleteSubscription"
	>
>;

describe("SubscriptionsController", () => {
	let controller: SubscriptionsController;
	let service: MockedSubscriptionsService;

	beforeEach(async () => {
		service = {
			getUserSubscriptions: jest.fn(),
			getSubscriptionById: jest.fn(),
			createSubscription: jest.fn(),
			updateSubscription: jest.fn(),
			deleteSubscription: jest.fn(),
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

	describe("getUserSubscriptions", () => {
		it("should return subscriptions for the authenticated user", async () => {
			const query: SubscriptionQuerySchema = { status: "registered" } as SubscriptionQuerySchema;
			const req = { user: { id: "user-123" } };
			const subscriptions = [{ id: "sub-1" }] as unknown as Awaited<
				ReturnType<SubscriptionsService["getUserSubscriptions"]>
			>;
			service.getUserSubscriptions.mockResolvedValue(subscriptions);

			const result = await controller.getUserSubscriptions(query, req);

			expect(service.getUserSubscriptions).toHaveBeenCalledWith(req.user.id, query);
			expect(result).toBe(subscriptions);
		});
	});

	describe("getSubscriptionById", () => {
		it("should return subscription by id for the authenticated user", async () => {
			const id = "subscription-id" as SubscriptionIdParamSchema;
			const req = { user: { id: "user-456" } };
			const subscription = { id: id } as unknown as Awaited<
				ReturnType<SubscriptionsService["getSubscriptionById"]>
			>;
			service.getSubscriptionById.mockResolvedValue(subscription);

			const result = await controller.getSubscriptionById(id, req);

			expect(service.getSubscriptionById).toHaveBeenCalledWith(id, req.user.id);
			expect(result).toBe(subscription);
		});
	});

	describe("createSubscription", () => {
		it("should create a subscription for the authenticated user", async () => {
			const req = { user: { id: "user-789" } };
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
			const id = "subscription-id" as SubscriptionIdParamSchema;
			const req = { user: { id: "user-321" } };
			const data = { status: "cancelled" } as UpdateSubscriptionSchema;
			const subscription = {
				id,
				userId: req.user.id,
				eventId: "event-1",
				status: data.status,
				position: null,
			} as SubscriptionResponseSchema;
			service.updateSubscription.mockResolvedValue(subscription);

			const result = await controller.updateSubscription(data, id, req);

			expect(service.updateSubscription).toHaveBeenCalledWith(id, req.user.id, data);
			expect(result).toBe(subscription);
		});
	});

	describe("deleteSubscription", () => {
		it("should delete subscription for the authenticated user", async () => {
			const id = "subscription-id" as SubscriptionIdParamSchema;
			const req = { user: { id: "user-654" } };
			const message = { message: "Subscription cancelled successfully" };
			service.deleteSubscription.mockResolvedValue(message);

			const result = await controller.deleteSubscription(id, req);

			expect(service.deleteSubscription).toHaveBeenCalledWith(id, req.user.id);
			expect(result).toBe(message);
		});
	});
});
