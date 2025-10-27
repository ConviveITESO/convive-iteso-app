import { notFound } from "next/navigation";
import { HeaderTitle } from "@/hooks/use-header-title";
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

	return (
		<>
			<HeaderTitle title="Event Check-in" showBackButton={true} />
			<ManageEventQrPageClient eventId={id} />
		</>
	);
}
