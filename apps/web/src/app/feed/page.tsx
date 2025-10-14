"use client";

import type { CategoryResponseArraySchema, EventResponseArraySchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Search, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

export default function FeedPage() {
	const { isAuthenticated } = useAuth();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const { data: events = [], isLoading: eventsLoading } = useQuery({
		queryKey: ["events"],
		queryFn: () =>
			fetch(`${getApiUrl()}/events`, {
				method: "GET",
				credentials: "include",
			})
				.then((res) => res.json())
				.then((data) => {
					// Deduplicate events by ID
					const uniqueEvents = Array.from(
						new Map((data as EventResponseArraySchema).map((event) => [event.id, event])).values(),
					) as EventResponseArraySchema;
					console.log(uniqueEvents);
					return uniqueEvents;
				}),
		enabled: isAuthenticated,
	});

	const { data: categories = [], isLoading: categoriesLoading } = useQuery({
		queryKey: ["categories"],
		queryFn: () =>
			fetch(`${getApiUrl()}/categories`, {
				method: "GET",
				credentials: "include",
			})
				.then((res) => res.json() as Promise<CategoryResponseArraySchema>)
				.then((data) => {
					console.log(data);
					return data;
				}),
		enabled: isAuthenticated,
	});

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

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("es-MX", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Search Header */}
			<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto max-w-7xl px-4 py-6">
					<div className="relative mx-auto max-w-2xl">
						<Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search events..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-12 rounded-full pl-10 pr-4 shadow-md"
						/>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-4 py-8">
				{/* Categories Filter */}
				<div className="mb-8">
					<h2 className="mb-4 text-lg font-semibold">Categories</h2>
					<div className="flex flex-wrap gap-2">
						<Badge
							variant={selectedCategory === null ? "default" : "outline"}
							className="cursor-pointer"
							onClick={() => setSelectedCategory(null)}
						>
							All
						</Badge>
						{categories.map((category) => (
							<Badge
								key={category.id}
								variant={selectedCategory === category.id ? "default" : "outline"}
								className="cursor-pointer"
								onClick={() => setSelectedCategory(category.id)}
							>
								{category.name}
							</Badge>
						))}
					</div>
				</div>

				{/* Events Grid */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredEvents.length === 0 ? (
						<div className="col-span-full py-12 text-center">
							<p className="text-muted-foreground">No events found</p>
						</div>
					) : (
						filteredEvents.map((event) => (
							<Card key={event.id} className="transition-shadow hover:shadow-lg">
								<CardHeader>
									<CardTitle className="line-clamp-2">{event.name}</CardTitle>
									<CardDescription className="line-clamp-3">{event.description}</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Calendar className="size-4" />
										<span>{formatDate(event.startDate)}</span>
									</div>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<MapPin className="size-4" />
										<span>{event.location.name}</span>
									</div>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Users className="size-4" />
										<span>{event.quota} spots</span>
									</div>
									{event.categories.length > 0 && (
										<div className="flex flex-wrap gap-1 pt-2">
											{event.categories.map((category) => (
												<Badge key={category.id} variant="secondary" className="text-xs">
													{category.name}
												</Badge>
											))}
										</div>
									)}
									{event.badges.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{event.badges.map((badge) => (
												<Badge key={badge.id} variant="outline" className="text-xs">
													{badge.name}
												</Badge>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						))
					)}
				</div>
			</div>
		</div>
	);
}
