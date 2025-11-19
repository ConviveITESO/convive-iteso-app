"use client";

import { Calendar, Filter, MapPin, Tag } from "lucide-react";
import { useFilters } from "@/components/providers/filter-context";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/use-categories";
import { useLocations } from "@/hooks/use-locations";

export function NoEventsFound() {
	const { filters } = useFilters();
	const { data: categories = [] } = useCategories(true);
	const { data: locations = [] } = useLocations(true);

	// 🏷 Get names of selected categories
	const activeCategories = categories
		.filter((c) => filters.selectedCategories.includes(c.id))
		.map((c) => c.name);

	// 📍 Get current location name
	const selectedLocationName = locations.find((l) => l.id === filters.locationId)?.name || null;

	const hasAnyFilter =
		activeCategories.length > 0 ||
		!!selectedLocationName ||
		filters.dateRange.from ||
		filters.dateRange.to ||
		filters.searchQuery.trim().length > 0;

	if (!hasAnyFilter) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
				<Filter className="h-10 w-10 mb-3 opacity-70" />
				<p className="text-lg font-medium">No events found</p>
				<p className="text-sm">Try searching with different keywords or filters.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<Filter className="h-10 w-10 mb-3 text-muted-foreground" />
			<h2 className="text-xl font-semibold mb-2 text-foreground">No events found</h2>
			<p className="text-sm text-muted-foreground mb-6">No events match your current filters.</p>

			<div className="flex flex-col gap-3 items-center text-left">
				{/* 🔍 Event search query */}
				{filters.searchQuery && (
					<Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
						<Tag className="h-3.5 w-3.5" />
						<span>
							Event name contains: <b>{filters.searchQuery}</b>
						</span>
					</Badge>
				)}

				{/* 🏷 Categories */}
				{activeCategories.length > 0 && (
					<Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
						<Tag className="h-3.5 w-3.5" />
						<span>
							Categories: <b>{activeCategories.join(", ")}</b>
						</span>
					</Badge>
				)}

				{/* 📍 Location */}
				{selectedLocationName && (
					<Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
						<MapPin className="h-3.5 w-3.5" />
						<span>
							Location: <b>{selectedLocationName}</b>
						</span>
					</Badge>
				)}

				{/* 📅 Dates */}
				{(filters.dateRange.from || filters.dateRange.to) && (
					<Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
						<Calendar className="h-3.5 w-3.5" />
						<span>
							Dates:{" "}
							{filters.dateRange.from ? (
								filters.dateRange.to ? (
									<b>
										{filters.dateRange.from.toLocaleDateString("en-US", {
											day: "numeric",
											month: "short",
										})}{" "}
										-{" "}
										{filters.dateRange.to.toLocaleDateString("en-US", {
											day: "numeric",
											month: "short",
										})}
									</b>
								) : (
									<b>
										From{" "}
										{filters.dateRange.from.toLocaleDateString("en-US", {
											day: "numeric",
											month: "short",
										})}
									</b>
								)
							) : (
								<b>
									Until{" "}
									{filters.dateRange.to?.toLocaleDateString("en-US", {
										day: "numeric",
										month: "short",
									})}
								</b>
							)}
						</span>
					</Badge>
				)}
			</div>
		</div>
	);
}
