import { validateAuth } from "@/lib/auth";

export default async function ManageEventsPage() {
	await validateAuth();
	return <h1>Manage Events</h1>;
}
