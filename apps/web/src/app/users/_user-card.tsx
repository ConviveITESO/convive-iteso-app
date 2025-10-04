"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface User {
	id: string;
	name: string;
	email: string;
	age: number;
	birthDate: string;
	createdAt?: string;
}

interface UserCardProps extends User {
	onUserDeleted: () => void;
}

export default function UserCard({
	id,
	name,
	email,
	age,
	birthDate,
	createdAt,
	onUserDeleted,
}: UserCardProps) {
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		setLoading(true);

		try {
			const response = await fetch(`http://localhost:8080/user/${id}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (response.ok) {
				setDeleteOpen(false);
				onUserDeleted();
			} else {
				window.location.href = "/";
			}
		} catch {
			// Handle error appropriately in production
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("es");
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{name}</CardTitle>
					<CardDescription>{email}</CardDescription>
					<CardAction className="flex flex-col-reverse items-center gap-2">
						<Badge variant="secondary">Age: {age}</Badge>
						<span className="text-sm text-muted-foreground">Born: {formatDate(birthDate)}</span>
						{createdAt && (
							<span className="text-sm text-muted-foreground">
								Created: {formatDate(createdAt)}
							</span>
						)}
					</CardAction>
					<CardContent className="mt-3 flex w-full justify-end items-center">
						<Button variant="destructive" onClick={() => setDeleteOpen(true)}>
							Delete
						</Button>
					</CardContent>
				</CardHeader>
			</Card>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete User</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete {name}? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={loading}>
							{loading ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
