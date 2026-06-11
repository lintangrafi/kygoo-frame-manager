import { SessionDetail } from "@/components/sessions/SessionDetail";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SessionDetail sessionId={id} />;
}
