import type { NotificationItem } from "@/components/notifications/types";

const API = process.env.NEXT_PUBLIC_API_URL;

const mock: NotificationItem[] = [
	{
		id: "1",
		kind: "rescheduled",
		title: "Urban Photography Workshop",
		body: "Moved to 6:00 PM.",
		dateIso: "2025-01-09T14:30:00.000Z",
	},
	{
		id: "2",
		kind: "canceled",
		title: "Innovation in Technology Conference",
		body: "Canceled due to unforeseen circumstances.",
		dateIso: "2025-01-09T14:30:00.000Z",
	},
	{
		id: "3",
		kind: "reminder",
		title: "Entrepreneurship Fair",
		body: "Tomorrow at Pedro Arrupe Auditorium.",
		dateIso: "2025-01-09T14:30:00.000Z",
	},
	{
		id: "4",
		kind: "location",
		title: "ITESO Jazz Concert",
		body: "Now at Central Garden.",
		dateIso: "2025-01-09T14:30:00.000Z",
	},
];

export async function fetchNotifications(): Promise<NotificationItem[]> {
	if (!API) return mock;
	try {
		const res = await fetch(`${API}/notifications`, { cache: "no-store" });
		if (!res.ok) throw new Error("Bad status");
		const data = (await res.json()) as NotificationItem[];
		return Array.isArray(data) ? data : mock;
	} catch {
		return mock;
	}
}

/**
 * Opcional: si tu backend soporta borrar/archivar todas
 * - método típico: DELETE /notifications  (o)  POST /notifications/clear
 */
export async function clearAllNotifications(): Promise<void> {
	if (!API) return;
	try {
		const res = await fetch(`${API}/notifications`, { method: "DELETE" });
		if (!res.ok) throw new Error("Failed");
	} catch {
		// Silencioso: ya haremos rollback en el cliente si lo necesitas.
	}
}
