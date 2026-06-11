import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockDbSelect = vi.fn();
const mockDbWhere = vi.fn();
const mockDbLimit = vi.fn();
const mockBcryptCompare = vi.fn();
const mockSessionSave = vi.fn();
const mockSessionDestroy = vi.fn();
const mockGetSession = vi.fn();
const mockGetStaffSession = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: () => ({ from: mockDbSelect, where: mockDbWhere }),
  },
}));
vi.mock("bcryptjs", () => ({
  default: { compare: (...args: unknown[]) => mockBcryptCompare(...args) },
}));
vi.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));
vi.mock("@/lib/auth/get-session", () => ({
  getStaffSession: () => mockGetStaffSession(),
}));

import { POST as loginHandler } from "@/app/api/auth/login/route";
import { GET as sessionHandler } from "@/app/api/auth/session/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";

function mockJsonReq(body: unknown): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelect.mockReturnValue({ where: mockDbWhere, orderBy: vi.fn() });
    mockDbWhere.mockReturnValue({ limit: mockDbLimit });
    mockDbLimit.mockReturnValue({ limit: vi.fn() });
  });

  it("returns 400 when email is missing", async () => {
    const req = mockJsonReq({ password: "test" });
    const res = await loginHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Email dan password diperlukan");
  });

  it("returns 400 when password is missing", async () => {
    const req = mockJsonReq({ email: "test@test.com" });
    const res = await loginHandler(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 when user not found", async () => {
    mockDbLimit.mockResolvedValue([]);
    const req = mockJsonReq({ email: "unknown@test.com", password: "wrong" });
    const res = await loginHandler(req);

    expect(res.status).toBe(401);
  });

  it("returns 401 when password is incorrect", async () => {
    mockDbLimit.mockResolvedValue([{ id: "1", email: "a@b.com", passwordHash: "hash", name: "Test" }]);
    mockBcryptCompare.mockResolvedValue(false);

    const req = mockJsonReq({ email: "a@b.com", password: "wrong" });
    const res = await loginHandler(req);

    expect(res.status).toBe(401);
  });

  it("returns success when credentials are valid", async () => {
    const user = { id: "u1", email: "admin@kygoo.com", passwordHash: "hash", name: "Admin" };
    mockDbLimit.mockResolvedValue([user]);
    mockBcryptCompare.mockResolvedValue(true);
    const mockSession = { staff: null, save: mockSessionSave };
    mockGetSession.mockResolvedValue(mockSession);

    const req = mockJsonReq({ email: "admin@kygoo.com", password: "admin123" });
    const res = await loginHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.staff.email).toBe("admin@kygoo.com");
    expect(mockSessionSave).toHaveBeenCalled();
  });
});

describe("GET /api/auth/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no staff session", async () => {
    mockGetStaffSession.mockResolvedValue(null);
    const res = await sessionHandler();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.staff).toBeNull();
  });

  it("returns staff when session exists", async () => {
    const staffData = { id: "1", email: "admin@kygoo.com", name: "Admin" };
    mockGetStaffSession.mockResolvedValue(staffData);
    const res = await sessionHandler();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.staff).toEqual(staffData);
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("destroys session and returns success", async () => {
    const mockSession = { destroy: mockSessionDestroy };
    mockGetSession.mockResolvedValue(mockSession);

    const res = await logoutHandler();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockSessionDestroy).toHaveBeenCalled();
  });
});
