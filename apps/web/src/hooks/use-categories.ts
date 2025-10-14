"use client";

import type { CategoryResponseArraySchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

/**
 * Custom hook for fetching categories
 * Uses React Query for caching and state management
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with categories data, loading state, and error state
 */
export function useCategories(enabled = true) {
	return useQuery({
		queryKey: ["categories"],
		queryFn: () =>
			fetch(`${getApiUrl()}/categories`, {
				method: "GET",
				credentials: "include",
			}).then((res) => res.json() as Promise<CategoryResponseArraySchema>),
		enabled,
	});
}
