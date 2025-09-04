import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schemas";

export const DATABASE_CONNECTION = "database_connection";

export type AppDatabase = NodePgDatabase<typeof schema>;
