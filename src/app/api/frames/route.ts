import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { frames, frameSlots } from "@/db/schema";
import { getStaffSession } from "@/lib/auth/get-session";
import { saveFile } from "@/lib/upload";
import { eq, and, isNull, ilike, or, asc, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const occasion = url.searchParams.get("occasion");
  const search = url.searchParams.get("search");
  const tags = url.searchParams.get("tags");
  const includeDeleted = url.searchParams.get("includeDeleted") === "true";
  const includeInactive = url.searchParams.get("includeInactive") === "true";
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") === "asc" ? asc : eq;

  // Build conditions
  const conditions = [];

  // Exclude deleted by default
  if (!includeDeleted) {
    conditions.push(isNull(frames.deletedAt));
  }

  // Filter by category (2R, 4R)
  if (category) {
    conditions.push(eq(frames.category, category));
  }

  // Filter by occasion
  if (occasion) {
    conditions.push(eq(frames.occasion, occasion));
  }

  // Search by name
  if (search) {
    conditions.push(
      or(
        ilike(frames.name, `%${search}%`),
        ilike(frames.description, `%${search}%`)
      )
    );
  }

  // Filter by tags
  if (tags) {
    const tagList = tags.split(",").map(t => t.trim().toLowerCase());
    // Check if any of the specified tags exist in the frame's tags array
    // This is a simplified check - for PostgreSQL you might use @> or other array operators
    for (const tag of tagList) {
      conditions.push(ilike(frames.tags, `%${tag}%`));
    }
  }

  // Filter inactive
  if (!includeInactive) {
    conditions.push(eq(frames.isActive, true));
  }

  // Build query
  let query = db.select().from(frames);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Sorting
  const sortColumn = (frames as any)[sortBy] || frames.createdAt;
  const allFrames = sortOrder === asc
    ? await query.orderBy(asc(sortColumn as any))
    : await query.orderBy(desc(sortColumn as any));

  return NextResponse.json(allFrames);
}

export async function POST(req: NextRequest) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const occasion = formData.get("occasion") as string || "general";
  const additionalFee = parseInt(formData.get("additionalFee") as string) || 0;
  const description = formData.get("description") as string || "";
  const tagsStr = formData.get("tags") as string || "";
  const tags = tagsStr ? tagsStr.split(",").map(t => t.trim().toLowerCase()) : [];

  if (!file || !name || !category) {
    return NextResponse.json({ error: "File, name, dan category diperlukan" }, { status: 400 });
  }

  // Validate category (only 2R and 4R for now)
  if (!["2R", "4R"].includes(category)) {
    return NextResponse.json({ error: "Kategori harus 2R atau 4R" }, { status: 400 });
  }

  const fileUrl = await saveFile(file, "frames");

  // Generate thumbnail
  let thumbnailUrl: string | null = null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sharpModule = (await import("sharp")).default;
    const metadata = await sharpModule(buffer).metadata();

    // Create thumbnail (200px width, maintain aspect ratio)
    const thumbBuffer = await sharpModule(buffer)
      .resize(200, null, { fit: "inside" })
      .png()
      .toBuffer();

    const { writeFile, mkdir } = await import("fs/promises");
    const { join } = await import("path");
    const { v4: uuid } = await import("uuid");

    const thumbDir = join("./public/uploads/frames/thumbnails");
    await mkdir(thumbDir, { recursive: true });

    const thumbFilename = `${uuid()}.png`;
    const thumbPath = join(thumbDir, thumbFilename);
    await writeFile(thumbPath, thumbBuffer);
    thumbnailUrl = `/uploads/frames/thumbnails/${thumbFilename}`;
  } catch (error) {
    console.warn("Failed to generate thumbnail:", error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(buffer).metadata();

  const [frame] = await db.insert(frames).values({
    name,
    category,
    occasion,
    fileUrl,
    thumbnailUrl,
    dimensionsW: metadata.width || 1200,
    dimensionsH: metadata.height || 1800,
    additionalFee,
    description,
    tags,
    isActive: true,
    isFeatured: false,
    version: 1,
  }).returning();

  const dimW = frame.dimensionsW;
  const dimH = frame.dimensionsH;

  // Auto-create 1 slot default yang menutupi seluruh area frame
  await db.insert(frameSlots).values({
    frameId: frame.id,
    slotNumber: 1,
    x: "0",
    y: "0",
    width: String(dimW),
    height: String(dimH),
    rotation: "0",
  });

  return NextResponse.json(frame);
}
