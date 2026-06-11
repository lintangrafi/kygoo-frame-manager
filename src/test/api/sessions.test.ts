import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLimit = vi.fn();

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

const mockGetStaffSession = vi.fn();
vi.mock("@/lib/auth/get-session", () => ({
  getStaffSession: vi.fn(() => mockGetStaffSession()),
}));

import { GET } from "@/app/api/sessions/[id]/route";

function mockReq() {
  return {} as any;
}

function mockCtx(params: { id: string }) {
  return { params: Promise.resolve(params) };
}

describe("Sessions API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStaffSession.mockResolvedValue({ id: "staff-1", email: "admin@kygoo.com", name: "Admin" });
  });

  describe("GET /api/sessions/[id]", () => {
    it("returns 401 when no staff session", async () => {
      mockGetStaffSession.mockResolvedValue(null);
      const res = await GET(mockReq(), mockCtx({ id: "s-1" }));
      expect(res.status).toBe(401);
    });

    it("returns 404 when not found", async () => {
      mockLimit.mockResolvedValue([]);
      const res = await GET(mockReq(), mockCtx({ id: "nonexistent" }));
      const body = await res.json();
      expect(res.status).toBe(404);
      expect(body.error).toBe("Sesi tidak ditemukan");
    });
  });
});
