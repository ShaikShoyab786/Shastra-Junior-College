import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  lte,
  ne,
  or,
} from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateStudyResourceBody,
  CreateStudyResourceCategoryBody,
  CreateStudyResourceCategoryResponse,
  CreateStudyResourceResponse,
  DeleteStudyResourceCategoryParams,
  DeleteStudyResourceParams,
  GetAdminStudyResourcesResponse,
  GetStudyResourcesResponse,
  UpdateStudyResourceBody,
  UpdateStudyResourceCategoryBody,
  UpdateStudyResourceCategoryParams,
  UpdateStudyResourceCategoryResponse,
  UpdateStudyResourceResponse,
  UpdateStudyResourceSettingsBody,
  UpdateStudyResourceSettingsResponse,
  UpdateStudyResourceParams,
} from "@workspace/api-zod";
import {
  db,
  studyResourceCategoriesTable,
  studyResourceHubSettingsTable,
  studyResourcesTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const adminRouter: IRouter = Router();

const resourceColumns = {
  id: studyResourcesTable.id,
  categoryId: studyResourcesTable.categoryId,
  categoryName: studyResourceCategoriesTable.name,
  categorySlug: studyResourceCategoriesTable.slug,
  title: studyResourcesTable.title,
  description: studyResourcesTable.description,
  resourceType: studyResourcesTable.resourceType,
  fileUrl: studyResourcesTable.fileUrl,
  fileName: studyResourcesTable.fileName,
  fileSizeBytes: studyResourcesTable.fileSizeBytes,
  isDemo: studyResourcesTable.isDemo,
  thumbnailUrl: studyResourcesTable.thumbnailUrl,
  thumbnailAlt: studyResourcesTable.thumbnailAlt,
  publishedAt: studyResourcesTable.publishedAt,
  isPublished: studyResourcesTable.isPublished,
  position: studyResourcesTable.position,
  createdAt: studyResourcesTable.createdAt,
  updatedAt: studyResourcesTable.updatedAt,
};

function isSafeLocalReference(value: string | null | undefined): boolean {
  if (value == null || value === "") return true;
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("?") &&
    !value.includes("#") &&
    !value.split("/").includes("..")
  );
}

function isSafePdfReference(value: string): boolean {
  return (
    /^\/study-resource-pdfs\/[a-z0-9][a-z0-9-]*\.pdf$/i.test(value) ||
    /^\/(?:api\/storage\/)?objects\/uploads\/[0-9a-f-]{36}$/i.test(value)
  );
}

function isValidImageReference(value: string | null | undefined): boolean {
  return value == null || isSafeLocalReference(value);
}

function toResourceRow(resourceId: string) {
  return db
    .select(resourceColumns)
    .from(studyResourcesTable)
    .innerJoin(
      studyResourceCategoriesTable,
      eq(studyResourcesTable.categoryId, studyResourceCategoriesTable.id),
    )
    .where(eq(studyResourcesTable.id, resourceId))
    .limit(1);
}

async function loadResourceResponse(resourceId: string) {
  const [resource] = await toResourceRow(resourceId);
  return resource ?? null;
}

async function loadStudyResources(includeUnpublished: boolean) {
  const [settings] = await db
    .select()
    .from(studyResourceHubSettingsTable)
    .where(eq(studyResourceHubSettingsTable.id, "primary"))
    .limit(1);

  if (!settings) return null;

  const categories = await db
    .select()
    .from(studyResourceCategoriesTable)
    .orderBy(asc(studyResourceCategoriesTable.position), asc(studyResourceCategoriesTable.name));

  const resources = includeUnpublished
    ? await db
        .select(resourceColumns)
        .from(studyResourcesTable)
        .innerJoin(
          studyResourceCategoriesTable,
          eq(studyResourcesTable.categoryId, studyResourceCategoriesTable.id),
        )
        .orderBy(
          asc(studyResourcesTable.position),
          desc(studyResourcesTable.createdAt),
        )
    : await db
        .select(resourceColumns)
        .from(studyResourcesTable)
        .innerJoin(
          studyResourceCategoriesTable,
          eq(studyResourcesTable.categoryId, studyResourceCategoriesTable.id),
        )
        .where(
          and(
            eq(studyResourcesTable.isPublished, true),
            or(
              isNull(studyResourcesTable.publishedAt),
              lte(studyResourcesTable.publishedAt, new Date()),
            ),
          ),
        )
        .orderBy(
          asc(studyResourcesTable.position),
          desc(studyResourcesTable.createdAt),
        );

  return { settings, categories, resources };
}

