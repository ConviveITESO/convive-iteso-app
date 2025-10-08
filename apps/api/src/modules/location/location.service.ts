import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { LocationResponseSchema } from "@repo/schemas";
import { and, eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { Location, locations } from "../database/schemas";

@Injectable()
export class LocationService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async getLocationById(id: string): Promise<LocationResponseSchema | undefined> {
		const location = await this.db.query.locations.findFirst({
			where: and(eq(locations.id, id), eq(locations.status, "active")),
		});
		if (!location) return location;
		return this.formatLocation(location);
	}

	async getLocationByIdOrThrow(id: string): Promise<LocationResponseSchema> {
		const location = await this.getLocationById(id);
		if (!location) throw new NotFoundException("Location not found");
		return location;
	}

	async getAllLocations(): Promise<LocationResponseSchema[]> {
		return this.db
			.select({
				id: locations.id,
				name: locations.name,
			})
			.from(locations)
			.where(eq(locations.status, "active"));
	}

	formatLocation(location: Location): LocationResponseSchema {
		return {
			id: location.id,
			name: location.name,
		};
	}
}
