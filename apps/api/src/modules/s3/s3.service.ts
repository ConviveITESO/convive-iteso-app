/** biome-ignore-all lint/style/useNamingConvention: <Using AWS commands> */
import { Readable } from "node:stream";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class S3Service {
	private readonly s3Client: S3Client;
	private readonly bucketName: string;
	private readonly logger = new Logger(S3Service.name);

	constructor(private readonly configService: ConfigService) {
		const region = this.configService.get<string>("s3.region");
		const accessKeyId = this.configService.get<string>("s3.accessKeyId");
		const secretAccessKey = this.configService.get<string>("s3.secretAccessKey");
		const sessionToken = this.configService.get<string>("s3.sessionToken");
		const endpoint = this.configService.get<string>("s3.endpoint");
		this.bucketName = this.configService.get<string>("s3.bucketName") || "";

		this.s3Client = new S3Client({
			region,
			credentials: {
				accessKeyId: accessKeyId || "",
				secretAccessKey: secretAccessKey || "",
				...(sessionToken && { sessionToken }),
			},
			...(endpoint && {
				endpoint,
				forcePathStyle: true, // For localstack compatibility
			}),
		});

		this.logger.log(
			`S3 Client initialized with endpoint: ${endpoint ? `Localstack endpoint ${endpoint}` : "AWS endpoint"} for bucket: ${this.bucketName}`,
		);
	}

	async uploadFile(key: string, body: Buffer | Readable | string, contentType?: string) {
		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: body,
			ContentType: contentType,
		});

		await this.s3Client.send(command);
		this.logger.log(`File uploaded to S3: ${key}`);

		return key;
	}

	async getFile(key: string): Promise<Readable> {
		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});

		const response = await this.s3Client.send(command);
		return response.Body as Readable;
	}

	async deleteFile(key: string): Promise<void> {
		const command = new DeleteObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});

		await this.s3Client.send(command);
		this.logger.log(`File deleted: ${key}`);
	}

	async getFileUrl(key: string): Promise<string> {
		const endpoint = this.configService.get<string>("s3.endpoint");
		const region = this.configService.get<string>("s3.region");

		if (endpoint) {
			// LocalStack URL
			return `${endpoint}/${this.bucketName}/${key}`;
		}

		// AWS S3 URL
		return `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
	}
}
