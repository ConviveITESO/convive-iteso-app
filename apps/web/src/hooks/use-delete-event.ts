import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

/**
 * Custom hook for deleting an event
 * Uses React Query's mutation + cache invalidation
 */
export function useChangeEventStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (eventId: string) => {
			const res = await fetch(`${getApiUrl()}/events/${eventId}/change-status`, {
				method: "PUT",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				const body = await res.json();
				alert(body.message);
				throw new Error(`Failed to delete event: ${res.status}`);
			}
		},
		onSuccess: () => {
			// Refresh the events list
			queryClient.invalidateQueries({ queryKey: ["events"] });
		},
	});
}
