import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { BadgeModule } from "./modules/badge/badge.module";
import { CategoryModule } from "./modules/category/category.module";
import { ConfigModule } from "./modules/config";
import { DatabaseModule } from "./modules/database/database.module";
import { EmailModule } from "./modules/email/email.module";
import { EventModule } from "./modules/event/event.module";
import { EventAnalyticsModule } from "./modules/event-analytics/event-analytics.module";
import { EventReminderModule } from "./modules/event-reminder/event-reminder.module";
import { GroupModule } from "./modules/group/group.module";
import { HealthModule } from "./modules/health/health.module";
import { LocationModule } from "./modules/location/location.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { S3Module } from "./modules/s3/s3.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { UserModule } from "./modules/user/user.module";

@Module({
	imports: [
		ConfigModule,
		DatabaseModule,
		HealthModule,
		UserModule,
		EventModule,
		CategoryModule,
		BadgeModule,
		GroupModule,
		LocationModule,
		SubscriptionsModule,
		AuthModule,
		EventReminderModule,
		NotificationsModule,
		EmailModule,
		EventAnalyticsModule,
		S3Module,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