router.get("/study-resources", async (req, res): Promise<void> => {
  const data = await loadStudyResources(false);
  if (!data) {
    res.status(503).json({ error: "Study Resources content is not available." });
    return;
  }
  res.json(GetStudyResourcesResponse.parse(data));
});

adminRouter.use(requireAdmin);

adminRouter.get("/", async (req, res): Promise<void> => {
  const data = await loadStudyResources(true);
  if (!data) {
    res.status(503).json({ error: "Study Resources content is not available." });
    return;
  }
  res.json(GetAdminStudyResourcesResponse.parse(data));
});

adminRouter.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateStudyResourceSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!isValidImageReference(parsed.data.heroImageUrl)) {
    res.status(400).json({ error: "Choose a valid local hero image." });
    return;
  }

  const [settings] = await db
    .update(studyResourceHubSettingsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(studyResourceHubSettingsTable.id, "primary"))
    .returning();
  if (!settings) {
    res.status(503).json({ error: "Study Resources settings are not available." });
    return;
  }
  res.json(UpdateStudyResourceSettingsResponse.parse(settings));
});

adminRouter.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateStudyResourceCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [category] = await db
    .insert(studyResourceCategoriesTable)
    .values(parsed.data)
    .onConflictDoNothing()
    .returning();
  if (!category) {
    res.status(409).json({ error: "A category with this slug already exists." });
    return;
  }
  res.status(201).json(CreateStudyResourceCategoryResponse.parse(category));
});

adminRouter.patch("/categories/:id", async (req, res): Promise<void> => {
  const params = UpdateStudyResourceCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStudyResourceCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.slug) {
    const [slugConflict] = await db
      .select({ id: studyResourceCategoriesTable.id })
      .from(studyResourceCategoriesTable)
      .where(
        and(
          eq(studyResourceCategoriesTable.slug, parsed.data.slug),
          ne(studyResourceCategoriesTable.id, params.data.id),
        ),
      )
      .limit(1);
    if (slugConflict) {
      res.status(409).json({ error: "A category with this slug already exists." });
      return;
    }
  }
  const [category] = await db
    .update(studyResourceCategoriesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(studyResourceCategoriesTable.id, params.data.id))
    .returning();
  if (!category) {
    const [conflict] = parsed.data.slug
      ? await db
          .select({ id: studyResourceCategoriesTable.id })
          .from(studyResourceCategoriesTable)
          .where(eq(studyResourceCategoriesTable.slug, parsed.data.slug))
          .limit(1)
      : [];
    res.status(conflict ? 409 : 404).json({
      error: conflict
        ? "A category with this slug already exists."
        : "Category not found.",
    });
    return;
  }
  res.json(UpdateStudyResourceCategoryResponse.parse(category));
});

