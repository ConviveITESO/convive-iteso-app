"use client";

import type { UpdateTodoSchema } from "@repo/schemas";
import { useId, useState } from "react";
import { getApiUrl } from "@/lib/api";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

interface Props {
	id: string;
	title: string;
	description: string;
	status: string;
	createdAt: string;
	onTodoUpdated: () => void;
}

export default function TodoCard({
	id,
	title,
	description,
	status,
	createdAt,
	onTodoUpdated,
}: Props) {
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const editTitleId = useId();
	const editDescriptionId = useId();
	const [formData, setFormData] = useState<UpdateTodoSchema>({
		title,
		description,
		status: status as "todo" | "in_progress" | "done" | "cancelled",
	});

	const statusDisplay = () => {
		switch (status) {
			case "todo":
				return "To Do";
			case "in_progress":
				return "In Progress";
			case "done":
				return "Done";
			case "cancelled":
				return "Cancelled";
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch(`${getApiUrl()}/todos/todo/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				setEditOpen(false);
				onTodoUpdated();
			} else {
				console.error("Failed to update todo");
			}
		} catch (error) {
			console.error("Error updating todo:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		setLoading(true);

		try {
			const response = await fetch(`${getApiUrl()}/todos/todo/${id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				setDeleteOpen(false);
				onTodoUpdated();
			} else {
				console.error("Failed to delete todo");
			}
		} catch (error) {
			console.error("Error deleting todo:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
					<CardAction className="flex flex-col-reverse items-center gap-2">
						<Badge variant="secondary">{statusDisplay()}</Badge>
						<span className="text-sm text-muted-foreground">
							{new Date(createdAt).toLocaleDateString("es")}
						</span>
					</CardAction>
					<CardContent className="mt-3 flex w-full justify-between items-center">
						<Button variant="outline" onClick={() => setEditOpen(true)}>
							Edit
						</Button>
						<Button variant="destructive" onClick={() => setDeleteOpen(true)}>
							Delete
						</Button>
					</CardContent>
				</CardHeader>
			</Card>

			{/* Edit Dialog */}
			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Edit Todo</DialogTitle>
						<DialogDescription>Update the todo item details below.</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleUpdate}>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor={editTitleId} className="text-right">
									Title
								</Label>
								<Input
									id={editTitleId}
									value={formData.title}
									onChange={(e) =>
										setFormData({
											...formData,
											title: e.target.value,
										})
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor={editDescriptionId} className="text-right">
									Description
								</Label>
								<Textarea
									id={editDescriptionId}
									value={formData.description}
									onChange={(e) =>
										setFormData({
											...formData,
											description: e.target.value,
										})
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="edit-status" className="text-right">
									Status
								</Label>
								<Select
									value={formData.status}
									onValueChange={(value) =>
										setFormData({
											...formData,
											status: value as "todo" | "in_progress" | "done" | "cancelled",
										})
									}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="todo">To Do</SelectItem>
										<SelectItem value="in_progress">In Progress</SelectItem>
										<SelectItem value="done">Done</SelectItem>
										<SelectItem value="cancelled">Cancelled</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? "Updating..." : "Update Todo"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Todo</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this todo? This action cannot be undone.
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
