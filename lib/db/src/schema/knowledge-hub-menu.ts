import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type KnowledgeHubMenuItemKey =
  | "article-hub"
  | "video-hub"
  | "study-resources"
  | "exam-updates";

export type KnowledgeHubMenuItem = {
  key: KnowledgeHubMenuItemKey;
  order: number;
  title: string;
  description: string;
};

export type KnowledgeHubMenuContent = {
  heading: {
    eyebrow: string;
    title: string;
    description: string;
  };
  items: KnowledgeHubMenuItem[];
  ctaLabel: string;
};

export const knowledgeHubMenuSettingsTable = pgTable(
  "knowledge_hub_menu_settings",
  {
    id: text("id").primaryKey().default("primary"),
    content: jsonb("content").$type<KnowledgeHubMenuContent>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);