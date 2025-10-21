"use client";

import type { GroupMessageArraySchema, GroupMessageSchema } from "@repo/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api";

/**
 * Custom hook for fetching group messages
 * Uses React Query for caching and state management
 * @param groupId - The group ID to fetch messages for
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with messages data, loading state, and error state
 */
export function useGroupMessages(groupId: string | undefined) {
	const router = useRouter();
	return useQuery({
		queryKey: ["group-messages", groupId],
		queryFn: async () => {
			if (!groupId) throw new Error("Group ID is required");

			const res = await fetch(`${getApiUrl()}/groups/${groupId}/messages`, {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					router.push("/");
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to fetch messages: ${res.status}`);
			}

			return res.json() as Promise<GroupMessageArraySchema>;
		},
	});
}

/**
 * Custom hook for sending a message to a group
 * Uses React Query mutation for optimistic updates
 * @param groupId - The group ID to send the message to
 * @returns Mutation object with mutate function and state
 */
export function useSendGroupMessage(groupId: string | undefined) {
	const router = useRouter();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (content: string) => {
			if (!groupId) throw new Error("Group ID is required");

			const res = await fetch(`${getApiUrl()}/groups/${groupId}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content }),
				credentials: "include",
			});

			if (!res.ok) {
				if (res.status === 401) {
					router.push("/");
					throw new Error("Unauthorized");
				}
				throw new Error(`Failed to send message: ${res.status}`);
			}

			return res.json() as Promise<GroupMessageSchema>;
		},
		onSuccess: (newMessage) => {
			// Update the cache with the new message
			queryClient.setQueryData<GroupMessageArraySchema>(["group-messages", groupId], (old) => {
				return old ? [...old, newMessage] : [newMessage];
			});
		},
	});
}
