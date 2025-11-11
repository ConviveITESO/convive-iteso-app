"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { SearchModal } from "@/components/events/search/search-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchHeaderProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
}

export function SearchHeader({ searchQuery, onSearchChange }: SearchHeaderProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto max-w-7xl px-4 py-4">
					<div className="mx-auto max-w-2xl flex items-center gap-3">
						{/* 🔍 Barra de búsqueda */}
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Buscar eventos..."
								value={searchQuery}
								onChange={(e) => onSearchChange(e.target.value)}
								className="h-12 rounded-2xl pl-10 pr-4 shadow-md"
							/>
						</div>

						{/* 🎚️ Botón de filtros */}
						<Button
							variant="outline"
							size="icon"
							onClick={() => setOpen(true)}
							className="h-12 w-12 rounded-2xl border border-border/60 shadow-sm hover:bg-accent transition bg-primary"
						>
							<SlidersHorizontal className="h-5 w-5 text-white" />
						</Button>
					</div>
				</div>
			</div>

			{/* Modal de búsqueda avanzada */}
			<SearchModal open={open} onOpenChange={setOpen} />
		</>
	);
}
