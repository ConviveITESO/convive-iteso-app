import { validateAuth } from "@/lib/auth";

export default async function NotificationsPage() {
	await validateAuth();
	return <h1>Notifications</h1>;
}
