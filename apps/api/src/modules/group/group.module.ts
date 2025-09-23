import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { UserModule } from "../user/user.module";
import { GroupService } from "./group.service";

@Module({
	providers: [GroupService],
	imports: [DatabaseModule, UserModule],
	exports: [GroupService],
})
export class GroupModule {}
