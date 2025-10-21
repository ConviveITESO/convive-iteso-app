"use client";

import type { EventResponseSchema } from "@repo/schemas";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";
import { CheckInScanner } from "./_check-in-scanner";

interface ManageEventQrPageClientProps {
	eventId: string;
}

export function ManageEventQrPageClient({ eventId }: ManageEventQrPageClientProps) {
	const router = useRouter();
	const [event, setEvent] = useState<EventResponseSchema | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;
		async function loadEvent() {
			setIsLoading(true);
			setError(null);
			try {
				const response = await fetch(`${getApiUrl()}/events/${eventId}`, {
					method: "GET",
					credentials: "include",
					cache: "no-store",
				});

				if (response.status === 401) {
					router.replace("/");
					return;
				}

				if (response.status === 404) {
					router.replace("/404");
					return;
				}

				if (!response.ok) {
					throw new Error(`Request failed with status ${response.status}`);
				}

				const data = (await response.json()) as EventResponseSchema;
				if (isMounted) {
					setEvent(data);
				}
			} catch (_error) {
				if (isMounted) {
					setError("Unable to load event details. Please try again.");
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		void loadEvent();
		return () => {
			isMounted = false;
		};
	}, [eventId, router]);

	if (isLoading) {
		return <p className="p-4 text-sm text-muted-foreground">Loading event information…</p>;
	}

	if (error) {
		return (
			<div className="p-4">
				<p className="text-sm text-red-700">{error}</p>
				<button
					type="button"
					className="mt-3 rounded border border-input px-3 py-1 text-sm"
					onClick={() => router.refresh()}
				>
					Try again
				</button>
			</div>
		);
	}

	if (!event) {
		return null;
	}

	return <CheckInScanner eventId={eventId} eventName={event.name} />;
}
