import { NotificationCard } from "./notification-card";
import { NotificationEmpty } from "./notification-empty";
import type { NotificationItem } from "./types";

export default function NotificationList({ data }: { data: NotificationItem[] }) {
	if (!data?.length) return <NotificationEmpty />;
	return (
		<div className="space-y-3">
			{data.map((n) => (
				<NotificationCard key={n.id} item={n} />
			))}
		</div>
	);
}
