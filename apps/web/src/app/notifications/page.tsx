import { validateAuth } from "@/lib/auth";
import { NotificationsTestClient } from "./_components/notifications-test-client";

export default async function NotificationsPage() {
	await validateAuth();
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold">Notifications Playground</h1>
			<NotificationsTestClient />
		</div>
	);
}
