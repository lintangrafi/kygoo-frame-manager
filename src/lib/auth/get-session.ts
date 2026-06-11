import { getSession } from "./session";
import { StaffSession } from "./types";

export async function getStaffSession(): Promise<StaffSession | null> {
  const session = await getSession();
  return session.staff || null;
}
