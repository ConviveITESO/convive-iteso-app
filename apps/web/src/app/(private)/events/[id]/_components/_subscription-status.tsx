import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubscriptionStatusProps {
	isWaitlisted: boolean;
	position?: number | null;
}

export function SubscriptionStatus({ isWaitlisted, position }: SubscriptionStatusProps) {
	if (isWaitlisted) {
		return (
			<Badge
				variant="secondary"
				className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-orange-200 text-orange-700 hover:bg-orange-200"
			>
				<Clock className="size-3" />
				<span className="text-sm font-medium">
					You are waitlisted, you are the position: {position}
				</span>
			</Badge>
		);
	}

	return (
		<Badge
			variant="secondary"
			className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-green-100 text-green-600 hover:bg-green-100"
		>
			<CheckCircle2 className="size-3" />
			<span className="text-sm font-medium">You are subscribed</span>
		</Badge>
	);
}
