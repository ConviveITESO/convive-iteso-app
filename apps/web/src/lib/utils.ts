import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
	return new Date(date).toLocaleString("en-US", {
		dateStyle: "long",
		timeStyle: "short",
	});
}
