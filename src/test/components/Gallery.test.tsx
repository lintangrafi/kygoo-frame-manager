import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Gallery } from "@/components/session/Gallery";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("Gallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });
  });

  it("renders the gallery heading", async () => {
    render(<Gallery sessionId="s-1" slug="ABC-2026-001" status="active" />);
    await waitFor(() => {
      expect(screen.getByText(/Foto & Frame/)).toBeInTheDocument();
    });
  });

  it("renders tab buttons for photos, 2R, and 4R", async () => {
    render(<Gallery sessionId="s-1" slug="ABC-2026-001" status="active" />);
    await waitFor(() => {
      expect(screen.getByText("Foto Saya")).toBeInTheDocument();
      expect(screen.getByText("Frame 2R")).toBeInTheDocument();
      expect(screen.getByText("Frame 4R")).toBeInTheDocument();
    });
  });

  it("shows photos tab content when photos tab is active", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockReset()
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            { id: "p1", fileUrl: "/uploads/sessions/s1/p1.jpg", originalName: "photo1.jpg" },
          ]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    render(<Gallery sessionId="s-1" slug="ABC-2026-001" status="active" />);

    await waitFor(() => {
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  it("shows frames in grid when 2R tab is selected", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockReset()
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "f1",
              name: "Frame Classic",
              category: "2R",
              fileUrl: "/uploads/frames/classic.png",
              additionalFee: 0,
              isActive: true,
            },
          ]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    render(<Gallery sessionId="s-1" slug="ABC-2026-001" status="active" />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Frame 2R"));
    });
    await waitFor(() => {
      expect(screen.getByText("Frame Classic")).toBeInTheDocument();
    });
  });

  it("hides 'Pilih Frame' button when session is completed", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockReset()
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "f1",
              name: "Frame Classic",
              category: "2R",
              fileUrl: "/uploads/frames/classic.png",
              additionalFee: 0,
              isActive: true,
            },
          ]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    render(<Gallery sessionId="s-1" slug="ABC-2026-001" status="completed" />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Frame 2R"));
    });
    await waitFor(() => {
      expect(screen.queryByText("Pilih Frame")).not.toBeInTheDocument();
    });
  });

  it("shows finalized compositions with download links", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockReset()
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "c1",
              frameId: "f1",
              status: "finalized",
              exportUrl: "/uploads/exports/export.png",
            },
          ]),
      });

    render(<Gallery sessionId="s-1" slug="ABC-2026-001" status="active" />);

    await waitFor(() => {
      expect(screen.getByText("Hasil Final")).toBeInTheDocument();
      expect(screen.getByText("Download")).toBeInTheDocument();
    });
  });

  it("navigates to editor when frame is selected", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockReset()
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "f1",
              name: "Frame Classic",
              category: "2R",
              fileUrl: "/uploads/frames/classic.png",
              additionalFee: 0,
              isActive: true,
            },
          ]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ id: "comp-1" }), ok: true });

    render(<Gallery sessionId="s-1" slug="ABC-2026-001" status="active" />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Frame 2R"));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText("Pilih Frame"));
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/s/ABC-2026-001/editor/comp-1");
    });
  });
});
