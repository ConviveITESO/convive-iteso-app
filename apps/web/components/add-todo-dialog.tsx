"use client";

import type { CreateTodoSchema } from "@repo/schemas";
import { useId, useState } from "react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

interface AddTodoDialogProps {
	onTodoAdded: () => void;
}

export default function AddTodoDialog({ onTodoAdded }: AddTodoDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const titleId = useId();
	const descriptionId = useId();
	const statusId = useId();
	const [formData, setFormData] = useState<CreateTodoSchema>({
		title: "",
		description: "",
		status: "todo",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("http://localhost:8080/todos/todo", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				setOpen(false);
				setFormData({ title: "", description: "", status: "todo" });
				onTodoAdded();
			} else {
				console.error("Failed to create todo");
			}
		} catch (error) {
			console.error("Error creating todo:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>Add New Todo</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New Todo</DialogTitle>
					<DialogDescription>
						Create a new todo item. Fill in the details below.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={titleId} className="text-right">
								Title
							</Label>
							<Input
								id={titleId}
								value={formData.title}
								onChange={(e) =>
									setFormData({
										...formData,
										title: e.target.value,
									})
								}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label
								htmlFor={descriptionId}
								className="text-right"
							>
								Description
							</Label>
							<Textarea
								id={descriptionId}
								value={formData.description}
								onChange={(e) =>
									setFormData({
										...formData,
										description: e.target.value,
									})
								}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={statusId} className="text-right">
								Status
							</Label>
							<Select
								value={formData.status}
								onValueChange={(value) =>
									setFormData({
										...formData,
										status: value as
											| "todo"
											| "in_progress"
											| "done"
											| "cancelled",
									})
								}
							>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todo">To Do</SelectItem>
									<SelectItem value="in_progress">
										In Progress
									</SelectItem>
									<SelectItem value="done">Done</SelectItem>
									<SelectItem value="cancelled">
										Cancelled
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={loading}>
							{loading ? "Creating..." : "Create Todo"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
