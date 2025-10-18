"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

type SubmissionState = "idle" | "loading" | "success" | "error";

type JobStatus = {
	id: string;
	state: string;
	failedReason: string | null;
	attemptsMade: number;
};

type QueueCounts = Partial<{
	waiting: number;
	active: number;
	completed: number;
	failed: number;
	delayed: number;
}>;

const defaultPayload = {
	creatorName: "Event Organizer",
	creatorEmail: "organizer@example.com",
	eventName: "Convive ITESO demo",
	subscriberName: "New Attendee",
};

export function NotificationsTestClient() {
	const [payload, setPayload] = useState(defaultPayload);
	const [status, setStatus] = useState<SubmissionState>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
	const [queueCounts, setQueueCounts] = useState<QueueCounts | null>(null);

	const handleInputChange =
		(field: keyof typeof payload) => (event: ChangeEvent<HTMLInputElement>) => {
			const target = event.currentTarget;
			setPayload((current) => ({ ...current, [field]: target.value }));
		};

	useEffect(() => {
		if (!jobId) {
			return;
		}

		let cancelled = false;
		const pollIntervalMs = 1500;

		const poll = async () => {
			try {
				const [statusRes, countsRes] = await Promise.all([
					fetch(`${getApiUrl()}/notifications/test/${jobId}`, {
						credentials: "include",
					}),
					fetch(`${getApiUrl()}/notifications/test`, {
						credentials: "include",
					}),
				]);

				if (cancelled) return;

				if (statusRes.ok) {
					const statusPayload = (await statusRes.json()) as {
						id: string;
						state: string;
						failedReason: string | null;
						attemptsMade: number;
					};
					setJobStatus(statusPayload);

					if (statusPayload.state === "completed") {
						setStatus("success");
					} else if (statusPayload.state === "failed") {
						setStatus("error");
						setErrorMessage(statusPayload.failedReason ?? "Job failed");
					}
				} else if (statusRes.status === 404) {
					setErrorMessage("Job no longer exists (it may have been cleaned up).");
					setJobStatus(null);
					setStatus("error");
					return;
				}

				if (countsRes.ok) {
					const countsPayload = (await countsRes.json()) as QueueCounts;
					setQueueCounts(countsPayload);
				}
			} catch (error) {
				if (cancelled) return;
				setErrorMessage(
					error instanceof Error ? error.message : "Unexpected error while polling job status",
				);
				setStatus("error");
			}
		};

		const interval = setInterval(poll, pollIntervalMs);
		void poll();

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [jobId]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setStatus("loading");
		setErrorMessage(null);
		setJobId(null);
		setJobStatus(null);

		try {
			const response = await fetch(`${getApiUrl()}/notifications/test`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				credentials: "include",
			});

			if (!response.ok) {
				const errorBody = await response.json().catch(() => ({}));
				throw new Error(errorBody?.message ?? "Failed to enqueue notification");
			}

			const result = (await response.json()) as { jobId: string };
			setJobId(result.jobId);
			setStatus("success");
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unexpected error";
			setErrorMessage(message);
			setStatus("error");
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm text-gray-600">
					Submit the form below to enqueue a subscription-created notification. Once queued, the
					worker will send an email to the creator. Open Mailhog at{" "}
					<a
						className="text-blue-600 underline"
						href="http://localhost:8025"
						target="_blank"
						rel="noopener"
					>
						http://localhost:8025
					</a>{" "}
					to verify the message arrives.
				</p>
				<p className="mt-2 text-xs text-gray-500">
					Make sure both the API (`pnpm run --filter ./apps/api dev`) and the worker (`pnpm run
					--filter ./apps/api dev:worker`) are running before testing.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
				<div className="flex flex-col">
					<label className="text-sm font-medium text-gray-700" htmlFor="creatorName">
						Creator name
					</label>
					<input
						id="creatorName"
						className="mt-1 rounded border border-gray-300 px-3 py-2"
						value={payload.creatorName}
						onChange={handleInputChange("creatorName")}
						required
					/>
				</div>

				<div className="flex flex-col">
					<label className="text-sm font-medium text-gray-700" htmlFor="creatorEmail">
						Creator email
					</label>
					<input
						id="creatorEmail"
						type="email"
						className="mt-1 rounded border border-gray-300 px-3 py-2"
						value={payload.creatorEmail}
						onChange={handleInputChange("creatorEmail")}
						required
					/>
				</div>

				<div className="flex flex-col">
					<label className="text-sm font-medium text-gray-700" htmlFor="eventName">
						Event name
					</label>
					<input
						id="eventName"
						className="mt-1 rounded border border-gray-300 px-3 py-2"
						value={payload.eventName}
						onChange={handleInputChange("eventName")}
						required
					/>
				</div>

				<div className="flex flex-col">
					<label className="text-sm font-medium text-gray-700" htmlFor="subscriberName">
						Subscriber name
					</label>
					<input
						id="subscriberName"
						className="mt-1 rounded border border-gray-300 px-3 py-2"
						value={payload.subscriberName}
						onChange={handleInputChange("subscriberName")}
						required
					/>
				</div>

				<button
					type="submit"
					className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
					disabled={status === "loading"}
				>
					{status === "loading" ? "Queueing..." : "Send Test Notification"}
				</button>
			</form>

			{status === "success" && (
				<p className="text-sm text-green-600">
					Notification queued successfully{jobStatus?.state === "completed" ? " and processed" : ""}
					. Check Mailhog and the job status below.
				</p>
			)}

			{status === "error" && errorMessage && (
				<p className="text-sm text-red-600">Error: {errorMessage}</p>
			)}

			{jobId && (
				<div className="rounded border border-gray-200 p-4">
					<h2 className="text-lg font-semibold">Job status</h2>
					<p className="text-sm text-gray-600">Job ID: {jobId}</p>
					<p className="text-sm">
						State: <span className="font-medium">{jobStatus?.state ?? "checking..."}</span>
					</p>
					{jobStatus?.failedReason && (
						<p className="text-sm text-red-600">Failure: {jobStatus.failedReason}</p>
					)}
					<p className="text-sm text-gray-600">Attempts: {jobStatus?.attemptsMade ?? 0}</p>
				</div>
			)}

			{queueCounts && (
				<div className="rounded border border-gray-200 p-4">
					<h2 className="text-lg font-semibold">Queue overview</h2>
					<ul className="text-sm text-gray-700">
						<li>Waiting: {queueCounts.waiting ?? 0}</li>
						<li>Active: {queueCounts.active ?? 0}</li>
						<li>Completed: {queueCounts.completed ?? 0}</li>
						<li>Failed: {queueCounts.failed ?? 0}</li>
						<li>Delayed: {queueCounts.delayed ?? 0}</li>
					</ul>
				</div>
			)}
		</div>
	);
}
