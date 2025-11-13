import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getNameInitials(name: string) {
	const names = name.toUpperCase().split(" ");
	const initials = names.map((n) => n.trim()[0] as string);

	if (initials.length >= 4) {
		return `${initials[0]}${initials[2]}`;
	}

	return `${initials[0]}${initials[1]}`;
}
