import { validateAuth } from "@/lib/auth";

export default async function FeedPage() {
	await validateAuth();

	return <h1>Feed</h1>;
}