adminRouter.delete("/categories/:id", async (req, res): Promise<void> => {
  const params = DeleteStudyResourceCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [usage] = await db
    .select({ total: count() })
    .from(studyResourcesTable)
    .where(eq(studyResourcesTable.categoryId, params.data.id));
  if ((usage?.total ?? 0) > 0) {
    res.status(400).json({ error: "Move or delete the category's resources first." });
    return;
  }
  const [deleted] = await db
    .delete(studyResourceCategoriesTable)
    .where(eq(studyResourceCategoriesTable.id, params.data.id))
    .returning({ id: studyResourceCategoriesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Category not found." });
    return;
  }
  res.sendStatus(204);
});

adminRouter.post("/resources", async (req, res): Promise<void> => {
  const parsed = CreateStudyResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!isSafePdfReference(parsed.data.fileUrl)) {
    res.status(400).json({ error: "Choose a valid PDF upload." });
    return;
  }
  if (
    !parsed.data.fileName.toLowerCase().endsWith(".pdf") ||
    parsed.data.fileSizeBytes < 1
  ) {
    res.status(400).json({ error: "A PDF file name and file size are required." });
    return;
  }
  if (!isValidImageReference(parsed.data.thumbnailUrl)) {
    res.status(400).json({ error: "Choose a valid local cover image." });
    return;
  }
  const [category] = await db
    .select({ id: studyResourceCategoriesTable.id })
    .from(studyResourceCategoriesTable)
    .where(eq(studyResourceCategoriesTable.id, parsed.data.categoryId))
    .limit(1);
  if (!category) {
    res.status(400).json({ error: "Choose an existing category." });
    return;
  }

  const [created] = await db
    .insert(studyResourcesTable)
    .values({
      ...parsed.data,
      publishedAt: parsed.data.publishedAt
        ? new Date(parsed.data.publishedAt)
        : null,
    })
    .returning({ id: studyResourcesTable.id });
  const resource = created ? await loadResourceResponse(created.id) : null;
  if (!resource) {
    res.status(500).json({ error: "The resource could not be created." });
    return;
  }
  res.status(201).json(CreateStudyResourceResponse.parse(resource));
});

adminRouter.patch("/resources/:id", async (req, res): Promise<void> => {
  const params = UpdateStudyResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStudyResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.fileUrl !== undefined && !isSafePdfReference(parsed.data.fileUrl)) {
    res.status(400).json({ error: "Choose a valid PDF upload." });
    return;
  }
  if (
    parsed.data.fileName !== undefined &&
    !parsed.data.fileName.toLowerCase().endsWith(".pdf")
  ) {
    res.status(400).json({ error: "Choose a PDF file name." });
    return;
  }
  if (
    parsed.data.fileSizeBytes !== undefined &&
    parsed.data.fileSizeBytes < 1
  ) {
    res.status(400).json({ error: "PDF file size must be greater than zero." });
    return;
  }
  if (
    parsed.data.thumbnailUrl !== undefined &&
    !isValidImageReference(parsed.data.thumbnailUrl)
  ) {
    res.status(400).json({ error: "Choose a valid local cover image." });
    return;
  }
  if (parsed.data.categoryId !== undefined) {
    const [category] = await db
      .select({ id: studyResourceCategoriesTable.id })
      .from(studyResourceCategoriesTable)
      .where(eq(studyResourceCategoriesTable.id, parsed.data.categoryId))
      .limit(1);
    if (!category) {
      res.status(400).json({ error: "Choose an existing category." });
      return;
    }
  }

  const updates = {
    ...parsed.data,
    ...(parsed.data.publishedAt !== undefined
      ? {
          publishedAt: parsed.data.publishedAt
            ? new Date(parsed.data.publishedAt)
            : null,
        }
      : {}),
    updatedAt: new Date(),
  };
  const [updated] = await db
    .update(studyResourcesTable)
    .set(updates)
    .where(eq(studyResourcesTable.id, params.data.id))
    .returning({ id: studyResourcesTable.id });
  if (!updated) {
    res.status(404).json({ error: "Resource not found." });
    return;
  }
  const resource = await loadResourceResponse(updated.id);
  if (!resource) {
    res.status(404).json({ error: "Resource not found." });
    return;
  }
  res.json(UpdateStudyResourceResponse.parse(resource));
});

adminRouter.delete("/resources/:id", async (req, res): Promise<void> => {
  const params = DeleteStudyResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(studyResourcesTable)
    .where(eq(studyResourcesTable.id, params.data.id))
    .returning({ id: studyResourcesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Resource not found." });
    return;
  }
  res.sendStatus(204);
});

router.use("/admin/study-resources", adminRouter);

export default router;