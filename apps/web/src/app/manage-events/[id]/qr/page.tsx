import { notFound } from "next/navigation";
import { validateAuth } from "@/lib/auth";
import { ManageEventQrPageClient } from "./_check-in-qr-client";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function ManageEventQrPage({ params }: PageProps) {
	await validateAuth();
	const { id } = await params;

	if (!id) {
		notFound();
	}

	return <ManageEventQrPageClient eventId={id} />;
}
