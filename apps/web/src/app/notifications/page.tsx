import NotificationsClient from "@/components/notifications/notifications-client";
import { validateAuth } from "@/lib/auth";

export default async function NotificationsPage() {
	await validateAuth();
	return <NotificationsClient />;
}
