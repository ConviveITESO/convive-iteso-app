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

interface AddUserDialogProps {
	onUserAdded: () => void;
}

interface FormData {
	name: string;
	email: string;
	age: string;
	birthDate: string;
	password: string;
}

interface FormErrors {
	name?: string;
	email?: string;
	age?: string;
	birthDate?: string;
	password?: string;
}

export default function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});

	const nameId = useId();
	const emailId = useId();
	const ageId = useId();
	const birthDateId = useId();
	const passwordId = useId();

	const [formData, setFormData] = useState<FormData>({
		name: "",
		email: "",
		age: "",
		birthDate: "",
		password: "",
	});

	const validateForm = () => {
		try {
			const validatedData = createUserSchema.parse({
				name: formData.name,
				email: formData.email,
				age: formData.age,
				birthDate: formData.birthDate, // HTML date input already provides YYYY-MM-DD format
				password: formData.password,
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
			const response = await fetch("http://localhost:8080/user", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(createUserSchema.encode(validatedData)),
			});

			if (response.ok) {
				setOpen(false);
				setFormData({
					name: "",
					email: "",
					age: "",
					birthDate: "",
					password: "",
				});
				setErrors({});
				onUserAdded();
			} else {
				// Handle error appropriately in production
				await response.json();
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
							<Label htmlFor={ageId} className="text-right">
								Age
							</Label>
							<div className="col-span-3">
								<Input
									id={ageId}
									type="number"
									value={formData.age}
									onChange={(e) =>
										setFormData({
											...formData,
											age: e.target.value,
										})
									}
									className={errors.age ? "border-red-500" : ""}
								/>
								{errors.age && <p className="text-sm text-red-500 mt-1">{errors.age}</p>}
							</div>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={birthDateId} className="text-right">
								Birth Date
							</Label>
							<div className="col-span-3">
								<Input
									id={birthDateId}
									type="date"
									value={formData.birthDate}
									onChange={(e) =>
										setFormData({
											...formData,
											birthDate: e.target.value,
										})
									}
									className={errors.birthDate ? "border-red-500" : ""}
								/>
								{errors.birthDate && (
									<p className="text-sm text-red-500 mt-1">{errors.birthDate}</p>
								)}
							</div>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={passwordId} className="text-right">
								Password
							</Label>
							<div className="col-span-3">
								<Input
									id={passwordId}
									type="password"
									value={formData.password}
									onChange={(e) =>
										setFormData({
											...formData,
											password: e.target.value,
										})
									}
									className={errors.password ? "border-red-500" : ""}
								/>
								{errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
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
