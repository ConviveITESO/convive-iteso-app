import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventStatsProps {
	registeredCount: number;
	quota: number;
	spotsLeft: number;
}

export function EventStats({ registeredCount, quota, spotsLeft }: EventStatsProps) {
	return (
		<div className="flex items-start gap-3 mb-8">
			<Users className="size-5 text-foreground mt-0.5 shrink-0" />
			<div className="flex-1">
				<p className="text-base font-medium text-foreground mb-1">Attendance</p>
				<div className="flex items-center gap-2">
					<p className="text-base text-foreground/70">
						{registeredCount} / {quota} registered
					</p>
					<Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xs">
						{spotsLeft} spots left
					</Badge>
				</div>
			</div>
		</div>
	);
}
