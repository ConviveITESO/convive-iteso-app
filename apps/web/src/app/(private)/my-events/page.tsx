"use client";

import type { SubscribedEventResponseSchema } from "@repo/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClockIcon, HistoryIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MyEventsGrid } from "@/components/my-events/my-events-grid";
import { MyEventsSkeleton } from "@/components/my-events/my-events-skeleton";
import { TabsUnderline } from "@/components/my-events/tabs-underline";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useHeaderTitle } from "@/hooks/use-header-title";
import { useSubscribedEvents } from "@/hooks/use-subscribed-events";
import { getApiUrl } from "@/lib/api";

export default function MyEventsPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("upcoming");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<SubscribedEventResponseSchema | null>(null);
	const queryClient = useQueryClient();

	const unsubscribeMutation = useMutation({
		mutationFn: async (subscriptionId: string) => {
			const res = await fetch(`${getApiUrl()}/subscriptions/${subscriptionId}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (!res.ok) {
				throw new Error("Failed to cancel subscription");
			}
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["subscriptions", "events"],
				}),
				queryClient.invalidateQueries({ queryKey: ["subscription-check"] }),
				queryClient.invalidateQueries({ queryKey: ["subscription-details"] }),
			]);
			setDialogOpen(false);
			setSelectedEvent(null);
		},
		onError: () => {
			alert("Failed to cancel the event. Please try again.");
		},
	});

	const { data: events = [], isLoading } = useSubscribedEvents(isAuthenticated);

	const handleDialogChange = useCallback((open: boolean) => {
		setDialogOpen(open);
		if (!open) {
			setSelectedEvent(null);
		}
	}, []);
	useHeaderTitle("My events");

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<MyEventsSkeleton />
			</div>
		);
	}

	const now = new Date();

	// Filter events based on tab
	const upcomingEvents = events.filter((event) => new Date(event.startDate) >= now);
	const pastEvents = events.filter((event) => new Date(event.startDate) < now);

	const handleEventClick = (eventId: string) => {
		router.push(`/events/${eventId}`);
	};

	const handleUnsubscribe = (event: SubscribedEventResponseSchema) => {
		setSelectedEvent(event);
		setDialogOpen(true);
	};

	const confirmUnsubscribe = () => {
		if (!selectedEvent) {
			return;
		}

		unsubscribeMutation.mutate(selectedEvent.subscriptionId);
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
			<div className="min-h-screen bg-background">
				{/* Tabs and Content */}
				<div className="mx-auto max-w-7xl px-4 py-6">
					<TabsUnderline
						tabs={[
							{
								id: "upcoming",
								label: "Upcoming",
								icon: <ClockIcon />,
								count: upcomingEvents.length,
							},
							{
								id: "past",
								label: "Past",
								icon: <HistoryIcon />,
								count: pastEvents.length,
							},
						]}
						active={activeTab}
						onChange={setActiveTab}
					/>

					<div className="mt-6">
						{activeTab === "upcoming" ? (
							<MyEventsGrid
								mode="upcoming"
								events={upcomingEvents}
								isLoading={isLoading}
								onEventClick={handleEventClick}
								onUnsubscribe={handleUnsubscribe}
							/>
						) : (
							<MyEventsGrid events={pastEvents} onEventClick={handleEventClick} mode={"past"} />
						)}
					</div>
				</div>

				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel subscription</DialogTitle>
						<DialogDescription>
							Are you sure you want to cancel your subscription to
							{selectedEvent ? ` "${selectedEvent.name}"` : " this event"}? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDialogOpen(false)}
							disabled={unsubscribeMutation.isPending}
						>
							No, keep event
						</Button>
						<Button
							variant="destructive"
							onClick={confirmUnsubscribe}
							disabled={unsubscribeMutation.isPending}
						>
							{unsubscribeMutation.isPending ? "Canceling..." : "Yes, cancel"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</div>
		</Dialog>
	);
}
