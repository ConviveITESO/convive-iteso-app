import { Calendar, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface EventDetailsProps {
	description: string;
	startDate: Date;
	endDate: Date;
}

export function EventDetails({ description, startDate, endDate }: EventDetailsProps) {
	const formatDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatTime = (start: Date, end: Date) => {
		const startTime = start.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
		const endTime = end.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
		return `${startTime} - ${endTime}`;
	};

	const formatDateTime = (date: Date) => {
		return date.toLocaleString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const isSameDay = (date1: Date, date2: Date) => {
		return (
			date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate()
		);
	};

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
								<p className="text-base text-foreground/70">{formatDate(startDate)}</p>
								<p className="text-base text-foreground/70">to {formatDate(endDate)}</p>
							</>
						) : (
							<p className="text-base text-foreground/70">{formatDate(startDate)}</p>
						)}
					</div>
				</div>

				<div className="flex items-start gap-3">
					<Clock className="size-5 text-foreground mt-0.5 shrink-0" />
					<div>
						<p className="text-base font-medium text-foreground">Time</p>
						{isMultiDay ? (
							<>
								<p className="text-base text-foreground/70">{formatDateTime(startDate)}</p>
								<p className="text-base text-foreground/70">to {formatDateTime(endDate)}</p>
							</>
						) : (
							<p className="text-base text-foreground/70">{formatTime(startDate, endDate)}</p>
						)}
					</div>
				</div>
			</div>

			<Separator className="my-6" />
		</>
	);
}
