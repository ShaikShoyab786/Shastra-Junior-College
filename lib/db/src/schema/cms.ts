import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type NavigationLink = {
  label: string;
  path: string;
};

export type CmsJson = Record<string, unknown>;
export type EnquiryAnswer = {
  name: string;
  label: string;
  value: string;
};

export const siteSettingsTable = pgTable("site_settings", {
  id: text("id").primaryKey().default("primary"),
  collegeName: text("college_name").notNull(),
  headerTagline: text("header_tagline").notNull().default("Junior College"),
  logoUrl: text("logo_url"),
  navigation: jsonb("navigation").$type<NavigationLink[]>().notNull().default([]),
  footerNote: text("footer_note").notNull().default(""),
  primaryColor: text("primary_color").notNull().default("#0B3472"),
  accentColor: text("accent_color").notNull().default("#E3212B"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const siteEnquiriesTable = pgTable("site_enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  answers: jsonb("answers").$type<EnquiryAnswer[]>().notNull().default([]),
  status: text("status")
    .$type<"new" | "reviewed" | "handled">()
    .notNull()
    .default("new"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const contentSectionsTable = pgTable(
  "content_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageSlug: text("page_slug").notNull().default("home"),
    sectionKey: text("section_key").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    content: jsonb("content").$type<CmsJson>().notNull().default({}),
    isVisible: boolean("is_visible").notNull().default(true),
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
    uniqueIndex("content_sections_page_key_unique").on(
      table.pageSlug,
      table.sectionKey,
    ),
  ],
);

export const contentItemsTable = pgTable("content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => contentSectionsTable.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  linkPath: text("link_path"),
  label: text("label"),
  content: jsonb("content").$type<CmsJson>().notNull().default({}),
  isVisible: boolean("is_visible").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});