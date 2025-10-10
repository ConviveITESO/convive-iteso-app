import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api";

const publicPaths = ["/login", "/register"];

export async function middleware(req: NextRequest) {
	const { cookies, nextUrl } = req;
	const token = cookies.get("idToken")?.value;

	// Allow public paths without authentication
	if (publicPaths.some((path) => nextUrl.pathname.startsWith(path))) {
		return NextResponse.next();
	}

	// Redirect to login if no token
	if (!token) {
		const loginUrl = new URL("/", req.url);
		return NextResponse.redirect(loginUrl);
	}

	try {
		const res = await fetch(`${getApiUrl()}/auth/validate`, {
			method: "GET",
			headers: { cookie: `idToken=${token}` },
		});

		if (!res.ok) {
			const loginUrl = new URL("/", req.url);
			return NextResponse.redirect(loginUrl);
		}
	} catch {
		const loginUrl = new URL("/", req.url);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
