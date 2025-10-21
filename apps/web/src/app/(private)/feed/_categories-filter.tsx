import type { CategoryResponseArraySchema } from "@repo/schemas";
import { Badge } from "@/components/ui/badge";

interface CategoriesFilterProps {
	categories: CategoryResponseArraySchema;
	selectedCategory: string | null;
	onCategoryChange: (categoryId: string | null) => void;
}

export function CategoriesFilter({
	categories,
	selectedCategory,
	onCategoryChange,
}: CategoriesFilterProps) {
	return (
		<div className="mb-8">
			<h2 className="mb-4 text-lg font-semibold">Categories</h2>
			<div className="flex flex-wrap gap-2">
				<Badge
					variant={selectedCategory === null ? "default" : "outline"}
					className="cursor-pointer"
					onClick={() => onCategoryChange(null)}
				>
					All
				</Badge>
				{categories.map((category) => (
					<Badge
						key={category.id}
						variant={selectedCategory === category.id ? "default" : "outline"}
						className="cursor-pointer"
						onClick={() => onCategoryChange(category.id)}
					>
						{category.name}
					</Badge>
				))}
			</div>
		</div>
	);
}
