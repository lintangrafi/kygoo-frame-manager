import { describe, it, expect } from "vitest";
import { cn, formatPrice } from "@/lib/utils";

describe("cn", () => {
  it("merges single class", () => {
    expect(cn("bg-red-500")).toBe("bg-red-500");
  });

  it("merges multiple classes", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });

  it("handles undefined and null gracefully", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });

  it("resolves tailwind conflicts with twMerge", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles array inputs", () => {
    expect(cn(["px-4", "py-2"], "bg-red-500")).toBe("px-4 py-2 bg-red-500");
  });

  it("handles empty string inputs", () => {
    expect(cn("px-4", "", "py-2")).toBe("px-4 py-2");
  });
});

describe("formatPrice", () => {
  const NBSP = "\u00A0";

  it("formats zero as IDR 0", () => {
    expect(formatPrice(0)).toBe(`Rp${NBSP}0`);
  });

  it("formats thousands", () => {
    expect(formatPrice(5000)).toBe(`Rp${NBSP}5.000`);
  });

  it("formats millions", () => {
    expect(formatPrice(1500000)).toBe(`Rp${NBSP}1.500.000`);
  });

  it("formats large numbers", () => {
    expect(formatPrice(10000000)).toBe(`Rp${NBSP}10.000.000`);
  });

  it("uses Indonesian locale format", () => {
    const result = formatPrice(1234567);
    expect(result).toContain("Rp");
    expect(result).toContain(".");
  });

  it("handles negative numbers", () => {
    expect(formatPrice(-5000)).toBe(`-Rp${NBSP}5.000`);
  });

  it("has no decimal places", () => {
    const result = formatPrice(1000.50);
    expect(result).not.toContain(",");
    expect(result).not.toContain(".50");
  });
});
