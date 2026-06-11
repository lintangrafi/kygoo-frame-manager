import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { FrameList } from "@/components/frames/FrameList";

vi.mock("next/navigation", () => ({
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("FrameList", () => {
  const mockConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    window.confirm = mockConfirm;
  });

  it("renders frames in grid layout", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: "f1",
            name: "Classic Frame",
            category: "2R",
            fileUrl: "/uploads/frames/classic.png",
            additionalFee: 5000,
            isActive: true,
          },
        ]),
    });

    render(<FrameList />);

    await waitFor(() => {
      expect(screen.getByText("Classic Frame")).toBeInTheDocument();
      expect(screen.getByText("2R")).toBeInTheDocument();
      expect(screen.getByAltText("Classic Frame")).toBeInTheDocument();
    });
  });

  it("displays additional fee when non-zero", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: "f1",
            name: "Premium",
            category: "4R",
            fileUrl: "/f.png",
            additionalFee: 10000,
            isActive: true,
          },
        ]),
    });

    render(<FrameList />);
    await waitFor(() => {
      expect(screen.getByText(/10\.000/)).toBeInTheDocument();
    });
  });

  it("does not display fee when zero", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: "f1",
            name: "Basic",
            category: "2R",
            fileUrl: "/f.png",
            additionalFee: 0,
            isActive: true,
          },
        ]),
    });

    render(<FrameList />);
    await waitFor(() => {
      expect(screen.queryByText(/Rp/)).not.toBeInTheDocument();
    });
  });

  it("toggles active state", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "f1",
              name: "Frame",
              category: "2R",
              fileUrl: "/f.png",
              additionalFee: 0,
              isActive: true,
            },
          ]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "f1",
              name: "Frame",
              category: "2R",
              fileUrl: "/f.png",
              additionalFee: 0,
              isActive: false,
            },
          ]),
      });

    render(<FrameList />);

    await waitFor(() => {
      expect(screen.getByText("Aktif")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Aktif"));

    await waitFor(() => {
      expect(screen.getByText("Nonaktif")).toBeInTheDocument();
    });
  });

  it("asks confirmation before deleting", async () => {
    mockConfirm.mockReturnValue(false);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          {
            id: "f1",
            name: "Frame",
            category: "2R",
            fileUrl: "/f.png",
            additionalFee: 0,
            isActive: true,
          },
        ]),
    });

    render(<FrameList />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Hapus"));
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      "Hapus frame ini? Tindakan ini tidak bisa dibatalkan."
    );
  });

  it("deletes frame on confirmation", async () => {
    mockConfirm.mockReturnValue(true);
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: "f1",
              name: "Frame",
              category: "2R",
              fileUrl: "/f.png",
              additionalFee: 0,
              isActive: true,
            },
          ]),
      })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    render(<FrameList />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Hapus"));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/frames/f1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
