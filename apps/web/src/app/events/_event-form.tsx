import type {
	BadgeResponseSchema,
	CategoryResponseSchema,
	LocationResponseSchema,
} from "@repo/schemas";
import { type CreateEventSchema, createEventSchema } from "@repo/schemas";
import { ArrowLeft, Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { combineDateTime, formatLocalDate, formatLocalTime } from "@/lib/date-utils";

interface EventFormData {
	name: string;
	description: string;
	startDate: string;
	startTime: string;
	endDate: string;
	endTime: string;
	locationId: string;
	categoryIds: string[];
	badgeIds: string[];
	quota: number | "";
}

interface EventFormProps {
	mode?: "create" | "edit";
	eventId?: string;
	initialData?: Partial<CreateEventSchema>;
	categories?: CategoryResponseSchema[];
	badges?: BadgeResponseSchema[];
	locations?: LocationResponseSchema[];
	onSave?: (data: CreateEventSchema) => void | Promise<void>;
	onCancel?: () => void;
}

const EventForm = ({
	mode = "create",
	initialData,
	categories = [],
	badges = [],
	locations = [],
	onSave,
	onCancel,
}: EventFormProps) => {
	const [formData, setFormData] = useState<EventFormData>(() => {
		if (initialData) {
			const startDateTime = initialData.startDate ? new Date(initialData.startDate) : null;
			const endDateTime = initialData.endDate ? new Date(initialData.endDate) : null;

			return {
				name: initialData.name || "",
				description: initialData.description || "",
				startDate: formatLocalDate(startDateTime),
				startTime: formatLocalTime(startDateTime),
				endDate: formatLocalDate(endDateTime),
				endTime: formatLocalTime(endDateTime),
				locationId: initialData.locationId || "",
				categoryIds: initialData.categoryIds || [],
				badgeIds: initialData.badgeIds || [],
				quota: initialData.quota ?? "",
			};
		}

		return {
			name: "",
			description: "",
			startDate: "",
			startTime: "",
			endDate: "",
			endTime: "",
			locationId: "",
			categoryIds: [],
			badgeIds: [],
			quota: "",
		};
	});

	const [showCategoriesModal, setShowCategoriesModal] = useState(false);
	const [showBadgesModal, setShowBadgesModal] = useState(false);
	const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleInputChange = (field: keyof EventFormData, value: string | number) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleCategoriesChange = (categoryId: string, checked: boolean) => {
		setFormData((prev) => ({
			...prev,
			categoryIds: checked
				? [...prev.categoryIds, categoryId]
				: prev.categoryIds.filter((id) => id !== categoryId),
		}));
	};

	const handleBadgesChange = (badgeId: string, checked: boolean) => {
		setFormData((prev) => ({
			...prev,
			badgeIds: checked
				? [...prev.badgeIds, badgeId]
				: prev.badgeIds.filter((id) => id !== badgeId),
		}));
	};

	const handleSaveCategories = () => {
		setShowCategoriesModal(false);
	};

	const handleSaveBadges = () => {
		setShowBadgesModal(false);
	};

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof EventFormData, string>> = {};

		const dataToValidate = {
			name: formData.name,
			description: formData.description,
			startDate: combineDateTime(formData.startDate, formData.startTime),
			endDate: combineDateTime(formData.endDate, formData.endTime),
			quota: Number(formData.quota),
			locationId: formData.locationId,
			categoryIds: formData.categoryIds,
			badgeIds: formData.badgeIds,
		};

		const result = createEventSchema.safeParse(dataToValidate);

		if (!result.success) {
			result.error.issues.forEach((issue) => {
				const path = issue.path[0] as string;

				if (path === "startDate") {
					if (!formData.startDate || !formData.startTime) {
						newErrors.startDate = "The start date and time are required";
					} else {
						newErrors.startDate = issue.message;
					}
				} else if (path === "endDate") {
					if (!formData.endDate || !formData.endTime) {
						newErrors.endDate = "The end date and time are required";
					} else {
						newErrors.endDate = issue.message;
					}
				} else {
					const field = path as keyof EventFormData;
					newErrors[field] = issue.message;
				}
			});
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSaveChanges = async () => {
		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			const eventData: CreateEventSchema = {
				name: formData.name,
				description: formData.description,
				startDate: combineDateTime(formData.startDate, formData.startTime),
				endDate: combineDateTime(formData.endDate, formData.endTime),
				quota: Number(formData.quota),
				locationId: formData.locationId,
				categoryIds: formData.categoryIds,
				badgeIds: formData.badgeIds,
			};

			if (onSave) {
				await onSave(eventData);
			}
		} catch (error) {
			// Handle error appropriately
			if (error instanceof Error) {
				// Handle typed error
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleExitWithoutSaving = () => {
		if (onCancel) {
			onCancel();
		}
	};

	const getSelectedCategoriesText = () => {
		if (formData.categoryIds.length === 0) return "Select categories";
		if (formData.categoryIds.length === 1) return "1 category selected";
		return `${formData.categoryIds.length} categories selected`;
	};

	const getSelectedBadgesText = () => {
		if (formData.badgeIds.length === 0) return "Select badges";
		if (formData.badgeIds.length === 1) return "1 badge selected";
		return `${formData.badgeIds.length} badges selected`;
	};

	const pageTitle = mode === "edit" ? "Edit Event" : "Create Event";
	const submitButtonText = mode === "edit" ? "Save changes" : "Create event";

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="bg-card border-b border-border px-4 py-3 flex items-center sticky top-0 z-10">
				<Button variant="ghost" size="sm" className="p-0 mr-3" onClick={handleExitWithoutSaving}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
			</div>

			{/* Form Content */}
			<div className="p-4 space-y-6 max-w-md mx-auto lg:max-w-2xl pb-32">
				{/* Name Field */}
				<div className="space-y-2">
					<Label htmlFor="name" className="text-sm font-medium text-foreground">
						Name <span className="text-destructive">*</span>
					</Label>
					<Input
						id="name"
						placeholder="Event name"
						value={formData.name}
						onChange={(e) => handleInputChange("name", e.target.value)}
						aria-invalid={!!errors.name}
						aria-describedby={errors.name ? "name-error" : undefined}
					/>
					{errors.name && (
						<p id="name-error" className="text-sm text-destructive">
							{errors.name}
						</p>
					)}
				</div>

				{/* Description Field */}
				<div className="space-y-2">
					<Label htmlFor="description" className="text-sm font-medium text-foreground">
						Description <span className="text-destructive">*</span>
					</Label>
					<Input
						id="description"
						placeholder="Event description"
						value={formData.description}
						onChange={(e) => handleInputChange("description", e.target.value)}
						aria-invalid={!!errors.description}
						aria-describedby={errors.description ? "description-error" : undefined}
					/>
					{errors.description && (
						<p id="description-error" className="text-sm text-destructive">
							{errors.description}
						</p>
					)}
				</div>

				{/* Start Date & Time Field */}
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Start date <span className="text-destructive">*</span>
					</Label>
					<div className="flex gap-2">
						<div className="flex-1 relative">
							<Input
								id="startDate"
								type="date"
								placeholder="Pick a date"
								value={formData.startDate}
								onChange={(e) => handleInputChange("startDate", e.target.value)}
								className="pr-10"
								aria-invalid={!!errors.startDate}
								aria-describedby={errors.startDate ? "startDate-error" : undefined}
							/>
							<Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						</div>
						<div className="w-28">
							<Input
								id="startTime"
								type="time"
								value={formData.startTime}
								onChange={(e) => handleInputChange("startTime", e.target.value)}
								aria-invalid={!!errors.startDate}
								aria-describedby={errors.startDate ? "startDate-error" : undefined}
							/>
						</div>
					</div>
					{errors.startDate && (
						<p id="startDate-error" className="text-sm text-destructive">
							{errors.startDate}
						</p>
					)}
				</div>

				{/* End Date & Time Field */}
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						End date <span className="text-destructive">*</span>
					</Label>
					<div className="flex gap-2">
						<div className="flex-1 relative">
							<Input
								id="endDate"
								type="date"
								placeholder="Pick a date"
								value={formData.endDate}
								onChange={(e) => handleInputChange("endDate", e.target.value)}
								className="pr-10"
								aria-invalid={!!errors.endDate}
								aria-describedby={errors.endDate ? "endDate-error" : undefined}
							/>
							<Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						</div>
						<div className="w-28">
							<Input
								id="endTime"
								type="time"
								value={formData.endTime}
								onChange={(e) => handleInputChange("endTime", e.target.value)}
								aria-invalid={!!errors.endDate}
								aria-describedby={errors.endDate ? "endDate-error" : undefined}
							/>
						</div>
					</div>
					{errors.endDate && (
						<p id="endDate-error" className="text-sm text-destructive">
							{errors.endDate}
						</p>
					)}
				</div>

				{/* Location Field */}
				<div className="space-y-2">
					<Label htmlFor="location" className="text-sm font-medium text-foreground">
						Location <span className="text-destructive">*</span>
					</Label>
					<Select
						value={formData.locationId}
						onValueChange={(value) => handleInputChange("locationId", value)}
					>
						<SelectTrigger
							aria-invalid={!!errors.locationId}
							aria-describedby={errors.locationId ? "location-error" : undefined}
						>
							<SelectValue placeholder="Select a location" />
						</SelectTrigger>
						<SelectContent>
							{locations.map((location) => (
								<SelectItem key={location.id} value={location.id}>
									{location.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.locationId && (
						<p id="location-error" className="text-sm text-destructive">
							{errors.locationId}
						</p>
					)}
				</div>

				{/* Categories Field */}
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">Categories</Label>
					<Button
						type="button"
						variant="default"
						className="w-full"
						onClick={() => setShowCategoriesModal(true)}
					>
						{getSelectedCategoriesText()}
					</Button>
				</div>

				{/* Badges Field */}
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">Badges</Label>
					<Button
						type="button"
						variant="default"
						className="w-full"
						onClick={() => setShowBadgesModal(true)}
					>
						{getSelectedBadgesText()}
					</Button>
				</div>

				{/* Quota Field */}
				<div className="space-y-2">
					<Label htmlFor="quota" className="text-sm font-medium text-foreground">
						Quota <span className="text-destructive">*</span>
					</Label>
					<Input
						id="quota"
						type="number"
						min="1"
						placeholder="Number of participants"
						value={formData.quota}
						onChange={(e) =>
							handleInputChange("quota", e.target.value ? Number(e.target.value) : "")
						}
						aria-invalid={!!errors.quota}
						aria-describedby={errors.quota ? "quota-error" : undefined}
					/>
					{errors.quota && (
						<p id="quota-error" className="text-sm text-destructive">
							{errors.quota}
						</p>
					)}
				</div>
			</div>

			{/* Bottom Actions */}
			<div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex gap-3">
				<Button
					type="button"
					variant="outline"
					className="flex-1"
					onClick={handleExitWithoutSaving}
					disabled={isSubmitting}
				>
					Exit without saving
				</Button>
				<Button
					type="button"
					variant="default"
					className="flex-1"
					onClick={handleSaveChanges}
					disabled={isSubmitting}
				>
					{isSubmitting ? "Saving..." : submitButtonText}
				</Button>
			</div>

			{/* Categories Modal */}
			<Dialog open={showCategoriesModal} onOpenChange={setShowCategoriesModal}>
				<DialogContent className="w-[90vw] max-w-md mx-auto">
					<DialogHeader>
						<DialogTitle className="text-center">Categories</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
						{categories.length === 0 ? (
							<p className="text-center text-muted-foreground py-4">No categories available</p>
						) : (
							categories.map((category) => (
								<div key={category.id} className="flex items-center space-x-3">
									<Checkbox
										id={`category-${category.id}`}
										checked={formData.categoryIds.includes(category.id)}
										onCheckedChange={(checked: boolean) =>
											handleCategoriesChange(category.id, !!checked)
										}
									/>
									<Label
										htmlFor={`category-${category.id}`}
										className="flex-1 text-sm cursor-pointer"
									>
										{category.name}
									</Label>
								</div>
							))
						)}
					</div>
					<div className="flex flex-col gap-2">
						<Button type="button" onClick={handleSaveCategories} className="w-full">
							Save
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowCategoriesModal(false)}
							className="w-full"
						>
							Cancel
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Badges Modal */}
			<Dialog open={showBadgesModal} onOpenChange={setShowBadgesModal}>
				<DialogContent className="w-[90vw] max-w-md mx-auto">
					<DialogHeader>
						<DialogTitle className="text-center">Badges</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
						{badges.length === 0 ? (
							<p className="text-center text-muted-foreground py-4">No badges available</p>
						) : (
							badges.map((badge) => (
								<div key={badge.id} className="flex items-center space-x-3">
									<Checkbox
										id={`badge-${badge.id}`}
										checked={formData.badgeIds.includes(badge.id)}
										onCheckedChange={(checked: boolean) => handleBadgesChange(badge.id, !!checked)}
									/>
									<div className="flex-1">
										<Label
											htmlFor={`badge-${badge.id}`}
											className="text-sm font-medium cursor-pointer block"
										>
											{badge.name}
										</Label>
										<p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
									</div>
								</div>
							))
						)}
					</div>
					<div className="flex flex-col gap-2">
						<Button type="button" onClick={handleSaveBadges} className="w-full">
							Save
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowBadgesModal(false)}
							className="w-full"
						>
							Cancel
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default EventForm;
