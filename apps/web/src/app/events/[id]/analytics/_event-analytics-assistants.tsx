"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { getApiUrl } from "@/lib/api";

export type AttendeeStatus = "enrolled" | "confirmed" | "owner";

const BADGE_STYLE: Record<string, string> = {
	registered: "bg-blue-100 text-blue-700 border border-blue-200",
	waitlisted: "bg-amber-100 text-amber-700 border border-amber-200",
	cancelled: "bg-red-100 text-red-700 border border-red-200",
	attended: "bg-green-100 text-green-700 border border-green-200",
};

// label bonito (opcional)
const BADGE_LABEL: Record<string, string> = {
	registered: "registered",
	waitlisted: "waitlisted",
	cancelled: "cancelled",
	attended: "attended",
};

interface Subscriber {
	eventQuota: number;
	subscriptionStatus: string;
	userId: string;
	userName: string;
}

export default function EventAnalyticsAssistants() {
	const { isAuthenticated } = useAuth();
	const [loading, setLoading] = useState(true);
	const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
	const [query, setQuery] = useState("");
	const [noData, setNoData] = useState(false);

	// ---- obtain page id ----
	const params = useParams();
	const searchParams = useSearchParams();
	const first = (v?: string | string[] | null) => (Array.isArray(v) ? v[0] : (v ?? null));

	const pageId = first(params.id) ?? searchParams.get("id") ?? null;

	const fetchUsers = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(`${getApiUrl()}/event-analytics/${pageId}/participants`, {
				credentials: "include",
			});

			const data = await response.json();

			if (data.redirectTo) {
				window.location.href = data.redirectTo;
			} else {
				if (data.length !== 0) {
					setSubscribers(data as Subscriber[]);
				} else {
					setNoData(true);
				}
			}
		} catch {
			// Handle error appropriately in production
		} finally {
			setLoading(false);
		}
	}, [pageId]);

	useEffect(() => {
		if (isAuthenticated) {
			fetchUsers();
		}
	}, [isAuthenticated, fetchUsers]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return subscribers;
		return subscribers.filter((s) => s.userName.toLowerCase().includes(q));
	}, [subscribers, query]);

	if (loading) return <div>Loading...</div>;
	if (noData)
		return (
			<span className="flex justify-center items-center rounded-full border px-2.5 py-0.5 text-md font-medium text-gray-600 bg-gray-100">
				no subscribers yet
			</span>
		);

	return (
		<>
			<div className="flex mb-3">
				<p className="p-2 shadow-2xl bg-gray-100 rounded-4xl">
					Event Quota: {subscribers[0]?.eventQuota}
				</p>
			</div>
			<div className="flex justify-center">
				<Input
					type="search"
					placeholder="Search..."
					className="rounded-2xl"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</div>
			<ScrollArea className={`w-full h-80 p-2`}>
				<ul className="space-y-1">
					{filtered.map((subscriber) => {
						const status = subscriber.subscriptionStatus;
						const badgeClass = BADGE_STYLE[status] ?? "bg-gray-100 text-gray-700 border";
						const label = BADGE_LABEL[status] ?? subscriber.subscriptionStatus;

						const initials = subscriber.userName?.trim()?.slice(0, 1)?.toUpperCase() ?? "?";

						return (
							<li
								key={subscriber.userId}
								className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/40"
							>
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarImage src="" alt="alt" />
										<AvatarFallback> {initials} </AvatarFallback>
									</Avatar>
									<div className="leading-tight">
										<div className="font-medium"> {subscriber.userName} </div>
										{/* <div className="text-sm text-muted-foreground">Ing. en desarrollo de software</div> */}
									</div>
								</div>
								<Badge
									variant="secondary"
									className={`px-2 py-0.5 text-xs font-medium ${badgeClass} rounded-2xl`}
								>
									{label}
								</Badge>
							</li>
						);
					})}
				</ul>
			</ScrollArea>
		</>
	);
}
