"use client";

import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_PLACEHOLDERS = ["category-1", "category-2", "category-3", "category-4"];
const ROW_CARDS_PLACEHOLDERS = ["row-card-1", "row-card-2", "row-card-3"];
const GRID_CARDS_PLACEHOLDERS = [
	"grid-card-1",
	"grid-card-2",
	"grid-card-3",
	"grid-card-4",
	"grid-card-5",
	"grid-card-6",
];

export function FeedSkeleton() {
	return (
		<div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
			{/* 🔍 Search bar */}
			<div className="flex items-center gap-3">
				<Skeleton className="h-12 flex-1 rounded-2xl" />
				<Skeleton className="h-12 w-12 rounded-2xl" />
			</div>

			{/* 🏷️ Categories */}
			<div>
				<Skeleton className="h-5 w-24 mb-3" />
				<div className="flex gap-3">
					{CATEGORY_PLACEHOLDERS.map((id) => (
						<Skeleton key={id} className="h-8 w-20 rounded-full" />
					))}
				</div>
			</div>

			{/* 🗓️ Events row (What's happening today) */}
			<div>
				<Skeleton className="h-6 w-48 mb-4" />
				<div className="flex gap-4 overflow-x-hidden">
					{ROW_CARDS_PLACEHOLDERS.map((id) => (
						<div key={id} className="min-w-[260px] flex flex-col gap-2">
							<Skeleton className="h-[160px] w-full rounded-xl" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-24" />
						</div>
					))}
				</div>
			</div>

			{/* 🔜 Events grid (Upcoming) */}
			<div>
				<Skeleton className="h-6 w-56 mb-4" />
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
					{GRID_CARDS_PLACEHOLDERS.map((id) => (
						<div key={id} className="flex flex-col gap-3">
							<Skeleton className="h-[180px] w-full rounded-xl" />
							<Skeleton className="h-4 w-2/3" />
							<Skeleton className="h-3 w-1/3" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
