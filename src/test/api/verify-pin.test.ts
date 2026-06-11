import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLimit = vi.fn();
const mockGetCustomerSession = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: mockLimit,
        })),
      })),
    })),
  },
}));

vi.mock("@/lib/auth/customer-session", () => ({
  getCustomerSession: vi.fn(() => mockGetCustomerSession()),
}));

import { POST as verifyPinHandler } from "@/app/api/auth/verify-pin/route";

function mockJsonReq(body: unknown) {
  return { json: () => Promise.resolve(body) } as any;
}

describe("POST /api/auth/verify-pin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCustomerSession.mockResolvedValue({ customer: null, save: vi.fn() });
  });

  it("returns 400 when slug is missing", async () => {
    const res = await verifyPinHandler(mockJsonReq({ pin: "1234" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Slug dan PIN diperlukan");
  });

  it("returns 400 when pin is missing", async () => {
    const res = await verifyPinHandler(mockJsonReq({ slug: "ABC-2026-001" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when session not found", async () => {
    mockLimit.mockResolvedValue([]);
    const res = await verifyPinHandler(mockJsonReq({ slug: "XYZ-999", pin: "1234" }));
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe("Sesi tidak ditemukan");
  });
});
