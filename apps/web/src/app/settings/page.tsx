import { validateAuth } from "@/lib/auth";

export default async function SettingsPage() {
	await validateAuth();
	return <h1>Settings</h1>;
}
