import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { TodoController } from "./todo.controller";
import { TodoService } from "./todo.service";

describe("TodoController", () => {
	let controller: TodoController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TodoController],
			providers: [
				TodoService,
				{
					provide: DATABASE_CONNECTION,
					useValue: undefined,
				},
			],
		}).compile();

		controller = module.get<TodoController>(TodoController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
