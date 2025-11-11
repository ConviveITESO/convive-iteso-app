import type {
	CreatorEventResponseArraySchema,
	EventResponseArraySchema,
	EventResponseSchema,
	SubscribedEventResponseArraySchema,
} from "@repo/schemas";
import {
	ArrowRight,
	Edit,
	Eye,
	MapPin,
	MessageSquare,
	QrCode,
	Share2,
	Trash2,
	UserMinus,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/date-utils";

type CardEvent =
	| EventResponseArraySchema[number]
	| SubscribedEventResponseArraySchema[number]
	| CreatorEventResponseArraySchema[number];

interface EventCardProps {
	event: CardEvent;
	onClick: () => void;
	mode?: "admin" | "subscription";
	onEdit?: () => void;
	onDelete?: () => void;
	onShare?: () => void;
	onScanQr?: () => void;
	onViewStats?: () => void;
	onChat?: () => void;
	onUnsubscribe?: () => void;
}

export function EventCard({
	event,
	onClick,
	mode,
	onEdit,
	onDelete,
	onShare,
	onScanQr,
	onViewStats,
	onChat,
	onUnsubscribe,
}: EventCardProps) {
	const handleActionClick = (e: React.MouseEvent, action?: () => void) => {
		e.stopPropagation();
		action?.();
	};

	const locationName = "location" in event && event.location ? event.location.name : "";
	const canUnsubscribe = mode === "subscription" && "subscriptionId" in event;

	return (
		<Card
			onClick={onClick}
			className="relative cursor-pointer overflow-hidden rounded-3xl shadow-md hover:shadow-lg transition group h-64"
		>
			{/* Imagen de fondo (ocupa todo el card) */}
			<div className="absolute inset-0">
				<Image
					src={event.imageUrl}
					alt={event.name}
					fill
					className="object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				{/* Overlay degradado */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
			</div>

			{/* Etiqueta superior izquierda */}
			<div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md text-white px-2.5 py-1.5 rounded-full shadow-sm">
				<div className="flex items-center justify-center bg-white rounded-full size-6">
					<MapPin className="h-3.5 w-3.5 text-black" />
				</div>
				<span className="text-sm font-medium leading-none truncate">
					{locationName || "Tokyo, Japan"}
				</span>
			</div>

			{/* Contenido inferior */}
			<div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
				<div className="flex flex-col">
					<h3 className="text-lg font-semibold leading-tight line-clamp-1">{event.name}</h3>
					<p className="text-sm opacity-85">{formatDate(event.startDate)}</p>
				</div>
				<div className="flex items-center justify-center bg-white/90 hover:bg-white rounded-full size-9 transition">
					<ArrowRight className="text-black size-5" />
				</div>
			</div>

			{/* Acciones del modo admin o subscripción */}
			{(mode === "admin" || canUnsubscribe) && (
				<div className="absolute top-3 right-3 flex items-center gap-2">
					{mode === "admin" && (event as EventResponseSchema).status === "active" && (
						<>
							{onViewStats && (
								<Button
									variant="ghost"
									size="icon"
									className="size-8 bg-background/70 backdrop-blur-sm rounded-full shadow-sm"
									onClick={(e) => handleActionClick(e, onViewStats)}
								>
									<Eye className="size-4" />
								</Button>
							)}
							{onScanQr && (
								<Button
									variant="ghost"
									size="icon"
									className="size-8 bg-background/70 backdrop-blur-sm rounded-full shadow-sm"
									onClick={(e) => handleActionClick(e, onScanQr)}
								>
									<QrCode className="size-4" />
								</Button>
							)}
							{onChat && (
								<Button
									variant="ghost"
									size="icon"
									className="size-8 bg-background/70 backdrop-blur-sm rounded-full shadow-sm"
									onClick={(e) => handleActionClick(e, onChat)}
								>
									<MessageSquare className="size-4" />
								</Button>
							)}
							<Button
								variant="ghost"
								size="icon"
								className="size-8 bg-background/70 backdrop-blur-sm rounded-full shadow-sm"
								onClick={(e) => handleActionClick(e, onEdit)}
							>
								<Edit className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 bg-background/70 backdrop-blur-sm rounded-full shadow-sm"
								onClick={(e) => handleActionClick(e, onShare)}
							>
								<Share2 className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 bg-background/70 backdrop-blur-sm rounded-full shadow-sm"
								onClick={(e) => handleActionClick(e, onDelete)}
							>
								<Trash2 className="size-4" />
							</Button>
						</>
					)}
					{canUnsubscribe && (
						<Button
							variant="ghost"
							size="icon"
							className="size-8 bg-background/70 backdrop-blur-sm rounded-full shadow-sm"
							onClick={(e) => handleActionClick(e, onUnsubscribe)}
						>
							<UserMinus className="size-4" />
						</Button>
					)}
				</div>
			)}
		</Card>
	);
}
