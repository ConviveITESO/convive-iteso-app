"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useEvents } from "@/hooks/use-events";
import { DEFAULT_HEADER_TITLE, useHeaderTitle } from "@/hooks/use-header-title";
import { EventsGrid } from "../../../components/events/events-grid";
import { CategoriesFilter } from "./_categories-filter";
import { SearchHeader } from "./_search-header";

export default function FeedPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [pastEvents, setPastEvents] = useState<string | null>("false");

	useHeaderTitle(DEFAULT_HEADER_TITLE);

	const { data: events = [], isLoading: eventsLoading } = useEvents(
		searchQuery,
		selectedCategory,
		pastEvents === "true",
		isAuthenticated,
	);
	const { data: categories = [], isLoading: categoriesLoading } = useCategories(isAuthenticated);

	if (!isAuthenticated || eventsLoading || categoriesLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	const handleEventClick = (eventId: string) => {
		router.push(`/events/${eventId}`);
	};

	return (
		<div className="min-h-screen bg-background">
			<SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

			<div className="mx-auto max-w-7xl px-4 py-8">
				<CategoriesFilter
					title="Event type"
					categories={[
						{ id: "false", name: "current & upcoming" },
						{ id: "true", name: "past" },
					]}
					selectedCategory={pastEvents}
					onCategoryChange={setPastEvents}
					showAllOption={false}
				/>

				<CategoriesFilter
					title="Categories"
					categories={categories}
					selectedCategory={selectedCategory}
					onCategoryChange={setSelectedCategory}
					showAllOption={true}
				/>

				<EventsGrid events={events} onEventClick={handleEventClick} />
			</div>
		</div>
	);
}
