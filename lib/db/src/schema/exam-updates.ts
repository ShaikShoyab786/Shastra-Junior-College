import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const examUpdateHubSettingsTable = pgTable(
  "exam_update_hub_settings",
  {
    id: text("id").primaryKey().default("primary"),
    eyebrow: text("eyebrow").notNull(),
    title: text("title").notNull(),
    introduction: text("introduction").notNull(),
    contentSeedVersion: integer("content_seed_version").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);

export const examUpdateNoticesTable = pgTable(
  "exam_update_notices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    examCode: text("exam_code").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    sourceUrl: text("source_url").notNull(),
    publishedOn: date("published_on", { mode: "string" }),
    isSample: boolean("is_sample").notNull().default(false),
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
    index("exam_update_notices_publication_order_idx").on(
      table.isPublished,
      table.examCode,
      table.position,
    ),
  ],
);

export const examCalendarEntriesTable = pgTable(
  "exam_calendar_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    examCode: text("exam_code").notNull(),
    examCycle: text("exam_cycle").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    dateStatus: text("date_status").notNull().default("to-be-announced"),
    sourceUrl: text("source_url").notNull(),
    isSample: boolean("is_sample").notNull().default(false),
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
    index("exam_calendar_entries_publication_order_idx").on(
      table.isPublished,
      table.examCode,
      table.examCycle,
      table.position,
    ),
  ],
);

export const insertExamUpdateHubSettingsSchema = createInsertSchema(
  examUpdateHubSettingsTable,
).omit({ updatedAt: true });
export type InsertExamUpdateHubSettings = z.infer<
  typeof insertExamUpdateHubSettingsSchema
>;
export type ExamUpdateHubSettings =
  typeof examUpdateHubSettingsTable.$inferSelect;

export const insertExamUpdateNoticeSchema = createInsertSchema(
  examUpdateNoticesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExamUpdateNotice = z.infer<
  typeof insertExamUpdateNoticeSchema
>;
export type ExamUpdateNotice = typeof examUpdateNoticesTable.$inferSelect;

export const insertExamCalendarEntrySchema = createInsertSchema(
  examCalendarEntriesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExamCalendarEntry = z.infer<
  typeof insertExamCalendarEntrySchema
>;
export type ExamCalendarEntry = typeof examCalendarEntriesTable.$inferSelect;