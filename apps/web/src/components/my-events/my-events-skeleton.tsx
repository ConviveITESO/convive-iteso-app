"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function MyEventsSkeleton() {
	return (
		<div className="w-full mt-6 animate-fade-in">
			{/* ✅ Tabs Skeleton */}
			<div className="flex w-full border-b pb-3">
				{/* Tab 1 */}
				<div className="flex-1 flex flex-col items-center">
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5 rounded-full" />
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-5 w-7 rounded-full" />
					</div>
				</div>

				{/* Tab 2 */}
				<div className="flex-1 flex flex-col items-center">
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5 rounded-full" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-5 w-7 rounded-full" />
					</div>
				</div>
			</div>

			{/* Animated underline placeholder */}
			<div className="mt-2">
				<Skeleton className="h-[3px] w-1/2 rounded-full" />
			</div>

			{/* Spacing */}
			<div className="h-6" />

			{/* ✅ Skeleton Event Cards */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{["my-event-skeleton-1", "my-event-skeleton-2", "my-event-skeleton-3"].map((id) => (
					<div key={id} className="p-4 border rounded-xl bg-card shadow-sm space-y-4">
						{/* Top row: Image + right icon */}
						<div className="flex items-start justify-between">
							<Skeleton className="h-20 w-20 rounded-xl" />
							<Skeleton className="h-6 w-6 rounded-md" />
						</div>

						{/* Text */}
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-32" />
					</div>
				))}
			</div>
		</div>
	);
}
