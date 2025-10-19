"use client";

import type { SubscribedEventResponseArraySchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

export function useSubscribedEvents(enabled = true) {
	return useQuery({
		queryKey: ["subscriptions", "events"],
		queryFn: async () => {
			const res = await fetch(`${getApiUrl()}/subscriptions/events`, {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to fetch subscribed events: ${res.status}`);
			}

			return res.json() as Promise<SubscribedEventResponseArraySchema>;
		},
		enabled,
	});
}
