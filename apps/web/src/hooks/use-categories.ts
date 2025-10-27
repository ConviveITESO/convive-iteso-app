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
		queryFn: async () => {
			const res = await fetch(`${getApiUrl()}/categories`, {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to fetch categories: ${res.status}`);
			}

			return res.json() as Promise<CategoryResponseArraySchema>;
		},
		enabled,
	});
}
