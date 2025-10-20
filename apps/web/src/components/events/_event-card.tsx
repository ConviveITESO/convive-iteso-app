import type { EventResponseArraySchema } from "@repo/schemas";
import { Bell, Edit, Eye, Image, MapPin, Share2, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/date-utils";

interface EventCardProps {
	event: EventResponseArraySchema[number];
	onClick: () => void;
	mode?: "admin" | "subscription";
	onEdit?: () => void;
	onDelete?: () => void;
	onShare?: () => void;
	onNotify?: () => void;
	onViewStats?: () => void;
	onUnsubscribe?: () => void;
}

export function EventCard({
	event,
	onClick,
	mode,
	onEdit,
	onDelete,
	onShare,
	onNotify,
	onViewStats,
	onUnsubscribe,
}: EventCardProps) {
	const handleActionClick = (e: React.MouseEvent, action?: () => void) => {
		e.stopPropagation();
		action?.();
	};

	return (
		<Card
			className="cursor-pointer overflow-hidden p-2 transition-shadow hover:shadow-lg"
			onClick={onClick}
		>
			<div className="flex items-start gap-4">
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

				{/* Action buttons based on mode */}
				{mode === "admin" && (
					<div className="flex shrink-0 flex-col gap-1">
						<div className="flex gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={(e) => handleActionClick(e, onEdit)}
							>
								<Edit className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={(e) => handleActionClick(e, onDelete)}
							>
								<Trash2 className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={(e) => handleActionClick(e, onShare)}
							>
								<Share2 className="size-4" />
							</Button>
						</div>
						<div className="flex gap-1 justify-center">
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={(e) => handleActionClick(e, onNotify)}
							>
								<Bell className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={(e) => handleActionClick(e, onViewStats)}
							>
								<Eye className="size-4" />
							</Button>
						</div>
					</div>
				)}

				{mode === "subscription" && (
					<div className="flex shrink-0 items-center">
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={(e) => handleActionClick(e, onUnsubscribe)}
						>
							<UserMinus className="size-4" />
						</Button>
					</div>
				)}
			</div>
		</Card>
	);
}
