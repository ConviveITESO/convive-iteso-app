"use client";

import { useEffect, useState } from "react";
import NotificationHeader from "./notification-header";
import NotificationList from "./notification-list";
import type { NotificationItem } from "./types";
import { fetchNotifications, clearAllNotifications } from "../../services/Notifications";

export default function NotificationsClient() {
	const [items, setItems] = useState<NotificationItem[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [clearing, setClearing] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			const data = await fetchNotifications();
			if (mounted) {
				setItems(data);
				setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	async function handleClearAll() {
		if (!items?.length) return;
		setClearing(true);
		const prev = items;
		// Optimistic update
		setItems([]);
		try {
			await clearAllNotifications();
		} catch {
			// rollback si falla
			setItems(prev);
		} finally {
			setClearing(false);
		}
	}

	return (
		<main className="pb-8">
			<NotificationHeader
				rightAction={
					<button
						type="button"
						onClick={handleClearAll}
						disabled={clearing || !items?.length}
						className="text-xs text-gray-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
					>
						{clearing ? "Clearing..." : "Clear all"}
					</button>
				}
			/>
			<div className="mx-auto max-w-2xl px-4">
				{loading ? (
					<div className="py-10 text-center text-sm text-gray-500">Loading notifications…</div>
				) : (
					<NotificationList data={items ?? []} />
				)}
			</div>
		</main>
	);
}
