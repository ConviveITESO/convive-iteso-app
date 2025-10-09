"use client";

import { createUserSchema, ZodError } from "@repo/schemas";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getApiUrl } from "@/lib/api";

interface AddUserDialogProps {
	onUserAdded: () => void;
}

interface FormData {
	name: string;
	email: string;
	role: string;
	status: string;
}

interface FormErrors {
	name?: string;
	email?: string;
	role?: string;
	status?: string;
}

export default function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});

	const nameId = useId();
	const emailId = useId();
	const roleId = useId();
	const statusId = useId();

	const [formData, setFormData] = useState<FormData>({
		name: "",
		email: "",
		role: "",
		status: "",
	});

	const validateForm = () => {
		try {
			const validatedData = createUserSchema.parse({
				name: formData.name,
				email: formData.email,
				role: formData.role,
				status: formData.status,
			});
			setErrors({});
			return validatedData;
		} catch (error) {
			const newErrors: FormErrors = {};
			if (error instanceof ZodError) {
				// Use the native ZodError.issues array
				for (const issue of error.issues) {
					const field = issue.path[0] as keyof FormErrors;
					if (field && !newErrors[field]) {
						newErrors[field] = issue.message;
					}
				}
			}
			setErrors(newErrors);
			return null;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const validatedData = validateForm();
		if (!validatedData) return;

		setLoading(true);
		console.log(createUserSchema.encode(validatedData));

		try {
			const response = await fetch(`${getApiUrl()}/user`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify(createUserSchema.encode(validatedData)),
			});

			if (response.ok) {
				setOpen(false);
				setFormData({
					name: "",
					email: "",
					role: "",
					status: "",
				});
				setErrors({});
				onUserAdded();
			} else {
				// Handle error appropriately in production
				await response.json();
				window.location.href = "/";
			}
		} catch {
			// Handle error appropriately in production
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>Add New User</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New User</DialogTitle>
					<DialogDescription>
						Create a new user account. Fill in all the required details below.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={nameId} className="text-right">
								Name
							</Label>
							<div className="col-span-3">
								<Input
									id={nameId}
									value={formData.name}
									onChange={(e) =>
										setFormData({
											...formData,
											name: e.target.value,
										})
									}
									className={errors.name ? "border-red-500" : ""}
								/>
								{errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
							</div>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={emailId} className="text-right">
								Email
							</Label>
							<div className="col-span-3">
								<Input
									id={emailId}
									type="email"
									value={formData.email}
									onChange={(e) =>
										setFormData({
											...formData,
											email: e.target.value,
										})
									}
									className={errors.email ? "border-red-500" : ""}
								/>
								{errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
							</div>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={roleId} className="text-right">
								Role
							</Label>
							<div className="col-span-3">
								<Select
									value={formData.role}
									onValueChange={(value) =>
										setFormData({
											...formData,
											role: value,
										})
									}
								>
									<SelectTrigger id={roleId} className={errors.role ? "border-red-500" : ""}>
										<SelectValue placeholder="Select a role" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="student">Student</SelectItem>
									</SelectContent>
								</Select>
								{errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
							</div>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={statusId} className="text-right">
								Status
							</Label>
							<div className="col-span-3">
								<Select
									value={formData.status}
									onValueChange={(value) =>
										setFormData({
											...formData,
											status: value,
										})
									}
								>
									<SelectTrigger id={statusId} className={errors.status ? "border-red-500" : ""}>
										<SelectValue placeholder="Select a status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">Active</SelectItem>
										<SelectItem value="deleted">Deleted</SelectItem>
									</SelectContent>
								</Select>
								{errors.status && <p className="text-sm text-red-500 mt-1">{errors.status}</p>}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={loading}>
							{loading ? "Creating..." : "Create User"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
