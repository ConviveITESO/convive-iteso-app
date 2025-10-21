"use client";

import type { CreateNotificationTestSchema, NotificationResponse } from "@repo/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

/**
 * Custom hook for fetching notifications
 * Uses React Query for caching and state management
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with notifications data, loading state, and error state
 */
export function useNotifications(enabled = true) {
	return useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await fetch(`${getApiUrl()}/notifications`, {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to fetch notifications: ${res.status}`);
			}

			return res.json() as Promise<NotificationResponse[]>;
		},
		enabled,
	});
}

/**
 * Custom hook for fetching a single notification by ID
 * @param id - The notification ID
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with notification data, loading state, and error state
 */
export function useNotification(id: string | undefined, enabled = true) {
	return useQuery({
		queryKey: ["notifications", id],
		queryFn: async () => {
			if (!id) throw new Error("Notification ID is required");

			const res = await fetch(`${getApiUrl()}/notifications/${id}`, {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to fetch notification: ${res.status}`);
			}

			return res.json() as Promise<NotificationResponse>;
		},
		enabled: enabled && !!id,
	});
}

/**
 * Custom hook for clearing all notifications
 * Uses React Query mutation for optimistic updates
 * @returns Mutation object with mutate function and state
 */
export function useClearNotifications() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const res = await fetch(`${getApiUrl()}/notifications`, {
				method: "DELETE",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to clear notifications: ${res.status}`);
			}
		},
		onSuccess: () => {
			// Invalidate and refetch notifications
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}

/**
 * Custom hook for creating a test notification
 * Uses React Query mutation for optimistic updates
 * @returns Mutation object with mutate function and state
 */
export function useCreateNotification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateNotificationTestSchema) => {
			const res = await fetch(`${getApiUrl()}/notifications/test`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});

			if (!res.ok) {
				if (res.status === 401) {
					window.location.href = "/";
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to create notification: ${res.status}`);
			}

			return res.json() as Promise<NotificationResponse>;
		},
		onSuccess: (newNotification) => {
			// Add the new notification to the cache
			queryClient.setQueryData<NotificationResponse[]>(["notifications"], (old) => {
				return old ? [newNotification, ...old] : [newNotification];
			});
		},
	});
}
