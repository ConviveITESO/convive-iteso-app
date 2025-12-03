import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "../database/connection";
import { CommentsService } from "./comments.service";

describe("CommentsService", () => {
	let service: CommentsService;
	const mockDb = {
		query: {
			comments: {
				findMany: jest.fn(),
				findFirst: jest.fn(),
			},
		},
		insert: jest.fn(),
		update: jest.fn(),
		where: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CommentsService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();
		service = module.get<CommentsService>(CommentsService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getAllCommentsByEvent", () => {
		it("returns ordered comments for an event", async () => {
			const eventId = "event-123";
			const mockComments = [{ id: 1 }];
			mockDb.query.comments.findMany.mockResolvedValue(mockComments);

			const result = await service.getAllCommentsByEvent(eventId);

			expect(result).toEqual(mockComments);
			expect(mockDb.query.comments.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.any(Object),
					orderBy: expect.any(Function),
					with: expect.any(Object),
				}),
			);
		});

		it("returns empty array when there are no comments", async () => {
			mockDb.query.comments.findMany.mockResolvedValue([]);

			const result = await service.getAllCommentsByEvent("event-123");

			expect(result).toEqual([]);
		});
	});

	describe("getAllCommentsByUser", () => {
		it("returns comments authored by the user", async () => {
			const userId = "user-123";
			const mockComments = [{ id: 1 }];
			mockDb.query.comments.findMany.mockResolvedValue(mockComments);

			const result = await service.getAllCommentsByUser(userId);

			expect(result).toEqual(mockComments);
			expect(mockDb.query.comments.findMany).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});
	});

	describe("getCommentByIdByUser", () => {
		it("returns the matching comment", async () => {
			const mockComment = { id: 1 };
			mockDb.query.comments.findFirst.mockResolvedValue(mockComment);

			const result = await service.getCommentByIdByUser("user-123", 1);

			expect(result).toEqual(mockComment);
			expect(mockDb.query.comments.findFirst).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("returns undefined when comment is not found", async () => {
			mockDb.query.comments.findFirst.mockResolvedValue(undefined);

			const result = await service.getCommentByIdByUser("user-123", 999);

			expect(result).toBeUndefined();
		});
	});

	describe("addCommentToEvent", () => {
		it("persists a comment and returns it", async () => {
			const mockAddedComment = { id: 1 };
			const insertBuilder = {
				values: jest.fn().mockReturnThis(),
				returning: jest.fn().mockResolvedValue([mockAddedComment]),
			};
			mockDb.insert.mockReturnValue(insertBuilder);

			const result = await service.addCommentToEvent("event-123", "user-123", "Great event");

			expect(result).toEqual(mockAddedComment);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(insertBuilder.values).toHaveBeenCalledWith({
				eventId: "event-123",
				userId: "user-123",
				commentText: "Great event",
			});
		});
	});

	describe("updateCommentById", () => {
		it("updates the stored comment text", async () => {
			const updateBuilder = {
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockResolvedValue("updated"),
			};
			mockDb.update.mockReturnValue(updateBuilder);

			const result = await service.updateCommentById(1, "New text");

			expect(result).toBe("updated");
			expect(mockDb.update).toHaveBeenCalled();
			expect(updateBuilder.set).toHaveBeenCalledWith({ commentText: "New text" });
			expect(updateBuilder.where).toHaveBeenCalledWith(expect.any(Object));
		});

		it("propagates update errors", async () => {
			const updateBuilder = {
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockRejectedValue(new Error("fail")),
			};
			mockDb.update.mockReturnValue(updateBuilder);

			await expect(service.updateCommentById(1, "New text")).rejects.toThrow("fail");
		});
	});
});
