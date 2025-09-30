/** biome-ignore-all lint/style/noNonNullAssertion: temp mocks */
"use client";

import type {
	BadgeResponseSchema,
	CategoryResponseSchema,
	CreateEventSchema,
	LocationResponseSchema,
} from "@repo/schemas";
import { useState } from "react";
import EventForm from "../../_event-form";

export default function EditEventPage() {
	// TODO: replace mocks with fetch once GETs exist
	const categories: CategoryResponseSchema[] = [
		{ id: "temp1", name: "art" },
		{ id: "temp2", name: "entertainment" },
		{ id: "temp3", name: "economy" },
	];

	const badges: BadgeResponseSchema[] = [
		{ id: "temp4", name: "Badge4", description: "This is the badge4" },
		{ id: "temp5", name: "Badge5", description: "This is the badge5" },
	];

	const locations: LocationResponseSchema[] = [
		{ id: "temp6", name: "Building M" },
		{ id: "temp7", name: "Library" },
	];

	const initialData: Partial<CreateEventSchema> = {
		name: "Seeded Event",
		description: "This event uses seeded mocks",
		startDate: new Date().toISOString(),
		endDate: new Date(Date.now() + 3600 * 1000).toISOString(),
		quota: 30,
		locationId: locations[0]!.id,
		categoryIds: [categories[0]!.id, categories[2]!.id],
		badgeIds: [badges[0]!.id],
	};

	const eventId = "temp8";
	const [savedData, setSavedData] = useState<CreateEventSchema | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSave = async (data: CreateEventSchema) => {
		setErrorMessage(null);

		try {
			const response = await fetch(`http://localhost:8080/events/${eventId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				setErrorMessage("Failed to update event");
				return;
			}

			const updatedEvent = await response.json();
			setSavedData(updatedEvent);

			// TODO: redirect to events list page once it exists
		} catch {
			setErrorMessage("Unexpected error while updating event");
		}
	};

	const handleCancel = () => {
		// TODO: redirect to events list page once it exists
	};

	return (
		<div className="p-4">
			<EventForm
				mode="edit"
				eventId={eventId}
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
					<h2 className="font-semibold">Updated Event</h2>
					<pre>{JSON.stringify(savedData, null, 2)}</pre>
				</div>
			)}
		</div>

		//TODO: Remove once redirect is possible
	);
}
