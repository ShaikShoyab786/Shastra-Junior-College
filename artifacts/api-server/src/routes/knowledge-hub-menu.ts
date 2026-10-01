import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetAdminKnowledgeHubMenuResponse,
  GetKnowledgeHubMenuResponse,
  UpdateAdminKnowledgeHubMenuBody,
} from "@workspace/api-zod";
import {
  db,
  knowledgeHubMenuSettingsTable,
  type KnowledgeHubMenuContent,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const adminMiddleware = [requireAdmin];
const requiredKeys = [
  "article-hub",
  "video-hub",
  "study-resources",
  "exam-updates",
] as const;

function validateKnowledgeHubMenu(
  menu: KnowledgeHubMenuContent,
): string | null {
  if (
    menu.items.length !== requiredKeys.length ||
    new Set(menu.items.map((item) => item.key)).size !== requiredKeys.length ||
    requiredKeys.some((key) => !menu.items.some((item) => item.key === key))
  ) {
    return "The Knowledge Hub menu must contain Article Hub, Video Hub, Study Resources, and Exam Updates.";
  }

  const orders = new Set<number>();
  for (const item of menu.items) {
    if (
      item.order < 0 ||
      item.order >= requiredKeys.length ||
      orders.has(item.order)
    ) {
      return "Each Knowledge Hub menu item must have a unique display order from 0 to 3.";
    }
    orders.add(item.order);
    if (!item.title.trim() || !item.description.trim()) {
      return "Complete the title and description for each Knowledge Hub menu item.";
    }
  }

  if (
    !menu.heading.title.trim() ||
    !menu.ctaLabel.trim()
  ) {
    return "The Knowledge Hub menu needs a heading and Explore button label.";
  }

  return null;
}

router.get("/knowledge-hub-menu", async (req, res): Promise<void> => {
  const [record] = await db
    .select({ content: knowledgeHubMenuSettingsTable.content })
    .from(knowledgeHubMenuSettingsTable)
    .where(eq(knowledgeHubMenuSettingsTable.id, "primary"))
    .limit(1);

  if (!record) {
    res.status(503).json({ error: "Knowledge Hub menu content is not ready." });
    return;
  }

  const parsed = GetKnowledgeHubMenuResponse.safeParse(record.content);
  if (!parsed.success) {
    req.log.error(
      { errors: parsed.error.flatten() },
      "Invalid public Knowledge Hub menu content.",
    );
    res.status(500).json({ error: "Knowledge Hub menu content could not be loaded." });
    return;
  }

  res.json(parsed.data);
});

router.get(
  "/admin/knowledge-hub-menu",
  ...adminMiddleware,
  async (req, res): Promise<void> => {
    const [record] = await db
      .select({ content: knowledgeHubMenuSettingsTable.content })
      .from(knowledgeHubMenuSettingsTable)
      .where(eq(knowledgeHubMenuSettingsTable.id, "primary"))
      .limit(1);

    if (!record) {
      res.status(503).json({ error: "Knowledge Hub menu content is not ready." });
      return;
    }

    const parsed = GetAdminKnowledgeHubMenuResponse.safeParse(record.content);
    if (!parsed.success) {
      req.log.error(
        { errors: parsed.error.flatten() },
        "Invalid admin Knowledge Hub menu content.",
      );
      res.status(500).json({ error: "Knowledge Hub menu content could not be loaded." });
      return;
    }

    res.json(parsed.data);
  },
);

router.patch(
  "/admin/knowledge-hub-menu",
  ...adminMiddleware,
  async (req, res): Promise<void> => {
    const parsedBody = UpdateAdminKnowledgeHubMenuBody.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.message });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ content: knowledgeHubMenuSettingsTable.content })
        .from(knowledgeHubMenuSettingsTable)
        .where(eq(knowledgeHubMenuSettingsTable.id, "primary"))
        .for("update")
        .limit(1);

      if (!current) {
        return { kind: "missing" as const };
      }

      const content = {
        ...current.content,
        ...parsedBody.data,
      } as KnowledgeHubMenuContent;
      const validationError = validateKnowledgeHubMenu(content);
      if (validationError) {
        return { kind: "invalid" as const, error: validationError };
      }

      const [updated] = await tx
        .update(knowledgeHubMenuSettingsTable)
        .set({ content, updatedAt: new Date() })
        .where(eq(knowledgeHubMenuSettingsTable.id, "primary"))
        .returning({ content: knowledgeHubMenuSettingsTable.content });

      return updated
        ? { kind: "updated" as const, content: updated.content }
        : { kind: "missing" as const };
    });

    if (result.kind === "missing") {
      res.status(503).json({ error: "Knowledge Hub menu content is not ready." });
      return;
    }
    if (result.kind === "invalid") {
      res.status(400).json({ error: result.error });
      return;
    }

    const parsed = GetAdminKnowledgeHubMenuResponse.safeParse(result.content);
    if (!parsed.success) {
      req.log.error(
        { errors: parsed.error.flatten() },
        "Updated Knowledge Hub menu content failed response validation.",
      );
      res.status(500).json({ error: "Knowledge Hub menu content could not be saved." });
      return;
    }

    res.json(parsed.data);
  },
);

export default router;