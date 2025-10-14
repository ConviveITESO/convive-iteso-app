/** biome-ignore-all lint/style/noNonNullAssertion: temp mocks */
"use client";

import type {
	BadgeResponseSchema,
	CategoryResponseSchema,
	CreateEventSchema,
	EventResponseSchema,
	LocationResponseSchema,
} from "@repo/schemas";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import EventForm from "../../_event-form";

export default function EditEventPage() {
	const router = useRouter();
	const { isAuthenticated } = useAuth();
	const [locations, setLocations] = useState<LocationResponseSchema[]>([]);
	const [categories, setCategories] = useState<CategoryResponseSchema[]>([]);
	const [badges, setBadges] = useState<BadgeResponseSchema[]>([]);
	const [initialData, setInitialData] = useState<CreateEventSchema & EventResponseSchema>(
		{} as CreateEventSchema & EventResponseSchema,
	);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		try {
			const url = window.location.href.split("/")!;
			const eventId = url[url.length - 2];
			const [resLoc, resCat, resBad, resEvent] = await Promise.all([
				fetch(`${getApiUrl()}/locations`, { credentials: "include" }),
				fetch(`${getApiUrl()}/categories`, { credentials: "include" }),
				fetch(`${getApiUrl()}/badges`, { credentials: "include" }),
				fetch(`${getApiUrl()}/events/${eventId}`, { credentials: "include" }),
			]);

			if (!resLoc.ok || !resCat.ok || !resBad.ok || !resEvent.ok) {
				return;
			}

			const event: EventResponseSchema = await resEvent.json();
			setLocations(await resLoc.json());
			setCategories(await resCat.json());
			setBadges(await resBad.json());
			setInitialData({
				...event,
				locationId: event.location.id,
				categoryIds: event.categories.map((category) => category.id),
				badgeIds: event.badges.map((badge) => badge.id),
			});
			setLoading(false);
		} catch (err) {
			console.error("Error loading data", err);
		}
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			loadData();
		}
	}, [isAuthenticated, loadData]);

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
