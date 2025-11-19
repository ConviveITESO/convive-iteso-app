"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchActionsProps {
	onClear: () => void;
	onSearch: () => void;
}

export function SearchActions({ onClear, onSearch }: SearchActionsProps) {
	return (
		<div className="mt-8 flex items-center justify-between border-t pt-4">
			<button
				type="button"
				className="text-sm underline text-muted-foreground hover:text-foreground"
				onClick={onClear}
			>
				Quitar filtros
			</button>
			<Button onClick={onSearch}>
				<Search className="mr-2 h-4 w-4" /> Buscar
			</Button>
		</div>
	);
}
