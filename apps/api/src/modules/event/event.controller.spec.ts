import { Test, TestingModule } from "@nestjs/testing";
import { CreateEventSchema, UpdateEventSchema } from "@repo/schemas";
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

	describe("createEvent", () => {
		it("should call service and return event", async () => {
			const id = "eventId";
			const mockEvent = { name: "Test event 1" };
			mockEventService.createEvent.mockResolvedValue(id);
			mockEventService.getEventByIdOrThrow.mockResolvedValue(mockEvent);
			const mockEventCreated = { name: "Test event 2" };
			const result = await controller.createEvent(mockEventCreated as CreateEventSchema);
			expect(mockEventService.createEvent).toHaveBeenCalledWith(mockEventCreated, "");
			expect(mockEventService.getEventByIdOrThrow).toHaveBeenCalledWith(id);
			expect(result).toEqual(mockEvent);
		});
	});

	describe("updateEvent", () => {
		it("should call service and return updated event", async () => {
			const id = "eventId";
			const mockUpdatedEvent = { name: "Updated event" };
			const mockUpdateData = { name: "Updated event name" };

			mockEventService.updateEvent = jest.fn().mockResolvedValue(undefined);
			mockEventService.getEventByIdOrThrow.mockResolvedValue(mockUpdatedEvent);

			const result = await controller.updateEvent(id, mockUpdateData as UpdateEventSchema);

			expect(mockEventService.updateEvent).toHaveBeenCalledWith(mockUpdateData, id);
			expect(mockEventService.getEventByIdOrThrow).toHaveBeenCalledWith(id);
			expect(result).toEqual(mockUpdatedEvent);
		});
	});
});
