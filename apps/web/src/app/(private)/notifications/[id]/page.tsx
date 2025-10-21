import NotificationDetailClient from "./_components/notification-detail-client";

export default function NotificationDetailPage({ params }: { params: { id: string } }) {
	return <NotificationDetailClient id={params.id} />;
}
