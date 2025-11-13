import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { UserRequest } from "@/types/user.request";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";

describe("CommentsController", () => {
	let controller: CommentsController;

	const mockCommentsService = {
		getAllCommentsByEvent: jest.fn(),
		addCommentToEvent: jest.fn(),
		getCommentByIdByUser: jest.fn(),
		updateCommentById: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CommentsController],
			providers: [{ provide: CommentsService, useValue: mockCommentsService }],
		}).compile();

		controller = module.get<CommentsController>(CommentsController);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it("returns comments for an event", async () => {
		const eventId = "event-1";
		const comments = [{ id: 1 }];
		mockCommentsService.getAllCommentsByEvent.mockResolvedValue(comments);

		const result = await controller.getAllCommentsFromEvent(eventId);

		expect(result).toEqual(comments);
		expect(mockCommentsService.getAllCommentsByEvent).toHaveBeenCalledWith(eventId);
	});

	it("adds a comment for the authenticated user", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;
		const created = { id: 1, commentText: "Nice event" };
		mockCommentsService.addCommentToEvent.mockResolvedValue(created);

		const result = await controller.addCommentToEvent({ comment: "Nice event" }, req, "event-1");

		expect(result).toEqual(created);
		expect(mockCommentsService.addCommentToEvent).toHaveBeenCalledWith(
			"event-1",
			req.user.id,
			"Nice event",
		);
	});

	it("updates a comment when it exists", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;
		const updated = { id: 1, commentText: "Updated" };
		mockCommentsService.getCommentByIdByUser.mockResolvedValue(updated);
		mockCommentsService.updateCommentById.mockResolvedValue(updated);

		const result = await controller.updateComment({ comment: "Updated" }, 1, req);

		expect(result).toEqual(updated);
		expect(mockCommentsService.getCommentByIdByUser).toHaveBeenCalledWith(req.user.id, 1);
		expect(mockCommentsService.updateCommentById).toHaveBeenCalledWith(1, "Updated");
	});

	it("throws NotFoundException when the comment is missing", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;
		mockCommentsService.getCommentByIdByUser.mockResolvedValue(null);

		await expect(controller.updateComment({ comment: "Updated" }, 1, req)).rejects.toThrow(
			NotFoundException,
		);
		expect(mockCommentsService.updateCommentById).not.toHaveBeenCalled();
	});
});
