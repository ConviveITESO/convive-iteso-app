import { DialogTrigger } from "@radix-ui/react-dialog";
import type { CommentByEventResponseSchema } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareTextIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiUrl } from "@/lib/api";
import { getNameInitials } from "@/lib/utils";

interface Props {
	eventId: string;
}

export default function CommentsModal({ eventId }: Props) {
	const { data: comments } = useQuery({
		queryKey: ["comments", eventId],
		queryFn: async () => {
			const response = await fetch(`${getApiUrl()}/comments/event/${eventId}`, {
				credentials: "include",
			});
			if (response.status === 401 || response.status === 403) {
				window.location.href = "/";
				throw new Error("Unauthorized");
			}
			return (await response.json()) as Promise<CommentByEventResponseSchema[]>;
		},
		enabled: Boolean(eventId),
	});

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className="rounded-full" variant="ghost">
					<MessageSquareTextIcon />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">Comments</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-8">
					{comments && comments.length > 0 ? (
						comments?.map((c) => (
							<div key={c.id}>
								<div className="flex items-center gap-2">
									<Avatar>
										<AvatarImage src={c.user.profile || ""} />
										<AvatarFallback>{getNameInitials(c.user.name)}</AvatarFallback>
									</Avatar>
									<strong className="text-xs">{c.user.name}</strong>
								</div>
								<p className="opacity-70 ml-10">{c.commentText}</p>
							</div>
						))
					) : (
						<p className="text-center opacity-70">No comments yet</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
