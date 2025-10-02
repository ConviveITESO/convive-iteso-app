"use client";

import { Image } from "lucide-react";
/* import { useEffect, useState } from "react"; */
import { useParams, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventAnalyticsChart } from "./_event-analysis-chart";
import EventAnalyticsEngagement from "./_event-analysis-engagement";
import EventAnalyticsAssistants from "./_event-analytics-assistants";

export default function EventAnalytics() {
	// ---- obtain page id ----
	const params = useParams();
	const searchParams = useSearchParams();
	const first = (v?: string | string[] | null) => (Array.isArray(v) ? v[0] : (v ?? null));

	const pageId = first(params.id) ?? searchParams.get("id") ?? null;

	// ---- eAPI state ----
	/* const [apiData, setApiData] = useState<any>(null); */

	/*   const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); */

	/* useEffect(() => {
		if (!pageId) return;
		const ac = new AbortController();

		(async () => {
			try {
				const res = await fetch(`/api/events/${encodeURIComponent(pageId)}`, {
					signal: ac.signal,
				});
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = await res.json();
				// setApiData(json)
			} catch (err) {
				if ((err as any).name !== "AbortError") {
					// setError(String(err))
				}
			}
		})();

		return () => ac.abort();
	}, [pageId]); // deps correctas */

	return (
		<>
			<div className="px-4 pt-4">
				{pageId && (
					<p className="text-xs text-gray-500">
						ID: <span className="font-mono">{pageId}</span>
					</p>
				)}
				{/* {loading && <p className="text-sm text-gray-600">Cargando datos…</p>}
				{error && <p className="text-sm text-red-600">Error: {error}</p>} */}
			</div>

			{/* image placeholder */}
			<div className="flex justify-center pt-6">
				<div
					className="flex items-center justify-center w-10/12 h-40 bg-white rounded-4xl shadow-lg"
					style={{ boxShadow: "0px 2px 8px 0px rgba(99, 99, 99, 0.2)" }}
				>
					<Image className="h-12 w-12 text-gray-400" />
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
						<TabsTrigger className="rounded-2xl" value="Engagement">
							Engagement
						</TabsTrigger>
					</TabsList>

					<TabsContent value="Assistants">
						<EventAnalyticsAssistants />
					</TabsContent>

					<TabsContent value="Chart">
						{/* <EventAnalyticsChart data={apiData} /> */}
						<EventAnalyticsChart />
					</TabsContent>

					<TabsContent value="Engagement">
						<EventAnalyticsEngagement />
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
