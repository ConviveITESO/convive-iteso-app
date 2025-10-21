import type { NotificationResponse } from "@repo/schemas";
import { HeaderTitle } from "@/hooks/use-header-title";
import { validateAuth } from "@/lib/auth";
import NotificationHeader from "./_components/notification-header";
import NotificationList from "./_components/notification-list";

//remplazar por servicio
const MOCK: NotificationResponse[] = [
	{
		id: "1",
		userId: "1",
		eventId: "1",
		kind: "rescheduled",
		title: "Urban Photography Workshop",
		body: "The Urban Photography Workshop has been moved to 6:00 PM.",
		createdAt: new Date("2025-01-09T14:30:00.000Z"),
	},
	{
		id: "2",
		userId: "1",
		eventId: "1",
		kind: "canceled",
		title: "Innovation in Technology Conference",
		body: "The conference has been canceled due to unforeseen circumstances.",
		createdAt: new Date("2025-01-09T14:30:00.000Z"),
	},
	{
		id: "3",
		userId: "1",
		eventId: "1",
		kind: "reminder",
		title: "Entrepreneurship Fair",
		body: "Tomorrow you have your registered event at Pedro Arrupe Auditorium.",
		createdAt: new Date("2025-01-09T14:30:00.000Z"),
	},
	{
		id: "4",
		userId: "1",
		eventId: "1",
		kind: "location",
		title: "ITESO Jazz Concert",
		body: "Now at the Central Garden instead of Building W.",
		createdAt: new Date("2025-01-09T14:30:00.000Z"),
	},
];

export default async function NotificationsPage() {
	// const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, { cache: "no-store" })
	// const data: NotificationItem[] = await res.json()
	const data = MOCK;
	await validateAuth();
	return (
		<main className="pb-8">
			<HeaderTitle title="Notifications" showBackButton={true} />
			<NotificationHeader
				rightAction={
					<button type="button" className="text-xs text-gray-500 hover:underline">
						Clear all
					</button>
				}
			/>
			<div className="mx-auto max-w-2xl px-4">
				<NotificationList data={data} />
			</div>
		</main>
	);
}
