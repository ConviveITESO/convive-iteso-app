"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export type AttendeeStatus = "enrolled" | "confirmed" | "owner";

const STATUS_STYLE: Record<AttendeeStatus, string> = {
	enrolled: "bg-blue-100 text-blue-700 border border-blue-200",
	confirmed: "bg-green-100 text-green-700 border border-green-200",
	owner: "bg-purple-100 text-purple-700 border border-purple-200",
};

export default function EventAnalyticsAssistants() {
	return (
		<>
			<div className="flex justify-center">
				<Input type="search" placeholder="Search..." className="rounded-2xl" />
			</div>
			<ScrollArea className={`w-full h-50 p-2`}>
				<ul className="space-y-1">
					<li className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/40">
						<div className="flex items-center gap-3">
							<Avatar className="h-10 w-10">
								<AvatarImage src="" alt="alt" />
								<AvatarFallback> JJ </AvatarFallback>
							</Avatar>
							<div className="leading-tight">
								<div className="font-medium">Jose Jorge Villarreal Farias</div>
								<div className="text-sm text-muted-foreground">Ing. en desarrollo de software</div>
							</div>
						</div>
						<Badge
							variant="secondary"
							className={`px-2 py-0.5 text-xs font-medium ${STATUS_STYLE.enrolled} rounded-2xl`}
						>
							Enrolled
						</Badge>
					</li>
					<li className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/40">
						<div className="flex items-center gap-3">
							<Avatar className="h-10 w-10">
								<AvatarImage src="" alt="alt" />
								<AvatarFallback> JJ </AvatarFallback>
							</Avatar>
							<div className="leading-tight">
								<div className="font-medium">Jose Jorge Villarreal Farias</div>
								<div className="text-sm text-muted-foreground">Ing. en desarrollo de software</div>
							</div>
						</div>
						<Badge
							variant="secondary"
							className={`px-2 py-0.5 text-xs font-medium ${STATUS_STYLE.confirmed} rounded-2xl`}
						>
							confirmed
						</Badge>
					</li>
					<li className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/40">
						<div className="flex items-center gap-3">
							<Avatar className="h-10 w-10">
								<AvatarImage src="" alt="alt" />
								<AvatarFallback> JJ </AvatarFallback>
							</Avatar>
							<div className="leading-tight">
								<div className="font-medium">Jose Jorge Villarreal Farias</div>
								<div className="text-sm text-muted-foreground">Ing. en desarrollo de software</div>
							</div>
						</div>
						<Badge
							variant="secondary"
							className={`px-2 py-0.5 text-xs font-medium ${STATUS_STYLE.owner} rounded-2xl`}
						>
							owner
						</Badge>
					</li>
				</ul>
			</ScrollArea>
		</>
	);
}
