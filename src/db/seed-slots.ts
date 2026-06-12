// Script: tambahkan 1 slot default untuk setiap frame yang belum punya slot.
// Jalankan: npx tsx src/db/seed-slots.ts
// Di container Coolify: cd /app && npx tsx src/db/seed-slots.ts

import { db } from "./index";
import { frames, frameSlots } from "./schema";
import { eq } from "drizzle-orm";

async function seedSlots() {
  const allFrames = await db.select().from(frames);

  let added = 0;
  for (const frame of allFrames) {
    const existing = await db
      .select()
      .from(frameSlots)
      .where(eq(frameSlots.frameId, frame.id));

    if (existing.length > 0) continue;

    await db.insert(frameSlots).values({
      frameId: frame.id,
      slotNumber: 1,
      x: "0",
      y: "0",
      width: String(frame.dimensionsW),
      height: String(frame.dimensionsH),
      rotation: "0",
    });
    console.log(`  ✓ Frame "${frame.name}" (${frame.id}) → slot 1: 0,0 ${frame.dimensionsW}×${frame.dimensionsH}`);
    added++;
  }

  if (added === 0) {
    console.log("Semua frame sudah punya slot. Tidak ada yang perlu di-seed.");
  } else {
    console.log(`\nSelesai! ${added} slot default dibuat.`);
  }
  process.exit(0);
}

seedSlots().catch((e) => { console.error(e); process.exit(1); });
