export interface SubscriptionCreatedNotificationPayload {
	creatorEmail: string;
	creatorName: string;
	eventName: string;
	subscriberName: string;
}

export interface RegistrationConfirmationNotificationPayload {
	userEmail: string;
	userName: string;
}
