"use client";

import type { SubscribedEventResponseSchema } from "@repo/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { EventsGrid } from "@/components/events/events-grid";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
				queryClient.invalidateQueries({ queryKey: ["subscriptions", "events"] }),
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
				<p className="text-muted-foreground">Loading...</p>
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
				{/* Header */}
				<div className="border-b bg-background">
					<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
						<div className="flex items-center gap-3">
							<h1 className="text-xl font-semibold">Your events</h1>
						</div>
					</div>
				</div>

				{/* Tabs and Content */}
				<div className="mx-auto max-w-7xl px-4 py-6">
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
						<TabsList className="mb-6">
							<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
							<TabsTrigger value="past">Past</TabsTrigger>
						</TabsList>

						<TabsContent value="upcoming">
							<EventsGrid
								events={upcomingEvents}
								eventsLoading={isLoading}
								onEventClick={handleEventClick}
								mode="subscription"
								onUnsubscribe={handleUnsubscribe}
							/>
						</TabsContent>

						<TabsContent value="past">
							<EventsGrid
								events={pastEvents}
								eventsLoading={isLoading}
								onEventClick={handleEventClick}
							/>
						</TabsContent>
					</Tabs>
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
