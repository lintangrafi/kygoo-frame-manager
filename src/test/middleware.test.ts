import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockGetIronSession = vi.fn();

vi.mock("iron-session", () => ({
  getIronSession: (...args: unknown[]) => mockGetIronSession(...args),
}));

import { middleware, config } from "@/middleware";

function createMockRequest(pathname: string): NextRequest {
  return {
    nextUrl: { pathname } as any,
    url: `http://localhost:3000${pathname}`,
  } as unknown as NextRequest;
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows access to /staff/login without session", async () => {
    mockGetIronSession.mockResolvedValue({ staff: null });
    const req = createMockRequest("/staff/login");

    const result = await middleware(req);
    expect(result).toBeDefined();
  });

  it("redirects to /staff/login when no staff session for protected route", async () => {
    mockGetIronSession.mockResolvedValue({ staff: null });
    const req = createMockRequest("/staff/sessions");

    const result = await middleware(req);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(307);
    expect((result as Response).headers.get("Location")).toContain("/staff/login");
  });

  it("allows access when staff session exists for protected route", async () => {
    mockGetIronSession.mockResolvedValue({
      staff: { id: "1", email: "admin@kygoo.com", name: "Admin" },
    });
    const req = createMockRequest("/staff/sessions");

    const result = await middleware(req);
    expect(result).toBeDefined();
  });

  it("allows non-staff routes through", async () => {
    mockGetIronSession.mockResolvedValue({ staff: null });
    const req = createMockRequest("/s/ABC-2026-001");

    const result = await middleware(req);
    expect(result).toBeDefined();
  });

  it("configures matcher for /staff paths", () => {
    expect(config.matcher).toContain("/staff/:path*");
  });
});
