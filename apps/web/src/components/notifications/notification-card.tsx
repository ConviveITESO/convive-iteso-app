"use client";

import Link from "next/link";
import { useId } from "react";
import type { NotificationItem, NotificationKind } from "./types";

const KIND = {
	canceled: {
		badge: "Event Canceled",
		base: "bg-rose-50 border-rose-200",
		iconRing: "bg-white text-rose-600 ring-1 ring-rose-200",
		iconTitle: "Canceled event icon",
	},
	rescheduled: {
		badge: "Event Rescheduled",
		base: "bg-amber-50 border-amber-200",
		iconRing: "bg-white text-amber-600 ring-1 ring-amber-200",
		iconTitle: "Rescheduled event icon",
	},
	reminder: {
		badge: "New Reminder",
		base: "bg-sky-50 border-sky-200",
		iconRing: "bg-white text-sky-600 ring-1 ring-sky-200",
		iconTitle: "Reminder icon",
	},
	location: {
		badge: "Location Updated",
		base: "bg-emerald-50 border-emerald-200",
		iconRing: "bg-white text-emerald-600 ring-1 ring-emerald-200",
		iconTitle: "Location update icon",
	},
} satisfies Record<
	NotificationKind,
	{
		badge: string;
		base: string;
		iconRing: string;
		iconTitle: string;
	}
>;

function KindIcon({
	kind,
	titleId,
	title,
}: {
	kind: NotificationKind;
	titleId: string;
	title: string;
}) {
	const common = "size-4";
	switch (kind) {
		case "canceled":
			return (
				<svg
					viewBox="0 0 24 24"
					className={common}
					fill="none"
					aria-labelledby={titleId}
					role="img"
				>
					<title id={titleId}>{title}</title>
					<path d="M12 22a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" stroke="currentColor" strokeWidth="2" />
					<path d="m9 9 6 6m0-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				</svg>
			);
		case "rescheduled":
			return (
				<svg
					viewBox="0 0 24 24"
					className={common}
					fill="none"
					aria-labelledby={titleId}
					role="img"
				>
					<title id={titleId}>{title}</title>
					<path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
					<path
						d="M21 12a9 9 0 1 1-3-6.7"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					/>
					<path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				</svg>
			);
		case "reminder":
			return (
				<svg
					viewBox="0 0 24 24"
					className={common}
					fill="none"
					aria-labelledby={titleId}
					role="img"
				>
					<title id={titleId}>{title}</title>
					<path
						d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z"
						stroke="currentColor"
						strokeWidth="2"
					/>
				</svg>
			);
		case "location":
			return (
				<svg
					viewBox="0 0 24 24"
					className={common}
					fill="none"
					aria-labelledby={titleId}
					role="img"
				>
					<title id={titleId}>{title}</title>
					<path
						d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
						stroke="currentColor"
						strokeWidth="2"
					/>
					<circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="2" />
				</svg>
			);
	}

	return null;
}

export function NotificationCard({ item }: { item: NotificationItem }) {
	const iconTitleId = useId();
	const date = new Date(item.dateIso);
	const k = KIND[item.kind];

	return (
		<Link href={`/notifications/${item.id}`} className="block">
			<div className={`rounded-xl border ${k.base} p-4 shadow-sm transition hover:shadow-md`}>
				<div className="flex items-start gap-3">
					<div
						className={`mt-0.5 inline-flex items-center justify-center rounded-full p-2 ${k.iconRing}`}
					>
						<KindIcon kind={item.kind} titleId={iconTitleId} title={k.iconTitle} />
					</div>

					<div className="min-w-0 flex-1">
						<div className="mb-1 flex items-center justify-between gap-3">
							<span className="text-xs font-medium opacity-80">{k.badge}</span>
							<time className="shrink-0 text-[11px] text-gray-500">{date.toLocaleString()}</time>
						</div>

						<h3 className="truncate font-semibold text-gray-900">{item.title}</h3>
						<p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{item.body}</p>
					</div>
				</div>
			</div>
		</Link>
	);
}
