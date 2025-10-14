"use client";

import type { BadgeResponseArraySchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

/**
 * Custom hook for fetching badges
 * Uses React Query for caching and state management
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with badges data, loading state, and error state
 */
export function useBadges(enabled = true) {
	return useQuery({
		queryKey: ["badges"],
		queryFn: () =>
			fetch(`${getApiUrl()}/badges`, {
				method: "GET",
				credentials: "include",
			}).then((res) => res.json() as Promise<BadgeResponseArraySchema>),
		enabled,
	});
}
