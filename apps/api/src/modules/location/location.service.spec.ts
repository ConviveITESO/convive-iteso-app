import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { Location } from "../database/schemas";
import { LocationService } from "./location.service";

describe("LocationService", () => {
	let service: LocationService;
	const mockDb = {
		query: {
			locations: {
				findFirst: jest.fn(),
			},
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [LocationService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();
		service = module.get<LocationService>(LocationService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getLocationById", () => {
		it("should return formatted location if found", async () => {
			const location = { id: "locationId" };
			mockDb.query.locations.findFirst.mockResolvedValue(location);
			const result = await service.getLocationById("locationId");
			expect(result).toEqual(location);
		});

		it("should return undefined if not found", async () => {
			mockDb.query.locations.findFirst.mockResolvedValue(undefined);
			const result = await service.getLocationById("locationId");
			expect(result).toBeUndefined();
		});
	});

	describe("getLocationByIdOrThrow", () => {
		it("should return formatted location if found", async () => {
			const id = "locationId";
			const location = { id };
			jest.spyOn(service, "getLocationById").mockResolvedValue(location as Location);
			const result = await service.getLocationByIdOrThrow(id);
			expect(service.getLocationById).toHaveBeenCalledWith(id);
			expect(result).toEqual(location);
		});

		it("should throw NotFoundException if location not found", async () => {
			jest.spyOn(service, "getLocationById").mockResolvedValue(undefined);
			await expect(service.getLocationByIdOrThrow("locationId")).rejects.toThrow(NotFoundException);
		});
	});

	describe("formatLocation", () => {
		it("should format a location object", () => {
			const id = "locationId";
			const name = "Test location";
			const location: Location = {
				id,
				name,
				createdBy: "userId",
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: new Date(),
			};
			const result = service.formatLocation(location);
			expect(result).toEqual({
				id,
				name,
			});
		});
	});
});
