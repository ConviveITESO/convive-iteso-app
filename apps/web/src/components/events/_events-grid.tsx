import type { SubscribedEventResponseArraySchema } from "@repo/schemas";
import { EventCard } from "./_event-card";

interface EventsGridProps {
	events: SubscribedEventResponseArraySchema;
	onEventClick: (eventId: string) => void;
	mode?: "admin" | "subscription";
	onEdit?: (eventId: string) => void;
	onDelete?: (eventId: string) => void;
	onShare?: (eventId: string) => void;
	onNotify?: (eventId: string) => void;
	onViewStats?: (eventId: string) => void;
	onUnsubscribe?: (eventId: string) => void;
}

export function EventsGrid({
	events,
	onEventClick,
	mode,
	onEdit,
	onDelete,
	onShare,
	onNotify,
	onViewStats,
	onUnsubscribe,
}: EventsGridProps) {
	if (events.length === 0) {
		return (
			<div className="col-span-full py-12 text-center">
				<p className="text-muted-foreground">No events found</p>
			</div>
		);
	}

	return (
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
					onNotify={onNotify ? () => onNotify(event.id) : undefined}
					onViewStats={onViewStats ? () => onViewStats(event.id) : undefined}
					onUnsubscribe={onUnsubscribe ? () => onUnsubscribe(event.id) : undefined}
				/>
			))}
		</div>
	);
}
