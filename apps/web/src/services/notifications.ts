import type {
	NotificationItem,
	NotificationKind,
	NotificationMeta,
} from "@/components/notifications/types";
import { getApiUrl } from "@/lib/api";

const API_BASE_URL = getApiUrl();

type NotificationApiMeta = {
	originalDate?: string | null;
	newDate?: string | null;
	location?: string | null;
};

type NotificationApiResponse = {
	id: string;
	userId: number;
	eventId: number | null;
	kind: NotificationKind;
	title: string;
	body: string;
	createdAt: string;
	readAt: string | null;
	meta?: NotificationApiMeta | null;
};

function sanitizeMeta(meta?: NotificationApiMeta | null): NotificationMeta | undefined {
	if (!meta) return undefined;
	const { originalDate, newDate, location } = meta;
	if (!originalDate && !newDate && !location) return undefined;
	return {
		originalDate: originalDate ?? undefined,
		newDate: newDate ?? undefined,
		location: location ?? undefined,
	};
}

function mapNotification(api: NotificationApiResponse): NotificationItem {
	return {
		id: api.id,
		kind: api.kind,
		title: api.title,
		body: api.body,
		eventId: api.eventId ?? null,
		userId: api.userId,
		dateIso: api.createdAt,
		meta: sanitizeMeta(api.meta),
	};
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
	const res = await fetch(`${API_BASE_URL}/notifications`, {
		cache: "no-store",
		credentials: "include",
	});
	if (!res.ok) throw new Error("Failed to load notifications.");
	const server = (await res.json()) as NotificationApiResponse[];
	return server.map(mapNotification);
}

export async function clearAllNotifications(): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/notifications`, {
		method: "DELETE",
		credentials: "include",
	});
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
	const res = await fetch(`${API_BASE_URL}/notifications/test`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!res.ok) throw new Error("Failed to create notification");

	const n = (await res.json()) as NotificationApiResponse;
	return mapNotification(n);
}

export async function fetchNotification(id: string): Promise<NotificationItem | null> {
	const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
		cache: "no-store",
		credentials: "include",
	});
	if (!res.ok) return null;
	const server = (await res.json()) as NotificationApiResponse;
	return mapNotification(server);
}
