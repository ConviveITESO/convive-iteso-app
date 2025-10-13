import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "@/lib/api";

/**
 * Server-side authentication validation
 * Call this at the start of server components or server actions
 * Redirects to / if authentication fails
 */
export async function validateAuth() {
	const cookieStore = await cookies();
	const token = cookieStore.get("idToken")?.value;

	if (!token) {
		redirect("/");
	}

	try {
		const res = await fetch(`${getApiUrl()}/auth/validate`, {
			method: "GET",
			headers: { cookie: `idToken=${token}` },
			cache: "no-store",
		});

		if (!res.ok) {
			redirect("/");
		}
	} catch {
		redirect("/");
	}
}
