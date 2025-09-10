/** biome-ignore-all lint/suspicious/noConsole: main file not logger  */
import process from "node:process";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors(); // TODO: Add correct CORS configuration
	await app.listen(process.env.PORT ?? 8080);
}
bootstrap()
	.then(() => console.log(`API is running on port ${process.env.PORT ?? 8080}`))
	.catch((e) => console.error(e));
