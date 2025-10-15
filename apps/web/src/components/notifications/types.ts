export type NotificationKind = "canceled" | "rescheduled" | "reminder" | "location";

export type NotificationItem = {
	id: string;
	kind: NotificationKind;
	title: string;
	body: string;
	dateIso: string;
	meta?: {
		originalDate?: string;
		newDate?: string;
		location?: string;
	};
};
