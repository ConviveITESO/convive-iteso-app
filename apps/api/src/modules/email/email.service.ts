import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { SentMessageInfo } from "nodemailer";
import { ConfigSchema } from "../config";

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private readonly transporter: nodemailer.Transporter;
	private readonly serverEmail: string;

	constructor(private readonly configService: ConfigService<ConfigSchema>) {
		this.serverEmail = configService.getOrThrow("EMAIL_ADDRESS");
		const isProd = configService.getOrThrow("NODE_ENV") === "production";
		if (isProd) {
			this.transporter = nodemailer.createTransport({
				host: configService.getOrThrow("EMAIL_HOST"),
				port: configService.getOrThrow("EMAIL_PORT"),
				auth: {
					user: configService.getOrThrow("EMAIL_USER"),
					pass: configService.getOrThrow("EMAIL_PASSWORD"),
				},
			});
		} else {
			this.transporter = nodemailer.createTransport({
				host: configService.getOrThrow("EMAIL_HOST"),
				port: configService.getOrThrow("EMAIL_PORT"),
				secure: false,
			});
		}
	}

	async sendEmail(to: string, subject: string, html: string): Promise<SentMessageInfo> {
		const result: SentMessageInfo = await this.transporter.sendMail({
			from: this.serverEmail,
			to,
			subject,
			html,
		});
		this.logger.log(`Email sent to ${to}`);
		return result;
	}
}
