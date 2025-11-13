import { randomUUID } from "node:crypto";
import { Test, TestingModule } from "@nestjs/testing";
import {
	CreateEventSchema,
	GetEventsCreatedByUserQuerySchema,
	GetEventsQuerySchema,
	UpdateEventSchema,
} from "@repo/schemas";
import { UserRequest } from "@/types/user.request";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";

describe("EventController", () => {
	let controller: EventController;

	const mockEventService = {
		getEvents: jest.fn(),
		getEventsCreatedByUser: jest.fn(),
		getEventByIdOrThrow: jest.fn(),
		createEvent: jest.fn(),
		updateEvent: jest.fn(),
		changeEventStatus: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [EventController],
			providers: [{ provide: EventService, useValue: mockEventService }],
		}).compile();

		controller = module.get<EventController>(EventController);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it("delegates getEvents to the service", async () => {
		const events = [{ id: "event-1" }];
		const filters = { name: "Test", pastEvents: "false" } as GetEventsQuerySchema;
		mockEventService.getEvents.mockResolvedValue(events);

		const result = await controller.getEvents(filters);

		expect(result).toEqual(events);
		expect(mockEventService.getEvents).toHaveBeenCalledWith(filters);
	});

	it("returns events created by the logged in user", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;
		const events = [{ id: "event-1" }];
		const query = { status: "active" } as GetEventsCreatedByUserQuerySchema;
		mockEventService.getEventsCreatedByUser.mockResolvedValue(events);

		const result = await controller.getEventsCreatedByUser(query, req);

		expect(result).toEqual(events);
		expect(mockEventService.getEventsCreatedByUser).toHaveBeenCalledWith(req.user.id, query);
	});

	it("fetches a single event scoped to the user", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;
		const event = { id: "event-1" };
		mockEventService.getEventByIdOrThrow.mockResolvedValue(event);

		const result = await controller.getEventById({ id: "event-1" }, req);

		expect(result).toEqual(event);
		expect(mockEventService.getEventByIdOrThrow).toHaveBeenCalledWith("event-1", req.user.id);
	});

	it("creates an event with the uploaded image", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;
		const file = {
			originalname: "banner.png",
			buffer: Buffer.from("file"),
			mimetype: "image/png",
		} as Express.Multer.File;
		const payload: CreateEventSchema = {
			name: "Test event",
			description: "Description",
			startDate: new Date().toISOString(),
			endDate: new Date().toISOString(),
			quota: 25,
			locationId: randomUUID(),
			categoryIds: [randomUUID()],
			badgeIds: [randomUUID()],
		};
		const eventId = "event-1";
		const createdEvent = { id: eventId };
		mockEventService.createEvent.mockResolvedValue(eventId);
		mockEventService.getEventByIdOrThrow.mockResolvedValue(createdEvent);

		const result = await controller.createEvent({ data: JSON.stringify(payload) }, req, file);

		expect(result).toEqual(createdEvent);
		expect(mockEventService.createEvent).toHaveBeenCalledWith(payload, req.user.id, file);
		expect(mockEventService.getEventByIdOrThrow).toHaveBeenCalledWith(eventId, req.user.id);
	});

	it("updates an event and returns the latest state", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;
		const payload: UpdateEventSchema = { name: "Updated name" };
		const updatedEvent = { id: "event-1", name: "Updated name" };
		mockEventService.updateEvent.mockResolvedValue(undefined);
		mockEventService.getEventByIdOrThrow.mockResolvedValue(updatedEvent);

		const result = await controller.updateEvent("event-1", payload, req);

		expect(result).toEqual(updatedEvent);
		expect(mockEventService.updateEvent).toHaveBeenCalledWith(payload, "event-1", req.user.id);
		expect(mockEventService.getEventByIdOrThrow).toHaveBeenCalledWith("event-1", req.user.id);
	});

	it("changes the event status when requested", async () => {
		const req = { user: { id: "user-1" } } as UserRequest;

		const result = await controller.changeEventStatus({ id: "event-1" }, req);

		expect(result).toEqual({ message: "Event status changed successfully" });
		expect(mockEventService.changeEventStatus).toHaveBeenCalledWith("event-1", req.user);
	});
});
