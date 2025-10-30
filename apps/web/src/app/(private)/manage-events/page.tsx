"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EventsGrid } from "@/components/events/events-grid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useCreatedEvents } from "@/hooks/use-created-events";
import { useChangeEventStatus } from "@/hooks/use-delete-event";
import { HeaderTitle } from "@/hooks/use-header-title";
import { CategoriesFilter } from "../feed/_categories-filter";

export default function ManageEventsPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const [status, setStatus] = useState<string | null>("active");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [eventToDelete, setEventToDelete] = useState<string | null>(null);
	const { mutate: changeEventStatus, isPending: isChangingStatus } = useChangeEventStatus();
	const [showCopiedMessage, setShowCopiedMessage] = useState(false);

	const { data: events = [], isLoading: eventsLoading } = useCreatedEvents(
		status || "active",
		isAuthenticated,
	);
	const loading = eventsLoading;

	if (!isAuthenticated || loading) {
		return <div>Loading...</div>;
	}

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

		changeEventStatus(eventToDelete, {
			onSuccess: () => {
				setDeleteDialogOpen(false);
				setEventToDelete(null);
			},
			onError: () => {
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

	const handleScanQr = (eventId: string) => {
		router.push(`/manage-events/${eventId}/qr`);
	};

	const handleChat = (groupId: string) => {
		router.push(`/groups/${groupId}`);
	};

	const handleViewStats = (eventId: string) => {
		router.push(`/events/${eventId}/analytics`);
	};

	return (
		<div className="min-h-screen bg-background">
			<HeaderTitle title="Manage events" />

			<div className="mx-auto max-w-7xl px-4 py-8">
				<div className="mb-6">
					<h2 className="text-muted-foreground mt-1">View and manage your created events</h2>
				</div>

				<CategoriesFilter
					title="Event status"
					categories={[
						{ id: "active", name: "active" },
						{ id: "deleted", name: "cancelled" },
					]}
					selectedCategory={status}
					onCategoryChange={setStatus}
					showAllOption={false}
				/>

				<EventsGrid
					events={events}
					onEventClick={handleEventClick}
					mode="admin"
					onEdit={handleEdit}
					onDelete={handleDelete}
					onShare={handleShare}
					onChat={handleChat}
					onScanQr={handleScanQr}
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
						<DialogTitle className="text-center">
							{status === "active" ? "Delete Event" : "Restore Event"}
						</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p className="text-center text-muted-foreground">
							{status === "active"
								? "Are you sure you want to delete this event?"
								: "Are you sure you want to restore this event?"}
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<Button
							type="button"
							variant="default"
							onClick={confirmDelete}
							className="w-full"
							disabled={isChangingStatus}
						>
							{status === "active"
								? isChangingStatus
									? "Deleting..."
									: "Delete"
								: isChangingStatus
									? "Restoring..."
									: "Restore"}
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
