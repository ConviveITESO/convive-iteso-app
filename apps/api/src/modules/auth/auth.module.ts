import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { S3Module } from "../s3/s3.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
	imports: [DatabaseModule, ConfigModule, S3Module, NotificationsModule],
	providers: [AuthService],
	controllers: [AuthController],
})
export class AuthModule {}
