"use client";

import { useParams } from "next/navigation";

export default function GroupPage() {
	const { id } = useParams();
	return <h1>Group {id}</h1>;
}
