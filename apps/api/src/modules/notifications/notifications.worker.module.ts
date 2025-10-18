import { Module } from "@nestjs/common";
import { ConfigModule as AppConfigModule } from "../config";
import { EmailModule } from "../email/email.module";
import { NotificationsModule } from "./notifications.module";
import { NotificationsProcessor } from "./notifications.processor";

@Module({
	imports: [AppConfigModule, EmailModule, NotificationsModule],
	providers: [NotificationsProcessor],
})
export class NotificationsWorkerModule {}
