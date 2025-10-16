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
export function useEvents(enabled = true) {
	return useQuery({
		queryKey: ["events"],
		queryFn: async () => {
			const res = await fetch(`${getApiUrl()}/events`, {
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
