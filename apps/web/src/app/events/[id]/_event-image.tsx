import { ImageIcon } from "lucide-react";

export function EventImage() {
	return (
		<div className="mx-4 mt-12 mb-6">
			<div className="bg-gray-200 rounded-[50px] shadow-md h-52 flex items-center justify-center">
				<ImageIcon className="size-6 text-foreground" />
			</div>
		</div>
	);
}
