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
		it("should return all comments for a specific event", async () => {
			const eventId = "event-123";
			const mockComments = [
				{
					id: 1,
					userId: "user-1",
					eventId,
					commentText: "Great event!",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					userId: "user-2",
					eventId,
					commentText: "Looking forward to it",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockDb.query.comments.findMany.mockResolvedValue(mockComments);

			const result = await service.getAllCommentsByEvent(eventId);

			expect(result).toEqual(mockComments);
			expect(mockDb.query.comments.findMany).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("should return empty array when no comments found for event", async () => {
			mockDb.query.comments.findMany.mockResolvedValue([]);

			const result = await service.getAllCommentsByEvent("event-123");

			expect(result).toEqual([]);
		});
	});

	describe("getAllCommentsByUser", () => {
		it("should return all comments made by a specific user", async () => {
			const userId = "user-123";
			const mockComments = [
				{
					id: 1,
					userId,
					eventId: "event-1",
					commentText: "Comment 1",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					userId,
					eventId: "event-2",
					commentText: "Comment 2",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockDb.query.comments.findMany.mockResolvedValue(mockComments);

			const result = await service.getAllCommentsByUser(userId);

			expect(result).toEqual(mockComments);
			expect(mockDb.query.comments.findMany).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("should return empty array when user has no comments", async () => {
			mockDb.query.comments.findMany.mockResolvedValue([]);

			const result = await service.getAllCommentsByUser("user-123");

			expect(result).toEqual([]);
		});
	});

	describe("getCommentByIdByUser", () => {
		it("should return a specific comment for a user", async () => {
			const userId = "user-123";
			const commentId = 1;
			const mockComment = {
				id: commentId,
				userId,
				eventId: "event-1",
				commentText: "My comment",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDb.query.comments.findFirst.mockResolvedValue(mockComment);

			const result = await service.getCommentByIdByUser(userId, commentId);

			expect(result).toEqual(mockComment);
			expect(mockDb.query.comments.findFirst).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("should return undefined when comment not found", async () => {
			mockDb.query.comments.findFirst.mockResolvedValue(undefined);

			const result = await service.getCommentByIdByUser("user-123", 999);

			expect(result).toBeUndefined();
		});

		it("should return undefined when comment belongs to different user", async () => {
			mockDb.query.comments.findFirst.mockResolvedValue(undefined);

			const result = await service.getCommentByIdByUser("wrong-user", 1);

			expect(result).toBeUndefined();
		});
	});

	describe("addCommentToEvent", () => {
		it("should add a new comment to an event", async () => {
			const eventId = "event-123";
			const userId = "user-123";
			const commentText = "This is a test comment";
			const mockAddedComment = {
				id: 1,
				userId,
				eventId,
				commentText,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDb.insert.mockReturnValue({
				values: jest.fn().mockReturnThis(),
				returning: jest.fn().mockResolvedValue([mockAddedComment]),
			});

			const result = await service.addCommentToEvent(eventId, userId, commentText);

			expect(result).toEqual(mockAddedComment);
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe("updateCommentById", () => {
		it("should update an existing comment", async () => {
			const commentId = 1;
			const userId = "user-123";
			const originalText = "Original comment";
			const updatedText = "Updated comment";
			const mockComment = {
				id: commentId,
				userId,
				eventId: "event-1",
				commentText: originalText,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest.spyOn(service, "getCommentByIdByUser").mockResolvedValue(mockComment);
			mockDb.update.mockReturnValue({
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockResolvedValue(undefined),
			});

			const result = await service.updateCommentById(commentId, userId, updatedText);

			expect(result).toBeDefined();
			expect(result?.commentText).toBe(updatedText);
			expect(service.getCommentByIdByUser).toHaveBeenCalledWith(userId, commentId);
			expect(mockDb.update).toHaveBeenCalled();
		});

		it("should return null when comment does not exist", async () => {
			jest.spyOn(service, "getCommentByIdByUser").mockResolvedValue(undefined);

			const result = await service.updateCommentById(999, "user-123", "New text");

			expect(result).toBeNull();
			expect(mockDb.update).not.toHaveBeenCalled();
		});

		it("should return null when comment belongs to different user", async () => {
			jest.spyOn(service, "getCommentByIdByUser").mockResolvedValue(undefined);

			const result = await service.updateCommentById(1, "wrong-user", "New text");

			expect(result).toBeNull();
			expect(mockDb.update).not.toHaveBeenCalled();
		});
	});
});
