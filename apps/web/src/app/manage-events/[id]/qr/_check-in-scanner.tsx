"use client";

import type { SubscriptionCheckInResponseSchema } from "@repo/schemas";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type FeedbackIntent = "success" | "warning" | "danger";

type BarcodeDetectorResult = {
	rawValue?: string;
};

type BarcodeDetectorInstance = {
	detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>;
};

type BarcodeDetectorCtor = new (config?: { formats?: string[] }) => BarcodeDetectorInstance;

const STATUS_STYLES: Record<
	SubscriptionCheckInResponseSchema["status"],
	{
		title: string;
		intent: FeedbackIntent;
	}
> = {
	success: { title: "Check-in successful", intent: "success" },
	// biome-ignore lint/style/useNamingConvention: API status keys use snake_case
	already_checked_in: { title: "Already checked in", intent: "warning" },
	// biome-ignore lint/style/useNamingConvention: API status keys use snake_case
	invalid_event: { title: "Wrong event", intent: "danger" },
	// biome-ignore lint/style/useNamingConvention: API status keys use snake_case
	invalid_subscription: { title: "Registration not valid", intent: "danger" },
};

const INTENT_CLASSES: Record<FeedbackIntent, string> = {
	success: "border-green-500 bg-green-50 text-green-700",
	warning: "border-amber-500 bg-amber-50 text-amber-700",
	danger: "border-red-500 bg-red-50 text-red-700",
};

interface CheckInScannerProps {
	eventId: string;
	eventName: string;
}

type CheckInResult = SubscriptionCheckInResponseSchema & {
	scannedCode: string;
};

