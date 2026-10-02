import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { siteEnquiriesTable } from "./cms";

export const siteEnquiryNotesTable = pgTable(
  "site_enquiry_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enquiryId: uuid("enquiry_id")
      .notNull()
      .references(() => siteEnquiriesTable.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("site_enquiry_notes_enquiry_created_idx").on(
      table.enquiryId,
      table.createdAt,
    ),
  ],
);

export type SiteEnquiryNote = typeof siteEnquiryNotesTable.$inferSelect;