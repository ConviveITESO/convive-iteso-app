export type NotificationKind = "canceled" | "rescheduled" | "reminder" | "location";

export type NotificationMeta = {
	originalDate?: string;
	newDate?: string;
	location?: string;
};

export type NotificationItem = {
	id: string;
	userId: string;
	eventId?: string;
	kind: NotificationKind;
	title: string;
	body: string;
	date: string; // mapeado desde createdAt del backend
	meta?: NotificationMeta;
};
