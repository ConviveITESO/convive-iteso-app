import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { UserModule } from "./modules/user/user.module";

@Module({
	imports: [
		DatabaseModule,
		ConfigModule.forRoot({ isGlobal: true }),
		HealthModule,
		UserModule,
		SubscriptionsModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
