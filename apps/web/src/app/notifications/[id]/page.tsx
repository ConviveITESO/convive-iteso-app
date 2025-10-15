import type { NotificationItem } from "@/components/notifications/types";
import { fetchNotification } from "@/services/notifications";

function fallbackNotification(id: string): NotificationItem {
	return {
		id,
		userId: 1,
		eventId: null,
		kind: "canceled",
		title: "Innovation in Technology Conference",
		body: "The event has been canceled due to unforeseen circumstances.",
		dateIso: "2025-09-22T14:30:00.000Z",
		meta: {
			originalDate: "2025-09-25 10:00",
			location: "Building W, Room 204",
		},
	};
}

async function getNotification(id: string): Promise<NotificationItem | null> {
	try {
		const notification = await fetchNotification(id);
		if (notification) return notification;
	} catch {
		// ignore network failures and fall back to mock data
	}
	return fallbackNotification(id);
}

export default async function NotificationDetail({ params }: { params: { id: string } }) {
	const item = await getNotification(params.id);
	if (!item) return <div className="p-6">Notification not found.</div>;

	return (
		<main className="mx-auto max-w-xl px-4 py-6">
			<div className="rounded-lg border border-red-300 bg-red-50 p-6">
				<h2 className="text-lg font-semibold text-red-700">Event Canceled!</h2>
				<p className="text-sm text-gray-500">{new Date(item.dateIso).toLocaleString()}</p>

				<h3 className="mt-2 font-medium">{item.title}</h3>
				<p className="mt-1 text-sm text-gray-600">{item.body}</p>

				{item.meta?.originalDate && (
					<p className="mt-2 text-sm underline">Original date: {item.meta.originalDate}</p>
				)}
				{item.meta?.location && <p className="text-sm underline">Location: {item.meta.location}</p>}

				<div className="mt-4 flex gap-3">
					<a
						href={`/events/${item.id}`}
						className="rounded bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
					>
						Go Event
					</a>
					<a
						href="/notifications"
						className="rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
					>
						Dismiss
					</a>
				</div>
			</div>
		</main>
	);
}
