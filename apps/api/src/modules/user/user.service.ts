import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	CreateUserSchema,
	UpdateUserSchema,
	UserIdParamSchema,
	UserQuerySchema,
	UserResponseSchema,
} from "@repo/schemas";
import { and, eq, like, SQL } from "drizzle-orm";
import { AppDatabase, DATABASE_CONNECTION } from "../database/connection";
import { User, users } from "../database/schemas";
import { S3Service } from "../s3/s3.service";

@Injectable()
export class UserService {
	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: AppDatabase,
		private readonly s3Service: S3Service,
	) {}

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
			where: eq(users.id, userId.id),
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
			.where(eq(users.id, userId.id))
			.returning();
		return result[0];
	}

	/**
	 * Updates a user's profile picture
	 * @param userId The UUID of the user
	 * @param file The uploaded image file
	 * @returns The updated user with new profile picture URL
	 */
	async updateProfilePicture(userId: UserIdParamSchema, file: Express.Multer.File) {
		if (!file) {
			throw new NotFoundException("No file provided");
		}

		// Validate file type
		if (!file.mimetype.startsWith("image/")) {
			throw new NotFoundException("File must be an image");
		}

		const user = await this.getUserById(userId);
		if (!user) {
			throw new NotFoundException("User not found");
		}

		// Delete old profile picture if it exists
		if (user.profile) {
			const oldKey = this.extractS3KeyFromUrl(user.profile);
			if (oldKey) {
				await this.s3Service.deleteFile(oldKey);
			}
		}

		// Upload new profile picture
		const s3Key = `profile/${Date.now()}-${userId.id}`;
		await this.s3Service.uploadFile(s3Key, file.buffer, file.mimetype);
		const imageUrl = await this.s3Service.getFileUrl(s3Key);

		// Update user in database
		const result = await this.db
			.update(users)
			.set({
				profile: imageUrl,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId.id))
			.returning();

		const updatedUser = result[0];
		if (!updatedUser) {
			throw new Error("Failed to update user");
		}

		return updatedUser;
	}

	/**
	 * Soft deletes a user by its id
	 * @param userId The UUID of the user
	 * @returns The deleted user or undefined
	 */
	async deleteUser(userId: UserIdParamSchema) {
		const user = await this.getUserById(userId);
		if (!user) return undefined;
		await this.db
			.update(users)
			.set({
				status: "deleted",
				deletedAt: new Date(),
			})
			.where(eq(users.id, userId.id));
		return user;
	}

	formatUser(user: User): UserResponseSchema {
		return {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			status: user.status,
			profile: user.profile,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
			deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
		};
	}

	/**
	 * Extracts the S3 key from a full S3 URL
	 * @param url The full S3 URL
	 * @returns The S3 key or null if extraction fails
	 */
	private extractS3KeyFromUrl(url: string): string | null {
		try {
			const localStackMatch = url.match(/\/[^/]+\/(.+)$/);
			if (localStackMatch?.[1]) {
				return localStackMatch[1];
			}

			const awsMatch = url.match(/\.com\/(.+)$/);
			if (awsMatch?.[1]) {
				return awsMatch[1];
			}

			return null;
		} catch {
			//Error extracting S3 key from URL
			return null;
		}
	}
}
