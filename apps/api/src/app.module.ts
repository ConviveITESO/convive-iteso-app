import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { BadgeModule } from "./modules/badge/badge.module";
import { CategoryModule } from "./modules/category/category.module";
import { DatabaseModule } from "./modules/database/database.module";
import { EventModule } from "./modules/event/event.module";
import { GroupModule } from "./modules/group/group.module";
import { HealthModule } from "./modules/health/health.module";
import { LocationModule } from "./modules/location/location.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { UserModule } from "./modules/user/user.module";

@Module({
	imports: [
		DatabaseModule,
		ConfigModule.forRoot({ isGlobal: true }),
		HealthModule,
		UserModule,
		EventModule,
		CategoryModule,
		BadgeModule,
		GroupModule,
		LocationModule,
		SubscriptionsModule,
		AuthModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
