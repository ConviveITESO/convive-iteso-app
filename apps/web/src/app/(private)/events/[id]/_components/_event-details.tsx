import type { UserResponseSchema } from "@repo/schemas";
import { Calendar, Clock, StarIcon, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDateLong, formatDateTimeShort, formatTimeRange, isSameDay } from "@/lib/date-utils";
import CommentsModal from "./_comments-modal";

interface EventDetailsProps {
	description: string;
	startDate: Date;
	endDate: Date;
	eventId: string;
	createdBy: UserResponseSchema;
	ratingAverage?: number;
}

export function EventDetails({
	description,
	startDate,
	endDate,
	ratingAverage,
	eventId,
	createdBy,
}: EventDetailsProps) {
	const isMultiDay = !isSameDay(startDate, endDate);

	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-medium text-foreground mb-4">About this event</h2>
					<p className="text-base text-foreground/70 leading-relaxed mb-6">{description}</p>
				</div>
				{ratingAverage !== undefined && ratingAverage >= 0 ? (
					<div className="flex items-center gap-6">
						<div>
							<StarIcon fill="#ffbf00" color="#ffbf00" />
							<strong>{ratingAverage.toFixed(1)}</strong>
						</div>

						<CommentsModal eventId={eventId} />
					</div>
				) : undefined}
			</div>

			<Separator className="my-6" />

			<div className="space-y-4 mb-6">
				<div className="flex items-start gap-3">
					<User className="size-5 text-foreground mt-0.5 shrink-0" />
					<div>
						<p className="text-base font-medium text-foreground">Organizer</p>
						<p className="text-base text-foreground/70">{`${createdBy.name} (${createdBy.email})`}</p>
					</div>
				</div>

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
