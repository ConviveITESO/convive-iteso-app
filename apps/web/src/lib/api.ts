export const getApiUrl = () => {
	// biome-ignore lint/style/noProcessEnv: false positive
	return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
};

export const api = {
	async get<T>(path: string): Promise<{ data: T }> {
		const response = await fetch(`${getApiUrl()}${path}`, {
			headers: {
				"content-type": "application/json",
				...(typeof window !== "undefined" && {
					authorization: `Bearer ${localStorage.getItem("token")}`,
				}),
			},
		});

		if (!response.ok) {
			throw new Error("API request failed");
		}

		const data = await response.json();
		return { data };
	},
};
