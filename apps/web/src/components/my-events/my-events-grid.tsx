"use client";

import type { SubscribedEventResponseArraySchema } from "@repo/schemas";
import { EventCard } from "@/components/events/event-card";
import { MyEventsSkeleton } from "./my-events-skeleton";
import { NoEventsFound } from "./no-events-found";

interface MyEventsGridProps {
	events: SubscribedEventResponseArraySchema;
	isLoading?: boolean;
	onEventClick: (eventId: string) => void;
	onUnsubscribe?: (event: SubscribedEventResponseArraySchema[number]) => void;
	mode: "upcoming" | "past";
}

export function MyEventsGrid({
	events,
	isLoading,
	onEventClick,
	onUnsubscribe,
	mode,
}: MyEventsGridProps) {
	if (isLoading) {
		return <MyEventsSkeleton />;
	}

	if (!events || events.length === 0) {
		return (
			<NoEventsFound message={mode === "upcoming" ? "No upcoming events" : "No past events"} />
		);
	}

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
			{events.map((event) => (
				<EventCard
					key={event.id}
					event={event}
					onClick={() => onEventClick(event.id)}
					mode="subscription"
					onUnsubscribe={
						mode === "upcoming" && onUnsubscribe ? () => onUnsubscribe(event) : undefined
					}
				/>
			))}
		</div>
	);
}
