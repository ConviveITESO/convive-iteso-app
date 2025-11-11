"use client";

import { useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DateModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedRange?: DateRange;
	onSelectRange: (range: DateRange | undefined) => void;
}

export function DateModal({ open, onOpenChange, selectedRange, onSelectRange }: DateModalProps) {
	// Si sólo hay 'from', arma un rango de un día para confirmar
	const effectiveRange = useMemo<DateRange | undefined>(() => {
		if (!selectedRange?.from) return undefined;
		return {
			from: selectedRange.from,
			to: selectedRange.to ?? selectedRange.from,
		};
	}, [selectedRange]);

	const canConfirm = !!effectiveRange?.from; // basta con tener 'from'

	const handleConfirm = () => {
		if (!effectiveRange) return;
		onSelectRange(effectiveRange); // guarda el rango (si era 1 día, from=to)
		onOpenChange(false); // cierra el modal
	};

	const handleClear = () => {
		onSelectRange(undefined);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-3xl p-6">
				<DialogHeader className="text-left mb-2">
					<DialogTitle className="text-xl font-semibold">Seleccionar fechas</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col items-center gap-4">
					<Calendar
						mode="range"
						numberOfMonths={1}
						selected={selectedRange}
						onSelect={(range) => onSelectRange(range)}
						className="rounded-md border"
						// opcional: impedir fechas pasadas
						// disabled={{ before: new Date() }}
					/>

					<div className="flex w-full gap-3 mt-2">
						<Button variant="outline" className="w-1/3 rounded-full" onClick={handleClear}>
							Limpiar
						</Button>
						<Button className="w-2/3 rounded-full" disabled={!canConfirm} onClick={handleConfirm}>
							Confirmar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
