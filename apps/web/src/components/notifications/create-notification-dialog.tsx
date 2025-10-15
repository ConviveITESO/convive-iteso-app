"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type CreateNotificationInput, createNotification } from "@/services/notifications";

const schema = z.object({
	kind: z.enum(["canceled", "rescheduled", "reminder", "location"]),
	title: z.string().min(3, "Title is required"),
	body: z.string().min(3, "Body is required"),
	userId: z.number().int().positive().optional(),
	eventId: z.number().int().positive().optional(),
	originalDate: z.string().optional(),
	newDate: z.string().optional(),
	location: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateNotificationDialog({
	onCreated,
}: {
	onCreated: (n: Awaited<ReturnType<typeof createNotification>>) => void;
}) {
	const [open, setOpen] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { kind: "reminder" },
		mode: "onSubmit",
	});

	async function onSubmit(values: FormValues) {
		setSubmitError(null);
		try {
			const payload: CreateNotificationInput = {
				kind: values.kind,
				title: values.title,
				body: values.body,
				eventId: values.eventId,
				userId: values.userId,
				meta: {
					originalDate: values.originalDate || undefined,
					newDate: values.newDate || undefined,
					location: values.location || undefined,
				},
			};
			const created = await createNotification(payload);
			onCreated(created);
			reset({ kind: "reminder" });
			setOpen(false);
			setSubmitError(null);
		} catch (_error) {
			alert("No se pudo crear la notificación.");
			setSubmitError("We could not create the notification. Please try again.");
		}
	}

	function onError() {
		setSubmitError("Please review the highlighted fields.");
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="rounded bg-black px-3 py-1.5 text-xs text-white hover:bg-gray-800"
			>
				New notification
			</button>

			{open && (
				<div className="fixed mt-80 inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-sm font-semibold">Create notification</h2>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="rounded p-1 text-gray-500 hover:bg-black/5"
								aria-label="Close"
							>
								✕
							</button>
						</div>
						{submitError && (
							<p role="alert" className="mb-3 text-xs font-medium text-red-600">
								{submitError}
							</p>
						)}

						<form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-3">
							<div>
								<label className="mb-1 block text-xs font-medium" htmlFor="notification-kind">
									Kind
								</label>
								<select
									id="notification-kind"
									{...register("kind")}
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
								>
									<option value="reminder">Reminder</option>
									<option value="rescheduled">Rescheduled</option>
									<option value="canceled">Canceled</option>
									<option value="location">Location</option>
								</select>
							</div>

							<div>
								<label className="mb-1 block text-xs font-medium" htmlFor="notification-title">
									Title
								</label>
								<input
									id="notification-title"
									{...register("title")}
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
									placeholder="Title"
								/>
								{errors.title && (
									<p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
								)}
							</div>

							<div>
								<label className="mb-1 block text-xs font-medium" htmlFor="notification-body">
									Body
								</label>
								<textarea
									id="notification-body"
									{...register("body")}
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
									rows={3}
									placeholder="Message to the user…"
								/>
								{errors.body && <p className="mt-1 text-xs text-red-600">{errors.body.message}</p>}
							</div>

							<div>
								<label className="mb-1 block text-xs font-medium" htmlFor="notification-user-id">
									User ID
								</label>
								<input
									id="notification-user-id"
									{...register("userId", { valueAsNumber: true })}
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
									placeholder="1"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="mb-1 block text-xs font-medium" htmlFor="notification-event-id">
										Event ID (optional)
									</label>
									<input
										id="notification-event-id"
										{...register("eventId", {
											setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)),
										})}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
										placeholder="e.g. 42"
									/>
									{errors.eventId && (
										<p className="mt-1 text-xs text-red-600">
											{String(errors.eventId.message ?? "Invalid number")}
										</p>
									)}
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium" htmlFor="notification-location">
										Location (meta)
									</label>
									<input
										id="notification-location"
										{...register("location")}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
										placeholder="Building W, Room 204"
									/>
								</div>

								<div>
									<label
										className="mb-1 block text-xs font-medium"
										htmlFor="notification-original-date"
									>
										Original date (meta)
									</label>
									<input
										id="notification-original-date"
										{...register("originalDate")}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
										placeholder="2025-01-09 10:00"
									/>
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium" htmlFor="notification-new-date">
										New date (meta)
									</label>
									<input
										id="notification-new-date"
										{...register("newDate")}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
										placeholder="2025-01-09 18:00"
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-2 pt-2">
								<button
									type="button"
									onClick={() => setOpen(false)}
									className="rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="rounded bg-black px-3 py-1.5 text-xs text-white hover:bg-gray-800 disabled:opacity-50"
								>
									{isSubmitting ? "Creating..." : "Create"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
