import type {
	EventResponseSchema,
	EventStatsResponseSchema,
	SubscriptionIdResponseSchema,
	SubscriptionResponseSchema,
} from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api";

export function useEventData(eventId: string | undefined) {
	const router = useRouter();

	const { data: event, isLoading: isLoadingEvent } = useQuery({
		queryKey: ["event", eventId],
		queryFn: async () => {
			if (!eventId) {
				throw new Error("Event id is required");
			}

			const response = await fetch(`${getApiUrl()}/events/${eventId}`, {
				credentials: "include",
			});
			if (response.status === 401 || response.status === 403) {
				router.push("/");
				throw new Error("Unauthorized");
			}
			if (!response.ok) throw new Error("Failed to fetch event");
			return response.json() as Promise<EventResponseSchema>;
		},
		enabled: Boolean(eventId),
	});

	const { data: stats, isLoading: isLoadingStats } = useQuery({
		queryKey: ["event-stats", eventId],
		queryFn: async () => {
			if (!eventId) {
				throw new Error("Event id is required");
			}

			const response = await fetch(`${getApiUrl()}/subscriptions/${eventId}/stats`, {
				credentials: "include",
			});
			if (response.status === 401 || response.status === 403) {
				router.push("/");
				throw new Error("Unauthorized");
			}
			if (!response.ok) throw new Error("Failed to fetch event stats");
			return response.json() as Promise<EventStatsResponseSchema>;
		},
		enabled: Boolean(eventId),
	});

	const { data: subscriptionId, isLoading: isLoadingSubscriptionCheck } = useQuery({
		queryKey: ["subscription-check", eventId],
		queryFn: async () => {
			if (!eventId) {
				throw new Error("Event id is required");
			}

			const response = await fetch(`${getApiUrl()}/subscriptions/${eventId}/alreadyRegistered`, {
				credentials: "include",
			});
			if (response.status === 401 || response.status === 403) {
				router.push("/");
				throw new Error("Unauthorized");
			}
			if (response.status === 404) {
				return null;
			}
			if (!response.ok) throw new Error("Failed to fetch subscription status");
			return response.json() as Promise<SubscriptionIdResponseSchema>;
		},
		enabled: Boolean(eventId),
	});

	const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
		queryKey: ["subscription-details", subscriptionId?.id],
		queryFn: async () => {
			if (!subscriptionId?.id) {
				throw new Error("Subscription id is required");
			}

			const response = await fetch(`${getApiUrl()}/subscriptions/${subscriptionId.id}`, {
				credentials: "include",
			});
			if (response.status === 401 || response.status === 403) {
				router.push("/");
				throw new Error("Unauthorized");
			}
			if (!response.ok) throw new Error("Failed to fetch subscription details");
			return response.json() as Promise<SubscriptionResponseSchema>;
		},
		enabled: Boolean(subscriptionId?.id),
	});

	const isLoading =
		isLoadingEvent || isLoadingStats || isLoadingSubscriptionCheck || isLoadingSubscription;

	return {
		event,
		stats,
		subscription,
		isLoading,
	};
}
