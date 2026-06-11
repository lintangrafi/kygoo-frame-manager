import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password diperlukan" }, { status: 400 });
  }

  const [user] = await db.select().from(staff).where(eq(staff.email, email)).limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  const session = await getSession();
  session.staff = { id: user.id, email: user.email, name: user.name };
  await session.save();

  return NextResponse.json({ success: true, staff: { id: user.id, email: user.email, name: user.name } });
}
