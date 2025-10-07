"use client";

import type { EventResponseSchema, SubscriptionResponseSchema } from "@repo/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { QrCode } from "./qr-code";

interface EventPassProps {
	event: EventResponseSchema;
	subscription: SubscriptionResponseSchema;
	userName: string;
}

export function EventPass({ event, subscription, userName }: EventPassProps) {
	const isValid = subscription.status === "registered";
	const statusMessage = isValid ? "Ready to scan" : "Invalid registration";

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle>{event.name}</CardTitle>
				<div className="text-sm text-muted-foreground">
					<p>{formatDate(event.startDate)}</p>
					<p>Attendee: {userName}</p>
					<p className={isValid ? "text-green-600" : "text-red-600"}>{statusMessage}</p>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{isValid ? (
					<>
						<QrCode value={subscription.id} />
						<div className="text-center text-sm text-muted-foreground">
							<p>Manual code:</p>
							<p className="font-mono">{subscription.id}</p>
						</div>
					</>
				) : (
					<div className="text-center text-red-600">
						<p>Your registration is not valid.</p>
						<p>Please contact the event organizer.</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
