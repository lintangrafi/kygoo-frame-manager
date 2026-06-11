import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuid } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

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
  return join(UPLOAD_DIR, url.replace("/uploads/", ""));
}
