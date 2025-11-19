"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useCategories } from "@/hooks/use-categories";
import { CategoryModal } from "./category-modal";

interface CategorySelectorProps {
	selected: string[];
	onSelect: (categories: string[]) => void;
}

export function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
	const [open, setOpen] = useState(false);
	const { data: categories = [], isLoading } = useCategories(true);

	const label = isLoading
		? "Cargando categorías..."
		: selected.length === 0
			? "Agregar categorías"
			: selected.length === 1
				? (categories.find((c) => c.id === selected[0])?.name ?? "1 categoría")
				: `${selected.length} categorías seleccionadas`;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex w-full items-center justify-between px-5 py-4 rounded-2xl bg-background shadow-sm border border-border/50 hover:shadow-md transition text-left"
			>
				<div className="flex flex-col">
					<span className="text-[15px] font-medium text-foreground">Categorías</span>
					<span className="text-[15px] text-muted-foreground">{label}</span>
				</div>
				<ChevronRight className="text-muted-foreground h-5 w-5" />
			</button>

			<CategoryModal
				open={open}
				onOpenChange={setOpen}
				categories={categories}
				selectedCategories={selected}
				onSelectCategories={(ids) => {
					onSelect(ids);
					setOpen(false);
				}}
			/>
		</>
	);
}
