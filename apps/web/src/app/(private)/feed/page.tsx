"use client";

import { useRouter } from "next/navigation";
import { EventsGrid } from "@/components/events/events-grid";
import { EventsRow } from "@/components/events/events-row";
import { useFilters } from "@/components/providers/filter-context";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useDebouncedValue } from "@/hooks/use-debounce-value";
import { useEvents } from "@/hooks/use-events";
import { DEFAULT_HEADER_TITLE, useHeaderTitle } from "@/hooks/use-header-title";
import { CategoriesFilter } from "./_categories-filter";
import { SearchHeader } from "./_search-header";

export default function FeedPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const { filters, updateFilter } = useFilters();
	const debouncedSearch = useDebouncedValue(filters.searchQuery, 400);

	useHeaderTitle(DEFAULT_HEADER_TITLE);

	// 📦 Obtener todos los eventos
	const { data: allEvents = [], isLoading: eventsLoading } = useEvents(
		"",
		null,
		false,
		isAuthenticated,
	);

	// 📦 Obtener categorías
	const { data: categories = [], isLoading: categoriesLoading } = useCategories(isAuthenticated);

	if (!isAuthenticated || eventsLoading || categoriesLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	const handleEventClick = (eventId: string) => router.push(`/events/${eventId}`);

	// 🎯 Filtro de eventos usando los filtros globales
	const filteredEvents = allEvents.filter((event) => {
		const matchesSearch = event.name.toLowerCase().includes(debouncedSearch.toLowerCase());

		const matchesCategory =
			filters.selectedCategories.length === 0 ||
			(Array.isArray(event.categories) &&
				event.categories.some((c) => filters.selectedCategories.includes(c.id)));

		const matchesLocation = !filters.locationId || event.location?.id === filters.locationId;

		const matchesDate =
			(!filters.dateRange.from || new Date(event.startDate) >= filters.dateRange.from) &&
			(!filters.dateRange.to || new Date(event.startDate) <= filters.dateRange.to);

		return matchesSearch && matchesCategory && matchesLocation && matchesDate;
	});

	// 🗓️ Filtro de eventos de hoy
	const todayEvents = filteredEvents.filter((e) => {
		const eventDate = new Date(e.startDate);
		const now = new Date();
		return (
			eventDate.getFullYear() === now.getFullYear() &&
			eventDate.getMonth() === now.getMonth() &&
			eventDate.getDate() === now.getDate()
		);
	});

	return (
		<div className="min-h-screen bg-background">
			{/* 🔍 Barra de búsqueda y filtros */}
			<SearchHeader
				searchQuery={filters.searchQuery}
				onSearchChange={(val) => updateFilter("searchQuery", val)}
			/>

			<div className="mx-auto max-w-7xl px-4">
				{/* 🏷️ Filtro rápido de categorías (una sola) */}
				<CategoriesFilter
					title="Categories"
					categories={categories}
					selectedCategory={filters.singleCategory}
					onCategoryChange={(cat) => {
						updateFilter("singleCategory", cat);
						updateFilter("selectedCategories", cat ? [cat] : []);
					}}
					showAllOption={true}
				/>

				{/* 🗓️ Eventos de hoy */}
				<EventsRow
					title="What's happening today"
					events={todayEvents}
					onEventClick={handleEventClick}
				/>

				{/* 🔜 Próximos eventos */}
				<EventsGrid events={filteredEvents} onEventClick={handleEventClick} />
			</div>
		</div>
	);
}
