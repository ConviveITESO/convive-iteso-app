import Image from "next/image";

interface EventImageProps {
	imageUrl: string;
	name: string;
}

export function EventImage({ imageUrl, name }: EventImageProps) {
	return (
		<div className="mx-4 mt-12 mb-6">
			<div className="relative bg-gray-200 rounded-[50px] shadow-md h-52 flex items-center justify-center">
				<Image className="rounded-[50px] object-cover" src={imageUrl} alt={name} fill />
			</div>
		</div>
	);
}
