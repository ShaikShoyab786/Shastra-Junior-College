import { and, asc, eq, inArray } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateContentItemBody,
  CreateContentItemResponse,
  CreateContentSectionBody,
  CreateContentSectionResponse,
  DeleteContentItemParams,
  DeleteContentSectionParams,
  GetAdminHomeResponse,
  GetAdminHomeSummaryResponse,
  GetHomePageResponse,
  UpdateContentItemBody,
  UpdateContentItemParams,
  UpdateContentItemResponse,
  UpdateContentSectionBody,
  UpdateContentSectionParams,
  UpdateContentSectionResponse,
  UpdateSiteSettingsBody,
  UpdateSiteSettingsResponse,
} from "@workspace/api-zod";
import {
  contentItemsTable,
  contentSectionsTable,
  db,
  siteSettingsTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const adminRouter: IRouter = Router();
const homePageSlug = "home";

type CmsRecord = Record<string, unknown>;

function isSafeImageReference(value: string | null): boolean {
  if (value === null || value.trim() === "") {
    return true;
  }

  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isSafeInternalPath(value: string): boolean {
  return (
    value === "" ||
    value.startsWith("#") ||
    (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"))
  );
}

function validateSectionContent(content: CmsRecord): string | null {
  for (const [key, value] of Object.entries(content)) {
    if (
      typeof value === "string" &&
      /imageurl|image_url|backgroundimage/i.test(key) &&
      !isSafeImageReference(value)
    ) {
      return "Image fields must use an http(s) URL or a same-site asset path.";
    }

    if (
      typeof value === "string" &&
      /(path|href|link)$/i.test(key) &&
      !isSafeInternalPath(value)
    ) {
      return "Homepage links must use a same-site path or an in-page anchor.";
    }
  }

  return null;
}

function serializeSettings(
  settings: typeof siteSettingsTable.$inferSelect,
) {
  return {
    ...settings,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

function serializeSection(
  section: typeof contentSectionsTable.$inferSelect,
) {
  return {
    ...section,
    createdAt: section.createdAt.toISOString(),
    updatedAt: section.updatedAt.toISOString(),
  };
}

function serializeItem(item: typeof contentItemsTable.$inferSelect) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

async function loadHomePage(includeHidden: boolean) {
  const [settings] = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, "primary"))
    .limit(1);

  if (!settings) {
    return null;
  }

  const allSections = await db
    .select()
    .from(contentSectionsTable)
    .where(eq(contentSectionsTable.pageSlug, homePageSlug))
    .orderBy(asc(contentSectionsTable.position), asc(contentSectionsTable.createdAt));
  const sections = includeHidden
    ? allSections
    : allSections.filter((section) => section.isVisible);
  const visibleSectionIds = sections.map((section) => section.id);
  const allItems =
    visibleSectionIds.length > 0
      ? await db
          .select()
          .from(contentItemsTable)
          .where(inArray(contentItemsTable.sectionId, visibleSectionIds))
          .orderBy(asc(contentItemsTable.position), asc(contentItemsTable.createdAt))
      : [];
  const items = includeHidden
    ? allItems
    : allItems.filter((item) => item.isVisible);

  return {
    settings: serializeSettings(settings),
    sections: sections.map(serializeSection),
    items: items.map(serializeItem),
  };
}

router.get("/home", async (req, res): Promise<void> => {
  const content = await loadHomePage(false);

  if (!content) {
    req.log.error("Homepage settings are missing.");
    res.status(503).json({ error: "Homepage content is not ready." });
    return;
  }

  const parsed = GetHomePageResponse.safeParse(content);
  if (!parsed.success) {
    req.log.error({ errors: parsed.error.flatten() }, "Invalid homepage response.");
    res.status(500).json({ error: "Homepage content could not be loaded." });
    return;
  }

  res.json(parsed.data);
});

adminRouter.use(requireAdmin);

adminRouter.get("/admin/home", async (req, res): Promise<void> => {
  const content = await loadHomePage(true);
  if (!content) {
    res.status(503).json({ error: "Homepage content is not ready." });
    return;
  }

  const parsed = GetAdminHomeResponse.safeParse(content);
  if (!parsed.success) {
    req.log.error(
      { errors: parsed.error.flatten() },
      "Invalid admin homepage response.",
    );
    res.status(500).json({ error: "Homepage content could not be loaded." });
    return;
  }

  res.json(parsed.data);
});

adminRouter.get("/admin/home/summary", async (_req, res): Promise<void> => {
  const sections = await db
    .select()
    .from(contentSectionsTable)
    .where(eq(contentSectionsTable.pageSlug, homePageSlug));
  const sectionIds = sections.map((section) => section.id);
  const items =
    sectionIds.length > 0
      ? await db
          .select()
          .from(contentItemsTable)
          .where(inArray(contentItemsTable.sectionId, sectionIds))
      : [];

  res.json(
    GetAdminHomeSummaryResponse.parse({
      sectionCount: sections.length,
      visibleSectionCount: sections.filter((section) => section.isVisible).length,
      hiddenSectionCount: sections.filter((section) => !section.isVisible).length,
      itemCount: items.length,
      visibleItemCount: items.filter((item) => item.isVisible).length,
      hiddenItemCount: items.filter((item) => !item.isVisible).length,
    }),
  );
});

adminRouter.patch("/admin/site-settings", async (req, res): Promise<void> => {
  const parsed = UpdateSiteSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { logoUrl, navigation, ...rest } = parsed.data;
  if (logoUrl !== undefined && !isSafeImageReference(logoUrl)) {
    res.status(400).json({
      error: "Logo must use an http(s) URL or a same-site asset path.",
    });
    return;
  }

  if (
    navigation?.some((link) => !isSafeInternalPath(link.path))
  ) {
    res.status(400).json({
      error: "Navigation links must use a same-site path or an in-page anchor.",
    });
    return;
  }

  const [updated] = await db
    .update(siteSettingsTable)
    .set({
      ...rest,
      ...(logoUrl === undefined ? {} : { logoUrl }),
      ...(navigation === undefined ? {} : { navigation }),
      updatedAt: new Date(),
    })
    .where(eq(siteSettingsTable.id, "primary"))
    .returning();

  if (!updated) {
    res.status(503).json({ error: "Site settings are not ready." });
    return;
  }

  res.json(UpdateSiteSettingsResponse.parse(serializeSettings(updated)));
});

adminRouter.post("/admin/sections", async (req, res): Promise<void> => {
  const parsed = CreateContentSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.pageSlug !== homePageSlug) {
    res.status(400).json({ error: "This editor manages homepage sections only." });
    return;
  }

  if (!/^[a-z][a-z0-9-]*$/.test(parsed.data.sectionKey)) {
    res.status(400).json({
      error: "Section keys must start with a letter and use lowercase letters, numbers, or hyphens.",
    });
    return;
  }

  const contentError = validateSectionContent(parsed.data.content);
  if (contentError) {
    res.status(400).json({ error: contentError });
    return;
  }

  const [existing] = await db
    .select({ id: contentSectionsTable.id })
    .from(contentSectionsTable)
    .where(eq(contentSectionsTable.sectionKey, parsed.data.sectionKey))
    .limit(1);
  if (existing) {
    res.status(400).json({ error: "That section key is already in use." });
    return;
  }

  const [created] = await db
    .insert(contentSectionsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(CreateContentSectionResponse.parse(serializeSection(created)));
});

adminRouter.patch("/admin/sections/:id", async (req, res): Promise<void> => {
  const params = UpdateContentSectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateContentSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.pageSlug && parsed.data.pageSlug !== homePageSlug) {
    res.status(400).json({ error: "This editor manages homepage sections only." });
    return;
  }
  if (
    parsed.data.sectionKey &&
    !/^[a-z][a-z0-9-]*$/.test(parsed.data.sectionKey)
  ) {
    res.status(400).json({
      error: "Section keys must start with a letter and use lowercase letters, numbers, or hyphens.",
    });
    return;
  }
  if (parsed.data.content) {
    const contentError = validateSectionContent(parsed.data.content);
    if (contentError) {
      res.status(400).json({ error: contentError });
      return;
    }
  }

  const [updated] = await db
    .update(contentSectionsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(
      and(
        eq(contentSectionsTable.id, params.data.id),
        eq(contentSectionsTable.pageSlug, homePageSlug),
      ),
    )
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Section not found." });
    return;
  }

  res.json(UpdateContentSectionResponse.parse(serializeSection(updated)));
});

adminRouter.delete("/admin/sections/:id", async (req, res): Promise<void> => {
  const params = DeleteContentSectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(contentSectionsTable)
    .where(
      and(
        eq(contentSectionsTable.id, params.data.id),
        eq(contentSectionsTable.pageSlug, homePageSlug),
      ),
    )
    .returning({ id: contentSectionsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Section not found." });
    return;
  }

  res.sendStatus(204);
});

adminRouter.post("/admin/items", async (req, res): Promise<void> => {
  const parsed = CreateContentItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [section] = await db
    .select({ id: contentSectionsTable.id })
    .from(contentSectionsTable)
    .where(
      and(
        eq(contentSectionsTable.id, parsed.data.sectionId),
        eq(contentSectionsTable.pageSlug, homePageSlug),
      ),
    )
    .limit(1);
  if (!section) {
    res.status(400).json({ error: "Choose an existing homepage section." });
    return;
  }

  if (
    parsed.data.imageUrl !== null &&
    !isSafeImageReference(parsed.data.imageUrl)
  ) {
    res.status(400).json({
      error: "Images must use an http(s) URL or a same-site asset path.",
    });
    return;
  }
  if (
    parsed.data.linkPath !== null &&
    !isSafeInternalPath(parsed.data.linkPath)
  ) {
    res.status(400).json({
      error: "Links must use a same-site path or an in-page anchor.",
    });
    return;
  }

  const [created] = await db
    .insert(contentItemsTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(CreateContentItemResponse.parse(serializeItem(created)));
});

adminRouter.patch("/admin/items/:id", async (req, res): Promise<void> => {
  const params = UpdateContentItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateContentItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.sectionId) {
    const [section] = await db
      .select({ id: contentSectionsTable.id })
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.id, parsed.data.sectionId),
          eq(contentSectionsTable.pageSlug, homePageSlug),
        ),
      )
      .limit(1);
    if (!section) {
      res.status(400).json({ error: "Choose an existing homepage section." });
      return;
    }
  }
  if (
    parsed.data.imageUrl !== undefined &&
    parsed.data.imageUrl !== null &&
    !isSafeImageReference(parsed.data.imageUrl)
  ) {
    res.status(400).json({
      error: "Images must use an http(s) URL or a same-site asset path.",
    });
    return;
  }
  if (
    parsed.data.linkPath !== undefined &&
    parsed.data.linkPath !== null &&
    !isSafeInternalPath(parsed.data.linkPath)
  ) {
    res.status(400).json({
      error: "Links must use a same-site path or an in-page anchor.",
    });
    return;
  }

  const [existingItem] = await db
    .select({ id: contentItemsTable.id })
    .from(contentItemsTable)
    .innerJoin(
      contentSectionsTable,
      eq(contentItemsTable.sectionId, contentSectionsTable.id),
    )
    .where(
      and(
        eq(contentItemsTable.id, params.data.id),
        eq(contentSectionsTable.pageSlug, homePageSlug),
      ),
    )
    .limit(1);
  if (!existingItem) {
    res.status(404).json({ error: "Item not found." });
    return;
  }

  const [updated] = await db
    .update(contentItemsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(contentItemsTable.id, params.data.id))
    .returning();

  res.json(UpdateContentItemResponse.parse(serializeItem(updated)));
});

adminRouter.delete("/admin/items/:id", async (req, res): Promise<void> => {
  const params = DeleteContentItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existingItem] = await db
    .select({ id: contentItemsTable.id })
    .from(contentItemsTable)
    .innerJoin(
      contentSectionsTable,
      eq(contentItemsTable.sectionId, contentSectionsTable.id),
    )
    .where(
      and(
        eq(contentItemsTable.id, params.data.id),
        eq(contentSectionsTable.pageSlug, homePageSlug),
      ),
    )
    .limit(1);
  if (!existingItem) {
    res.status(404).json({ error: "Item not found." });
    return;
  }

  const [deleted] = await db
    .delete(contentItemsTable)
    .where(eq(contentItemsTable.id, params.data.id))
    .returning({ id: contentItemsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Item not found." });
    return;
  }

  res.sendStatus(204);
});

router.use(adminRouter);

export default router;