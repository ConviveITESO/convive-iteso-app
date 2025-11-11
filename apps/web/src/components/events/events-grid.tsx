"use client";

import type {
	CreatorEventResponseArraySchema,
	EventResponseArraySchema,
	SubscribedEventResponseArraySchema,
} from "@repo/schemas";
import { EventCard } from "./event-card";
import { NoEventsFound } from "./no-events-found";

type GridEvent =
	| EventResponseArraySchema[number]
	| SubscribedEventResponseArraySchema[number]
	| CreatorEventResponseArraySchema[number];

type GridEventArray = GridEvent[];

/**
 * ✅ Type guard — checks if the event has a groupId (only creator events do)
 */
export function hasGroupWithId(event: GridEvent): event is CreatorEventResponseArraySchema[number] {
	return "groupId" in event;
}

interface EventsGridProps {
	events: GridEventArray;
	onEventClick: (eventId: string) => void;
	mode?: "admin" | "subscription";
	onEdit?: (eventId: string) => void;
	onDelete?: (eventId: string) => void;
	onShare?: (eventId: string) => void;
	onScanQr?: (eventId: string) => void;
	onChat?: (groupId: string) => void;
	onViewStats?: (eventId: string) => void;
	onUnsubscribe?: (event: SubscribedEventResponseArraySchema[number]) => void;
}

export function EventsGrid({
	events,
	onEventClick,
	mode,
	onEdit,
	onDelete,
	onShare,
	onScanQr,
	onChat,
	onViewStats,
	onUnsubscribe,
}: EventsGridProps) {
	const hasEvents = events.length > 0;

	if (!hasEvents) {
		return (
			<div className="col-span-full py-12 text-center">
				<NoEventsFound />
			</div>
		);
	}

	return (
		<section className="mb-10">
			<h2 className="text-xl font-semibold mb-4">Upcoming events</h2>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{events.map((event) => (
					<EventCard
						key={event.id}
						event={event}
						onClick={() => onEventClick(event.id)}
						mode={mode}
						onEdit={onEdit ? () => onEdit(event.id) : undefined}
						onDelete={onDelete ? () => onDelete(event.id) : undefined}
						onShare={onShare ? () => onShare(event.id) : undefined}
						onScanQr={onScanQr ? () => onScanQr(event.id) : undefined}
						onChat={onChat && hasGroupWithId(event) ? () => onChat(event.groupId) : undefined}
						onViewStats={onViewStats ? () => onViewStats(event.id) : undefined}
						onUnsubscribe={
							onUnsubscribe && "subscriptionId" in event
								? () => onUnsubscribe(event as SubscribedEventResponseArraySchema[number])
								: undefined
						}
					/>
				))}
			</div>
		</section>
	);
}
