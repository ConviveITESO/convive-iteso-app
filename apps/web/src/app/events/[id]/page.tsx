"use client";

import type { EventResponseSchema, EventStatsResponseSchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, ImageIcon, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getApiUrl } from "@/lib/api";

export default function EventPage() {
	const { id } = useParams();
	const router = useRouter();

	const { data: event, isLoading } = useQuery({
		queryKey: ["event", id],
		queryFn: async () => {
			const response = await fetch(`${getApiUrl()}/events/${id}`, {
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to fetch event");
			return response.json() as Promise<EventResponseSchema>;
		},
	});

	const { data: stats, isLoading: isLoadingStats } = useQuery({
		queryKey: ["event-stats", id],
		queryFn: async () => {
			const response = await fetch(`${getApiUrl()}/subscriptions/${id}/stats`, {
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to fetch event stats");
			return response.json() as Promise<EventStatsResponseSchema>;
		},
		enabled: !!id,
	});

	const handleRegister = async () => {
		try {
			const response = await fetch(`${getApiUrl()}/subscriptions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					eventId: id,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to register for event");
			}

			// Optionally show success message or redirect
			alert("Successfully registered for event!");
		} catch (_error) {
			alert("Failed to register for event. Please try again.");
		}
	};

	if (isLoading || isLoadingStats) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-muted-foreground">Event not found</p>
			</div>
		);
	}

	const startDate = new Date(event.startDate);
	const endDate = new Date(event.endDate);
	const registeredCount = stats?.registeredCount ?? 0;
	const spotsLeft = stats?.spotsLeft ?? event.quota;

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

	const isSameDay = (date1: Date, date2: Date) => {
		return (
			date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate()
		);
	};

	const isMultiDay = !isSameDay(startDate, endDate);

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-md mx-auto shadow-lg overflow-hidden">
				{/* Header */}
				<div className="relative h-24 shadow-md -mb-5">
					<Button
						variant="ghost"
						size="icon"
						className="absolute left-6 top-6"
						onClick={() => router.back()}
					>
						<ArrowLeft className="size-6" />
					</Button>
					<h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-semibold text-center whitespace-nowrap">
						{event.name}
					</h1>
				</div>

				{/* Event Image Placeholder */}
				<div className="mx-4 mt-12 mb-6">
					<div className="bg-gray-200 rounded-4xl shadow-md h-52 flex items-center justify-center">
						<ImageIcon className="size-6 text-foreground" />
					</div>
				</div>

				{/* Content */}
				<div className="px-8 pb-8">
					{/* About Section */}
					<h2 className="text-xl font-medium text-foreground mb-4">About this event</h2>
					<p className="text-base text-foreground/70 leading-relaxed mb-6">{event.description}</p>

					<Separator className="my-6" />

					{/* Date and Time */}
					<div className="space-y-4 mb-6">
						<div className="flex items-start gap-3">
							<Calendar className="size-5 text-foreground mt-0.5 shrink-0" />
							<div>
								<p className="text-base font-medium text-foreground">
									{isMultiDay ? "Dates" : "Date"}
								</p>
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
										<p className="text-base text-foreground/70">
											Starts: {formatTime(startDate, startDate)}
										</p>
										<p className="text-base text-foreground/70">
											Ends: {formatTime(endDate, endDate)}
										</p>
									</>
								) : (
									<p className="text-base text-foreground/70">{formatTime(startDate, endDate)}</p>
								)}
							</div>
						</div>
					</div>

					<Separator className="my-6" />

					{/* Attendance */}
					<div className="flex items-start gap-3 mb-8">
						<Users className="size-5 text-foreground mt-0.5 shrink-0" />
						<div className="flex-1">
							<p className="text-base font-medium text-foreground mb-1">Attendance</p>
							<div className="flex items-center gap-2">
								<p className="text-base text-foreground/70">
									{registeredCount} / {event.quota} registered
								</p>
								<Badge
									variant="secondary"
									className="bg-secondary text-secondary-foreground text-xs"
								>
									{spotsLeft} spots left
								</Badge>
							</div>
						</div>
					</div>

					{/* Register Button */}
					<Button
						className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
						onClick={handleRegister}
					>
						Register for event
					</Button>
				</div>
			</div>
		</div>
	);
}
