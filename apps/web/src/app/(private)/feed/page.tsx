"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useEvents } from "@/hooks/use-events";
import { DEFAULT_HEADER_TITLE, useHeaderTitle } from "@/hooks/use-header-title";
import { EventsGrid } from "../../../components/events/_events-grid";
import { CategoriesFilter } from "./_categories-filter";
import { SearchHeader } from "./_search-header";

export default function FeedPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	useHeaderTitle(DEFAULT_HEADER_TITLE);

	const { data: events = [], isLoading: eventsLoading } = useEvents(isAuthenticated);
	const { data: categories = [], isLoading: categoriesLoading } = useCategories(isAuthenticated);

	if (!isAuthenticated || eventsLoading || categoriesLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	const filteredEvents = events.filter((event) => {
		const matchesSearch =
			event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			event.description.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory =
			!selectedCategory || event.categories.some((cat) => cat.id === selectedCategory);
		return matchesSearch && matchesCategory;
	});

	const handleEventClick = (eventId: string) => {
		router.push(`/events/${eventId}`);
	};

	return (
		<div className="min-h-screen bg-background">
			<SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

			<div className="mx-auto max-w-7xl px-4 py-8">
				<CategoriesFilter
					categories={categories}
					selectedCategory={selectedCategory}
					onCategoryChange={setSelectedCategory}
				/>

				<EventsGrid events={filteredEvents} onEventClick={handleEventClick} />
			</div>
		</div>
	);
}
