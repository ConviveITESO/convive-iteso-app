/** biome-ignore-all lint/suspicious/noConsole: main file not logger  */
import process from "node:process";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors(); // TODO: Add correct CORS configuration

	// Swagger setup
	const config = new DocumentBuilder()
		.setTitle("Convive ITESO API")
		.setDescription("Documentacion de la API de Convive ITESO")
		.setVersion("1.0")
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api-docs", app, document);

	await app.listen(process.env.PORT ?? 8080);
}
bootstrap()
	.then(() => console.log(`API is running on port ${process.env.PORT ?? 8080}`))
	.catch((e) => console.error(e));
