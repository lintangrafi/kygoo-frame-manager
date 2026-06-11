import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SessionList } from "@/components/sessions/SessionList";

vi.mock("next/navigation", () => ({
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("SessionList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("shows empty state when no sessions", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    });

    render(<SessionList />);

    await waitFor(() => {
      expect(screen.getByText("Belum Ada Sesi")).toBeInTheDocument();
      expect(screen.getByText("Buat Sesi Baru")).toBeInTheDocument();
    });
  });

  it("renders session items with correct data", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          {
            id: "s1",
            slug: "ABC-2026-001",
            pinCode: "1234",
            customerName: "John",
            status: "active",
            basePrice: 50000,
            extraFrameFee: 10000,
            createdAt: "2026-06-10T00:00:00Z",
          },
        ]),
    });

    render(<SessionList />);

    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
      expect(screen.getByText("Aktif")).toBeInTheDocument();
      expect(screen.getByText(/Rp/)).toBeInTheDocument();
    });
  });

  it("links each session to its detail page", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          {
            id: "s2",
            slug: "ABC-2026-002",
            pinCode: "5678",
            customerName: "Jane",
            status: "draft",
            basePrice: 0,
            extraFrameFee: 0,
            createdAt: "2026-06-10T00:00:00Z",
          },
        ]),
    });

    render(<SessionList />);

    await waitFor(() => {
      const link = screen.getByText("Jane").closest("a");
      expect(link).toHaveAttribute("href", "/staff/sessions/s2");
    });
  });

  it("displays status badge with warm color classes", async () => {
    const statuses = [
      { status: "draft", label: "Draft", css: "bg-cacao/10" },
      { status: "active", label: "Aktif", css: "bg-amber/10" },
      { status: "completed", label: "Selesai", css: "bg-mahogany/10" },
      { status: "expired", label: "Kadaluarsa", css: "bg-espresso/5" },
    ];

    for (const { status, label, css } of statuses) {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "s1",
              slug: "TST-2026-001",
              pinCode: "1111",
              customerName: "Test",
              status,
              basePrice: 0,
              extraFrameFee: 0,
              createdAt: "2026-01-01",
            },
          ]),
      });

      const { unmount } = render(<SessionList />);
      await waitFor(() => {
        const badge = screen.getByText(label);
        expect(badge.className).toContain(css);
        unmount();
      });
    }
  });
});
