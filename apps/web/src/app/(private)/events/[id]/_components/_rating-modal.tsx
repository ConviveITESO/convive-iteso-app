"use client";

import { StarIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import RatingStars from "@/components/rating-stars";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getApiUrl } from "@/lib/api";
import type { RatingValue } from "@/types/misc";

interface Props {
	eventId: string;
	userHasRated: boolean;
}

export default function RatingModal({ eventId, userHasRated }: Props) {
	const [rating, setRating] = useState<RatingValue>();
	const [comment, setComment] = useState<string>();

	const handleRatingSelect = (value: number) => {
		setRating(value as RatingValue);
	};

	const handleFormSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!rating) return;

		const ratingBody: RequestInit = {
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				score: rating,
			}),
		};

		const commentBody: RequestInit = {
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				comment,
			}),
		};

		const sendRating = async () => {
			await fetch(`${getApiUrl()}/ratings/event/${eventId}`, {
				method: "POST",
				...ratingBody,
			});
		};

		const sendComment = async () => {
			await fetch(`${getApiUrl()}/comments/event/${eventId}`, {
				method: "POST",
				...commentBody,
			});
		};

		const sendQueries = [sendRating(), comment && sendComment()];
		try {
			await Promise.all([...sendQueries]);
			window.location.reload(); // reload window to reset all UI state
		} catch {
			alert("ERROR"); // TODO: Change to UI level alerts
		}
	};

	const title = userHasRated ? "Modify your rating" : "Rate this event";
	const description = userHasRated
		? "Change your rating for this event"
		: "Rate this event so event creator can improve the experience";

	return (
		<Dialog
			onOpenChange={(open) => {
				// ensure the dependant values on this dialog are cleaned
				if (!open) {
					setRating(undefined);
				}
				if (!open) {
					setComment(undefined);
				}
			}}
		>
			<DialogTrigger asChild>
				{userHasRated ? (
					// TODO: Change in the future after MVP, if you rated you can't rate anymore via frontend
					<Button variant="outline" className="w-full" disabled={true}>
						<StarIcon color="#ffbf00" fill="#ffbf00" />
						You already rated this event
					</Button>
				) : (
					<Button variant="secondary" className="w-full">
						<StarIcon color="#ffbf00" fill="#ffbf00" />
						Rate this event
					</Button>
				)}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{/** Content of the dialog modal */}
				<form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
					<RatingStars
						className="self-center"
						stars={5}
						initialValue={rating}
						handler={handleRatingSelect}
					/>
					{/** Shady but necessary: If the user already rated, then don't allow him to comment since comments currently are coupled to ratings */}
					{/** TODO: This should change in the future */}
					{!userHasRated && (
						<div>
							<Textarea
								id="comment"
								name="comment"
								placeholder="Comment (Optional)"
								rows={40}
								onChange={(e) => setComment(e.target.value || undefined)}
							/>
						</div>
					)}
					<DialogFooter>
						<Button type="submit">Submit review</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
