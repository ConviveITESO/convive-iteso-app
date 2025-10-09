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
	SubscriptionIdParamSchema,
	SubscriptionQuerySchema,
	subscriptionArrayResponseSchema,
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
