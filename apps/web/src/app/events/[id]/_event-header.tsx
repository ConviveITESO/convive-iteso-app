import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface EventHeaderProps {
	eventName: string;
}

export function EventHeader({ eventName }: EventHeaderProps) {
	const router = useRouter();

	return (
		<div className="relative h-24 shadow-md -mb-5">
			<Button
				variant="ghost"
				size="icon"
				className="absolute left-6 top-6"
				onClick={() => router.back()}
			>
				<ArrowLeft className="size-6" />
			</Button>
			<h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-semibold text-center whitespace-nowrap">
				{eventName}
			</h1>
		</div>
	);
}
