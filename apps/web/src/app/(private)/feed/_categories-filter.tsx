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
	return (
		<div className="mb-8">
			<h2 className="mb-4 text-lg font-semibold">{title}</h2>
			<div className="flex flex-wrap gap-2">
				{showAllOption && (
					<Badge
						variant={selectedCategory === null ? "default" : "outline"}
						className="cursor-pointer"
						onClick={() => onCategoryChange(null)}
					>
						All
					</Badge>
				)}
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
