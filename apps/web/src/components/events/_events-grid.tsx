import type { EventResponseArraySchema } from "@repo/schemas";
import { EventCard } from "./_event-card";

interface EventsGridProps {
	events: EventResponseArraySchema;
	onEventClick: (eventId: string) => void;
}

export function EventsGrid({ events, onEventClick }: EventsGridProps) {
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
				<EventCard key={event.id} event={event} onClick={() => onEventClick(event.id)} />
			))}
		</div>
	);
}
