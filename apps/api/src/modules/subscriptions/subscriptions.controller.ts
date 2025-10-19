import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	CreateSubscriptionSchema,
	createSubscriptionSchema,
	EventIdParamSchema,
	eventIdParamSchema,
	eventStatsResponseSchema,
	SubscriptionCheckInRequestSchema,
	SubscriptionIdParamSchema,
	SubscriptionQuerySchema,
	subscribedEventResponseArraySchema,
	subscriptionArrayResponseSchema,
	subscriptionCheckInRequestSchema,
	subscriptionCheckInResponseSchema,
	subscriptionIdParamSchema,
	subscriptionIdResponseSchema,
	subscriptionQuerySchema,
	subscriptionResponseSchema,
	UpdateSubscriptionSchema,
	updateSubscriptionSchema,
} from "@repo/schemas";
import {
	ZodBody,
	ZodCreated,
	ZodOk,
	ZodParam,
	ZodQuery,
	ZodValidationPipe,
} from "@/pipes/zod-validation/zod-validation.pipe";
import { UserRequest } from "@/types/user.request";
import { AuthGuard } from "../auth/guards/auth.guard";
import { SubscriptionsService } from "./subscriptions.service";

@ApiTags("Subscriptions")
@Controller("subscriptions")
@UseGuards(AuthGuard)
export class SubscriptionsController {
	constructor(private readonly subscriptionsService: SubscriptionsService) {}

	// POST /subscriptions/getQr
	@Post("getQr")
	@ZodBody(createSubscriptionSchema) // We can reuse this schema since it has the same structure
	@ZodOk(subscriptionResponseSchema) // We can reuse this schema since it has subscription details
	async getQrCode(
		@Body(new ZodValidationPipe(createSubscriptionSchema)) body: CreateSubscriptionSchema,
		@Req() req?: { user: { id: string } },
	) {
		const userId = req?.user?.id || "";
		return await this.subscriptionsService.getQrCode(body.eventId, userId);
	}

	// POST /subscriptions/check-in
	@Post("check-in")
	@ZodBody(subscriptionCheckInRequestSchema)
	@ZodOk(subscriptionCheckInResponseSchema)
	async checkIn(
		@Body(new ZodValidationPipe(subscriptionCheckInRequestSchema))
		body: SubscriptionCheckInRequestSchema,
	) {
		return await this.subscriptionsService.checkIn(body.eventId, body.subscriptionId);
	}
	
	@Get("events")
	@ZodOk(subscribedEventResponseArraySchema)
	getUserSubscribedEvents(@Req() req: UserRequest) {
		const userId = req.user.id;
		return this.subscriptionsService.getUserSubscribedEvents(userId);
	}

	// GET /subscriptions
	@Get()
	@ZodQuery(subscriptionQuerySchema, "search")
	@ZodOk(subscriptionArrayResponseSchema)
	async getUserSubscriptions(
		@Req() req: UserRequest,
		@Query(new ZodValidationPipe(subscriptionQuerySchema)) query?: SubscriptionQuerySchema,
	) {
		const userId = req.user.id;
		return await this.subscriptionsService.getUserSubscriptions(userId, query);
	}

	// GET /subscriptions/:id
	@Get(":id")
	@ZodParam(subscriptionIdParamSchema, "id")
	@ZodOk(subscriptionResponseSchema)
	async getSubscriptionById(
		@Param(new ZodValidationPipe(subscriptionIdParamSchema)) id: SubscriptionIdParamSchema,
		@Req() req: UserRequest,
	) {
		const userId = req.user.id;
		return await this.subscriptionsService.getSubscriptionById(id.id, userId);
	}

	// GET /subscriptions/:id/stats
	@Get(":id/stats")
	@ZodParam(eventIdParamSchema, "id")
	@ZodOk(eventStatsResponseSchema)
	async getEventStats(@Param(new ZodValidationPipe(eventIdParamSchema)) id: EventIdParamSchema) {
		return await this.subscriptionsService.getEventStats(id.id);
	}

	// GET /subscriptions/:id/alreadyRegistered
	@Get(":id/alreadyRegistered")
	@ZodParam(eventIdParamSchema, "id")
	@ZodOk(subscriptionIdResponseSchema)
	async getEventAlreadyRegistered(
		@Param(new ZodValidationPipe(eventIdParamSchema)) eventId: EventIdParamSchema,
		@Req() req: UserRequest,
	) {
		return await this.subscriptionsService.getEventAlreadyRegistered(eventId.id, req.user.id);
	}

	// POST /subscriptions
	@Post()
	@ZodBody(createSubscriptionSchema)
	@ZodCreated(subscriptionResponseSchema)
	async createSubscription(
		@Body(new ZodValidationPipe(createSubscriptionSchema)) data: CreateSubscriptionSchema,
		@Req() req: UserRequest,
	) {
		const userId = req.user.id;
		return await this.subscriptionsService.createSubscription(userId, data);
	}

	// PATCH /subscriptions/:id
	@Patch(":id")
	@ZodParam(subscriptionIdParamSchema, "id")
	@ZodBody(updateSubscriptionSchema)
	@ZodOk(subscriptionResponseSchema)
	async updateSubscription(
		@Body(new ZodValidationPipe(updateSubscriptionSchema)) data: UpdateSubscriptionSchema,
		@Param(new ZodValidationPipe(subscriptionIdParamSchema)) id: SubscriptionIdParamSchema,
		@Req() req: UserRequest,
	) {
		const userId = req.user.id;
		return await this.subscriptionsService.updateSubscription(id.id, userId, data);
	}

	// DELETE /subscriptions/:id
	@Delete(":id")
	@ZodParam(subscriptionIdParamSchema, "id")
	@ZodOk(subscriptionResponseSchema)
	async deleteSubscription(
		@Param(new ZodValidationPipe(subscriptionIdParamSchema)) id: SubscriptionIdParamSchema,
		@Req() req: UserRequest,
	) {
		const userId = req.user.id;
		return await this.subscriptionsService.deleteSubscription(id.id, userId);
	}
}
