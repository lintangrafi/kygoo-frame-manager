import { pgTable, uuid, text, integer, numeric, boolean, timestamp, uniqueIndex, jsonb, varchar } from "drizzle-orm/pg-core";

export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").default("staff"), // admin | staff
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Frame categories - 2R and 4R sizes with occasion categories
export const frameCategories = pgTable("frame_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // "2R", "4R"
  displayName: text("display_name").notNull(), // "Photo 2R", "Photo 4R"
  occasion: text("occasion").default("general"), // general | wedding | birthday | graduation | corporate | holiday
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const frames = pgTable("frames", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // '2R' | '4R'
  occasion: text("occasion").default("general"), // general | wedding | birthday | graduation | corporate | holiday
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"), // Smaller preview image
  dimensionsW: integer("dimensions_w").notNull(),
  dimensionsH: integer("dimensions_h").notNull(),
  additionalFee: integer("additional_fee").default(0),
  tags: text("tags").array(), // Array of tags for filtering
  description: text("description"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  // For frame duplication/versioning
  parentId: uuid("parent_id").references((): any => frames.id),
  version: integer("version").default(1),
  // Soft delete
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Photo filters/presets
export const photoPresets = pgTable("photo_presets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // "Warm Glow", "Cool Breeze", "Vintage"
  hue: numeric("hue").default("0"),
  saturation: numeric("saturation").default("100"),
  brightness: numeric("brightness").default("100"),
  contrast: numeric("contrast").default("100"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  originalName: text("original_name"),
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  orderIndex: integer("order_index").default(0),
  // Soft delete
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const compositions = pgTable("compositions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  frameId: uuid("frame_id").references(() => frames.id),
  status: text("status").default("draft"), // draft | review | approved | finalized
  previewUrl: text("preview_url"),
  exportUrl: text("export_url"),
  // Share link for real-time preview
  shareToken: text("share_token").unique(),
  shareUrl: text("share_url"),
  // Customer feedback
  customerNote: text("customer_note"),
  staffNote: text("staff_note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const allocations = pgTable("allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  compositionId: uuid("composition_id").references(() => compositions.id, { onDelete: "cascade" }).notNull(),
  slotId: uuid("slot_id").references(() => frameSlots.id),
  photoId: uuid("photo_id").references(() => photos.id),
  scale: numeric("scale").default("1").notNull(),
  offsetX: numeric("offset_x").default("0").notNull(),
  offsetY: numeric("offset_y").default("0").notNull(),
  hue: numeric("hue").default("0").notNull(),
  saturation: numeric("saturation").default("100").notNull(),
  brightness: numeric("brightness").default("100").notNull(),
  contrast: numeric("contrast").default("100").notNull(),
  rotation: numeric("rotation").default("0").notNull(),
  // Crop data
  cropX: numeric("crop_x").default("0"),
  cropY: numeric("crop_y").default("0"),
  cropWidth: numeric("crop_width"),
  cropHeight: numeric("crop_height"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity Log for audit trail
export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: text("entity_type").notNull(), // session | frame | composition | photo | staff
  entityId: uuid("entity_id"),
  action: text("action").notNull(), // create | update | delete | approve | finalize | share
  actorType: text("actor_type").notNull(), // staff | customer | system
  actorId: uuid("actor_id"),
  changes: jsonb("changes"), // { field: { old: x, new: y } }
  metadata: jsonb("metadata"), // Additional context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Print Queue for production management
export const printQueue = pgTable("print_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  compositionId: uuid("composition_id").references(() => compositions.id).notNull(),
  sessionId: uuid("session_id").references(() => sessions.id).notNull(),
  printSize: text("print_size").notNull(), // "2R" | "4R" | "8R" | etc
  quantity: integer("quantity").default(1),
  status: text("status").default("pending"), // pending | printing | completed | cancelled
  priority: integer("priority").default(0), // Higher = more priority
  staffId: uuid("staff_id").references(() => staff.id),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
