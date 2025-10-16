export const getApiUrl = () => {
	// biome-ignore lint/style/noProcessEnv: false positive
	return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
};
