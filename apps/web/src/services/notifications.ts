import type { NotificationItem } from "@/components/notifications/types";
const API = process.env.NEXT_PUBLIC_API_URL;

export async function fetchNotifications(): Promise<NotificationItem[]> {
	const res = await fetch(`${API}/notifications`, { cache: "no-store", credentials: "include" });
	if (!res.ok) throw new Error("Failed");
	const server = await res.json();
	// map server → client (createdAt → dateIso)
	return server.map((n: any) => ({
		id: n.id,
		kind: n.kind,
		title: n.title,
		body: n.body,
		eventId: n.eventId,
		userId: n.userId,
		dateIso: n.createdAt, // <- importante
		meta: n.meta ?? undefined,
	}));
}

export async function clearAllNotifications(): Promise<void> {
	const res = await fetch(`${API}/notifications`, { method: "DELETE", credentials: "include" });
	if (!res.ok) throw new Error("Failed to clear");
}

export type CreateNotificationInput = {
	kind: "canceled" | "rescheduled" | "reminder" | "location";
	title: string;
	body: string;
	eventId?: number;
	userId?: number;
	meta?: {
		originalDate?: string;
		newDate?: string;
		location?: string;
	};
};

export async function createNotification(
	input: CreateNotificationInput,
): Promise<NotificationItem> {
	const res = await fetch(`${API}/notifications/test`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!res.ok) throw new Error("Failed to create notification");

	const n = await res.json();
	return {
		id: n.id,
		kind: n.kind,
		title: n.title,
		body: n.body,
		eventId: n.eventId,
		userId: n.userId,
		dateIso: n.createdAt, // map a front
		meta: n.meta ?? undefined,
	} satisfies NotificationItem;
}
