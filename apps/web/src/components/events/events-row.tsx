"use client";

import type {
	CreatorEventResponseArraySchema,
	EventResponseArraySchema,
	SubscribedEventResponseArraySchema,
} from "@repo/schemas";
import { CalendarX2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EventCard } from "./event-card";

type RowEvent =
	| EventResponseArraySchema[number]
	| SubscribedEventResponseArraySchema[number]
	| CreatorEventResponseArraySchema[number];

interface EventsRowProps {
	title: string;
	events: RowEvent[];
	onEventClick: (eventId: string) => void;
}

export function EventsRow({ title, events, onEventClick }: EventsRowProps) {
	const hasEvents = events && events.length > 0;

	return (
		<div className="mb-10">
			<h2 className="text-xl font-semibold mb-4">{title}</h2>

			{hasEvents ? (
				<ScrollArea>
					<div className="flex space-x-4 pb-3">
						{events.map((event) => (
							<div key={event.id} className="min-w-[260px]">
								<EventCard event={event} onClick={() => onEventClick(event.id)} />
							</div>
						))}
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			) : (
				<Card className="flex flex-col items-center justify-center h-[180px] border-dashed border bg-muted/30 text-center text-muted-foreground">
					<CalendarX2 className="h-8 w-8 mb-2 opacity-70" />
					<p className="text-sm font-medium">No events today</p>
					<p className="text-xs opacity-70">Check upcoming events below ↓</p>
				</Card>
			)}
		</div>
	);
}
