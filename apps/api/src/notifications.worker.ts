import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NotificationsWorkerModule } from "./modules/notifications/notifications.worker.module";

async function bootstrap() {
	const logger = new Logger("NotificationsWorker");
	const app = await NestFactory.createApplicationContext(NotificationsWorkerModule);
	logger.log("Notifications worker is running");

	const handleShutdown = async (signal: string) => {
		logger.log(`Received ${signal}, shutting down notifications worker`);
		await app.close();
		process.exit(0);
	};

	process.on("SIGINT", () => void handleShutdown("SIGINT"));
	process.on("SIGTERM", () => void handleShutdown("SIGTERM"));
}

void bootstrap();
