/** biome-ignore-all lint/style/noNonNullAssertion: temp mocks */
"use client";

import type { CreateEventSchema, EventResponseSchema } from "@repo/schemas";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBadges } from "@/hooks/use-badges";
import { useCategories } from "@/hooks/use-categories";
import { useHeaderTitle } from "@/hooks/use-header-title";
import { useLocations } from "@/hooks/use-locations";
import { getApiUrl } from "@/lib/api";
import EventForm from "../../_event-form";

export default function EditEventPage() {
	const params = useParams();
	const router = useRouter();
	const { isAuthenticated } = useAuth();
	const eventId = params.id as string;

	useHeaderTitle("Edit event", { showBackButton: true });

	const [initialData, setInitialData] = useState<CreateEventSchema & EventResponseSchema>(
		{} as CreateEventSchema & EventResponseSchema,
	);
	const [eventLoading, setEventLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const { data: locations = [], isLoading: locationsLoading } = useLocations(isAuthenticated);
	const { data: categories = [], isLoading: categoriesLoading } = useCategories(isAuthenticated);
	const { data: badges = [], isLoading: badgesLoading } = useBadges(isAuthenticated);

	useEffect(() => {
		setEventLoading(true);
		setErrorMessage(null);
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
			} catch (_err) {
				setErrorMessage("We could not load the event. Please refresh and try again.");
				setEventLoading(false);
			}
		};

		loadEvent();
	}, [isAuthenticated, eventId]);

	const loading = locationsLoading || categoriesLoading || badgesLoading || eventLoading;

	if (!isAuthenticated || loading) return <div>Loading...</div>;

	const handleSave = async (data: CreateEventSchema) => {
		setErrorMessage(null);
		try {
			const response = await fetch(`${getApiUrl()}/events/${initialData.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
				credentials: "include",
			});

			if (!response.ok) {
				setErrorMessage("We couldn't update the event. Please try again.");
				return;
			}

			router.push("/manage-events");
		} catch (_err) {
			setErrorMessage("Unexpected error while updating event. Please try again.");
		}
	};

	const handleCancel = () => {
		router.back();
	};

	return (
		<div className="p-4">
			{errorMessage && (
				<p role="alert" className="mb-4 text-sm text-red-600">
					{errorMessage}
				</p>
			)}
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
