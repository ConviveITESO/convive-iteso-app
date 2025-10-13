import { validateAuth } from "@/lib/auth";
import NotificationHeader from "../../components/notiications/NotificationHeader";
import NotificationList from "../../components/notiications/NotificationList";
import type { NotificationItem } from "../../components/notiications/types";

//remplazar por servicio
const MOCK: NotificationItem[] = [
	{
		id: "1",
		kind: "rescheduled",
		title: "Urban Photography Workshop",
		body: "The Urban Photography Workshop has been moved to 6:00 PM.",
		date: "2025-01-09T14:30:00.000Z",
	},
	{
		id: "2",
		kind: "canceled",
		title: "Innovation in Technology Conference",
		body: "The conference has been canceled due to unforeseen circumstances.",
		date: "2025-01-09T14:30:00.000Z",
	},
	{
		id: "3",
		kind: "reminder",
		title: "Entrepreneurship Fair",
		body: "Tomorrow you have your registered event at Pedro Arrupe Auditorium.",
		date: "2025-01-09T14:30:00.000Z",
	},
	{
		id: "4",
		kind: "location",
		title: "ITESO Jazz Concert",
		body: "Now at the Central Garden instead of Building W.",
		date: "2025-01-09T14:30:00.000Z",
	},
];

export default async function NotificationsPage() {
	// const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, { cache: "no-store" })
	// const data: NotificationItem[] = await res.json()
	const data = MOCK;
	await validateAuth();
	return (
		<main className="pb-8">
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
