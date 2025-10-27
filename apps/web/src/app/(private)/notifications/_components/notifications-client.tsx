"use client";

import { useClearNotifications, useNotifications } from "@/hooks/use-notifications";
import CreateNotificationDialog from "./create-notification-dialog";
import NotificationHeader from "./notification-header";
import NotificationList from "./notification-list";

export default function NotificationsClient() {
	const { data: items, isLoading } = useNotifications();
	const { mutate: clearAll, isPending: clearing } = useClearNotifications();

	function handleClearAll() {
		if (!items?.length) return;
		clearAll();
	}

	return (
		<main className="pb-8">
			<NotificationHeader
				rightAction={
					<div className="flex gap-2">
						<CreateNotificationDialog />
						<button
							type="button"
							onClick={handleClearAll}
							disabled={clearing || !items?.length}
							className="text-xs text-gray-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
						>
							{clearing ? "Clearing..." : "Clear all"}
						</button>
					</div>
				}
			/>
			<div className="mx-auto max-w-2xl px-4">
				{isLoading ? (
					<div className="py-10 text-center text-sm text-gray-500">Loading notifications…</div>
				) : (
					<NotificationList data={items ?? []} />
				)}
			</div>
		</main>
	);
}
