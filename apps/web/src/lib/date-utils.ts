/**
 * Formats a date string to a localized format
 * @param dateString - ISO date string to format
 * @param locale - Locale string (default: "es-MX")
 * @returns Formatted date string
 */
export function formatDate(dateString: string, locale = "es-MX"): string {
	const date = new Date(dateString);
	return date.toLocaleDateString(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Formats a date string to a simple localized format without time
 * @param dateString - ISO date string to format
 * @param locale - Locale string (default: "es")
 * @returns Formatted date string
 */
export function formatDateSimple(dateString: string, locale = "es"): string {
	return new Date(dateString).toLocaleDateString(locale);
}
