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
		queryFn: () =>
			fetch(`${getApiUrl()}/events`, {
				method: "GET",
				credentials: "include",
			})
				.then((res) => res.json())
				.then((data) => data as EventResponseArraySchema),
		enabled,
	});
}
