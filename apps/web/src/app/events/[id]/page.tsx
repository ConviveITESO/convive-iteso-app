"use client";

import { useParams } from "next/navigation";

export default function EventPage() {
	const { id } = useParams();
	return <h1>Event {id}</h1>;
}
