import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/customer-session";
import { PinGate } from "@/components/session/PinGate";
import { Gallery } from "@/components/session/Gallery";

export default async function SessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const customer = await getCurrentCustomer();

  if (!customer || customer.slug !== slug) {
    return <PinGate slug={slug} />;
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.slug, slug)).limit(1);
  if (!session || session.status === "expired" || new Date() > new Date(session.expiresAt)) {
    return <PinGate slug={slug} />;
  }

  return <Gallery sessionId={session.id} slug={session.slug} status={session.status ?? "draft"} />;
}
