"use client";

import { Camera, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { HeaderTitle } from "@/hooks/use-header-title";
import { getApiUrl } from "@/lib/api";

interface UserProfile {
	id: string;
	name: string;
	email: string;
	role: string;
	profile: string | null;
}

export default function ProfileSettingsPage() {
	const { isAuthenticated } = useAuth();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [username, setUsername] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [error, setError] = useState("");
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isAuthenticated) return;

		const loadCurrentUser = async () => {
			try {
				const response = await fetch(`${getApiUrl()}/user/me`, {
					credentials: "include",
				});

				if (!response.ok) {
					setError("Failed to load profile");
					return;
				}

				const data: UserProfile = await response.json();
				setProfile(data);
				setUsername(data.name);
				setImagePreview(data.profile);
			} catch (err) {
				console.error("Error loading profile", err);
				setError("Failed to load profile");
			} finally {
				setIsLoading(false);
			}
		};

		loadCurrentUser();
	}, [isAuthenticated]);

	const handleImageClick = () => {
		fileInputRef.current?.click();
	};

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !profile) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			setError("Please select an image file");
			return;
		}

		// Validate file size (e.g., 5MB max)
		if (file.size > 5 * 1024 * 1024) {
			setError("Image size should be less than 5MB");
			return;
		}

		setIsUploadingImage(true);
		setError("");

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(`${getApiUrl()}/user/${profile.id}/profile-picture`, {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			if (!response.ok) {
				setError("Failed to upload profile picture");
				return;
			}

			const updatedProfile: UserProfile = await response.json();
			setProfile(updatedProfile);
			setImagePreview(updatedProfile.profile);
		} catch (err) {
			console.error("Error uploading profile picture", err);
			setError("Failed to upload profile picture");
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleSave = async () => {
		if (!profile) return;

		setIsSaving(true);
		setError("");

		try {
			const response = await fetch(`${getApiUrl()}/user/${profile.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username }),
				credentials: "include",
			});

			if (!response.ok) {
				setError("Failed to update username");
				return;
			}

			const updatedProfile: UserProfile = await response.json();
			setProfile(updatedProfile);
			setIsEditing(false);
		} catch (err) {
			console.error("Error updating profile", err);
			setError("Failed to update username");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		if (profile) {
			setUsername(profile.name);
		}
		setIsEditing(false);
		setError("");
	};

	if (!isAuthenticated || isLoading) {
		return <div>Loading...</div>;
	}

	if (!profile) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Failed to load profile</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<HeaderTitle title="Profile Settings" />

			{/* Content */}
			<div className="p-4 space-y-6 max-w-md mx-auto lg:max-w-2xl">
				{/* Profile Picture */}
				<div className="flex justify-center pt-6">
					<div className="relative">
						<div className="flex size-24 items-center justify-center rounded-full bg-muted overflow-hidden">
							{imagePreview ? (
								<img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
							) : (
								<User className="size-12 text-muted-foreground" />
							)}
						</div>
						<button
							type="button"
							onClick={handleImageClick}
							disabled={isUploadingImage}
							className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
							aria-label="Upload profile picture"
						>
							{isUploadingImage ? (
								<div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
							) : (
								<Camera className="size-4" />
							)}
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							className="hidden"
						/>
					</div>
				</div>

				{/* Username Field */}
				<div className="space-y-2">
					<Label htmlFor="username" className="text-sm font-medium text-foreground">
						Username
					</Label>
					<Input
						id="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						disabled={!isEditing}
					/>
				</div>

				{/* Email Field (Read-only) */}
				<div className="space-y-2">
					<Label htmlFor="email" className="text-sm font-medium text-foreground">
						Email
					</Label>
					<Input id="email" value={profile.email} disabled className="bg-muted" />
				</div>

				{/* Role Field (Read-only) */}
				<div className="space-y-2">
					<Label htmlFor="role" className="text-sm font-medium text-foreground">
						Role
					</Label>
					<Input id="role" value={profile.role} disabled className="bg-muted" />
				</div>

				{/* User ID Field (Read-only) */}
				<div className="space-y-2">
					<Label htmlFor="id" className="text-sm font-medium text-foreground">
						User ID
					</Label>
					<Input id="id" value={profile.id} disabled className="bg-muted" />
				</div>

				{/* Error Message */}
				{error && <p className="text-sm text-destructive text-center">{error}</p>}

				{/* Action Buttons */}
				<div className="flex gap-3 pt-4">
					{!isEditing ? (
						<Button className="w-full" onClick={() => setIsEditing(true)}>
							Edit Username
						</Button>
					) : (
						<>
							<Button
								variant="outline"
								className="flex-1"
								onClick={handleCancel}
								disabled={isSaving}
							>
								Cancel
							</Button>
							<Button
								className="flex-1"
								onClick={handleSave}
								disabled={isSaving || username === profile.name}
							>
								{isSaving ? "Saving..." : "Save Changes"}
							</Button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
