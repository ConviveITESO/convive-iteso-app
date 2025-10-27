"use client";

import type { NotificationResponse } from "@repo/schemas";
import { useNotification } from "@/hooks/use-notifications";

function NotificationDetailCard({ item }: { item: NotificationResponse }) {
	const kindColors = {
		canceled: "border-rose-300 bg-rose-50 text-rose-700",
		rescheduled: "border-amber-300 bg-amber-50 text-amber-700",
		reminder: "border-sky-300 bg-sky-50 text-sky-700",
		location: "border-emerald-300 bg-emerald-50 text-emerald-700",
	};

	const kindLabels = {
		canceled: "Event Canceled!",
		rescheduled: "Event Rescheduled!",
		reminder: "Reminder",
		location: "Location Updated!",
	};

	const colorClass = kindColors[item.kind];
	const label = kindLabels[item.kind];

	return (
		<div className={`rounded-lg border p-6 ${colorClass}`}>
			<h2 className="text-lg font-semibold">{label}</h2>
			<p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>

			<h3 className="mt-2 font-medium">{item.title}</h3>
			<p className="mt-1 text-sm text-gray-600">{item.body}</p>

			{item.meta?.originalDate && (
				<p className="mt-2 text-sm underline">
					Original date: {new Date(item.meta.originalDate).toLocaleString()}
				</p>
			)}
			{item.meta?.newDate && (
				<p className="text-sm underline">
					New date: {new Date(item.meta.newDate).toLocaleString()}
				</p>
			)}
			{item.meta?.location && <p className="text-sm underline">Location: {item.meta.location}</p>}

			<div className="mt-4 flex gap-3">
				<a
					href={`/events/${item.eventId}`}
					className="rounded bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
				>
					View Event
				</a>
				<a
					href="/notifications"
					className="rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
				>
					Back to Notifications
				</a>
			</div>
		</div>
	);
}

export default function NotificationDetailClient({ id }: { id: string }) {
	const { data: notification, isLoading, isError } = useNotification(id);

	if (isLoading) {
		return (
			<main className="mx-auto max-w-xl px-4 py-6">
				<div className="py-10 text-center text-sm text-gray-500">Loading notification…</div>
			</main>
		);
	}

	if (isError || !notification) {
		return (
			<main className="mx-auto max-w-xl px-4 py-6">
				<div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
					<h2 className="text-lg font-semibold text-gray-700">Notification not found</h2>
					<p className="mt-2 text-sm text-gray-600">
						The notification you're looking for doesn't exist or has been deleted.
					</p>
					<div className="mt-4">
						<a
							href="/notifications"
							className="rounded bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
						>
							Back to Notifications
						</a>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-xl px-4 py-6">
			<NotificationDetailCard item={notification} />
		</main>
	);
}
