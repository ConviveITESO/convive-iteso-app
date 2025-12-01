import { Test, TestingModule } from "@nestjs/testing";
import { UserRequest } from "@/types/user.request";
import { AuthGuard } from "../auth/guards/auth.guard";
import { GroupController } from "./group.controller";
import { GroupService } from "./group.service";

describe("GroupController", () => {
	let controller: GroupController;

	// Mock del servicio
	const mockGroupService = {
		getMessages: jest.fn(),
		sendMessage: jest.fn(),
	};

	// Mock del guard
	const mockAuthGuard = {
		canActivate: jest.fn(() => true),
	};

	// Helper para mockear UserRequest sin usar ANY
	const createMockRequest = (userId: string): UserRequest =>
		({
			user: { id: userId },
		}) as Partial<UserRequest> as UserRequest;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [GroupController],
			providers: [
				{
					provide: GroupService,
					useValue: mockGroupService,
				},
			],
		})
			.overrideGuard(AuthGuard)
			.useValue(mockAuthGuard)
			.compile();

		controller = module.get<GroupController>(GroupController);

		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it("should return messages for a group", async () => {
		const groupId = "group123";
		const expectedMessages = [{ id: "1", content: "hello" }];

		mockGroupService.getMessages.mockResolvedValue(expectedMessages);

		const result = await controller.getMessages(groupId);

		expect(mockGroupService.getMessages).toHaveBeenCalledWith(groupId);
		expect(result).toEqual(expectedMessages);
	});

	it("should send a message to a group", async () => {
		const groupId = "group456";
		const content = "Hola mundo";
		const userId = "user789";

		const req = createMockRequest(userId);

		const expectedResponse = {
			id: "msg1",
			content,
			userId,
		};

		mockGroupService.sendMessage.mockResolvedValue(expectedResponse);

		const result = await controller.sendMessage(groupId, content, req);

		expect(mockGroupService.sendMessage).toHaveBeenCalledWith(groupId, userId, content);

		expect(result).toEqual(expectedResponse);
	});
});
