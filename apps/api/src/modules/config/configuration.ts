/** biome-ignore-all lint/style/noProcessEnv: reading environment variables */
export default () => ({
	nodeEnv: process.env.NODE_ENV || "development",
	port: Number.parseInt(process.env.PORT || "8080", 10),
	app: {
		backendUrl: process.env.BACKEND_URL,
		frontendUrl: process.env.FRONTEND_URL,
	},
	database: {
		url: process.env.DATABASE_URL,
	},
	auth: {
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		redirectUri: process.env.REDIRECT_URI,
	},
	admin: {
		adminToken: process.env.ADMIN_TOKEN,
	},
	queue: {
		redis: {
			host: process.env.REDIS_HOST || "127.0.0.1",
			port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
		},
	},
	s3: {
		region: process.env.AWS_REGION || "us-east-1",
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		sessionToken: process.env.AWS_SESSION_TOKEN,
		endpoint: process.env.AWS_ENDPOINT_URL,
		bucketName: process.env.S3_BUCKET_NAME,
	},
});
