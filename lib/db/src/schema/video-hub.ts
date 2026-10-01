import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const videoHubSettingsTable = pgTable("video_hub_settings", {
  id: text("id").primaryKey().default("primary"),
  eyebrow: text("eyebrow").notNull(),
  title: text("title").notNull(),
  introduction: text("introduction").notNull(),
  heroImageUrl: text("hero_image_url"),
  heroImageAlt: text("hero_image_alt").notNull().default(""),
  contentSeedVersion: integer("content_seed_version").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const videoCategoriesTable = pgTable(
  "video_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("video_categories_slug_unique").on(table.slug)],
);

export const videosTable = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => videoCategoriesTable.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    youtubeUrl: text("youtube_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    thumbnailAlt: text("thumbnail_alt").notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("videos_publication_order_idx").on(
      table.isPublished,
      table.publishedAt,
      table.position,
    ),
    index("videos_category_idx").on(table.categoryId),
  ],
);