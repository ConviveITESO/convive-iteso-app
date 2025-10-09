/** biome-ignore-all lint/style/noNonNullAssertion: temp mocks */
"use client";

import type {
	BadgeResponseSchema,
	CategoryResponseSchema,
	CreateEventSchema,
	LocationResponseSchema,
} from "@repo/schemas";
import { useCallback, useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";
import EventForm from "../_event-form";

export default function EditEventPage() {
	const [locations, setLocations] = useState<LocationResponseSchema[]>([]);
	const [categories, setCategories] = useState<CategoryResponseSchema[]>([]);
	const [badges, setBadges] = useState<BadgeResponseSchema[]>([]);
	const [loading, setLoading] = useState(true);
	const [savedData, setSavedData] = useState<CreateEventSchema | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		try {
			const [resLoc, resCat, resBad] = await Promise.all([
				fetch(`${getApiUrl()}/locations`, { credentials: "include" }),
				fetch(`${getApiUrl()}/categories`, { credentials: "include" }),
				fetch(`${getApiUrl()}/badges`, { credentials: "include" }),
			]);
			setLocations(await resLoc.json());
			setCategories(await resCat.json());
			setBadges(await resBad.json());
			setLoading(false);
		} catch (err) {
			console.error("Error loading data", err);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	if (loading) return <div>Loading...</div>;

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
