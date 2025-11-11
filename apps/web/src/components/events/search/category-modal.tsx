"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryModalProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	categories: { id: string; name: string }[];
	selectedCategories: string[]; // ahora es un array
	onSelectCategories: (ids: string[]) => void;
}

export function CategoryModal({
	open,
	onOpenChange,
	categories,
	selectedCategories,
	onSelectCategories,
}: CategoryModalProps) {
	// Manejo de selección
	const toggleCategory = (id: string) => {
		if (selectedCategories.includes(id)) {
			onSelectCategories(selectedCategories.filter((c) => c !== id));
		} else {
			onSelectCategories([...selectedCategories, id]);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-0 shadow-xl bg-background/95 backdrop-blur-md">
				<DialogHeader className="p-6 pb-4 text-left border-b">
					<DialogTitle className="text-2xl font-semibold">Selecciona categorías</DialogTitle>
				</DialogHeader>

				<ScrollArea className="max-h-[60vh] px-6 py-6">
					<div className="flex flex-wrap gap-3">
						{categories.map((cat) => {
							const isSelected = selectedCategories.includes(cat.id);
							return (
								<Badge
									key={cat.id}
									onClick={() => toggleCategory(cat.id)}
									className={`
                    text-[15px] px-5 py-2.5 rounded-full cursor-pointer transition-all
                    border border-transparent select-none
                    ${
											isSelected
												? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
												: "bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground"
										}
                  `}
								>
									{cat.name}
									{isSelected && <Check className="ml-1.5 h-4 w-4 opacity-80" />}
								</Badge>
							);
						})}
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
