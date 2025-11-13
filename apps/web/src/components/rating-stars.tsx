"use client";

import { StarIcon } from "lucide-react";
import { useState } from "react";
import type { RatingValue } from "@/types/misc";

interface Props {
	stars: RatingValue;
	handler: (val: number) => void;
	initialValue?: 0 | RatingValue;
	className?: string;
}

export default function RatingStars({ stars, initialValue, handler, className }: Props) {
	const numberArray = Array.from({ length: stars }, (_, index) => index + 1);

	const [hoveredStars, setHoveredStars] = useState(0);

	const canHover = (starValue: number) => hoveredStars && starValue <= hoveredStars;

	return (
		<div className={`flex items-center justify-start ${className}`}>
			{numberArray.map((starValue) => (
				<StarIcon
					onMouseEnter={() => {
						if (initialValue) return;
						setHoveredStars(starValue);
					}}
					onMouseLeave={() => {
						if (initialValue) return;
						setHoveredStars(0);
					}}
					onClick={() => {
						handler(starValue);

						setHoveredStars(starValue);
					}}
					fill={canHover(starValue) ? "#FFBF00" : "#fff0"}
					color={canHover(starValue) ? "#ffbf00" : "#000"}
					className="cursor-pointer"
					key={starValue}
				/>
			))}
		</div>
	);
}
