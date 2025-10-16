import type { EventResponseSchema } from "@repo/schemas";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import { validateAuth } from "@/lib/auth";
import { CheckInScanner } from "./_check-in-scanner";

interface PageProps {
	params: Promise<{ id: string }>;
}

async function fetchEvent(id: string): Promise<EventResponseSchema | null> {
	try {
		const response = await fetch(`${getApiUrl()}/events/${id}`, {
			method: "GET",
			credentials: "include",
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		return (await response.json()) as EventResponseSchema;
	} catch (_error) {
		return null;
	}
}

export default async function ManageEventQrPage({ params }: PageProps) {
	await validateAuth();
	const { id } = await params;

	const event = await fetchEvent(id);

	if (!event) {
		notFound();
	}

	return <CheckInScanner eventId={id} eventName={event.name} />;
}
