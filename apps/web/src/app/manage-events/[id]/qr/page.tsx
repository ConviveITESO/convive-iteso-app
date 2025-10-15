import type { EventResponseSchema } from "@repo/schemas";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import { validateAuth } from "@/lib/auth";
import { CheckInScanner } from "./_check-in-scanner";

interface PageProps {
	params: Promise<{ id: string }>;
}

async function fetchEvent(id: string): Promise<EventResponseSchema | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get("idToken")?.value;

	try {
		const response = await fetch(`${getApiUrl()}/events/${id}`, {
			method: "GET",
			headers: token ? { cookie: `idToken=${token}` } : undefined,
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
