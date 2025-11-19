"use client";

import { motion } from "framer-motion";
import { CalendarX2 } from "lucide-react";

interface NoEventsFoundProps {
	message: string;
}

export function NoEventsFound({ message }: NoEventsFoundProps) {
	return (
		<div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
			{/* Icon */}
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.35, ease: "easeOut" }}
			>
				<CalendarX2 className="w-14 h-14 text-muted-foreground" />
			</motion.div>

			{/* Title */}
			<motion.h3
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.05, duration: 0.4 }}
				className="text-lg font-semibold text-foreground"
			>
				Nothing here yet
			</motion.h3>

			{/* Subtitle */}
			<motion.p
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.12, duration: 0.4 }}
				className="text-muted-foreground text-sm max-w-xs"
			>
				{message}
			</motion.p>
		</div>
	);
}
