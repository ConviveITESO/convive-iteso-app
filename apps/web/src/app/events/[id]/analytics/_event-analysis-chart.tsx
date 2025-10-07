"use client";

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

export const description = "Attendees: Enrolled vs Confirmed";

const attendeesData = [
	{ status: "enrolled", count: 14, fill: "var(--color-enrolled)" },
	{ status: "confirmed", count: 5, fill: "var(--color-confirmed)" },
	{ status: "Aforo", count: 7, fill: "var(--color-aforo)" },
];

const chartConfig = {
	attendees: { label: "Attendees" },
	enrolled: { label: "Enrolled", color: "var(--chart-1)" },
	confirmed: { label: "Confirmed", color: "var(--chart-2)" },
	aforo: { label: "Aforo", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function EventAnalyticsChart() {
	const id = "pie-attendees";
	const [activeIndex, setActiveIndex] = React.useState(0);

	return (
		<Card data-chart={id} className="flex flex-col border-none">
			<ChartStyle id={id} config={chartConfig} />
			<CardHeader className="pb-0">
				<CardTitle>Attendees</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-1 justify-center pb-0">
				<ChartContainer id={id} config={chartConfig} className="mx-auto aspect-square w-full ">
					<PieChart>
						<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
						<Pie
							data={attendeesData}
							dataKey="count"
							nameKey="status"
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
													{attendeesData?.[activeIndex]?.count.toLocaleString()}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
													className="fill-muted-foreground"
												>
													{chartConfig[
														attendeesData[activeIndex]?.status as keyof typeof chartConfig
													]?.label ?? "Attendees"}
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
