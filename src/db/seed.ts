import { db } from "./index";
import { staff, frameCategories } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  // ── Admin ──
  const hash = await bcrypt.hash("admin123", 10);
  await db.insert(staff).values({
    email: "admin@kygoo.com",
    passwordHash: hash,
    name: "Admin Studio",
  });

  // ── Frame Categories (Tree) ──
  const categories = [
    { name: "2R (6×9cm)", slug: "2r", icon: "frame", sortOrder: 1 },
    { name: "3R (8.9×12.7cm)", slug: "3r", icon: "frame", sortOrder: 2 },
    { name: "4R (10×15cm)", slug: "4r", icon: "frame", sortOrder: 3 },
    { name: "5R (12.7×17.8cm)", slug: "5r", icon: "frame", sortOrder: 4 },
    { name: "8R (20×25cm)", slug: "8r", icon: "frame", sortOrder: 5 },
    { name: "10R (25×30cm)", slug: "10r", icon: "frame", sortOrder: 6 },
    { name: "A4", slug: "a4", icon: "file-text", sortOrder: 10 },
    { name: "Polaroid", slug: "polaroid", icon: "camera", sortOrder: 20 },
    { name: "Pas Foto", slug: "pas-foto", icon: "user", sortOrder: 30 },
    { name: "Custom", slug: "custom", icon: "settings", sortOrder: 99 },
  ];

  for (const cat of categories) {
    await db.insert(frameCategories).values(cat);
  }

  console.log("Seed complete: admin@kygoo.com / admin123 + 10 kategori frame");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
