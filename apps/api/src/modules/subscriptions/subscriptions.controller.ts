import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	CreateSubscriptionSchema,
	createSubscriptionSchema,
	SubscriptionIdParamSchema,
	SubscriptionQuerySchema,
	subscriptionArrayResponseSchema,
	subscriptionIdParamSchema,
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
import { SubscriptionsService } from "./subscriptions.service";

@ApiTags("Subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
	constructor(private readonly subscriptionsService: SubscriptionsService) {}

	// GET /subscriptions
	@Get()
	@ZodQuery(subscriptionQuerySchema, "search")
	@ZodOk(subscriptionArrayResponseSchema)
	async getUserSubscriptions(
		@Query(new ZodValidationPipe(subscriptionQuerySchema)) query?: SubscriptionQuerySchema,
		@Req() req?: { user: { id: string } },
	) {
		// TODO: Replace with actual user ID from authentication
		const userId = req?.user?.id || "";
		return await this.subscriptionsService.getUserSubscriptions(userId, query);
	}

	// GET /subscriptions/:id
	@Get(":id")
	@ZodParam(subscriptionIdParamSchema, "id")
	@ZodOk(subscriptionResponseSchema)
	async getSubscriptionById(
		@Param(new ZodValidationPipe(subscriptionIdParamSchema)) id: SubscriptionIdParamSchema,
		@Req() req?: { user: { id: string } },
	) {
		// TODO: Replace with actual user ID from authentication
		const userId = req?.user?.id || "";
		return await this.subscriptionsService.getSubscriptionById(id, userId);
	}

	// POST /subscriptions
	@Post()
	@ZodBody(createSubscriptionSchema)
	@ZodCreated(subscriptionResponseSchema)
	async createSubscription(
		@Body(new ZodValidationPipe(createSubscriptionSchema)) data: CreateSubscriptionSchema,
		@Req() req?: { user: { id: string } },
	) {
		// TODO: Replace with actual user ID from authentication
		const userId = req?.user?.id || "";
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
		@Req() req?: { user: { id: string } },
	) {
		// TODO: Replace with actual user ID from authentication
		const userId = req?.user?.id || "";
		return await this.subscriptionsService.updateSubscription(id, userId, data);
	}

	// DELETE /subscriptions/:id
	@Delete(":id")
	@ZodParam(subscriptionIdParamSchema, "id")
	@ZodOk(subscriptionResponseSchema)
	async deleteSubscription(
		@Param(new ZodValidationPipe(subscriptionIdParamSchema)) id: SubscriptionIdParamSchema,
		@Req() req?: { user: { id: string } },
	) {
		// TODO: Replace with actual user ID from authentication
		const userId = req?.user?.id || "";
		return await this.subscriptionsService.deleteSubscription(id, userId);
	}
}
