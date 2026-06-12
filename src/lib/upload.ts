import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";
import { constants } from "fs";
import { v4 as uuid } from "uuid";

const UPLOAD_DIR_RAW = process.env.UPLOAD_DIR || "./public/uploads";

// Pastikan direktori upload selalu di bawah public/ agar Next.js bisa serve file
// Jika env override mengarah ke luar public/ (contoh: ./uploads), auto-fix ke ./public/uploads
function resolveUploadDir(): string {
  const normalized = UPLOAD_DIR_RAW.replace(/\\/g, "/");
  if (normalized.includes("/public/")) return UPLOAD_DIR_RAW;
  // Auto-fix: prepend public/ jika env var mengarah ke direktori tanpa public/
  if (normalized.startsWith("./")) {
    const fixed = "./public/" + normalized.slice(2);
    console.warn(`[upload] UPLOAD_DIR="${UPLOAD_DIR_RAW}" tidak berada di public/. Auto-fix ke "${fixed}"`);
    return fixed;
  }
  console.warn(`[upload] UPLOAD_DIR="${UPLOAD_DIR_RAW}" tidak berada di public/. File tidak akan bisa di-serve oleh Next.js.`);
  return UPLOAD_DIR_RAW;
}

const UPLOAD_DIR = resolveUploadDir();

export { UPLOAD_DIR };

export async function saveFile(file: File, subdir: string): Promise<string> {
  const dir = join(UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const ext = file.name.split(".").pop() || "png";
  const filename = `${uuid()}.${ext}`;
  const filepath = join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return `/uploads/${subdir}/${filename}`;
}

export function getUploadPath(url: string): string {
  const relative = url.replace("/uploads/", "");
  // Coba di UPLOAD_DIR dulu, fallback ke ./public/uploads/
  const primary = join(UPLOAD_DIR, relative);
  if (UPLOAD_DIR.includes("public")) return primary;
  // Jika UPLOAD_DIR tidak mengandung public, return primary tapi
  // caller sebaiknya juga cek fallback path
  return primary;
}

export function getPublicUploadPath(url: string): string {
  return join("./public/uploads", url.replace("/uploads/", ""));
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function resolveExistingUploadPath(url: string): Promise<string | null> {
  const relative = url.replace("/uploads/", "");
  const candidates = [join(UPLOAD_DIR, relative), getPublicUploadPath(url)];
  for (const p of candidates) {
    if (await fileExists(p)) return p;
  }
  return null;
}
