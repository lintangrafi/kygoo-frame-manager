import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export const customerSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "kygoo_customer_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export interface CustomerSession {
  sessionId: string;
  slug: string;
  customerName: string;
  status: string;
  expiresAt: string;
}

export async function getCustomerSession() {
  const cookieStore = await cookies();
  return getIronSession<{ customer?: CustomerSession }>(cookieStore, customerSessionOptions);
}

export async function getCurrentCustomer(): Promise<CustomerSession | null> {
  const session = await getCustomerSession();
  return session.customer || null;
}
