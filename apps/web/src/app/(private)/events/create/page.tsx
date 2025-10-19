/** biome-ignore-all lint/style/noNonNullAssertion: temp mocks */
"use client";

import type { CreateEventSchema } from "@repo/schemas";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useBadges } from "@/hooks/use-badges";
import { useCategories } from "@/hooks/use-categories";
import { useHeaderTitle } from "@/hooks/use-header-title";
import { useLocations } from "@/hooks/use-locations";
import { getApiUrl } from "@/lib/api";
import EventForm from "../_event-form";

export default function EditEventPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	useHeaderTitle("Create event", { showBackButton: true });

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

	const handleSave = async (data: CreateEventSchema, imageFile: File) => {
		try {
			const formData = new FormData();
			formData.append("image", imageFile);
			formData.append("data", JSON.stringify(data));

			const response = await fetch(`${getApiUrl()}/events`, {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			if (!response.ok) {
				alert("Failed to create event");
				return;
			}

			router.push(`/manage-events`);
		} catch {
			alert("Unexpected error while creating event");
		}
	};

	const handleCancel = () => {
		router.back();
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
		</div>
	);
}
