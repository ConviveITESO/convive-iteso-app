"use client";

import type { EventResponseSchema } from "@repo/schemas";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useHeaderTitle } from "@/hooks/use-header-title";
import { getApiUrl } from "@/lib/api";
import { EventAnalyticsChart } from "./_event-analysis-chart";
import EventAnalyticsAssistants from "./_event-analytics-assistants";

export default function EventAnalytics() {
	const { isAuthenticated } = useAuth();
	const [bannerImageUrl, setBannerImageUrl] = useState<string>();
	useHeaderTitle("Event analytics", { showBackButton: true });
	const params = useParams();
	const id = params.id;

	useEffect(() => {
		const run = async () => {
			const response = await fetch(`${getApiUrl()}/events/${id}`, { credentials: "include" });
			const { imageUrl } = (await response.json()) as EventResponseSchema;
			setBannerImageUrl(imageUrl);
		};
		run();
	}, [id]);

	if (!isAuthenticated) return <div>Loading...</div>;

	return (
		<>
			{/* image placeholder */}
			<div className="flex justify-center pt-6">
				<div
					className="relative flex items-center justify-center w-10/12 h-40 bg-white rounded-4xl shadow-lg overflow-hidden"
					style={{ boxShadow: "0px 2px 8px 0px rgba(99, 99, 99, 0.2)" }}
				>
					{bannerImageUrl ? (
						<Image src={bannerImageUrl} alt="Image banner" fill={true} className="object-cover" />
					) : (
						<ImageIcon />
					)}
				</div>
			</div>

			<div>
				<Tabs defaultValue="account" className="px-2 pt-6">
					<TabsList className="rounded-2xl">
						<TabsTrigger className="rounded-2xl" value="Assistants">
							Assistants
						</TabsTrigger>
						<TabsTrigger className="rounded-2xl" value="Chart">
							Chart
						</TabsTrigger>
						{/* <TabsTrigger className="rounded-2xl" value="Engagement">
							Engagement
						</TabsTrigger> */}
					</TabsList>

					<TabsContent value="Assistants">
						<EventAnalyticsAssistants />
					</TabsContent>

					<TabsContent value="Chart">
						{/* <EventAnalyticsChart data={apiData} /> */}
						<EventAnalyticsChart />
					</TabsContent>

					{/* <TabsContent value="Engagement">
						<EventAnalyticsEngagement />
					</TabsContent> */}
				</Tabs>
			</div>
		</>
	);
}
