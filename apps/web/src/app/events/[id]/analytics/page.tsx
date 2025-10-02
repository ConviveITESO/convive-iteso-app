"use client";

import { useParams } from "next/navigation";

export default function AnalyticsPage() {
	const { id } = useParams();
	return <h1>Analytics {id}</h1>;
}
