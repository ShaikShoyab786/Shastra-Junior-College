import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
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

export const studyResourceHubSettingsTable = pgTable(
  "study_resource_hub_settings",
  {
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
  },
);

export const studyResourceCategoriesTable = pgTable(
  "study_resource_categories",
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
  (table) => [uniqueIndex("study_resource_categories_slug_unique").on(table.slug)],
);

export const studyResourcesTable = pgTable(
  "study_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => studyResourceCategoriesTable.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    resourceType: text("resource_type").notNull().default("study-notes"),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull().default(0),
    isDemo: boolean("is_demo").notNull().default(false),
    thumbnailUrl: text("thumbnail_url"),
    thumbnailAlt: text("thumbnail_alt").notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    isPublished: boolean("is_published").notNull().default(false),
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
    index("study_resources_publication_order_idx").on(
      table.isPublished,
      table.publishedAt,
      table.position,
    ),
    index("study_resources_category_idx").on(table.categoryId),
  ],
);

export const insertStudyResourceHubSettingsSchema = createInsertSchema(
  studyResourceHubSettingsTable,
).omit({ updatedAt: true });
export type InsertStudyResourceHubSettings = z.infer<
  typeof insertStudyResourceHubSettingsSchema
>;
export type StudyResourceHubSettings =
  typeof studyResourceHubSettingsTable.$inferSelect;

export const insertStudyResourceCategorySchema = createInsertSchema(
  studyResourceCategoriesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudyResourceCategory = z.infer<
  typeof insertStudyResourceCategorySchema
>;
export type StudyResourceCategory =
  typeof studyResourceCategoriesTable.$inferSelect;

export const insertStudyResourceSchema = createInsertSchema(
  studyResourcesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudyResource = z.infer<typeof insertStudyResourceSchema>;
export type StudyResource = typeof studyResourcesTable.$inferSelect;