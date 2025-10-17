"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EventsGrid } from "@/components/events/_events-grid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useEvents } from "@/hooks/use-events";

export default function MyEventsPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("upcoming");

	const { data: events = [], isLoading } = useEvents(isAuthenticated);

	if (!isAuthenticated || isLoading) {
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

	const handleUnsubscribe = (eventId: string) => {
		// TODO: Implement unsubscribe logic with API call
		void eventId;
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="border-b bg-background">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="icon">
							<Menu className="size-5" />
						</Button>
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
							onEventClick={handleEventClick}
							mode="subscription"
							onUnsubscribe={handleUnsubscribe}
						/>
					</TabsContent>

					<TabsContent value="past">
						<EventsGrid
							events={pastEvents}
							onEventClick={handleEventClick}
							mode="subscription"
							onUnsubscribe={handleUnsubscribe}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
