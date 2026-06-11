import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-uuid-001"),
}));

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  };
});

import { saveFile, getUploadPath } from "@/lib/upload";

function mockFile(name: string, size: number = 100): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type: "image/png" });
}

describe("saveFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes file to subdirectory and returns URL path", async () => {
    const file = mockFile("photo.jpg");
    const result = await saveFile(file, "frames");

    expect(result).toBe("/uploads/frames/test-uuid-001.jpg");
  });

  it("uses the extension from the file name when present", async () => {
    const file = mockFile("noext");
    // file.name is literally "noext" — split(".").pop() returns "noext" (no dot found)
    const result = await saveFile(file, "sessions");
    expect(result).toContain("test-uuid-001.");
  });

  it("defaults to png when file has empty extension", async () => {
    // File with name "dot." — split yields ["dot", ""], pop returns ""
    const file = mockFile("dot.");
    const result = await saveFile(file, "sessions");
    expect(result).toBe("/uploads/sessions/test-uuid-001.png");
  });

  it("handles nested subdirectories", async () => {
    const file = mockFile("img.png");
    const result = await saveFile(file, "sessions/abc-123");

    expect(result).toBe("/uploads/sessions/abc-123/test-uuid-001.png");
  });
});

describe("getUploadPath", () => {
  it("converts URL path to filesystem path", () => {
    const result = getUploadPath("/uploads/frames/photo.png");
    expect(result).toContain("uploads");
    expect(result).toContain("frames");
    expect(result).toContain("photo.png");
  });

  it("handles nested paths", () => {
    const result = getUploadPath("/uploads/sessions/abc-123/img.png");
    expect(result).toContain("sessions");
    expect(result).toContain("abc-123");
  });
});
