import type { EventResponseArraySchema } from "@repo/schemas";
import { Image, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/date-utils";

interface EventCardProps {
	event: EventResponseArraySchema[number];
	onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
	return (
		<Card
			className="cursor-pointer overflow-hidden p-2 transition-shadow hover:shadow-lg"
			onClick={onClick}
		>
			<div className="flex items-center gap-4">
				{/* Image placeholder */}
				<div className="flex size-[92px] shrink-0 items-center justify-center rounded-xl bg-muted shadow-sm">
					<Image className="size-6 text-muted-foreground" />
				</div>

				{/* Event details */}
				<div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
					{/* Date and time */}
					<p className="text-[13px] text-muted-foreground">{formatDate(event.startDate)}</p>

					{/* Event title */}
					<h3 className="line-clamp-2 text-[15px] font-medium leading-tight text-foreground">
						{event.name}
					</h3>

					{/* Location */}
					<div className="flex items-center gap-1.5">
						<MapPin className="size-3.5 text-muted-foreground" />
						<span className="text-[13px] text-muted-foreground">{event.location.name}</span>
					</div>
				</div>
			</div>
		</Card>
	);
}
