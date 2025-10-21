import type { NotificationResponse } from "@repo/schemas";
import { NotificationCard } from "./notification-card";
import { NotificationEmpty } from "./notification-empty";

export default function NotificationList({ data }: { data: NotificationResponse[] }) {
	if (!data?.length) return <NotificationEmpty />;
	return (
		<div className="space-y-3">
			{data.map((n) => (
				<NotificationCard key={n.id} item={n} />
			))}
		</div>
	);
}
