"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

/**
 * Client-side authentication hook
 * Use this in client components ("use client")
 * Redirects to / if authentication fails
 * Returns loading state to prevent rendering before auth check completes
 */
export function useAuth() {
	const router = useRouter();
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		fetch(`${getApiUrl()}/auth/validate`, {
			method: "GET",
			credentials: "include",
			cache: "no-store",
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				Pragma: "no-cache",
			},
		})
			.then((res) => {
				if (!res.ok) {
					router.push("/");
				} else {
					setIsAuthenticated(true);
				}
			})
			.catch(() => {
				router.push("/");
			});
	}, [router]);

	return { isAuthenticated };
}
