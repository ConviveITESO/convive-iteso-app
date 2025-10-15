"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createNotification, type CreateNotificationInput } from "@/services/notifications";

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
		console.log("[CreateNotification] submitting values:", values);
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
			console.log("[CreateNotification] created:", created);
			onCreated(created);
			reset({ kind: "reminder" });
			setOpen(false);
		} catch (e) {
			console.error("createNotification failed:", e);
			alert("No se pudo crear la notificación.");
		}
	}

	function onError(errs: unknown) {
		console.warn("[CreateNotification] validation errors:", errs);
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

						<form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-3">
							<div>
								<label className="mb-1 block text-xs font-medium">Kind</label>
								<select
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
								<label className="mb-1 block text-xs font-medium">Title</label>
								<input
									{...register("title")}
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
									placeholder="Title"
								/>
								{errors.title && (
									<p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
								)}
							</div>

							<div>
								<label className="mb-1 block text-xs font-medium">Body</label>
								<textarea
									{...register("body")}
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
									rows={3}
									placeholder="Message to the user…"
								/>
								{errors.body && <p className="mt-1 text-xs text-red-600">{errors.body.message}</p>}
							</div>

							<div>
								<label className="mb-1 block text-xs font-medium">User ID</label>
								<input
									{...register("userId", { valueAsNumber: true })}
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
									placeholder="1"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="mb-1 block text-xs font-medium">Event ID (optional)</label>
									<input
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
									<label className="mb-1 block text-xs font-medium">Location (meta)</label>
									<input
										{...register("location")}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
										placeholder="Building W, Room 204"
									/>
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium">Original date (meta)</label>
									<input
										{...register("originalDate")}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
										placeholder="2025-01-09 10:00"
									/>
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium">New date (meta)</label>
									<input
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
