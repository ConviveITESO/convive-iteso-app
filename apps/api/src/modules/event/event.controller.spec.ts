import { randomUUID } from "node:crypto";
import { Test, TestingModule } from "@nestjs/testing";
import { UpdateEventSchema } from "@repo/schemas";
import { UserRequest } from "@/types/user.request";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";

describe("EventController", () => {
	let controller: EventController;
	const mockEventService = {
		getEvents: jest.fn(),
		createEvent: jest.fn(),
		updateEvent: jest.fn(),
		getEventByIdOrThrow: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [EventController],
			providers: [{ provide: EventService, useValue: mockEventService }],
		}).compile();
		controller = module.get<EventController>(EventController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("getEvents", () => {
		it("should return all events when no filters provided", async () => {
			const mockEvents = [
				{ id: "event1", name: "Event 1" },
				{ id: "event2", name: "Event 2" },
			];
			mockEventService.getEvents.mockResolvedValue(mockEvents);
			const result = await controller.getEvents({});
			expect(mockEventService.getEvents).toHaveBeenCalledWith({});
			expect(result).toEqual(mockEvents);
		});

		it("should return filtered events by name", async () => {
			const mockEvents = [{ id: "event1", name: "Test Event" }];
			mockEventService.getEvents.mockResolvedValue(mockEvents);
			const result = await controller.getEvents({ name: "Test Event" });
			expect(mockEventService.getEvents).toHaveBeenCalledWith({ name: "Test Event" });
			expect(result).toEqual(mockEvents);
		});

		it("should return filtered events by locationId", async () => {
			const mockEvents = [{ id: "event1", name: "Event at Location" }];
			mockEventService.getEvents.mockResolvedValue(mockEvents);
			const result = await controller.getEvents({ locationId: "loc123" });
			expect(mockEventService.getEvents).toHaveBeenCalledWith({ locationId: "loc123" });
			expect(result).toEqual(mockEvents);
		});

		it("should return filtered events by categoryId", async () => {
			const mockEvents = [{ id: "event1", name: "Category Event" }];
			mockEventService.getEvents.mockResolvedValue(mockEvents);
			const result = await controller.getEvents({ categoryId: "cat123" });
			expect(mockEventService.getEvents).toHaveBeenCalledWith({ categoryId: "cat123" });
			expect(result).toEqual(mockEvents);
		});

		it("should return filtered events by badgeId", async () => {
			const mockEvents = [{ id: "event1", name: "Badge Event" }];
			mockEventService.getEvents.mockResolvedValue(mockEvents);
			const result = await controller.getEvents({ badgeId: "badge123" });
			expect(mockEventService.getEvents).toHaveBeenCalledWith({ badgeId: "badge123" });
			expect(result).toEqual(mockEvents);
		});

		it("should return filtered events with multiple filters", async () => {
			const mockEvents = [{ id: "event1", name: "Filtered Event" }];
			mockEventService.getEvents.mockResolvedValue(mockEvents);
			const filters = {
				name: "Filtered Event",
				locationId: "loc123",
				categoryId: "cat123",
			};
			const result = await controller.getEvents(filters);
			expect(mockEventService.getEvents).toHaveBeenCalledWith(filters);
			expect(result).toEqual(mockEvents);
		});
	});

	describe("getEventById", () => {
		it("should return an event from the service", async () => {
			const eventId = "event123";
			const mockEvent = {
				id: eventId,
				name: "Test Event",
			};
			mockEventService.getEventByIdOrThrow.mockResolvedValue(mockEvent);
			const result = await controller.getEventById({ id: eventId });
			expect(mockEventService.getEventByIdOrThrow).toHaveBeenCalledWith(eventId);
			expect(result).toEqual(mockEvent);
		});
	});

	describe("createEvent", () => {
		it("should call service and return event", async () => {
			const id = "eventId";
			const mockEvent = { name: "Test event 1" };
			const mockEventCreated = {
				name: "Test event 2",
				description: "This is a test event",
				startDate: new Date().toISOString(),
				endDate: new Date().toISOString(),
				quota: 10,
				locationId: randomUUID(),
				categoryIds: [randomUUID(), randomUUID()],
				badgeIds: [randomUUID(), randomUUID()],
			};
			const req = { user: { id: "userId" } } as UserRequest;
			const file = {
				originalname: "test.png",
				buffer: Buffer.from("test"),
				mimetype: "image/png",
			} as Express.Multer.File;
			mockEventService.createEvent.mockResolvedValue(id);
			mockEventService.getEventByIdOrThrow.mockResolvedValue(mockEvent);
			const result = await controller.createEvent(
				{ data: JSON.stringify(mockEventCreated) },
				req,
				file,
			);
			expect(mockEventService.createEvent).toHaveBeenCalledWith(
				mockEventCreated,
				req.user.id,
				file,
			);
			expect(mockEventService.getEventByIdOrThrow).toHaveBeenCalledWith(id);
			expect(result).toEqual(mockEvent);
		});
	});

	describe("updateEvent", () => {
		it("should call service and return updated event", async () => {
			const id = "eventId";
			const mockUpdatedEvent = { name: "Updated event" };
			const mockUpdateData = { name: "Updated event name" };
			const req = { user: { id: "userId" } } as UserRequest;
			mockEventService.updateEvent = jest.fn().mockResolvedValue(undefined);
			mockEventService.getEventByIdOrThrow.mockResolvedValue(mockUpdatedEvent);
			const result = await controller.updateEvent(id, mockUpdateData as UpdateEventSchema, req);
			expect(mockEventService.updateEvent).toHaveBeenCalledWith(mockUpdateData, id, req.user.id);
			expect(mockEventService.getEventByIdOrThrow).toHaveBeenCalledWith(id);
			expect(result).toEqual(mockUpdatedEvent);
		});
	});
});
