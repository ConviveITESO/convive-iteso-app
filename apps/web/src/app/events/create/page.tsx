/** biome-ignore-all lint/style/noNonNullAssertion: temp mocks */
"use client";

import type {
	BadgeResponseSchema,
	CategoryResponseSchema,
	CreateEventSchema,
	LocationResponseSchema,
} from "@repo/schemas";
import { useState } from "react";
import EventForm from "../_event-form";

export default function EditEventPage() {
	// TODO: replace mocks with fetch once GETs exist
	const categories: CategoryResponseSchema[] = [
		{ id: "140c5571-9d06-47af-b05f-52c5b3ad3dc6", name: "art" },
		{ id: "158bf962-77f9-4dd4-874b-3b4d1c9c808d", name: "entertainment" },
		{ id: "33c119a0-d431-491a-8bdf-e93f2fdf775a", name: "economy" },
	];

	const badges: BadgeResponseSchema[] = [
		{
			id: "92c5592a-7160-49b9-86fa-95e13c8e2d4d",
			name: "Badge4",
			description: "This is the badge4",
		},
		{
			id: "7310eed1-c17c-4cbe-927c-7b6316649ceb",
			name: "Badge5",
			description: "This is the badge5",
		},
	];

	const locations: LocationResponseSchema[] = [
		{ id: "264869f2-a8a4-4ba0-965c-c529c8a3f567", name: "Building M" },
		{ id: "ab0baa65-53de-44d9-8428-8805e8f7c864", name: "Library" },
	];

	const initialData: Partial<CreateEventSchema> = {
		name: "Event name",
		description: "Event description",
		startDate: new Date().toISOString(),
		endDate: new Date().toISOString(),
		quota: 100,
		locationId: locations[0]!.id,
		categoryIds: [],
		badgeIds: [],
	};

	const [savedData, setSavedData] = useState<CreateEventSchema | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSave = async (data: CreateEventSchema) => {
		setErrorMessage(null);

		try {
			const response = await fetch(`http://localhost:8080/events`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				setErrorMessage("Failed to create event");
				return;
			}

			const createdEvent = await response.json();
			setSavedData(createdEvent);

			// TODO: redirect to events list page once it exists
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
