import { Calendar, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDateLong, formatDateTimeShort, formatTimeRange, isSameDay } from "@/lib/date-utils";

interface EventDetailsProps {
	description: string;
	startDate: Date;
	endDate: Date;
}

export function EventDetails({ description, startDate, endDate }: EventDetailsProps) {
	const isMultiDay = !isSameDay(startDate, endDate);

	return (
		<>
			<h2 className="text-xl font-medium text-foreground mb-4">About this event</h2>
			<p className="text-base text-foreground/70 leading-relaxed mb-6">{description}</p>

			<Separator className="my-6" />

			<div className="space-y-4 mb-6">
				<div className="flex items-start gap-3">
					<Calendar className="size-5 text-foreground mt-0.5 shrink-0" />
					<div>
						<p className="text-base font-medium text-foreground">{isMultiDay ? "Dates" : "Date"}</p>
						{isMultiDay ? (
							<>
								<p className="text-base text-foreground/70">{formatDateLong(startDate)}</p>
								<p className="text-base text-foreground/70">to {formatDateLong(endDate)}</p>
							</>
						) : (
							<p className="text-base text-foreground/70">{formatDateLong(startDate)}</p>
						)}
					</div>
				</div>

				<div className="flex items-start gap-3">
					<Clock className="size-5 text-foreground mt-0.5 shrink-0" />
					<div>
						<p className="text-base font-medium text-foreground">Time</p>
						{isMultiDay ? (
							<>
								<p className="text-base text-foreground/70">{formatDateTimeShort(startDate)}</p>
								<p className="text-base text-foreground/70">to {formatDateTimeShort(endDate)}</p>
							</>
						) : (
							<p className="text-base text-foreground/70">{formatTimeRange(startDate, endDate)}</p>
						)}
					</div>
				</div>
			</div>

			<Separator className="my-6" />
		</>
	);
}
