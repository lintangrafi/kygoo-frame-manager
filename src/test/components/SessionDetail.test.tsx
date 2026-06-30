import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { SessionDetail } from "@/components/sessions/SessionDetail";

describe("SessionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("shows skeleton loading state initially", () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ json: () => new Promise(() => {}) })
      .mockResolvedValueOnce({ json: () => new Promise(() => {}) })
      .mockResolvedValueOnce({ json: () => new Promise(() => {}) });

    const { container } = render(<SessionDetail sessionId="s-1" />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders session details after loading", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: "s-1",
            slug: "ABC-2026-001",
            pinCode: "1234",
            customerName: "John",
            status: "active",
            basePrice: 50000,
          }),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    render(<SessionDetail sessionId="s-1" />);

    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
      expect(screen.getByText(/ABC-2026-001/)).toBeInTheDocument();
    });
  });

  it("shows activate button for draft sessions", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: "s-1",
            slug: "ABC-2026-001",
            pinCode: "1234",
            customerName: "John",
            status: "draft",
            basePrice: 50000,
          }),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    render(<SessionDetail sessionId="s-1" />);

    await waitFor(() => {
      expect(screen.getByText("Aktifkan Sesi")).toBeInTheDocument();
    });
  });

  it("activates session on button click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: "s-1",
            slug: "ABC-2026-001",
            pinCode: "1234",
            customerName: "John",
            status: "draft",
            basePrice: 50000,
          }),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ status: "active" }) });

    render(<SessionDetail sessionId="s-1" />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Aktifkan Sesi"));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/sessions/s-1",
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  it("displays composition list", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: "s-1",
            slug: "ABC-2026-001",
            pinCode: "1234",
            customerName: "John",
            status: "active",
            basePrice: 50000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "comp-11111111",
              frameId: "f-1",
              status: "draft",
              previewUrl: null,
              exportUrl: null,
            },
          ]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    render(<SessionDetail sessionId="s-1" />);

    await waitFor(() => {
      expect(screen.getByText("Daftar Komposisi")).toBeInTheDocument();
      expect(screen.getByText(/comp-1111/)).toBeInTheDocument();
    });
  });

  it("shows approve button for non-finalized compositions", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: "s-1",
            slug: "ABC-2026-001",
            pinCode: "1234",
            customerName: "John",
            status: "active",
            basePrice: 50000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "comp-1",
              frameId: "f-1",
              status: "review",
              previewUrl: null,
              exportUrl: null,
            },
          ]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    render(<SessionDetail sessionId="s-1" />);

    await waitFor(() => {
      expect(screen.getByText("Setujui")).toBeInTheDocument();
    });
  });

  it("hides approve button for finalized compositions", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: "s-1",
            slug: "ABC-2026-001",
            pinCode: "1234",
            customerName: "John",
            status: "active",
            basePrice: 50000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "comp-1",
              frameId: "f-1",
              status: "finalized",
              previewUrl: null,
              exportUrl: "/uploads/exports/export.png",
            },
          ]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    render(<SessionDetail sessionId="s-1" />);

    await waitFor(() => {
      expect(screen.queryByText("Setujui")).not.toBeInTheDocument();
      expect(screen.getByText("Unduh")).toBeInTheDocument();
    });
  });
});
