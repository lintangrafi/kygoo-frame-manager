import { eq } from "drizzle-orm";
import { db } from "@/db";
import { compositions, frames, sessions } from "@/db/schema";
import { notFound } from "next/navigation";
import { ShareView } from "./ShareView";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Find composition by share token
  const [comp] = await db.select().from(compositions)
    .where(eq(compositions.shareToken, token))
    .limit(1);

  if (!comp) {
    notFound();
  }

  // Get session info
  const [session] = await db.select().from(sessions)
    .where(eq(sessions.id, comp.sessionId))
    .limit(1);

  // Get frame info if available
  let frame = null;
  if (comp.frameId) {
    const [f] = await db.select().from(frames)
      .where(eq(frames.id, comp.frameId))
      .limit(1);
    frame = f;
  }

  return (
    <ShareView
      composition={comp}
      session={session}
      frame={frame}
    />
  );
}
