"use client";

import { useEffect, useState } from "react";
import { clearAllNotifications, fetchNotifications } from "../../services/notifications";
import CreateNotificationDialog from "./create-notification-dialog";
import NotificationHeader from "./notification-header";
import NotificationList from "./notification-list";
import type { NotificationItem } from "./types";

export default function NotificationsClient() {
	const [items, setItems] = useState<NotificationItem[] | null>(null);
	const [clearing, setClearing] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			const data = await fetchNotifications();
			if (mounted) setItems(data);
		})();
		return () => {
			mounted = false;
		};
	}, []);

	async function handleClearAll() {
		if (!items?.length) return;
		setClearing(true);
		const prev = items;
		setItems([]);
		try {
			await clearAllNotifications();
		} catch {
			setItems(prev); // rollback si falla
		} finally {
			setClearing(false);
		}
	}

	return (
		<main className="pb-8">
			<NotificationHeader
				rightAction={
					<div className="flex gap-2">
						<CreateNotificationDialog
							onCreated={(created) => setItems((prev) => [created, ...(prev ?? [])])}
						/>
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
				{items === null ? (
					<div className="py-10 text-center text-sm text-gray-500">Loading notifications…</div>
				) : (
					<NotificationList data={items} />
				)}
			</div>
		</main>
	);
}
