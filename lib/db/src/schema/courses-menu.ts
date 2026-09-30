import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type CoursesMenuCard = {
  id: string;
  order: number;
  title: string;
  category: string;
  description: string;
  destination: string;
  isVisible: boolean;
  icon: string | null;
  tint: string | null;
  imageUrl: string | null;
  imageAlt: string;
};

export type CoursesMenuBenefit = {
  id: string;
  order: number;
  title: string;
  description: string;
  icon: string | null;
  isVisible: boolean;
};

export type CoursesMenuLink = {
  id: string;
  order: number;
  label: string;
  destination: string;
  isVisible: boolean;
};

export type CoursesMenuButton = CoursesMenuLink & {
  variant: "primary" | "secondary";
};

export type CoursesMenuComingSoonCard = {
  title: string;
  description: string;
  statusLabel: string;
  isVisible: boolean;
};

export type CoursesMenuContent = {
  brandPanel: {
    collegeName: string;
    tagline: string;
    headline: string;
    supportingText: string;
    logoImageUrl: string | null;
    logoImageAlt: string;
    backgroundImageUrl: string | null;
    backgroundImageAlt: string;
  };
  heading: {
    eyebrow: string;
    title: string;
    pathwayBadge: string | null;
  };
  courseCards: CoursesMenuCard[];
  comingSoonCard: CoursesMenuComingSoonCard | null;
  benefits: CoursesMenuBenefit[];
  utilityLinks: CoursesMenuLink[];
  ctaButtons: CoursesMenuButton[];
};

export const coursesMenuSettingsTable = pgTable("courses_menu_settings", {
  id: text("id").primaryKey().default("primary"),
  content: jsonb("content").$type<CoursesMenuContent>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});