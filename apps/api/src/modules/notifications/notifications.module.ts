import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ConfigSchema } from "../config/config.schema";
import { EmailModule } from "../email/email.module";
import { NOTIFICATIONS_QUEUE } from "./notifications.constants";
import { NotificationsController } from "./notifications.controller";
import { NotificationsQueueService } from "./notifications.service";

@Module({
	imports: [
		ConfigModule,
		EmailModule,
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService<ConfigSchema>) => ({
				connection: {
					host: configService.getOrThrow("REDIS_HOST"),
					port: configService.getOrThrow("REDIS_PORT"),
				},
			}),
		}),
		BullModule.registerQueue({
			name: NOTIFICATIONS_QUEUE,
		}),
	],
	providers: [NotificationsQueueService],
	controllers: [NotificationsController],
	exports: [NotificationsQueueService],
})
export class NotificationsModule {}
