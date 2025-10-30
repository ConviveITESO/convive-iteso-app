"use client";

import type { EventResponseArraySchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

/**
 * Custom hook for fetching events
 * Uses React Query for caching and state management
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with events data, loading state, and error state
 */
export function useEvents(
	name: string,
	categoryId: string | null,
	pastEvents: boolean,
	enabled = true,
) {
	const url = new URL(`${getApiUrl()}/events`);
	url.searchParams.append("name", name);
	if (categoryId) url.searchParams.append("categoryId", categoryId);
	url.searchParams.append("pastEvents", String(pastEvents));

	return useQuery({
		queryKey: ["events", name, categoryId, pastEvents],
		queryFn: async () => {
			const res = await fetch(url.toString(), {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to fetch events: ${res.status}`);
			}

			return res.json() as Promise<EventResponseArraySchema>;
		},
		enabled,
	});
}
