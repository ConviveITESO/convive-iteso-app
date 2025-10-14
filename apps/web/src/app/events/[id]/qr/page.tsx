"use client";

import type {
	EventResponseSchema,
	SubscriptionResponseSchema,
	UserResponseSchema,
} from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { EventPass } from "@/components/qr/event-pass";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

// biome-ignore lint/style/useNamingConvention: false positive
export default function QRPage() {
	const { isAuthenticated } = useAuth();
	const { id } = useParams();
	const router = useRouter();

	const eventId = Array.isArray(id) ? id[0] : id;

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["event-pass", eventId],
		queryFn: async () => {
			if (!eventId) {
				throw new Error("Event id is required");
			}

			const [eventResponse, subscriptionsResponse] = await Promise.all([
				fetch(`${getApiUrl()}/events/${eventId}`, {
					credentials: "include",
				}),
				fetch(`${getApiUrl()}/subscriptions?eventId=${eventId}`, {
					credentials: "include",
				}),
			]);

			const ensureAuthorized = (response: Response) => {
				if (response.status === 401 || response.status === 403) {
					router.push("/");
					throw new Error("Unauthorized");
				}
			};

			ensureAuthorized(eventResponse);
			ensureAuthorized(subscriptionsResponse);

			if (!eventResponse.ok) {
				throw new Error("Failed to fetch event");
			}

			if (!subscriptionsResponse.ok) {
				throw new Error("Failed to fetch subscriptions");
			}

			const [event, subscriptions] = await Promise.all([
				eventResponse.json() as Promise<EventResponseSchema>,
				subscriptionsResponse.json() as Promise<SubscriptionResponseSchema[]>,
			]);

			const subscription = subscriptions[0];
			if (!subscription) {
				throw new Error("No subscription found for this event");
			}

			const userResponse = await fetch(`${getApiUrl()}/user/${subscription.userId}`, {
				credentials: "include",
			});
			ensureAuthorized(userResponse);

			if (!userResponse.ok) {
				throw new Error("Failed to fetch user");
			}

			const userData = (await userResponse.json()) as UserResponseSchema;

			return {
				event,
				subscription,
				userName: userData.name,
			};
		},
		enabled: Boolean(eventId),
	});

	if (isLoading && !isAuthenticated) {
		return <div>Loading...</div>;
	}

	if (isError || !data) {
		const message =
			error instanceof Error ? error.message : "Failed to load event pass. Please try again later.";
		return <div className="text-red-600 text-center">{message}</div>;
	}

	return <EventPass {...data} />;
}
