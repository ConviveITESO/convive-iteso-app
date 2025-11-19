import { CalendarCheck, History } from "lucide-react";

interface EventCounterProps {
	count: number;
	type: "upcoming" | "past";
}

export function EventCounter({ count, type }: EventCounterProps) {
	const isUpcoming = type === "upcoming";

	return (
		<div className="flex items-center gap-2 mt-4 mb-2 text-muted-foreground">
			{isUpcoming ? (
				<CalendarCheck className="w-5 h-5 text-primary" />
			) : (
				<History className="w-5 h-5 text-primary" />
			)}

			<span className="text-sm">{isUpcoming ? "Upcoming events:" : "Past events:"}</span>

			<span className="text-primary font-semibold text-base">{count}</span>
		</div>
	);
}
