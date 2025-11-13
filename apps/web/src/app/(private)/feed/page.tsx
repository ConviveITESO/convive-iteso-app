"use client";

import { CalendarX2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { EventsGrid } from "@/components/events/events-grid";
import { EventsRow } from "@/components/events/events-row";
import { FeedSkeleton } from "@/components/events/feed-skeleton";
import { useFilters } from "@/components/providers/filter-context";
import { Card } from "@/components/ui/card";
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

	// 📦 Obtener todos los eventos (futuros)
	const { data: allEvents = [], isLoading: eventsLoading } = useEvents(
		"",
		null,
		false,
		isAuthenticated,
	);

	// Obtener eventos pasados
	const { data: pastEvents = [], isLoading: pastLoading } = useEvents(
		"",
		null,
		true,
		isAuthenticated,
	);

	// Obtener categorías
	const { data: categories = [], isLoading: categoriesLoading } = useCategories(isAuthenticated);

	// Skeleton mientras carga
	if (!isAuthenticated || eventsLoading || categoriesLoading || pastLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<FeedSkeleton />
			</div>
		);
	}

	const handleEventClick = (eventId: string) => router.push(`/events/${eventId}`);

	// Filtro de eventos usando los filtros globales
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

	// Filtro de eventos de hoy
	const todayEvents = allEvents.filter((e) => {
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

			<div className="mx-auto max-w-7xl px-4 space-y-10">
				{/* 🏷️ Filtro rápido de categorías */}
				<CategoriesFilter
					title=""
					categories={categories}
					selectedCategory={filters.singleCategory}
					onCategoryChange={(cat) => {
						updateFilter("singleCategory", cat);
						updateFilter("selectedCategories", cat ? [cat] : []);
					}}
					showAllOption={true}
				/>

				{/* 🗓️ Eventos de hoy */}
				<section>
					{todayEvents.length > 0 ? (
						<EventsRow
							title="What's happening today"
							events={todayEvents}
							onEventClick={handleEventClick}
						/>
					) : (
						<Card className="flex flex-col items-center justify-center h-[180px] border-dashed border bg-muted/30 text-center text-muted-foreground">
							<CalendarX2 className="h-8 w-8 mb-2 opacity-70" />
							<p className="text-sm font-medium">No events scheduled for today</p>
							<p className="text-xs opacity-70">Check upcoming events below</p>
						</Card>
					)}
				</section>

				{/* 🔜 Próximos eventos */}
				<section>
					<div className="max-h-[600px] overflow-y-auto pr-2">
						<EventsGrid
							events={filteredEvents}
							onEventClick={handleEventClick}
							eventsLoading={false}
						/>
					</div>
				</section>

				{/* 🕓 Eventos pasados */}
				{pastEvents.length > 0 && (
					<EventsRow title="Past events" events={pastEvents} onEventClick={handleEventClick} />
				)}
			</div>
		</div>
	);
}
