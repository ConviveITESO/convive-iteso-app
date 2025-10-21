"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getApiUrl } from "@/lib/api";
import { EventDetails } from "./_event-details";
import { EventHeader } from "./_event-header";
import { EventImage } from "./_event-image";
import { EventPass } from "./_event-pass";
import { EventStats } from "./_event-stats";
import { SubscriptionStatus } from "./_subscription-status";
import { useEventData } from "./_use-event-data";

export default function EventPage() {
	const { isAuthenticated } = useAuth();
	const { id } = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();

	const eventId = Array.isArray(id) ? id[0] : id;
	const { event, stats, subscription, isLoading } = useEventData(eventId);

	if (!isAuthenticated) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	const handleRegister = async () => {
		try {
			if (!eventId) {
				throw new Error("Event id is required");
			}

			const response = await fetch(`${getApiUrl()}/subscriptions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					eventId,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to register for event");
			}

			// Invalidate stats and subscription check
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] }),
				queryClient.invalidateQueries({ queryKey: ["subscription-check", eventId] }),
				queryClient.invalidateQueries({ queryKey: ["subscriptions", "events"] }),
			]);

			// Optionally show success message or redirect
		} catch (_error) {
			alert("Failed to register for event. Please try again.");
		}
	};

	if (isLoading) {
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

	if (subscription) {
		const isWaitlisted = subscription.status === "waitlisted";
		const now = new Date();
		const tenMinutesBeforeStart = new Date(startDate.getTime() - 10 * 60 * 1000);
		const showQr = now >= tenMinutesBeforeStart && now <= endDate && !isWaitlisted;

		return (
			<div className="min-h-screen bg-background">
				<div className="max-w-md mx-auto shadow-lg overflow-hidden">
					<EventHeader eventName={event.name} />
					<EventImage imageUrl={event.imageUrl} name={event.name} />

					<div className="px-8 pb-8">
						<EventDetails description={event.description} startDate={startDate} endDate={endDate} />
						<SubscriptionStatus isWaitlisted={isWaitlisted} position={subscription.position} />
						{showQr && (
							<div className="w-full mt-4 p-4 text-center">
								<EventPass event={event} subscription={subscription} />
							</div>
						)}

						<Button
							variant="secondary"
							className="w-full mt-4 h-10"
							onClick={() => {
								router.push(`/groups/${event.group.id}`);
							}}
						>
							Go to event group
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const now = new Date();
	const eventHasStarted = now >= startDate;

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-md mx-auto shadow-lg overflow-hidden">
				<EventHeader eventName={event.name} />
				<EventImage imageUrl={event.imageUrl} name={event.name} />

				<div className="px-8 pb-8">
					<EventDetails description={event.description} startDate={startDate} endDate={endDate} />
					<EventStats registeredCount={registeredCount} quota={event.quota} spotsLeft={spotsLeft} />
					<Button
						className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
						onClick={handleRegister}
						disabled={eventHasStarted}
					>
						{eventHasStarted
							? "Event has started"
							: stats?.spotsLeft === 0
								? "Enter waitlist"
								: "Register for event"}
					</Button>
				</div>
			</div>
		</div>
	);
}
