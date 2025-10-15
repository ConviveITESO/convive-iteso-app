/** biome-ignore-all lint/style/noNonNullAssertion: temp mocks */
"use client";

import type { CreateEventSchema, EventResponseSchema } from "@repo/schemas";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBadges } from "@/hooks/use-badges";
import { useCategories } from "@/hooks/use-categories";
import { useLocations } from "@/hooks/use-locations";
import { getApiUrl } from "@/lib/api";
import EventForm from "../../_event-form";

export default function EditEventPage() {
	const params = useParams();
	const router = useRouter();
	const { isAuthenticated } = useAuth();
	const eventId = params.id as string;
	const [initialData, setInitialData] = useState<CreateEventSchema & EventResponseSchema>(
		{} as CreateEventSchema & EventResponseSchema,
	);
	const [eventLoading, setEventLoading] = useState(true);

	const { data: locations = [], isLoading: locationsLoading } = useLocations(isAuthenticated);
	const { data: categories = [], isLoading: categoriesLoading } = useCategories(isAuthenticated);
	const { data: badges = [], isLoading: badgesLoading } = useBadges(isAuthenticated);

	useEffect(() => {
		if (!isAuthenticated) return;

		const loadEvent = async () => {
			try {
				const resEvent = await fetch(`${getApiUrl()}/events/${eventId}`, {
					credentials: "include",
				});

				if (!resEvent.ok) {
					return;
				}

				const event: EventResponseSchema = await resEvent.json();
				setInitialData({
					...event,
					locationId: event.location.id,
					categoryIds: event.categories.map((category) => category.id),
					badgeIds: event.badges.map((badge) => badge.id),
				});
				setEventLoading(false);
			} catch (err) {
				console.error("Error loading data", err);
			}
		};

		loadEvent();
	}, [isAuthenticated, eventId]);

	const loading = locationsLoading || categoriesLoading || badgesLoading || eventLoading;

	if (!isAuthenticated || loading) return <div>Loading...</div>;

	const handleSave = async (data: CreateEventSchema) => {
		try {
			const response = await fetch(`${getApiUrl()}/events/${initialData.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
				credentials: "include",
			});

			if (!response.ok) {
				console.error("Failed to update event");
				return;
			}

			router.push("/manage-events");
		} catch (err) {
			console.error("Unexpected error while updating event", err);
		}
	};

	const handleCancel = () => {
		router.push("/manage-events");
	};

	return (
		<div className="p-4">
			<EventForm
				mode="edit"
				eventId={initialData.id}
				initialData={initialData}
				categories={categories}
				badges={badges}
				locations={locations}
				onSave={handleSave}
				onCancel={handleCancel}
			/>
		</div>
	);
}
