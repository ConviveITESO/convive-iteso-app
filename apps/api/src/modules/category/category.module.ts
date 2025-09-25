import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { CategoryService } from "./category.service";

@Module({
	providers: [CategoryService],
	imports: [DatabaseModule],
	exports: [CategoryService],
})
export class CategoryModule {}
