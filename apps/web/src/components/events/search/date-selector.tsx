"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { DateModal } from "./date-modal";

export interface FlexibleDateRange {
	from?: Date;
	to?: Date;
}

interface DateSelectorProps {
	value: FlexibleDateRange | undefined;
	onChange: (range: FlexibleDateRange | undefined) => void;
}

export function DateSelector({ value, onChange }: DateSelectorProps) {
	const [open, setOpen] = useState(false);

	const label = value?.from
		? value.to
			? `${value.from.toLocaleDateString("es-MX", {
					day: "numeric",
					month: "short",
				})} – ${value.to.toLocaleDateString("es-MX", {
					day: "numeric",
					month: "short",
				})}`
			: `${value.from.toLocaleDateString("es-MX", {
					day: "numeric",
					month: "short",
				})} – …`
		: "Agregar fechas";

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex w-full items-center justify-between px-5 py-4 rounded-2xl bg-background shadow-sm border border-border/50 hover:shadow-md transition text-left"
			>
				<div className="flex flex-col">
					<span className="text-[15px] font-medium text-foreground">Fechas</span>
					<span className="text-[15px] text-muted-foreground">{label}</span>
				</div>
				<ChevronRight className="text-muted-foreground h-5 w-5" />
			</button>

			<DateModal
				open={open}
				onOpenChange={setOpen}
				selectedRange={value as DateRange}
				onSelectRange={(range) => onChange(range ? { from: range.from, to: range.to } : undefined)}
			/>
		</>
	);
}
