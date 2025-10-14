/** biome-ignore-all lint/style/useNamingConvention: <> */
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { MailtrapTransport } from "mailtrap";
import nodemailer from "nodemailer";
import { ConfigSchema } from "../config";
import { EmailService } from "./email.service";

jest.mock("nodemailer", () => ({
	createTransport: jest.fn(),
}));

jest.mock("mailtrap", () => ({
	MailtrapTransport: jest.fn((opts) => ({
		name: "MailtrapTransport",
		version: "mock",
		client: { token: opts.token },
	})),
}));

describe("EmailService", () => {
	let service: EmailService;
	const configService = {
		getOrThrow: jest.fn()
	};
	const sendMailMock = jest.fn().mockResolvedValue({ accepted: ["user@example.com"] });

	beforeEach(async () => {
		(nodemailer.createTransport as jest.Mock).mockReturnValue({
			sendMail: sendMailMock,
		});
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EmailService,
				{ provide: ConfigService, useValue: configService },
			],
		}).compile();
		service = module.get<EmailService>(EmailService);
		jest.clearAllMocks();
	});

	it("should create a MailHog transporter in development", async () => {
		configService.getOrThrow.mockImplementation((key: string) => {
			const values: Record<string, string | number> = {
				NODE_ENV: "development",
				SMTP_NAME: "Convive",
				SMTP_ADDRESS: "no-reply@convive.com",
				LOCAL_SMTP_HOST: "mailhog",
				LOCAL_SMTP_PORT: 1025,
				MAILTRAP_API_KEY: "fake-token",
			};
			return values[key];
		});
		service = new EmailService(configService as unknown as ConfigService<ConfigSchema>);
		await service.sendEmail(["user@example.com"], "Test Subject", "<p>Hi!</p>");
		expect(nodemailer.createTransport).toHaveBeenCalledWith({
			host: "mailhog",
			port: 1025,
			secure: false,
		});
		expect(sendMailMock).toHaveBeenCalledWith({
			from: {
				name: "Convive",
				address: "no-reply@convive.com",
			},
			to: ["user@example.com"],
			subject: "Test Subject",
			html: "<p>Hi!</p>",
		});
	});

	it("should create a Mailtrap transporter in production", async () => {
		configService.getOrThrow.mockImplementation((key: string) => {
			const values: Record<string, string> = {
				NODE_ENV: "production",
				SMTP_NAME: "Convive",
				SMTP_ADDRESS: "no-reply@convive.com",
				MAILTRAP_API_KEY: "prod-token",
			};
			return values[key];
		});
		service = new EmailService(configService as unknown as ConfigService<ConfigSchema>);
		await service.sendEmail(["user@example.com"], "Prod Test", "<p>Hello</p>");
		expect(MailtrapTransport).toHaveBeenCalledWith({
			token: "prod-token",
		});
		expect(nodemailer.createTransport).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "MailtrapTransport",
				client: { token: "prod-token" },
			}),
		);
	});

	it("should log when email is sent", async () => {
		const logSpy = jest.spyOn(Logger.prototype, "log");
		await service.sendEmail(["user@example.com"], "Log Test", "<p>Body</p>");
		expect(logSpy).toHaveBeenCalledWith("Email sent to user@example.com");
	});
});
