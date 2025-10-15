"use client";

export default function NotificationHeader({ rightAction }: { rightAction?: React.ReactNode }) {
	return (
		<div className="sticky top-0 z-10 mx-auto mb-4 max-w-2xl px-4 pt-3">
			<div className="mx-auto flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 shadow-md ring-1 ring-black/5 backdrop-blur">
				{/* “menu” fantasma para balancear y simular tu mock */}
				<button
					type="button"
					aria-label="Menu"
					className="rounded-full p-2 hover:bg-black/5 active:scale-[0.98]"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M4 7h16M4 12h16M4 17h16"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
				</button>

				<h1 className="text-base font-semibold">Notifications</h1>

				{/* campana a la derecha, igual al mock */}
				<div className="flex items-center gap-3">
					{rightAction}
					<button
						type="button"
						aria-label="Bell"
						className="rounded-full p-2 hover:bg-black/5 active:scale-[0.98]"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M15 17H9a5 5 0 0 1-5-5V9a7 7 0 1 1 14 0v3a5 5 0 0 1-5 5Z"
								stroke="currentColor"
								strokeWidth="2"
							/>
							<path
								d="M10 20a2 2 0 0 0 4 0"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
