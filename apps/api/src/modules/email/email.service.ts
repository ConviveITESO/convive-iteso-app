import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailtrapTransport } from "mailtrap";
import Nodemailer from "nodemailer";
import { ConfigSchema } from "../config";

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private readonly transporter: Nodemailer.Transporter;
	private readonly sender: NodemailerSender;

	constructor(private readonly configService: ConfigService<ConfigSchema>) {
		this.sender = {
			name: configService.getOrThrow("SMTP_NAME"),
			address: configService.getOrThrow("SMTP_ADDRESS"),
		};
		const isProd = configService.getOrThrow("NODE_ENV") === "production";
		if (isProd) {
			this.transporter = Nodemailer.createTransport(
				MailtrapTransport({
					token: configService.getOrThrow("MAILTRAP_API_KEY"),
				}),
			);
		} else {
			this.transporter = Nodemailer.createTransport({
				host: configService.getOrThrow("LOCAL_SMTP_HOST"),
				port: configService.getOrThrow("LOCAL_SMTP_PORT"),
				secure: false,
			});
		}
	}

	async sendEmail(to: string[], subject: string, html: string): Promise<void> {
		await this.transporter.sendMail({
			from: this.sender,
			to,
			subject,
			html,
		});
		this.logger.log(`Email sent to ${to}`);
	}
}

interface NodemailerSender {
	name: string;
	address: string;
}
