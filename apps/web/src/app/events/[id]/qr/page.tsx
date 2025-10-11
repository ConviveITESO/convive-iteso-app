"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";

// biome-ignore lint/style/useNamingConvention: false positive
export default function QRPage() {
	const { isAuthenticated } = useAuth();
	const { id } = useParams();

	if (!isAuthenticated) return <div>Loading...</div>;

	return <h1>admin read QR {id}</h1>;
}
