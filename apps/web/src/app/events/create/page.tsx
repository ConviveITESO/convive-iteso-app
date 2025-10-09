/** biome-ignore-all lint/style/noNonNullAssertion: temp mocks */
"use client";

import type { BadgeResponseSchema, CreateEventSchema, LocationResponseSchema } from "@repo/schemas";
import { useState } from "react";
import EventForm from "../_event-form";

export default async function EditEventPage() {
	const categories = await fetch("http://localhost:8080/category").then((res) => res.json());

	// TODO: replace mocks with fetch once GETs exist
	const badges: BadgeResponseSchema[] = [
		{ id: "temp4", name: "Badge4", description: "This is the badge4" },
		{ id: "temp5", name: "Badge5", description: "This is the badge5" },
	];

	const locations: LocationResponseSchema[] = [
		{ id: "temp6", name: "Building M" },
		{ id: "temp7", name: "Library" },
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
