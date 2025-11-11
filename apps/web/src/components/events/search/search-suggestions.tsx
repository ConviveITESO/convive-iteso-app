"use client";

import { Check, MapPin } from "lucide-react";
import { useFilters } from "@/components/providers/filter-context";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SearchSuggestionsProps {
	locations: { id: string; name: string }[];
	onSelect: (locationId: string | null) => void; // 👈 allow null to deselect
}

export function SearchSuggestions({ locations, onSelect }: SearchSuggestionsProps) {
	const { filters } = useFilters();
	const selectedLocationId = filters.locationId;

	if (locations.length === 0) {
		return <p className="text-sm text-muted-foreground px-6">No locations available.</p>;
	}

	return (
		<div className="mt-4">
			<h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Available locations</h3>

			<Card className="max-h-[240px] overflow-y-auto p-2 rounded-2xl shadow-sm bg-background border border-border/60">
				<div className="flex flex-col gap-2">
					{locations.map((loc) => {
						const isSelected = selectedLocationId === loc.id;

						return (
							<button
								type="button"
								key={loc.id}
								onClick={() => onSelect(isSelected ? null : loc.id)} // 👈 toggle logic
								className={cn(
									"flex items-center gap-3 w-full rounded-xl px-3 py-2 text-left transition relative",
									isSelected
										? "bg-primary text-primary-foreground shadow-sm"
										: "hover:bg-accent text-foreground",
								)}
							>
								{/* Icon */}
								<div
									className={cn(
										"flex items-center justify-center w-10 h-10 rounded-xl",
										isSelected ? "bg-primary-foreground/20" : "bg-blue-50",
									)}
								>
									<MapPin
										className={cn(
											"h-5 w-5",
											isSelected ? "text-primary-foreground" : "text-blue-500",
										)}
									/>
								</div>

								{/* Name */}
								<span className="font-medium text-[15px] truncate">{loc.name}</span>

								{/* Checkmark if selected */}
								{isSelected && (
									<Check className="absolute right-3 h-4 w-4 text-primary-foreground opacity-90" />
								)}
							</button>
						);
					})}
				</div>
			</Card>
		</div>
	);
}
