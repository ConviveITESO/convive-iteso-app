import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { and, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import { DateTime } from "luxon";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { Event, events, reminders, subscriptions, User, users } from "../database/schemas";
import { EmailService } from "../email/email.service";

@Injectable()
export class EventReminderService {
	private readonly logger = new Logger(EventReminderService.name);
	private readonly remindersConfig: ReminderConfig[] = [
		{
			minutesBeforeEvent: {
				start: 15,
				end: 1,
			},
			emailSubject: () => "Reminder to attend to an event at ITESO",
			emailBody: (event, user) =>
				`Hi ${user.name}. Remember to attend to the event "${event.name}" on ${zoneDateToString(event.startDate, "America/Mexico_City")}`,
			tableColumn: "firstReminderDone",
		},
	];

	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase,
		private readonly emailService: EmailService,
	) {}

	@Cron(CronExpression.EVERY_30_SECONDS)
	async handleEventReminders(): Promise<void> {
		this.logger.log("Checking for upcoming events...");
		await Promise.all(
			this.remindersConfig.map(async (reminderConfig) => {
				const remindersToDo = await this.getReminders(reminderConfig);
				const remindersDone = await this.makeReminders(remindersToDo, reminderConfig);
				await this.setRemindersDone(remindersDone, reminderConfig);
				this.logger.log(`${remindersDone.length} reminders sent successfully`);
			}),
		);
	}

	private async makeReminders(
		remindersToDo: ReminderToDo[],
		reminderConfig: ReminderConfig,
	): Promise<string[]> {
		const remindersDone: string[] = [];
		await Promise.all(
			remindersToDo.map(async (reminderToDo) => {
				const email = reminderToDo.users.email;
				const subject = reminderConfig.emailSubject(reminderToDo.events, reminderToDo.users);
				const body = reminderConfig.emailBody(reminderToDo.events, reminderToDo.users);
				try {
					await this.emailService.sendEmail(email, subject, body);
					if (!reminderToDo.reminders) {
						const id = await this.createReminder(reminderToDo.events.id, reminderToDo.users.id);
						reminderToDo.reminders = { id };
					}
					remindersDone.push(reminderToDo.reminders.id);
				} catch {}
			}),
		);
		return remindersDone;
	}

	private async getReminders(reminderConfig: ReminderConfig): Promise<ReminderToDo[]> {
		const now = Date.now();
		const left = this.minutesToMiliseconds(reminderConfig.minutesBeforeEvent.start);
		const right = this.minutesToMiliseconds(reminderConfig.minutesBeforeEvent.end);
		const reminderDoneColumn = reminderConfig.tableColumn;
		const result = await this.db
			.select()
			.from(events)
			.where(
				and(
					// startDate - minutesBeforeEvent.start < now < startDate - minutesBeforeEvent.end
					eq(events.status, "active"),
					lt(events.startDate, new Date(now + left)),
					gt(events.startDate, new Date(now + right)),
				),
			)
			.innerJoin(
				subscriptions,
				and(eq(subscriptions.status, "registered"), eq(subscriptions.eventId, events.id)),
			)
			.innerJoin(users, and(eq(users.status, "active"), eq(users.id, subscriptions.userId)))
			.leftJoin(
				reminders,
				and(
					eq(reminders.eventId, events.id),
					eq(reminders.userId, users.id),
					or(
						eq(reminders[reminderDoneColumn], false),
						and(isNull(reminders.eventId), isNull(reminders.userId)),
					),
				),
			);
		return result;
	}

	private async createReminder(eventId: string, userId: string): Promise<string> {
		const result = await this.db
			.insert(reminders)
			.values({
				eventId,
				userId,
			})
			.returning({
				id: reminders.id,
			});
		// biome-ignore lint/style/noNonNullAssertion: <>
		return result[0]!.id;
	}

	private async setRemindersDone(ids: string[], reminderConfig: ReminderConfig): Promise<void> {
		if (ids.length === 0) return;
		const reminderDoneColumn = reminderConfig.tableColumn;
		await this.db
			.update(reminders)
			.set({
				[reminderDoneColumn]: true,
			})
			.where(inArray(reminders.id, ids));
	}

	private minutesToMiliseconds(minutes: number): number {
		return minutes * 60 * 1000;
	}
}

interface ReminderConfig {
	minutesBeforeEvent: {
		start: number;
		end: number;
	};
	emailSubject: (event: Event, user: User) => string;
	emailBody: (event: Event, user: User) => string;
	tableColumn: string;
}

interface ReminderToDo {
	events: Event;
	users: User;
	reminders: { id: string } | null;
}

function zoneDateToString(date: Date, zone: string) {
	return DateTime.fromISO(date.toISOString(), { zone: "UTC" })
		.setZone(zone)
		.toFormat("MMMM dd, yyyy 'at' hh:mm a");
}
