import { pgTable, uuid, text, integer, numeric, boolean, timestamp, uniqueIndex, jsonb, foreignKey } from "drizzle-orm/pg-core";

// ── Frame Categories (Tree) ──────────────────────────────────────
export const frameCategories = pgTable("frame_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  icon: text("icon").default("frame"),
  description: text("description"),
  parentId: uuid("parent_id").references((): any => frameCategories.id),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Staff ────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(),
  pinCode: text("pin_code").notNull(),
  customerName: text("customer_name").notNull(),
  status: text("status").default("draft"), // draft | active | completed | expired
  basePrice: integer("base_price").default(0),
  extraFrameFee: integer("extra_frame_fee").default(0),
  staffId: uuid("staff_id").references(() => staff.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  fileUrl: text("file_url").notNull(),
  originalName: text("original_name"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const frames = pgTable("frames", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // '2R' | '4R' — legacy ref
  categoryId: uuid("category_id").references(() => frameCategories.id),
  fileUrl: text("file_url").notNull(),
  dimensionsW: integer("dimensions_w").notNull(),
  dimensionsH: integer("dimensions_h").notNull(),
  additionalFee: integer("additional_fee").default(0),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const frameSlots = pgTable("frame_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  frameId: uuid("frame_id").references(() => frames.id, { onDelete: "cascade" }).notNull(),
  slotNumber: integer("slot_number").notNull(),
  x: numeric("x").notNull(),
  y: numeric("y").notNull(),
  width: numeric("width").notNull(),
  height: numeric("height").notNull(),
  rotation: numeric("rotation").default("0"),
});

export const compositions = pgTable("compositions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  frameId: uuid("frame_id").references(() => frames.id),
  status: text("status").default("draft"), // draft | review | approved | finalized
  previewUrl: text("preview_url"),
  exportUrl: text("export_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const allocations = pgTable("allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  compositionId: uuid("composition_id").references(() => compositions.id, { onDelete: "cascade" }).notNull(),
  slotId: uuid("slot_id").references(() => frameSlots.id),
  photoId: uuid("photo_id").references(() => photos.id),
  scale: numeric("scale").default("1"),
  offsetX: numeric("offset_x").default("0"),
  offsetY: numeric("offset_y").default("0"),
  hue: numeric("hue").default("0"),
  saturation: numeric("saturation").default("100"),
  brightness: numeric("brightness").default("100"),
  contrast: numeric("contrast").default("100"),
});
