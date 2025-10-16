import { Logger } from "@nestjs/common";
import { AppDatabase } from "../database/connection";
import { reminders } from "../database/schemas";
import { EmailService } from "../email/email.service";
import { EventReminderService } from "./event-reminder.service";

describe("EventReminderService", () => {
    let service: EventReminderService;
    const mockDb = {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
    };
    const mockEmailService = {
        sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
        jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
        jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
        service = new EventReminderService(mockDb as unknown as AppDatabase, mockEmailService as unknown as EmailService);
        jest.clearAllMocks();
    });

    it("should process reminders and mark them as done", async () => {
        const fakeUser = { id: "user1", name: "Luis", email: "test@iteso.mx", status: "active" };
        const fakeEvent = { id: "event1", name: "Convive Talk", startDate: new Date(), status: "active" };
        const fakeReminder = { id: "rem1", firstReminderDone: false, secondReminderDone: false };
        const remindersToDo = [{ users: fakeUser, events: fakeEvent, reminders: fakeReminder }];
        const mockSelectChain = {
            from: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValue(remindersToDo),
        };
        mockDb.select.mockReturnValue(mockSelectChain);
        await service.handleEventReminders();
        expect(mockEmailService.sendEmail).toHaveBeenCalled();
        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
            expect.arrayContaining(["test@iteso.mx"]),
            expect.stringMatching(/Reminder/),
            expect.stringMatching(/Convive Talk/),
        );
        expect(mockDb.update).toHaveBeenCalled();
        expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringMatching(/reminders sent successfully/),
        );
    });

    it("should handle missing reminder by inserting one before marking done", async () => {
        const fakeUser = { id: "user2", name: "Mario", email: "mario@iteso.mx", status: "active" };
        const fakeEvent = { id: "event2", name: "Tech Fair", startDate: new Date(), status: "active" };
        const remindersToDo = [{ users: fakeUser, events: fakeEvent, reminders: null }];
        const mockSelectChain = {
            from: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValue(remindersToDo),
        };
        mockDb.select.mockReturnValue(mockSelectChain);
        mockDb.insert.mockReturnValue({
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: "newRem" }]),
        });
        await service.handleEventReminders();
        expect(mockDb.insert).toHaveBeenCalledWith(reminders);
        expect(mockDb.update).toHaveBeenCalled();
        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
            expect.arrayContaining(["mario@iteso.mx"]),
            expect.stringMatching(/Reminder/),
            expect.stringMatching(/Tech Fair/),
        );
    });

    it("should handle errors gracefully and log them", async () => {
        const mockSelectChain = {
            from: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockRejectedValue(new Error("DB failure")),
        };
        mockDb.select.mockReturnValue(mockSelectChain);
        await service.handleEventReminders();
        expect(Logger.prototype.error).toHaveBeenCalledWith(
            expect.stringMatching(/Error for/));
    });

    it("should not update reminders if no reminders found", async () => {
        const mockSelectChain = {
            from: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValue([]),
        };
        mockDb.select.mockReturnValue(mockSelectChain);
        await service.handleEventReminders();
        expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
        expect(mockDb.update).not.toHaveBeenCalled();
    });
});
