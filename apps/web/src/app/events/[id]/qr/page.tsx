"use client";

import { useParams } from "next/navigation";

// biome-ignore lint/style/useNamingConvention: false positive
export default function QRPage() {
	const { id } = useParams();
	return <h1>admin read QR {id}</h1>;
}
