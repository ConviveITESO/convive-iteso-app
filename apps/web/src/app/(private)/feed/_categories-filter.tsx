"use client";

import { Badge } from "@/components/ui/badge";

interface CategoriesFilterProps {
	title: string;
	categories: { id: string; name: string }[];
	selectedCategory: string | null;
	onCategoryChange: (categoryId: string | null) => void;
	showAllOption: boolean;
}

export function CategoriesFilter({
	title,
	categories,
	selectedCategory,
	onCategoryChange,
	showAllOption,
}: CategoriesFilterProps) {
	function capitalizeFirstLetter(text: string): string {
		if (!text) return "";
		return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
	}

	return (
		<div className="mb-8">
			<div className="mb-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{title}
				</p>
			</div>
			{/* Contenedor scrolleable */}
			<div
				className="
          flex gap-3 overflow-x-auto
          snap-x snap-mandatory scroll-smooth
          [-webkit-overflow-scrolling:touch]
          hide-scrollbar
        "
			>
				{showAllOption && (
					<div className="shrink-0 snap-start">
						<Badge
							variant={selectedCategory === null ? "default" : "outline"}
							className="cursor-pointer text-sm px-5 py-3 rounded-2xl whitespace-nowrap"
							onClick={() => onCategoryChange(null)}
						>
							All
						</Badge>
					</div>
				)}

				{categories.map((category) => (
					<div key={category.id} className="shrink-0 snap-start">
						<Badge
							variant={selectedCategory === category.id ? "default" : "outline"}
							className="
                cursor-pointer text-sm px-6 py-3 whitespace-nowrap 
                transition-all hover:shadow-sm font-md rounded-2xl
              "
							onClick={() => onCategoryChange(category.id)}
						>
							{capitalizeFirstLetter(category.name)}
						</Badge>
					</div>
				))}
			</div>
		</div>
	);
}
