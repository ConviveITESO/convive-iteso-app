"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useFilters } from "@/components/providers/filter-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocations } from "@/hooks/use-locations";
import { CategorySelector } from "./category-selector";
import { DateSelector } from "./date-selector";
import { SearchSuggestions } from "./search-suggestions";

export function SearchModal({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
}) {
	const { filters, updateFilter, clearFilters } = useFilters();
	const { data: locations = [], isLoading } = useLocations(open);

	// 🔍 Este estado local solo filtra los lugares, no toca el contexto
	const [locationSearch, setLocationSearch] = useState("");

	// Filtrar los lugares según el texto local
	const filteredLocations = useMemo(() => {
		if (!locationSearch) return locations;
		return locations.filter((loc) => loc.name.toLowerCase().includes(locationSearch.toLowerCase()));
	}, [locationSearch, locations]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl rounded-3xl p-0 overflow-hidden">
				<div className="flex flex-col max-h-[90vh] overflow-y-auto bg-muted/30">
					{/* 🧩 Header */}
					<DialogHeader className="p-6 pb-3 items-start text-left">
						<DialogTitle className="text-2xl font-semibold">Filtros</DialogTitle>
					</DialogHeader>

					{/* 🔍 Buscar lugares */}
					<div className="relative px-6">
						<Search className="absolute left-9 top-[50%] size-5 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Buscar lugares..."
							value={locationSearch}
							onChange={(e) => setLocationSearch(e.target.value)}
							className="h-12 rounded-xl pl-10 pr-4 border bg-background shadow-sm"
						/>
					</div>

					{/* 📍 Lista de lugares */}
					<div className="px-6 mt-4 pb-3">
						{isLoading ? (
							<p className="text-sm text-muted-foreground">Cargando lugares...</p>
						) : (
							<SearchSuggestions
								locations={filteredLocations}
								onSelect={(id) => updateFilter("locationId", id)}
							/>
						)}
					</div>

					{/* 🗓️ Selector de fechas */}
					<div className="px-6 mb-3">
						<DateSelector
							value={filters.dateRange}
							onChange={(newRange) => updateFilter("dateRange", newRange ?? {})}
						/>
					</div>

					{/* 🏷️ Selector de categorías */}
					<div className="px-6 mb-3">
						<CategorySelector
							selected={filters.selectedCategories}
							onSelect={(newCategories) => updateFilter("selectedCategories", newCategories)}
						/>
					</div>

					{/* 🔘 Acciones */}
					<div className="flex items-center justify-between px-6 py-4 mt-3 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
						<button
							type="button"
							onClick={() => clearFilters()}
							className="text-sm underline text-muted-foreground hover:text-foreground"
						>
							Quitar filtros
						</button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
