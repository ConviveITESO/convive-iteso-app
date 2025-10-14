"use client";

import type { CategoryResponseArraySchema, EventResponseArraySchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { Image, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

export default function FeedPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
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
					return data as EventResponseArraySchema;
				}),
		enabled: isAuthenticated,
	});

	const { data: categories = [], isLoading: categoriesLoading } = useQuery({
		queryKey: ["categories"],
		queryFn: () =>
			fetch(`${getApiUrl()}/categories`, {
				method: "GET",
				credentials: "include",
			}).then((res) => res.json() as Promise<CategoryResponseArraySchema>),
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
							<Card
								key={event.id}
								className="cursor-pointer overflow-hidden p-2 transition-shadow hover:shadow-lg"
								onClick={() => router.push(`/events/${event.id}`)}
							>
								<div className="flex items-center gap-4">
									{/* Image placeholder */}
									<div className="flex size-[92px] shrink-0 items-center justify-center rounded-xl bg-muted shadow-sm">
										<Image className="size-6 text-muted-foreground" />
									</div>

									{/* Event details */}
									<div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
										{/* Date and time */}
										<p className="text-[13px] text-muted-foreground">
											{formatDate(event.startDate)}
										</p>

										{/* Event title */}
										<h3 className="line-clamp-2 text-[15px] font-medium leading-tight text-foreground">
											{event.name}
										</h3>

										{/* Location */}
										<div className="flex items-center gap-1.5">
											<MapPin className="size-3.5 text-muted-foreground" />
											<span className="text-[13px] text-muted-foreground">
												{event.location.name}
											</span>
										</div>
									</div>
								</div>
							</Card>
						))
					)}
				</div>
			</div>
		</div>
	);
}
