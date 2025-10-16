import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { DatabaseModule } from "../database/database.module";
import { EmailModule } from "../email/email.module";
import { EventReminderService } from "./event-reminder.service";

@Module({
	providers: [EventReminderService],
	imports: [DatabaseModule, EmailModule, ScheduleModule.forRoot()],
})
export class EventReminderModule {}
