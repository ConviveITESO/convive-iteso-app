import { Inject, Injectable } from "@nestjs/common";
import { CreateUserSchema, UpdateUserSchema } from "@repo/schemas";
import { eq } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "@/modules/database/connection";
import { users } from "../database/schemas";

@Injectable()
export class UserService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase) {}

	/**
	 * Gets all users from the database
	 * @returns all users
	 */
	async getUsers() {
		return await this.db.query.users.findMany();
	}

	/**
	 * Gets a single user by its id
	 * @param userId The id of the user
	 * @returns The user or undefined
	 */
	async getUserById(userId: string) {
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
	 * @param userId The id of the user
	 * @param data The data for update
	 * @returns The updated user or undefined
	 */
	async updateUser(userId: string, data: UpdateUserSchema) {
		const result = await this.db
			.update(users)
			.set({ ...data })
			.where(eq(users.id, userId))
			.returning();
		return result[0];
	}

	/**
	 * Deletes a user by its id
	 * @param userId The id of the user
	 * @returns The deleted user or undefined
	 */
	async deleteUser(userId: string) {
		const user = await this.getUserById(userId);
		if (!user) return undefined;
		await this.db.delete(users).where(eq(users.id, userId));
		return user;
	}
}
