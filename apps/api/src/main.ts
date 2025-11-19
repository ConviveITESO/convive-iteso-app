/** biome-ignore-all lint/suspicious/noConsole: main file not logger  */
/** biome-ignore-all lint/style/noProcessEnv: main doesn't use the config module */
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Remove X-Powered-By header for security
	app.getHttpAdapter().getInstance().disable("x-powered-by");

	// Add Cookie parser
	app.use(cookieParser());

	// Configure CORS properly
	const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
	app.enableCors({
		origin:
			process.env.NODE_ENV === "production"
				? [frontendUrl] // Use FRONTEND_URL environment variable
				: ["http://localhost:3000", "http://localhost:3001"], // Development origins
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma"],
	});

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
