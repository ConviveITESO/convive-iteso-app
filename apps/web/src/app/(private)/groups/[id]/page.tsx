"use client";

import { SendHorizonal } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useGroupMessages, useSendGroupMessage } from "@/hooks/use-group-messages";
import { useHeaderTitle } from "@/hooks/use-header-title";

export default function ChatPage() {
	const { isAuthenticated } = useAuth();
	const params = useParams();
	const rawGroupId = params.id;
	const groupId = Array.isArray(rawGroupId) ? rawGroupId[0] : rawGroupId;
	const [input, setInput] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const { id } = useParams();
	useHeaderTitle(`Group ${id ?? ""}`, { showBackButton: true });

	const { data: messages = [], isLoading, isError } = useGroupMessages(groupId);
	const { mutate: sendMessage, isPending: sending } = useSendGroupMessage(groupId);

	const loading = isLoading || !isAuthenticated;

	useEffect(() => {
		if (!messages.length) return;
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	const handleSend = () => {
		if (!input.trim()) return;
		sendMessage(input.trim(), {
			onSuccess: () => {
				setInput("");
			},
		});
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	if (!groupId) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<p className="text-sm text-muted-foreground">Invalid group identifier.</p>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col bg-background">
			<div className="border-b px-4 py-3 flex items-center justify-between">
				<h1 className="text-lg font-semibold">Group chat</h1>
			</div>

			<Card className="flex flex-1 flex-col rounded-none border-0">
				<CardContent className="flex flex-col flex-1 p-0">
					{isError && (
						<p role="alert" className="px-4 pt-3 text-sm text-red-600">
							We couldn't load the chat messages. Please try again.
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
											{msg.profile ? <AvatarImage src={msg.profile} alt={msg.username} /> : null}
											<AvatarFallback className="bg-muted">
												{getInitials(msg.username)}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">{msg.username}</span>
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
