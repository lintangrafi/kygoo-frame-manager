import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/Sidebar";

const mockPathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/staff");
  });

  it("renders the brand name", () => {
    render(<Sidebar />);
    expect(screen.getByText("Kygoo")).toBeInTheDocument();
    expect(screen.getByText("Frame Studio")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Sesi")).toBeInTheDocument();
    expect(screen.getByText("Frame")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(<Sidebar />);
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("has logout form targeting correct API endpoint", () => {
    render(<Sidebar />);
    const form = screen.getByText("Logout").closest("form");
    expect(form).toHaveAttribute("action", "/api/auth/logout");
    expect(form).toHaveAttribute("method", "POST");
  });

  it("highlights active link based on current pathname", () => {
    mockPathname.mockReturnValue("/staff/frames");
    render(<Sidebar />);
    const dashboardLink = screen.getByText("Dashboard");
    const framesLink = screen.getByText("Frame");
    const sessionsLink = screen.getByText("Sesi");

    expect(dashboardLink.className).toContain("bg-amber");
    expect(framesLink.className).toContain("bg-amber");
    expect(sessionsLink.className).not.toContain("bg-amber");
  });

  it("highlights parent path as active for child routes", () => {
    mockPathname.mockReturnValue("/staff/frames/new");
    render(<Sidebar />);
    const framesLink = screen.getByText("Frame");
    expect(framesLink.className).toContain("bg-amber");
  });

  it("renders navigation links with correct hrefs", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute("href", "/staff");
    expect(screen.getByText("Sesi").closest("a")).toHaveAttribute("href", "/staff/sessions");
    expect(screen.getByText("Frame").closest("a")).toHaveAttribute("href", "/staff/frames");
  });
});
