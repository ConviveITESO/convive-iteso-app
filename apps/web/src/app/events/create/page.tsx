/** biome-ignore-all lint/style/noNonNullAssertion: temp mocks */
"use client";

import type { CreateEventSchema } from "@repo/schemas";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBadges } from "@/hooks/use-badges";
import { useCategories } from "@/hooks/use-categories";
import { useLocations } from "@/hooks/use-locations";
import { getApiUrl } from "@/lib/api";
import EventForm from "../_event-form";

export default function EditEventPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const [savedData, setSavedData] = useState<CreateEventSchema | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const { data: locations = [], isLoading: locationsLoading } = useLocations(isAuthenticated);
	const { data: categories = [], isLoading: categoriesLoading } = useCategories(isAuthenticated);
	const { data: badges = [], isLoading: badgesLoading } = useBadges(isAuthenticated);

	const loading = locationsLoading || categoriesLoading || badgesLoading;

	if (!isAuthenticated || loading) return <div>Loading...</div>;

	const initialData: Partial<CreateEventSchema> = {
		startDate: new Date().toISOString(),
		endDate: new Date().toISOString(),
		locationId: locations[0]?.id,
		categoryIds: [],
		badgeIds: [],
	};

	const handleSave = async (data: CreateEventSchema) => {
		setErrorMessage(null);

		try {
			const response = await fetch(`${getApiUrl()}/events`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
				credentials: "include",
			});

			if (!response.ok) {
				setErrorMessage("Failed to create event");
				return;
			}

			const createdEvent = await response.json();
			setSavedData(createdEvent);

			router.push(`/manage-events`);
		} catch {
			setErrorMessage("Unexpected error while creating event");
		}
	};

	const handleCancel = () => {
		// TODO: redirect to events list page once it exists
	};

	return (
		<div className="p-4">
			<EventForm
				mode="create"
				eventId={undefined}
				initialData={initialData}
				categories={categories}
				badges={badges}
				locations={locations}
				onSave={handleSave}
				onCancel={handleCancel}
			/>

			{errorMessage && (
				<div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700">{errorMessage}</div>
			)}

			{savedData && (
				<div className="mt-6 p-4 bg-blue-50 border border-blue-200">
					<h2 className="font-semibold">Create Event</h2>
					<pre>{JSON.stringify(savedData, null, 2)}</pre>
				</div>
			)}
		</div>

		//TODO: Remove errorMessage and savedData display once redirect is possible
	);
}
