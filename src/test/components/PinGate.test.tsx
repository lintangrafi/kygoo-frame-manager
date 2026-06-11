import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinGate } from "@/components/session/PinGate";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/lib/confetti", () => ({
  burstConfetti: vi.fn(),
}));

describe("PinGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders the PIN entry form", () => {
    render(<PinGate slug="ABC-2026-001" />);

    expect(screen.getByText("Kygoo")).toBeInTheDocument();
    expect(screen.getByText("Frame Studio")).toBeInTheDocument();
    expect(screen.getByText(/Masukkan PIN Anda/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("4-digit PIN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lihat Foto Saya/ })).toBeInTheDocument();
  });

  it("shows session slug in the info section", () => {
    render(<PinGate slug="ABC-2026-001" />);
    expect(screen.getByText("ABC-2026-001")).toBeInTheDocument();
  });

  it("button is disabled when PIN is less than 4 digits", () => {
    render(<PinGate slug="ABC-2026-001" />);
    const button = screen.getByRole("button", { name: /Lihat Foto/ });
    expect(button).toBeDisabled();
  });

  it("button becomes enabled when PIN reaches 4 digits", async () => {
    render(<PinGate slug="ABC-2026-001" />);
    const input = screen.getByPlaceholderText("4-digit PIN");
    const button = screen.getByRole("button", { name: /Lihat Foto/ });

    await userEvent.type(input, "1234");
    expect(button).not.toBeDisabled();
  });

  it("filters non-numeric characters from PIN input", async () => {
    render(<PinGate slug="ABC-2026-001" />);
    const input = screen.getByPlaceholderText("4-digit PIN");

    await userEvent.type(input, "a1b2c3d4");
    expect(input).toHaveValue("1234");
  });

  it("limits PIN to 4 characters", async () => {
    render(<PinGate slug="ABC-2026-001" />);
    const input = screen.getByPlaceholderText("4-digit PIN");

    await userEvent.type(input, "12345");
    expect(input).toHaveValue("1234");
  });

  it("shows error message from API response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "PIN salah" }),
    });

    render(<PinGate slug="ABC-2026-001" />);
    const input = screen.getByPlaceholderText("4-digit PIN");
    const button = screen.getByRole("button", { name: /Lihat Foto/ });

    await userEvent.type(input, "9999");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("PIN salah")).toBeInTheDocument();
    });
  });

  it("calls router.refresh on successful verification", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<PinGate slug="ABC-2026-001" />);
    const input = screen.getByPlaceholderText("4-digit PIN");
    const button = screen.getByRole("button", { name: /Lihat Foto/ });

    await userEvent.type(input, "1234");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows loading state while verifying", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({}) }), 100))
    );

    render(<PinGate slug="ABC-2026-001" />);
    const input = screen.getByPlaceholderText("4-digit PIN");

    await userEvent.type(input, "1234");
    fireEvent.click(screen.getByRole("button", { name: /Lihat Foto/ }));

    expect(screen.getByText(/Membuka/)).toBeInTheDocument();
  });
});
