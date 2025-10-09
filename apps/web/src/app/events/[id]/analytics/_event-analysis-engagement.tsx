"use client";

import { Eye, Heart, Image, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function EventAnalyticsEngagement() {
	const [impressions] = useState(0);
	const [interactions] = useState(0);

	return (
		<>
			<div className="">
				<div className="flex justify-between px-4 pb-4">
					<div>
						<div className="flex items-center text-center text-sm">
							Impressions <Eye className="pl-2" />
						</div>
						<div className="text-3xl font-bold">{impressions}</div>
					</div>
					<div>
						<div className="flex items-center text-center text-sm">
							Interactions <MessageSquare className="pl-2" />
						</div>
						<div className="text-3xl font-bold">{interactions}</div>
					</div>
				</div>
			</div>
			<Separator />
			<div>
				<ScrollArea className={`w-full h-80 p-2`}>
					<div className="grid grid-cols-4 gap-4 py-2">
						{/* 1/4 */}
						<div className="col-span-1 rounded-2xl p-4">
							<Avatar className="h-10 w-10">
								<AvatarImage src="" alt="alt" />
								<AvatarFallback> JJ </AvatarFallback>
							</Avatar>
						</div>

						{/* 3/4 */}
						<div className="col-span-3 rounded-2xl border p-4">
							<div>
								¡Este evento estuvo increíble! La organización y las charlas fueron de primera.
							</div>
							<div>
								<div className="flex items-center justify-between">
									<div className="flex items-center">
										<Button type="button" variant="ghost" size="sm" className="rounded-full">
											<Heart className={`h-4 w-4 fill-current text-primary`} />
										</Button>
										<span className="text-sm text-muted-foreground">3</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-4 gap-4 py-2">
						{/* 1/4 */}
						<div className="col-span-1 rounded-2xl p-4">
							<Avatar className="h-10 w-10">
								<AvatarImage src="" alt="alt" />
								<AvatarFallback> R </AvatarFallback>
							</Avatar>
						</div>

						{/* 3/4 */}
						<div className="col-span-3 rounded-2xl border p-4 shadow-2xl flex justify-center">
							<Image className="h-12 w-12 text-gray-400" />
						</div>
					</div>

					<div className="grid grid-cols-4 gap-4 py-2">
						{/* 1/4 */}
						<div className="col-span-1 rounded-2xl p-4">
							<Avatar className="h-10 w-10">
								<AvatarImage src="" alt="alt" />
								<AvatarFallback> A </AvatarFallback>
							</Avatar>
						</div>

						{/* 3/4 */}
						<div className="col-span-3 rounded-2xl border p-4 shadow-2xl flex justify-center">
							<Image className="h-12 w-12 text-gray-400" />
						</div>
					</div>
				</ScrollArea>
			</div>
		</>
	);
}
