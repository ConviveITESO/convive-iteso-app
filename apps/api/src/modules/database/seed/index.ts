/** biome-ignore-all lint/suspicious/noConsole: main file not logger  */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../../app.module";
import { InitialDataService } from "./initial-data.service";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const initialDataService = app.get(InitialDataService);
	await initialDataService.loadData();
	app.close();
}
bootstrap()
	.then(() => console.log("Script executed successfully"))
	.catch((e) => console.error(e));
