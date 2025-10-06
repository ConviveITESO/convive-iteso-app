import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPaths = ["/users"];

export function middleware(req: NextRequest) {
	const { cookies, nextUrl } = req;

	const token = cookies.get("idToken")?.value;

	if (!protectedPaths.some((path) => nextUrl.pathname.startsWith(path))) {
		return NextResponse.next();
	}

	if (!token) {
		const loginUrl = new URL("/login", req.url);
		NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/users/:path"],
};
