"use client";

import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartStyle,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { getApiUrl } from "@/lib/api";

type SliceName = "registered" | "waitlisted" | "cancelled" | "attended" | "quota";
type ApiSlice = { name: SliceName; count: number };

const chartConfig = {
	registered: { label: "Registered", color: "var(--chart-1)" },
	waitlisted: { label: "Waitlisted", color: "var(--chart-2)" },
	cancelled: { label: "Cancelled", color: "var(--chart-3)" },
	attended: { label: "Attended", color: "var(--chart-4)" },
	quota: { label: "Quota", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function EventAnalyticsChart() {
	const id = "pie-attendees";
	const [activeIndex, setActiveIndex] = React.useState(0);
	const [data, setData] = React.useState<ApiSlice[]>([]);
	const [loading, setLoading] = React.useState(true);

	// obtener id (igual que en tus otros componentes)
	const params = useParams();
	const searchParams = useSearchParams();
	const first = (v?: string | string[] | null) => (Array.isArray(v) ? v[0] : (v ?? null));
	const pageId = first(params.id) ?? searchParams.get("id") ?? null;

	React.useEffect(() => {
		const run = async () => {
			if (!pageId) return;
			try {
				setLoading(true);
				const res = await fetch(`${getApiUrl()}/event-analytics/${pageId}/chart`, {
					credentials: "include",
				});
				if (!res.ok) {
					setData([]);
					return;
				}
				const json = (await res.json()) as ApiSlice[];

				// filtra slices con count 0 si no quieres mostrarlos
				const cleaned = json.filter((s) => s.count > 0);

				setData(cleaned);
				setActiveIndex(0);
			} finally {
				setLoading(false);
			}
		};
		run();
	}, [pageId]);

	if (loading) {
		return (
			<Card className="border-none">
				<CardContent>Loading…</CardContent>
			</Card>
		);
	}

	if (!data.length) {
		return (
			<Card className="border-none">
				<CardHeader className="pb-0">
					<CardTitle>Attendees</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">No data</CardContent>
			</Card>
		);
	}

	// añade color al dataset para Recharts
	const pieData = data.map((d) => ({ ...d, fill: chartConfig[d.name].color }));

	return (
		<Card data-chart={id} className="flex flex-col border-none">
			<ChartStyle id={id} config={chartConfig} />
			<CardHeader className="pb-0">
				<CardTitle>Attendees</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-1 justify-center pb-0">
				<ChartContainer id={id} config={chartConfig} className="mx-auto aspect-square w-full">
					<PieChart>
						<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
						<Pie
							data={pieData}
							dataKey="count"
							nameKey="name"
							innerRadius={60}
							strokeWidth={5}
							activeIndex={activeIndex}
							onMouseEnter={(_, index) => setActiveIndex(index)}
							activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
								<g>
									<Sector {...props} outerRadius={outerRadius + 10} />
									<Sector
										{...props}
										outerRadius={outerRadius + 25}
										innerRadius={outerRadius + 12}
									/>
								</g>
							)}
						>
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										const current = pieData[activeIndex];
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor="middle"
												dominantBaseline="middle"
											>
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className="fill-foreground text-3xl font-bold"
												>
													{current?.count.toLocaleString()}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
													className="fill-muted-foreground"
												>
													{chartConfig[current?.name as SliceName]?.label ?? "Attendees"}
												</tspan>
											</text>
										);
									}
									return null;
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