export function CheckInScanner({ eventId, eventName }: CheckInScannerProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationFrameRef = useRef<number>();
	const processingRef = useRef(false);
	const lastScanRef = useRef<{ code: string; time: number } | null>(null);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [result, setResult] = useState<CheckInResult | null>(null);
	const [manualCode, setManualCode] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [torchSupported, setTorchSupported] = useState(false);
	const [torchEnabled, setTorchEnabled] = useState(false);
	const [isCameraReady, setIsCameraReady] = useState(false);

	const statusIntent = useMemo(() => {
		if (!result) return undefined;
		return STATUS_STYLES[result.status].intent;
	}, [result]);

	const toggleTorch = useCallback(async () => {
		const stream = streamRef.current;
		if (!stream) return;

		const [track] = stream.getVideoTracks();
		if (!track) return;

		const capabilities = (track.getCapabilities?.() ?? {}) as { torch?: boolean };
		if (!capabilities || !("torch" in capabilities)) return;

		const enableTorch = !torchEnabled;
		try {
			await track.applyConstraints({
				advanced: [{ torch: enableTorch }] as unknown as MediaTrackConstraints,
			});
			setTorchEnabled(enableTorch);
		} catch (_error) {
			setCameraError("Unable to toggle flashlight on this device.");
		}
	}, [torchEnabled]);

	const submitCheckIn = useCallback(
		async (code: string) => {
			const trimmedCode = code.trim();
			if (!trimmedCode) {
				processingRef.current = false;
				setResult({
					status: "invalid_subscription",
					message: "Enter a valid registration code.",
					scannedCode: code,
				});
				setIsDialogOpen(true);
				return;
			}

			setIsSubmitting(true);

			try {
				const response = await fetch(`${getApiUrl()}/subscriptions/check-in`, {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						eventId,
						subscriptionId: trimmedCode,
					}),
				});

				let payload: SubscriptionCheckInResponseSchema | null = null;
				try {
					payload = (await response.json()) as SubscriptionCheckInResponseSchema;
				} catch (_error) {
					// ignore json parse errors and use fallback
				}

				const fallback: SubscriptionCheckInResponseSchema = {
					status: "invalid_subscription",
					message: "Unable to verify the registration. Please try again.",
				};

				const data = payload ?? fallback;

				setResult({
					...data,
					scannedCode: trimmedCode,
				});
				setIsDialogOpen(true);

				if (data.status === "success") {
					setManualCode("");
				}
			} catch (_error) {
				setResult({
					status: "invalid_subscription",
					message: "Unable to reach the server. Try again.",
					scannedCode: trimmedCode,
				});
				setIsDialogOpen(true);
			} finally {
				setIsSubmitting(false);
				processingRef.current = false;
			}
		},
		[eventId],
	);

	const handleScan = useCallback(
		(value: string) => {
			if (!value || processingRef.current || isDialogOpen) {
				return;
			}

			const code = value.trim();
			if (!code) return;

			const lastScan = lastScanRef.current;
			const now = Date.now();

			if (lastScan && lastScan.code === code && now - lastScan.time < 3000) {
				return;
			}

			lastScanRef.current = { code, time: now };
			processingRef.current = true;
			void submitCheckIn(code);
		},
		[isDialogOpen, submitCheckIn],
	);

	useEffect(() => {
		let detector: BarcodeDetectorInstance | null = null;
		let isMounted = true;

		const startCamera = async () => {
			if (!videoRef.current) return;

			if (typeof window === "undefined") {
				return;
			}

			setCameraError(null);

			const maybeDetectorCtor = (window as Record<string, unknown>).BarcodeDetector;

			if (typeof maybeDetectorCtor !== "function") {
				setCameraError("QR scanning is not supported on this device. Use manual code entry.");
				return;
			}

			try {
				const detectorCtor = maybeDetectorCtor as BarcodeDetectorCtor;
				detector = new detectorCtor({ formats: ["qr_code"] });
			} catch (_error) {
				setCameraError("Unable to initialize the QR detector. Use manual code entry.");
				return;
			}

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: { ideal: "environment" },
					},
				});

				if (!isMounted) {
					for (const track of stream.getTracks()) {
						track.stop();
					}
					return;
				}

				streamRef.current = stream;
				setTorchEnabled(false);
				const video = videoRef.current;
				if (!video) {
					for (const track of stream.getTracks()) {
						track.stop();
					}
					return;
				}

				video.srcObject = stream;
				await video.play();
				setIsCameraReady(true);

				const track = stream.getVideoTracks()[0];
				setTorchSupported(false);
				const capabilities = (track?.getCapabilities?.() ?? {}) as { torch?: boolean };
				if ("torch" in capabilities) {
					setTorchSupported(Boolean(capabilities.torch));
				}

				const detect = async () => {
					if (!videoRef.current || !detector || !isMounted) return;

					try {
						const barcodes = await detector.detect(videoRef.current);
						if (barcodes.length > 0) {
							const value = barcodes[0]?.rawValue ?? "";
							if (value) {
								handleScan(value);
							}
						}
					} catch (_error) {
						// Swallow detection errors and continue scanning
					}

					animationFrameRef.current = requestAnimationFrame(detect);
				};

				animationFrameRef.current = requestAnimationFrame(detect);
			} catch (_error) {
				setCameraError("Unable to access the camera. Check permissions or use manual code entry.");
			}
		};

		startCamera();

		return () => {
			isMounted = false;
			cancelAnimationFrame(animationFrameRef.current ?? 0);
			const currentStream = streamRef.current;
			if (currentStream) {
				for (const track of currentStream.getTracks()) {
					track.stop();
				}
			}
		};
	}, [handleScan]);

	const handleManualSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (processingRef.current) return;
			processingRef.current = true;
			lastScanRef.current = { code: manualCode.trim(), time: Date.now() };
			void submitCheckIn(manualCode);
		},
		[manualCode, submitCheckIn],
	);

	const statusClasses = statusIntent ? INTENT_CLASSES[statusIntent] : "";

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
				<div className="rounded-lg border bg-card p-6 shadow-sm">
					<h1 className="text-2xl font-semibold">Event Check-in</h1>
					<p className="text-muted-foreground">Event: {eventName}</p>
				</div>

				<div className="grid gap-6 md:grid-cols-[2fr,1fr]">
					<div className="flex flex-col gap-4">
						<div className="relative overflow-hidden rounded-lg border border-border bg-black/80">
							<video
								ref={videoRef}
								className="aspect-square w-full object-cover"
								muted
								autoPlay
								playsInline
							/>
							{!isCameraReady && !cameraError && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/60">
									<p className="text-sm text-white">Initializing camera…</p>
								</div>
							)}
							{cameraError && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 text-center text-sm text-white">
									{cameraError}
								</div>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="secondary"
								type="button"
								onClick={toggleTorch}
								disabled={!torchSupported || Boolean(cameraError)}
							>
								{torchEnabled ? "Turn off flashlight" : "Turn on flashlight"}
							</Button>
						</div>
					</div>

					<div className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm">
						<h2 className="text-lg font-medium">Manual lookup</h2>
						<p className="text-sm text-muted-foreground">
							Enter the attendee code printed below the QR if scanning fails.
						</p>
						<form onSubmit={handleManualSubmit} className="space-y-3">
							<label className="text-sm font-medium" htmlFor="manual-code">
								Subscription code
							</label>
							<Input
								id="manual-code"
								value={manualCode}
								onChange={(event) => setManualCode(event.target.value)}
								placeholder="UUID code"
								autoComplete="off"
								autoCorrect="off"
								spellCheck={false}
								disabled={isSubmitting}
							/>
							<Button className="w-full" type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Checking…" : "Validate registration"}
							</Button>
						</form>

						{result && (
							<div className={cn("rounded-lg border p-4 text-sm", statusClasses)}>
								<p className="font-medium">{STATUS_STYLES[result.status].title}</p>
								<p className="mt-1">{result.message}</p>
								{result.attendeeName && (
									<p className="mt-2 text-muted-foreground">Attendee: {result.attendeeName}</p>
								)}
								<p className="mt-2 text-muted-foreground">
									Code: <span className="font-mono">{result.scannedCode}</span>
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className={cn(statusClasses)}>
					<DialogHeader>
						<DialogTitle>{result ? STATUS_STYLES[result.status].title : "Check-in"}</DialogTitle>
						{result && (
							<DialogDescription className="text-base">{result.message}</DialogDescription>
						)}
					</DialogHeader>
					{result && (
						<div className="space-y-2 text-sm">
							{result.attendeeName && (
								<p>
									<span className="font-medium">Attendee:</span> {result.attendeeName}
								</p>
							)}
							<p>
								<span className="font-medium">Code:</span>{" "}
								<span className="font-mono">{result.scannedCode}</span>
							</p>
							{result.subscription && (
								<p className="text-muted-foreground">
									Status updated to {result.subscription.status}.
								</p>
							)}
						</div>
					)}
					<DialogFooter>
						<Button type="button" onClick={() => setIsDialogOpen(false)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
