import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetIronSession = vi.fn();
const mockCookies = vi.fn();

vi.mock("iron-session", () => ({
  getIronSession: (...args: unknown[]) => mockGetIronSession(...args),
}));
vi.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

import { getSession, sessionOptions } from "@/lib/auth/session";
import { getStaffSession } from "@/lib/auth/get-session";
import { getCustomerSession, getCurrentCustomer, customerSessionOptions } from "@/lib/auth/customer-session";

describe("sessionOptions", () => {
  it("has correct cookie name", () => {
    expect(sessionOptions.cookieName).toBe("kygoo_staff_session");
  });

  it("has a password set", () => {
    expect(sessionOptions.password).toBeTruthy();
    expect(sessionOptions.password.length).toBeGreaterThanOrEqual(32);
  });
});

describe("customerSessionOptions", () => {
  it("has correct cookie name", () => {
    expect(customerSessionOptions.cookieName).toBe("kygoo_customer_session");
  });

  it("has a password set", () => {
    expect(customerSessionOptions.password).toBeTruthy();
  });
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates iron session with staff type", async () => {
    const mockSession = { staff: null };
    mockCookies.mockReturnValue({ name: "test-cookie" });
    mockGetIronSession.mockResolvedValue(mockSession);

    const result = await getSession();
    expect(result).toBe(mockSession);
  });

  it("returns session with staff property", async () => {
    const staffData = { id: "1", email: "test@test.com", name: "Test" };
    mockCookies.mockReturnValue({});
    mockGetIronSession.mockResolvedValue({ staff: staffData });

    const result = await getSession();
    expect(result.staff).toEqual(staffData);
  });
});

describe("getStaffSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns staff when session has staff", async () => {
    const staffData = { id: "staff-1", email: "admin@kygoo.com", name: "Admin" };
    mockCookies.mockReturnValue({});
    mockGetIronSession.mockResolvedValue({ staff: staffData });

    const result = await getStaffSession();
    expect(result).toEqual(staffData);
  });

  it("returns null when session has no staff", async () => {
    mockCookies.mockReturnValue({});
    mockGetIronSession.mockResolvedValue({ staff: null });

    const result = await getStaffSession();
    expect(result).toBeNull();
  });

  it("returns null when staff is undefined", async () => {
    mockCookies.mockReturnValue({});
    mockGetIronSession.mockResolvedValue({});

    const result = await getStaffSession();
    expect(result).toBeNull();
  });
});

describe("getCustomerSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates iron session with customer type", async () => {
    const mockSession = { customer: null };
    mockCookies.mockReturnValue({});
    mockGetIronSession.mockResolvedValue(mockSession);

    const result = await getCustomerSession();
    expect(result).toBe(mockSession);
  });
});

describe("getCurrentCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns customer when session has customer", async () => {
    const customerData = {
      sessionId: "s-1",
      slug: "JOH-2026-001",
      customerName: "John",
      status: "active",
      expiresAt: new Date().toISOString(),
    };
    mockCookies.mockReturnValue({});
    mockGetIronSession.mockResolvedValue({ customer: customerData });

    const result = await getCurrentCustomer();
    expect(result).toEqual(customerData);
  });

  it("returns null when no customer in session", async () => {
    mockCookies.mockReturnValue({});
    mockGetIronSession.mockResolvedValue({});

    const result = await getCurrentCustomer();
    expect(result).toBeNull();
  });
});
