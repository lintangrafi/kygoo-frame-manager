import { db } from "./index";
import { staff } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  const hash = await bcrypt.hash("admin123", 10);
  await db.insert(staff).values({
    email: "admin@kygoo.com",
    passwordHash: hash,
    name: "Admin Studio",
  });
  console.log("Seed complete: admin@kygoo.com / admin123");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
