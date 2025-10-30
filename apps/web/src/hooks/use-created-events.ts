"use client";

import type { CreatorEventResponseArraySchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

export function useCreatedEvents(status: string, enabled = true) {
	return useQuery({
		queryKey: ["events", "created", status],
		queryFn: async () => {
			const res = await fetch(`${getApiUrl()}/events/created?status=${status}`, {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to fetch created events: ${res.status}`);
			}

			return res.json() as Promise<CreatorEventResponseArraySchema>;
		},
		enabled,
	});
}
