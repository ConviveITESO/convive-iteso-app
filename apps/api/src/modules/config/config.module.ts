import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { validate } from "./config.validation";
import configuration from "./configuration";

@Module({
	imports: [
		NestConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			validate,
			envFilePath: [".env.local", ".env"],
			cache: true,
		}),
	],
})
export class ConfigModule {}
