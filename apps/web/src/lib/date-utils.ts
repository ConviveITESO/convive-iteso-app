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

/**
 * Formats a Date object to YYYY-MM-DD format for date inputs
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatLocalDate(date: Date | null): string {
	if (!date) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to HH:MM format for time inputs
 * @param date - Date object to format
 * @returns Time string in HH:MM format
 */
export function formatLocalTime(date: Date | null): string {
	if (!date) return "";
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

/**
 * Combines date and time strings into an ISO string
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in HH:MM format
 * @returns ISO date string
 */
export function combineDateTime(date: string, time: string): string {
	if (!date || !time) return "";
	const localDateTime = new Date(`${date}T${time}:00`);
	return localDateTime.toISOString();
}

/**
 * Formats a Date object to a long date format
 * @param date - Date object to format
 * @param locale - Locale string (default: "en-US")
 * @returns Formatted date string (e.g., "Monday, January 15, 2024")
 */
export function formatDateLong(date: Date, locale = "en-US"): string {
	return date.toLocaleDateString(locale, {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

/**
 * Formats a time range between two dates
 * @param start - Start date
 * @param end - End date
 * @param locale - Locale string (default: "en-US")
 * @returns Formatted time range (e.g., "10:00 AM - 11:30 AM")
 */
export function formatTimeRange(start: Date, end: Date, locale = "en-US"): string {
	const startTime = start.toLocaleTimeString(locale, {
		hour: "2-digit",
		minute: "2-digit",
	});
	const endTime = end.toLocaleTimeString(locale, {
		hour: "2-digit",
		minute: "2-digit",
	});
	return `${startTime} - ${endTime}`;
}

/**
 * Formats a Date object to a short date-time format
 * @param date - Date object to format
 * @param locale - Locale string (default: "en-US")
 * @returns Formatted date-time string (e.g., "Mon, Jan 15, 10:00 AM")
 */
export function formatDateTimeShort(date: Date, locale = "en-US"): string {
	return date.toLocaleString(locale, {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Checks if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}
