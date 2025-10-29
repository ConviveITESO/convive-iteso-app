import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { DatabaseModule } from "../database/database.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AzureStrategy } from "./strategies/azure-oauth.strategy";

@Module({
	imports: [DatabaseModule, ConfigModule, PassportModule.register({ session: false })],
	providers: [AuthService, AzureStrategy],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
