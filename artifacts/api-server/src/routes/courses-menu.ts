import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetAdminCoursesMenuResponse,
  GetCoursesMenuResponse,
  UpdateAdminCoursesMenuBody,
} from "@workspace/api-zod";
import {
  coursesMenuSettingsTable,
  db,
  type CoursesMenuContent,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const adminMiddleware = [requireAdmin];

function hasUniqueIdsAndOrders(
  items: Array<{ id: string; order: number }>,
): boolean {
  const ids = new Set<string>();
  const orders = new Set<number>();

  for (const item of items) {
    if (ids.has(item.id) || orders.has(item.order)) {
      return false;
    }
    ids.add(item.id);
    orders.add(item.order);
  }

  return true;
}

function hasSafePathSegments(pathname: string): boolean {
  try {
    return pathname.split("/").every((segment) => {
      const decoded = decodeURIComponent(segment);
      return (
        decoded !== "." &&
        decoded !== ".." &&
        !decoded.includes("/") &&
        !decoded.includes("\\")
      );
    });
  } catch {
    return false;
  }
}

function isSafeDestination(value: string, required: boolean): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return !required;
  }
  if (/[\u0000-\u001f\\]/.test(trimmed)) {
    return false;
  }

  if (trimmed.startsWith("#")) {
    return false;
  }

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) {
      return false;
    }
    const pathname = trimmed.split(/[?#]/, 1)[0] ?? "";
    return hasSafePathSegments(pathname);
  }

  try {
    const url = new URL(trimmed);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return false;
    }

    const authorityEnd = trimmed.indexOf("/", trimmed.indexOf("://") + 3);
    const rawPath =
      authorityEnd < 0
        ? ""
        : (trimmed.slice(authorityEnd).split(/[?#]/, 1)[0] ?? "");
    return hasSafePathSegments(rawPath);
  } catch {
    return false;
  }
}

function isSafeImageReference(value: string | null): boolean {
  if (value === null || value.trim() === "") {
    return true;
  }

  const trimmed = value.trim();
  if (/[\u0000-\u001f\\]/.test(trimmed)) {
    return false;
  }
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) {
      return false;
    }
    return hasSafePathSegments(trimmed.split(/[?#]/, 1)[0] ?? "");
  }

  try {
    const url = new URL(trimmed);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return false;
    }
    const authorityEnd = trimmed.indexOf("/", trimmed.indexOf("://") + 3);
    const rawPath =
      authorityEnd < 0
        ? ""
        : (trimmed.slice(authorityEnd).split(/[?#]/, 1)[0] ?? "");
    return hasSafePathSegments(rawPath);
  } catch {
    return false;
  }
}

function hasUsefulImageAlt(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !["img", "image", "photo", "picture"].includes(normalized);
}

function validateCoursesMenu(menu: CoursesMenuContent): string | null {
  const orderedLists = [
    ["course cards", menu.courseCards],
    ["benefits", menu.benefits],
    ["utility links", menu.utilityLinks],
    ["CTA buttons", menu.ctaButtons],
  ] as const;

  for (const [label, items] of orderedLists) {
    if (!hasUniqueIdsAndOrders(items)) {
      return `Each ${label} list must have unique item IDs and display orders.`;
    }
  }

  for (const card of menu.courseCards) {
    if (!isSafeDestination(card.destination, false)) {
      return "Course destinations must be safe internal paths or HTTP(S) URLs.";
    }
    if (
      card.isVisible &&
      (!card.title.trim() ||
        !card.category.trim() ||
        !card.description.trim())
    ) {
      return "Visible course cards need a title, category, and description.";
    }
    if (!isSafeImageReference(card.imageUrl)) {
      return "Course images must use a safe site path or an HTTP(S) URL.";
    }
    if (card.imageUrl?.trim() && !card.imageAlt.trim()) {
      return "Every course image needs useful alt text.";
    }
  }

  for (const benefit of menu.benefits) {
    if (benefit.isVisible && (!benefit.title.trim() || !benefit.description.trim())) {
      return "Visible benefits need a title and description.";
    }
  }

  for (const link of menu.utilityLinks) {
    if (!isSafeDestination(link.destination, link.isVisible)) {
      return "Utility links must use safe internal paths or HTTP(S) URLs.";
    }
    if (link.isVisible && !link.label.trim()) {
      return "Visible utility links need a label.";
    }
  }

  for (const button of menu.ctaButtons) {
    if (!isSafeDestination(button.destination, button.isVisible)) {
      return "CTA destinations must be safe internal paths or HTTP(S) URLs.";
    }
    if (button.isVisible && !button.label.trim()) {
      return "Visible CTA buttons need a label.";
    }
  }

  if (
    menu.comingSoonCard?.isVisible &&
    (!menu.comingSoonCard.title.trim() ||
      !menu.comingSoonCard.description.trim() ||
      !menu.comingSoonCard.statusLabel.trim())
  ) {
    return "A visible coming-soon card needs a title, description, and status label.";
  }

  for (const [url, alt] of [
    [menu.brandPanel.logoImageUrl, menu.brandPanel.logoImageAlt],
    [menu.brandPanel.backgroundImageUrl, menu.brandPanel.backgroundImageAlt],
  ] as const) {
    if (!isSafeImageReference(url)) {
      return "Brand images must use a safe site path or an HTTP(S) URL.";
    }
    if (url?.trim() && !hasUsefulImageAlt(alt)) {
      return "Every brand image needs descriptive alt text, not a generic label.";
    }
  }

  if (!menu.brandPanel.collegeName.trim() || !menu.brandPanel.headline.trim()) {
    return "The brand panel needs a college name and headline.";
  }
  if (!menu.heading.title.trim()) {
    return "The Courses menu heading needs a title.";
  }

  return null;
}

function visibleMenu(menu: CoursesMenuContent): CoursesMenuContent {
  return {
    ...menu,
    courseCards: menu.courseCards.filter((item) => item.isVisible),
    benefits: menu.benefits.filter((item) => item.isVisible),
    utilityLinks: menu.utilityLinks.filter((item) => item.isVisible),
    ctaButtons: menu.ctaButtons.filter((item) => item.isVisible),
    comingSoonCard:
      menu.comingSoonCard?.isVisible === true ? menu.comingSoonCard : null,
  };
}

router.get("/courses-menu", async (req, res): Promise<void> => {
  const [record] = await db
    .select({ content: coursesMenuSettingsTable.content })
    .from(coursesMenuSettingsTable)
    .where(eq(coursesMenuSettingsTable.id, "primary"))
    .limit(1);

  if (!record) {
    res.status(503).json({ error: "Courses menu content is not ready." });
    return;
  }

  const parsed = GetCoursesMenuResponse.safeParse(visibleMenu(record.content));
  if (!parsed.success) {
    req.log.error(
      { errors: parsed.error.flatten() },
      "Invalid public Courses menu content.",
    );
    res.status(500).json({ error: "Courses menu content could not be loaded." });
    return;
  }

  res.json(parsed.data);
});

router.get(
  "/admin/courses-menu",
  ...adminMiddleware,
  async (req, res): Promise<void> => {
    const [record] = await db
      .select({ content: coursesMenuSettingsTable.content })
      .from(coursesMenuSettingsTable)
      .where(eq(coursesMenuSettingsTable.id, "primary"))
      .limit(1);

    if (!record) {
      res.status(503).json({ error: "Courses menu content is not ready." });
      return;
    }

    const parsed = GetAdminCoursesMenuResponse.safeParse(record.content);
    if (!parsed.success) {
      req.log.error(
        { errors: parsed.error.flatten() },
        "Invalid admin Courses menu content.",
      );
      res.status(500).json({ error: "Courses menu content could not be loaded." });
      return;
    }

    res.json(parsed.data);
  },
);

router.patch(
  "/admin/courses-menu",
  ...adminMiddleware,
  async (req, res): Promise<void> => {
    const parsedBody = UpdateAdminCoursesMenuBody.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.message });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ content: coursesMenuSettingsTable.content })
        .from(coursesMenuSettingsTable)
        .where(eq(coursesMenuSettingsTable.id, "primary"))
        .for("update")
        .limit(1);

      if (!current) {
        return { kind: "missing" as const };
      }

      const content = {
        ...current.content,
        ...parsedBody.data,
      } as CoursesMenuContent;
      const validationError = validateCoursesMenu(content);
      if (validationError) {
        return { kind: "invalid" as const, error: validationError };
      }

      const [updated] = await tx
        .update(coursesMenuSettingsTable)
        .set({ content, updatedAt: new Date() })
        .where(eq(coursesMenuSettingsTable.id, "primary"))
        .returning({ content: coursesMenuSettingsTable.content });

      return updated
        ? { kind: "updated" as const, content: updated.content }
        : { kind: "missing" as const };
    });

    if (result.kind === "missing") {
      res.status(503).json({ error: "Courses menu content is not ready." });
      return;
    }

    if (result.kind === "invalid") {
      res.status(400).json({ error: result.error });
      return;
    }

    const parsed = GetAdminCoursesMenuResponse.safeParse(result.content);
    if (!parsed.success) {
      req.log.error(
        { errors: parsed.error.flatten() },
        "Updated Courses menu content failed response validation.",
      );
      res.status(500).json({ error: "Courses menu content could not be saved." });
      return;
    }

    res.json(parsed.data);
  },
);

export default router;