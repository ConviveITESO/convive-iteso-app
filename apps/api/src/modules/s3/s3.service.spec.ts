/** biome-ignore-all lint/style/useNamingConvention: <Using AWS commands> */

import { Readable } from "node:stream";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { S3Service } from "./s3.service";

// 🧠 Mock AWS SDK (strongly typed)
const mockSend = jest.fn<Promise<unknown>, [unknown]>();

jest.mock("@aws-sdk/client-s3", () => {
	class MockS3Client {
		send = mockSend;
	}
	return {
		S3Client: MockS3Client,
		PutObjectCommand: jest.fn().mockImplementation((args: unknown) => args),
		GetObjectCommand: jest.fn().mockImplementation((args: unknown) => args),
		DeleteObjectCommand: jest.fn().mockImplementation((args: unknown) => args),
	};
});

describe("S3Service", () => {
	let service: S3Service;
	let mockConfigService: Pick<ConfigService, "get">;

	beforeEach(async () => {
		const mockGet = <T = string>(key: string): T | undefined => {
			const values: Record<string, string> = {
				"s3.region": "us-east-1",
				"s3.accessKeyId": "test-access-key",
				"s3.secretAccessKey": "test-secret",
				"s3.sessionToken": "",
				"s3.endpoint": "http://localhost:4566",
				"s3.bucketName": "test-bucket",
			};
			return values[key] as T;
		};

		mockConfigService = { get: mockGet };

		const module: TestingModule = await Test.createTestingModule({
			providers: [S3Service, { provide: ConfigService, useValue: mockConfigService }],
		}).compile();

		service = module.get<S3Service>(S3Service);
		mockSend.mockReset();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("uploadFile", () => {
		it("should send PutObjectCommand and return key", async () => {
			const key = "file.txt";
			const body = Buffer.from("hello");
			const contentType = "text/plain";
			mockSend.mockResolvedValueOnce({});

			const result = await service.uploadFile(key, body, contentType);

			expect(PutObjectCommand).toHaveBeenCalledWith({
				Bucket: "test-bucket",
				Key: key,
				Body: body,
				ContentType: contentType,
			});
			expect(mockSend).toHaveBeenCalledTimes(1);
			expect(result).toBe(key);
		});
	});

	describe("getFile", () => {
		it("should return readable stream", async () => {
			const key = "image.png";
			const stream = new Readable();
			mockSend.mockResolvedValueOnce({ Body: stream });

			const result = await service.getFile(key);

			expect(GetObjectCommand).toHaveBeenCalledWith({
				Bucket: "test-bucket",
				Key: key,
			});
			expect(result).toBe(stream);
		});
	});

	describe("deleteFile", () => {
		it("should send DeleteObjectCommand", async () => {
			const key = "to-delete.png";
			mockSend.mockResolvedValueOnce({});

			await service.deleteFile(key);

			expect(DeleteObjectCommand).toHaveBeenCalledWith({
				Bucket: "test-bucket",
				Key: key,
			});
			expect(mockSend).toHaveBeenCalledTimes(1);
		});
	});

	describe("getFileUrl", () => {
		it("should return LocalStack URL if endpoint exists", async () => {
			const url = await service.getFileUrl("myfile.png");
			expect(url).toBe("http://localhost:4566/test-bucket/myfile.png");
		});

		it("should return AWS S3 URL if no endpoint is configured", async () => {
			const mockGet = <T = string>(key: string): T | undefined => {
				const values: Record<string, string> = {
					"s3.region": "us-east-1",
					"s3.endpoint": "",
					"s3.bucketName": "prod-bucket",
				};
				return values[key] as T;
			};

			const module: TestingModule = await Test.createTestingModule({
				providers: [S3Service, { provide: ConfigService, useValue: { get: mockGet } }],
			}).compile();

			const prodService = module.get<S3Service>(S3Service);

			const url = await prodService.getFileUrl("test.png");
			expect(url).toBe("https://prod-bucket.s3.us-east-1.amazonaws.com/test.png");
		});
	});
});
