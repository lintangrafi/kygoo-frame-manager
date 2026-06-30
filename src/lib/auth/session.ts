import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { StaffSession } from "./types";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "kygoo_staff_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<{ staff?: StaffSession }>(cookieStore, sessionOptions);
  return session;
}
