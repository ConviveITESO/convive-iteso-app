export function NotificationEmpty() {
	return (
		<div className="flex h-[62vh] flex-col items-center justify-center text-center">
			<div className="mb-4 flex size-28 items-center justify-center rounded-full bg-gray-100">
				<svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="text-gray-400">
					<path
						d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z"
						stroke="currentColor"
						strokeWidth="2"
					/>
				</svg>
			</div>
			<h2 className="text-lg font-semibold">No new notifications</h2>
			<p className="mt-1 max-w-sm text-sm text-gray-500">
				You’ll see updates here about your events.
			</p>
		</div>
	);
}
