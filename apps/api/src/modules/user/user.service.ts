import { Inject, Injectable } from "@nestjs/common";
import {
	CreateUserSchema,
	UpdateUserSchema,
	UserIdParamSchema,
	UserQuerySchema,
} from "@repo/schemas";
import { and, eq, like, SQL } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "@/modules/database/connection";
import { users } from "../database/schemas";

@Injectable()
export class UserService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	/**
	 * Gets all users from the database with optional filtering
	 * @param query Query parameters for filtering
	 * @returns all users matching the criteria
	 */
	async getUsers(query?: UserQuerySchema) {
		if (!query || Object.keys(query).length === 0) {
			return await this.db.query.users.findMany();
		}

		const conditions: SQL[] = [];
		if (query.name) {
			conditions.push(like(users.name, `%${query.name}%`));
		}
		if (query.email) {
			conditions.push(like(users.email, `%${query.email}%`));
		}
		if (query.status) {
			conditions.push(like(users.status, `%${query.status}%`));
		}

		return await this.db.query.users.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
		});
	}

	/**
	 * Gets a single user by its id
	 * @param userId The UUID of the user
	 * @returns The user or undefined
	 */
	async getUserById(userId: UserIdParamSchema) {
		return await this.db.query.users.findFirst({
			where: eq(users.id, userId),
		});
	}

	/**
	 * Creates a new user
	 * @param data Data of the user
	 * @returns success
	 */
	async createUser(data: CreateUserSchema) {
		const result = await this.db
			.insert(users)
			.values({ ...data })
			.returning();
		return result[0];
	}

	/**
	 * Updates a single user
	 * @param userId The UUID of the user
	 * @param data The data for update
	 * @returns The updated user or undefined
	 */
	async updateUser(userId: UserIdParamSchema, data: UpdateUserSchema) {
		const result = await this.db
			.update(users)
			.set({ ...data })
			.where(eq(users.id, userId))
			.returning();
		return result[0];
	}

	/**
	 * Deletes a user by its id
	 * @param userId The UUID of the user
	 * @returns The deleted user or undefined
	 */
	async deleteUser(userId: UserIdParamSchema) {
		const user = await this.getUserById(userId);
		if (!user) return undefined;
		await this.db.delete(users).where(eq(users.id, userId));
		return user;
	}
}
