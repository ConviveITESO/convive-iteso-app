"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";

export default function GroupPage() {
	const { isAuthenticated } = useAuth();
	const { id } = useParams();

	if (!isAuthenticated) return <div>Loading...</div>;

	return <h1>Group {id}</h1>;
}
