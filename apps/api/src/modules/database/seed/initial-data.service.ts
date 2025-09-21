import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppDatabase, DATABASE_CONNECTION } from "../connection";
import { categories, locations } from "../schemas";

@Injectable()
export class InitialDataService {
	private readonly logger = new Logger(InitialDataService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	async loadData() {
		await this.loadCategories();
		await this.loadLocations();
	}

	private async loadCategories() {
		const categoriesCount = await this.db.$count(categories);
		if (categoriesCount !== 0) {
			this.logger.debug("Categories already loaded");
			return;
		}
		await this.db
			.insert(categories)
			.values([
				{ name: "arte" },
				{ name: "cultura" },
				{ name: "deporte" },
				{ name: "entretenimiento" },
				{ name: "ciencia" },
				{ name: "tecnología" },
				{ name: "salud" },
				{ name: "negocios" },
				{ name: "medio ambiente" },
			]);
		this.logger.debug("Categories loaded successfully");
	}

	private async loadLocations() {
		const locationsCount = await this.db.$count(locations);
		if (locationsCount !== 0) {
			this.logger.debug("Locations already loaded");
			return;
		}
		await this.db
			.insert(locations)
			.values([
				{ name: "Edificio A" },
				{ name: "Edificio B" },
				{ name: "Edificio C" },
				{ name: "Edificio D" },
				{ name: "Edificio M" },
				{ name: "Edificio T" },
				{ name: "Biblioteca" },
				{ name: "Auditorio Arrupe" },
				{ name: "Auditorio D1" },
			]);
		this.logger.debug("Locations loaded successfully");
	}
}
