"use client";

import { SendHorizonal } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiUrl } from "@/lib/api";

type Message = {
	id: string;
	userId: string;
	content: string;
	createdAt: string;
};

export default function ChatPage() {
	const params = useParams();
	const rawEventId = params.id;
	const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sending, setSending] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const apiBaseUrl = getApiUrl();

	useEffect(() => {
		if (!eventId) return;
		let active = true;

		async function loadMessages() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${apiBaseUrl}/chat/${eventId}`, { credentials: "include" });
				if (!res.ok) throw new Error("Failed to load chat messages.");
				const data = (await res.json()) as Message[];
				if (active) {
					setMessages(data);
				}
			} catch {
				if (active) {
					setError("We couldn't load the chat messages. Please try again.");
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}

		void loadMessages();

		return () => {
			active = false;
		};
	}, [apiBaseUrl, eventId]);

	// 🔹 Cargar mensajes
	useEffect(() => {
		if (!messages.length) return;
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	const handleSend = async () => {
		if (!input.trim() || !eventId) return;
		setSending(true);
		setError(null);
		try {
			const res = await fetch(`${apiBaseUrl}/chat/${eventId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: input.trim() }),
				credentials: "include",
			});

			if (!res.ok) throw new Error("Failed to send message.");

			const newMsg = (await res.json()) as Message;
			setMessages((prev) => [...prev, newMsg]);
			setInput("");
		} catch {
			setError("We couldn't send your message. Please try again.");
		} finally {
			setSending(false);
		}
	};

	if (!eventId) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<p className="text-sm text-muted-foreground">Invalid event identifier.</p>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col bg-background">
			<div className="border-b px-4 py-3 flex items-center justify-between">
				<h1 className="text-lg font-semibold">Chat del evento {eventId}</h1>
			</div>

			<Card className="flex flex-1 flex-col rounded-none border-0">
				<CardContent className="flex flex-col flex-1 p-0">
					{error && (
						<p role="alert" className="px-4 pt-3 text-sm text-red-600">
							{error}
						</p>
					)}
					<ScrollArea className="flex-1 px-4 py-3">
						{loading ? (
							<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
								Loading messages…
							</div>
						) : (
							<>
								{messages.map((msg) => (
									<div key={msg.id} className="mb-4 flex items-start gap-3">
										<Avatar className="size-8 shrink-0">
											<AvatarImage
												src={`https://api.dicebear.com/8.x/initials/svg?seed=${msg.userId}`}
											/>
											<AvatarFallback>U</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">Usuario</span>
												<span className="text-xs text-muted-foreground">
													{new Date(msg.createdAt).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
											</div>
											<p className="text-sm text-muted-foreground">{msg.content}</p>
										</div>
									</div>
								))}
								<div ref={scrollRef} />
							</>
						)}
					</ScrollArea>

					<div className="border-t p-3 flex items-center gap-2">
						<Input
							placeholder="Escribe un mensaje..."
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSend()}
							className="flex-1"
							disabled={sending}
						/>
						<Button size="icon" onClick={handleSend} disabled={sending || !input.trim()}>
							<SendHorizonal className="size-4" />
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
