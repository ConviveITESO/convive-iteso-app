import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "./../src/app.module";
import { DatabaseHealthService } from "../src/modules/database/database-health.service";

jest.mock("jose", () => ({
	// biome-ignore lint/style/useNamingConvention: external library name
	createRemoteJWKSet: jest.fn(),
	jwtVerify: jest.fn(),
}));

describe("AppController (e2e)", () => {
	let app: INestApplication<App>;

	const mockDatabaseHealthService = {
		onModuleInit: jest.fn(),
	};

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(DatabaseHealthService)
			.useValue(mockDatabaseHealthService)
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it("/health (GET)", () => {
		return request(app.getHttpServer()).get("/health").expect(200);
	});
});
