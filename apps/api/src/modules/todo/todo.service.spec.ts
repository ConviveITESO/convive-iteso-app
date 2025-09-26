import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { TodoService } from "./todo.service";

describe("TodoService", () => {
	let service: TodoService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TodoService,
				{
					provide: DATABASE_CONNECTION,
					useValue: undefined,
				},
			],
		}).compile();

		service = module.get<TodoService>(TodoService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
