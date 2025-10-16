"use client";

import type { LocationResponseArraySchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

/**
 * Custom hook for fetching locations
 * Uses React Query for caching and state management
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with locations data, loading state, and error state
 */
export function useLocations(enabled = true) {
	return useQuery({
		queryKey: ["locations"],
		queryFn: async () => {
			const res = await fetch(`${getApiUrl()}/locations`, {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to fetch locations: ${res.status}`);
			}

			return res.json() as Promise<LocationResponseArraySchema>;
		},
		enabled,
	});
}
