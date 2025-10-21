"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EventsGrid } from "@/components/events/events-grid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useDeleteEvent } from "@/hooks/use-delete-event";
import { useEvents } from "@/hooks/use-events";
import { HeaderTitle } from "@/hooks/use-header-title";
import { CategoriesFilter } from "../feed/_categories-filter";
import { SearchHeader } from "../feed/_search-header";

export default function ManageEventsPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [eventToDelete, setEventToDelete] = useState<string | null>(null);
	const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
	const [showCopiedMessage, setShowCopiedMessage] = useState(false);

	const { data: events = [], isLoading: eventsLoading } = useEvents(isAuthenticated);
	const { data: categories = [], isLoading: categoriesLoading } = useCategories(isAuthenticated);

	const loading = eventsLoading || categoriesLoading;

	if (!isAuthenticated || loading) {
		return <div>Loading...</div>;
	}

	const filteredEvents = events.filter((event) => {
		const matchesSearch =
			event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			event.description.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory =
			!selectedCategory || event.categories.some((cat) => cat.id === selectedCategory);
		return matchesSearch && matchesCategory;
	});

	const handleEventClick = (eventId: string) => {
		router.push(`/events/${eventId}`);
	};

	const handleEdit = (eventId: string) => {
		router.push(`/events/${eventId}/edit`);
	};

	const handleDelete = (eventId: string) => {
		setEventToDelete(eventId);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (!eventToDelete) return;

		deleteEvent(eventToDelete, {
			onSuccess: () => {
				setDeleteDialogOpen(false);
				setEventToDelete(null);
			},
			onError: (error) => {
				console.error("Failed to delete event:", error);
				setDeleteDialogOpen(false);
			},
		});
	};

	const handleShare = (eventId: string) => {
		const eventUrl = `${window.location.origin}/events/${eventId}`;
		navigator.clipboard.writeText(eventUrl);
		setShowCopiedMessage(true);
		setTimeout(() => setShowCopiedMessage(false), 2000);
	};

	const handleNotify = (eventId: string) => {
		router.push(`/manage-events/${eventId}/qr`);
	};

	const handleViewStats = (eventId: string) => {
		router.push(`/events/${eventId}/analytics`);
	};

	return (
		<div className="min-h-screen bg-background">
			<HeaderTitle title="Manage events" />
			<SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

			<div className="mx-auto max-w-7xl px-4 py-8">
				<div className="mb-6">
					<h2 className="text-muted-foreground mt-1">View and manage all events in the system</h2>
				</div>

				<CategoriesFilter
					categories={categories}
					selectedCategory={selectedCategory}
					onCategoryChange={setSelectedCategory}
				/>

				<EventsGrid
					events={filteredEvents}
					onEventClick={handleEventClick}
					mode="admin"
					onEdit={handleEdit}
					onDelete={handleDelete}
					onShare={handleShare}
					onScanQr={handleNotify}
					onViewStats={handleViewStats}
				/>

				<div className="mt-8 flex justify-center">
					<Button onClick={() => router.push("/events/create")} size="lg" className="gap-2">
						Create Event
					</Button>
				</div>

				{showCopiedMessage && (
					<div className="fixed bottom-4 right-4 bg-foreground text-background px-4 py-2 rounded-md shadow-lg">
						Link copied to clipboard
					</div>
				)}
			</div>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="w-[90vw] max-w-md mx-auto">
					<DialogHeader>
						<DialogTitle className="text-center">Delete Event</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p className="text-center text-muted-foreground">
							Are you sure you want to delete this event? This action cannot be undone.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<Button
							type="button"
							variant="destructive"
							onClick={confirmDelete}
							className="w-full"
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							className="w-full"
						>
							Cancel
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
