import { Test, TestingModule } from "@nestjs/testing";
import { CreateEventSchema, UpdateEventSchema } from "@repo/schemas";
import { UserRequest } from "@/types/user.request";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";

describe("EventController", () => {
	let controller: EventController;
	const mockEventService = {
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
			const mockEventCreated = { name: "Test event 2" };
			const req = { user: { id: "userId" } } as UserRequest;
			mockEventService.createEvent.mockResolvedValue(id);
			mockEventService.getEventByIdOrThrow.mockResolvedValue(mockEvent);
			const result = await controller.createEvent(mockEventCreated as CreateEventSchema, req);
			expect(mockEventService.createEvent).toHaveBeenCalledWith(mockEventCreated, req.user.id);
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
