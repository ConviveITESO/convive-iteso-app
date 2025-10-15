import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/modules/database/database.module";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";

@Module({
	imports: [DatabaseModule],
	providers: [NotificationService],
	controllers: [NotificationController],
})
export class NotificationModule {}
