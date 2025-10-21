"use client";

export default function NotificationHeader({ rightAction }: { rightAction?: React.ReactNode }) {
	return (
		<div className="sticky top-0 z-10 mx-auto mb-4 max-w-2xl px-4 pt-3">
			<div className="mx-auto flex items-center justify-end rounded-2xl bg-white/95 px-4 py-3 shadow-md ring-1 ring-black/5 backdrop-blur">
				{rightAction}
			</div>
		</div>
	);
}
