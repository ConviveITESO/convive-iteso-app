import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LocationResponseSchema, locationResponseSchema } from "@repo/schemas";
import { ZodOk } from "@/pipes/zod-validation/zod-validation.pipe";
import { AuthGuard } from "../auth/guards/auth.guard";
import { LocationService } from "./location.service";

@ApiTags("Location")
@Controller("locations")
@UseGuards(AuthGuard)
export class LocationController {
	constructor(private readonly locationService: LocationService) {}

	// GET /locations
	@Get()
	@ZodOk(locationResponseSchema)
	async createEvent(): Promise<LocationResponseSchema[]> {
		return this.locationService.getAllLocations();
	}
}
