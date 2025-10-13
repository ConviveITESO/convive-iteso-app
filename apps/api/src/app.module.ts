import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { BadgeModule } from "./modules/badge/badge.module";
import { CategoryModule } from "./modules/category/category.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { ConfigModule } from "./modules/config";
import { DatabaseModule } from "./modules/database/database.module";
import { EventModule } from "./modules/event/event.module";
import { GroupModule } from "./modules/group/group.module";
import { HealthModule } from "./modules/health/health.module";
import { LocationModule } from "./modules/location/location.module";
import { RatingsModule } from "./modules/ratings/ratings.module";
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
		RatingsModule,
		CommentsModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
