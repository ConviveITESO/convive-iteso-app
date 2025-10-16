import { validateAuth } from "@/lib/auth";

export default async function MyEventsPage() {
	await validateAuth();
	return <h1>My Events</h1>;
}
