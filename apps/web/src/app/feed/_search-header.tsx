import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchHeaderProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
}

export function SearchHeader({ searchQuery, onSearchChange }: SearchHeaderProps) {
	return (
		<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto max-w-7xl px-4 py-6">
				<div className="relative mx-auto max-w-2xl">
					<Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search events..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="h-12 rounded-full pl-10 pr-4 shadow-md"
					/>
				</div>
			</div>
		</div>
	);
}
