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

export const articleHubSettingsTable = pgTable("article_hub_settings", {
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

export const articleCategoriesTable = pgTable(
  "article_categories",
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
  (table) => [uniqueIndex("article_categories_slug_unique").on(table.slug)],
);

export const articlesTable = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => articleCategoriesTable.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt").notNull().default(""),
    author: text("author").notNull(),
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
    uniqueIndex("articles_slug_unique").on(table.slug),
    index("articles_publication_order_idx").on(
      table.isPublished,
      table.publishedAt,
      table.position,
    ),
    index("articles_category_idx").on(table.categoryId),
  ],
);