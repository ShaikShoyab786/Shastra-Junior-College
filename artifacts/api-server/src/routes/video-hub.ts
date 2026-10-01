import {
  and,
  asc,
  desc,
  eq,
  isNull,
  lte,
  ne,
  or,
} from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateVideoBody,
  CreateVideoCategoryBody,
  CreateVideoCategoryResponse,
  CreateVideoResponse,
  DeleteVideoCategoryParams,
  DeleteVideoParams,
  GetAdminVideoHubResponse,
  GetVideoHubResponse,
  UpdateVideoBody,
  UpdateVideoCategoryBody,
  UpdateVideoCategoryParams,
  UpdateVideoCategoryResponse,
  UpdateVideoHubSettingsBody,
  UpdateVideoHubSettingsResponse,
  UpdateVideoParams,
  UpdateVideoResponse,
} from "@workspace/api-zod";
import {
  db,
  videoCategoriesTable,
  videoHubSettingsTable,
  videosTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const adminRouter: IRouter = Router();

type VideoRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl: string | null;
  thumbnailAlt: string;
  publishedAt: Date | null;
  isPublished: boolean;
  isFeatured: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

function serializeSettings(settings: typeof videoHubSettingsTable.$inferSelect) {
  return { ...settings, updatedAt: settings.updatedAt.toISOString() };
}

function serializeCategory(
  category: typeof videoCategoriesTable.$inferSelect,
) {
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function serializeVideo(video: VideoRow) {
  return {
    ...video,
    publishedAt: video.publishedAt?.toISOString() ?? null,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
  };
}

function isSafeImageReference(value: string | null): boolean {
  if (value === null || value.trim() === "") return true;
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

function isSafeYouTubeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId: string | null = null;
    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com"
    ) {
      videoId =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/)?.[1] ??
            null;
    }
    return Boolean(videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId));
  } catch {
    return false;
  }
}

async function loadVideoRows(includeUnpublished: boolean): Promise<VideoRow[]> {
  const query = db
    .select({
      id: videosTable.id,
      categoryId: videosTable.categoryId,
      categoryName: videoCategoriesTable.name,
      categorySlug: videoCategoriesTable.slug,
      title: videosTable.title,
      description: videosTable.description,
      youtubeUrl: videosTable.youtubeUrl,
      thumbnailUrl: videosTable.thumbnailUrl,
      thumbnailAlt: videosTable.thumbnailAlt,
      publishedAt: videosTable.publishedAt,
      isPublished: videosTable.isPublished,
      isFeatured: videosTable.isFeatured,
      position: videosTable.position,
      createdAt: videosTable.createdAt,
      updatedAt: videosTable.updatedAt,
    })
    .from(videosTable)
    .innerJoin(
      videoCategoriesTable,
      eq(videosTable.categoryId, videoCategoriesTable.id),
    );
  const rows = includeUnpublished
    ? await query.orderBy(
        asc(videosTable.position),
        desc(videosTable.publishedAt),
        asc(videosTable.createdAt),
      )
    : await query
        .where(
          and(
            eq(videosTable.isPublished, true),
            or(
              isNull(videosTable.publishedAt),
              lte(videosTable.publishedAt, new Date()),
            ),
          ),
        )
        .orderBy(
          desc(videosTable.isFeatured),
          desc(videosTable.publishedAt),
          asc(videosTable.position),
        );
  return rows as VideoRow[];
}

async function loadVideoHub(includeUnpublished: boolean) {
  const [settings] = await db
    .select()
    .from(videoHubSettingsTable)
    .where(eq(videoHubSettingsTable.id, "primary"))
    .limit(1);
  if (!settings) return null;
  const categories = await db
    .select()
    .from(videoCategoriesTable)
    .orderBy(asc(videoCategoriesTable.position), asc(videoCategoriesTable.name));
  const videos = await loadVideoRows(includeUnpublished);
  return {
    settings: serializeSettings(settings),
    categories: categories.map(serializeCategory),
    videos: videos.map(serializeVideo),
  };
}

async function loadVideo(id: string): Promise<VideoRow | null> {
  const [row] = await db
    .select({
      id: videosTable.id,
      categoryId: videosTable.categoryId,
      categoryName: videoCategoriesTable.name,
      categorySlug: videoCategoriesTable.slug,
      title: videosTable.title,
      description: videosTable.description,
      youtubeUrl: videosTable.youtubeUrl,
      thumbnailUrl: videosTable.thumbnailUrl,
      thumbnailAlt: videosTable.thumbnailAlt,
      publishedAt: videosTable.publishedAt,
      isPublished: videosTable.isPublished,
      isFeatured: videosTable.isFeatured,
      position: videosTable.position,
      createdAt: videosTable.createdAt,
      updatedAt: videosTable.updatedAt,
    })
    .from(videosTable)
    .innerJoin(
      videoCategoriesTable,
      eq(videosTable.categoryId, videoCategoriesTable.id),
    )
    .where(eq(videosTable.id, id))
    .limit(1);
  return row ? (row as VideoRow) : null;
}

router.get("/video-hub", async (req, res): Promise<void> => {
  const content = await loadVideoHub(false);
  if (!content) {
    res.status(503).json({ error: "Video Hub content is not ready." });
    return;
  }
  const parsed = GetVideoHubResponse.safeParse(content);
  if (!parsed.success) {
    req.log.error(
      { errors: parsed.error.flatten() },
      "Invalid public Video Hub response.",
    );
    res.status(500).json({ error: "Video Hub content could not be loaded." });
    return;
  }
  res.json(parsed.data);
});

adminRouter.use("/admin/video-hub", requireAdmin);

adminRouter.get("/admin/video-hub", async (req, res): Promise<void> => {
  const content = await loadVideoHub(true);
  if (!content) {
    res.status(503).json({ error: "Video Hub content is not ready." });
    return;
  }
  const parsed = GetAdminVideoHubResponse.safeParse(content);
  if (!parsed.success) {
    req.log.error(
      { errors: parsed.error.flatten() },
      "Invalid admin Video Hub response.",
    );
    res.status(500).json({ error: "Video Hub content could not be loaded." });
    return;
  }
  res.json(parsed.data);
});

adminRouter.patch(
  "/admin/video-hub/settings",
  async (req, res): Promise<void> => {
    const parsed = UpdateVideoHubSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { heroImageUrl, ...rest } = parsed.data;
    if (heroImageUrl !== undefined && !isSafeImageReference(heroImageUrl)) {
      res.status(400).json({
        error: "Hero image must use an http(s) URL or a same-site asset path.",
      });
      return;
    }
    const nextHeroImageUrl =
      heroImageUrl === undefined
        ? (
            await db
              .select({ heroImageUrl: videoHubSettingsTable.heroImageUrl })
              .from(videoHubSettingsTable)
              .where(eq(videoHubSettingsTable.id, "primary"))
              .limit(1)
          )[0]?.heroImageUrl
        : heroImageUrl;
    const nextHeroImageAlt =
      rest.heroImageAlt ??
      (
        await db
          .select({ heroImageAlt: videoHubSettingsTable.heroImageAlt })
          .from(videoHubSettingsTable)
          .where(eq(videoHubSettingsTable.id, "primary"))
          .limit(1)
      )[0]?.heroImageAlt;
    if (nextHeroImageUrl && !nextHeroImageAlt?.trim()) {
      res.status(400).json({ error: "Add alternative text for the hero image." });
      return;
    }
    const [updated] = await db
      .update(videoHubSettingsTable)
      .set({
        ...rest,
        ...(heroImageUrl === undefined ? {} : { heroImageUrl }),
        updatedAt: new Date(),
      })
      .where(eq(videoHubSettingsTable.id, "primary"))
      .returning();
    if (!updated) {
      res.status(503).json({ error: "Video Hub settings are not ready." });
      return;
    }
    res.json(
      UpdateVideoHubSettingsResponse.parse(serializeSettings(updated)),
    );
  },
);

adminRouter.post(
  "/admin/video-hub/categories",
  async (req, res): Promise<void> => {
    const parsed = CreateVideoCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsed.data.slug)) {
      res.status(400).json({
        error: "Use lowercase letters, numbers, and hyphens for the category slug.",
      });
      return;
    }
    const [existing] = await db
      .select({ id: videoCategoriesTable.id })
      .from(videoCategoriesTable)
      .where(eq(videoCategoriesTable.slug, parsed.data.slug))
      .limit(1);
    if (existing) {
      res.status(400).json({ error: "That category slug is already in use." });
      return;
    }
    const [created] = await db
      .insert(videoCategoriesTable)
      .values({
        ...parsed.data,
        name: parsed.data.name.trim(),
        description: parsed.data.description.trim(),
      })
      .returning();
    res
      .status(201)
      .json(CreateVideoCategoryResponse.parse(serializeCategory(created)));
  },
);

adminRouter.patch(
  "/admin/video-hub/categories/:id",
  async (req, res): Promise<void> => {
    const params = UpdateVideoCategoryParams.safeParse(req.params);
    const parsed = UpdateVideoCategoryBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    if (
      parsed.data.slug !== undefined &&
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsed.data.slug)
    ) {
      res.status(400).json({
        error: "Use lowercase letters, numbers, and hyphens for the category slug.",
      });
      return;
    }
    const [existing] = await db
      .select({ id: videoCategoriesTable.id })
      .from(videoCategoriesTable)
      .where(eq(videoCategoriesTable.id, params.data.id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Category not found." });
      return;
    }
    if (parsed.data.slug) {
      const [slugMatch] = await db
        .select({ id: videoCategoriesTable.id })
        .from(videoCategoriesTable)
        .where(eq(videoCategoriesTable.slug, parsed.data.slug))
        .limit(1);
      if (slugMatch && slugMatch.id !== params.data.id) {
        res.status(400).json({ error: "That category slug is already in use." });
        return;
      }
    }
    const [updated] = await db
      .update(videoCategoriesTable)
      .set({
        ...parsed.data,
        ...(parsed.data.name === undefined
          ? {}
          : { name: parsed.data.name.trim() }),
        ...(parsed.data.description === undefined
          ? {}
          : { description: parsed.data.description.trim() }),
        updatedAt: new Date(),
      })
      .where(eq(videoCategoriesTable.id, params.data.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Category not found." });
      return;
    }
    res.json(
      UpdateVideoCategoryResponse.parse(serializeCategory(updated)),
    );
  },
);

adminRouter.delete(
  "/admin/video-hub/categories/:id",
  async (req, res): Promise<void> => {
    const params = DeleteVideoCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [used] = await db
      .select({ id: videosTable.id })
      .from(videosTable)
      .where(eq(videosTable.categoryId, params.data.id))
      .limit(1);
    if (used) {
      res.status(400).json({
        error: "Move or delete the category's videos before deleting this category.",
      });
      return;
    }
    const [deleted] = await db
      .delete(videoCategoriesTable)
      .where(eq(videoCategoriesTable.id, params.data.id))
      .returning({ id: videoCategoriesTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Category not found." });
      return;
    }
    res.sendStatus(204);
  },
);

adminRouter.post(
  "/admin/video-hub/videos",
  async (req, res): Promise<void> => {
    const parsed = CreateVideoBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const data = parsed.data;
    if (!isSafeYouTubeUrl(data.youtubeUrl)) {
      res.status(400).json({ error: "Enter a valid HTTPS YouTube video URL." });
      return;
    }
    if (!isSafeImageReference(data.thumbnailUrl)) {
      res.status(400).json({
        error: "Thumbnails must use an http(s) URL or a same-site asset path.",
      });
      return;
    }
    if (
      data.isPublished &&
      data.thumbnailUrl &&
      !data.thumbnailAlt.trim()
    ) {
      res.status(400).json({
        error: "Add alternative text for a published thumbnail.",
      });
      return;
    }
    const [category] = await db
      .select({ id: videoCategoriesTable.id })
      .from(videoCategoriesTable)
      .where(eq(videoCategoriesTable.id, data.categoryId))
      .limit(1);
    if (!category) {
      res.status(400).json({ error: "Choose an existing video category." });
      return;
    }
    const created = await db.transaction(async (tx) => {
      await tx
        .select({ id: videoHubSettingsTable.id })
        .from(videoHubSettingsTable)
        .where(eq(videoHubSettingsTable.id, "primary"))
        .for("update");
      const isFeatured = data.isFeatured && data.isPublished;
      if (isFeatured) {
        await tx
          .update(videosTable)
          .set({ isFeatured: false, updatedAt: new Date() })
          .where(eq(videosTable.isFeatured, true));
      }
      const [row] = await tx
        .insert(videosTable)
        .values({
          ...data,
          title: data.title.trim(),
          description: data.description.trim(),
          youtubeUrl: data.youtubeUrl.trim(),
          thumbnailUrl: data.thumbnailUrl?.trim() || null,
          thumbnailAlt: data.thumbnailAlt.trim(),
          isFeatured,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt)
            : data.isPublished
              ? new Date()
              : null,
        })
        .returning();
      return row;
    });
    const video = await loadVideo(created.id);
    if (!video) {
      res.status(500).json({ error: "Created video could not be loaded." });
      return;
    }
    res.status(201).json(CreateVideoResponse.parse(serializeVideo(video)));
  },
);

adminRouter.patch(
  "/admin/video-hub/videos/:id",
  async (req, res): Promise<void> => {
    const params = UpdateVideoParams.safeParse(req.params);
    const parsed = UpdateVideoBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const data = parsed.data;
    if (
      data.youtubeUrl !== undefined &&
      !isSafeYouTubeUrl(data.youtubeUrl)
    ) {
      res.status(400).json({ error: "Enter a valid HTTPS YouTube video URL." });
      return;
    }
    if (
      data.thumbnailUrl !== undefined &&
      !isSafeImageReference(data.thumbnailUrl)
    ) {
      res.status(400).json({
        error: "Thumbnails must use an http(s) URL or a same-site asset path.",
      });
      return;
    }
    if (data.categoryId) {
      const [category] = await db
        .select({ id: videoCategoriesTable.id })
        .from(videoCategoriesTable)
        .where(eq(videoCategoriesTable.id, data.categoryId))
        .limit(1);
      if (!category) {
        res.status(400).json({ error: "Choose an existing video category." });
        return;
      }
    }
    const [beforeUpdate] = await db
      .select()
      .from(videosTable)
      .where(eq(videosTable.id, params.data.id))
      .limit(1);
    if (!beforeUpdate) {
      res.status(404).json({ error: "Video not found." });
      return;
    }
    const nextPublished = data.isPublished ?? beforeUpdate.isPublished;
    const nextThumbnailUrl =
      data.thumbnailUrl === undefined
        ? beforeUpdate.thumbnailUrl
        : data.thumbnailUrl;
    const nextThumbnailAlt = data.thumbnailAlt ?? beforeUpdate.thumbnailAlt;
    if (
      nextPublished &&
      nextThumbnailUrl &&
      !nextThumbnailAlt.trim()
    ) {
      res.status(400).json({
        error: "Add alternative text for a published thumbnail.",
      });
      return;
    }
    const updated = await db.transaction(async (tx) => {
      await tx
        .select({ id: videoHubSettingsTable.id })
        .from(videoHubSettingsTable)
        .where(eq(videoHubSettingsTable.id, "primary"))
        .for("update");
      const [existing] = await tx
        .select()
        .from(videosTable)
        .where(eq(videosTable.id, params.data.id))
        .limit(1);
      if (!existing) return false;
      const isPublished = data.isPublished ?? existing.isPublished;
      const isFeatured = (data.isFeatured ?? existing.isFeatured) && isPublished;
      if (isFeatured) {
        await tx
          .update(videosTable)
          .set({ isFeatured: false, updatedAt: new Date() })
          .where(
            and(
              eq(videosTable.isFeatured, true),
              ne(videosTable.id, params.data.id),
            ),
          );
      }
      await tx
        .update(videosTable)
        .set({
          ...data,
          ...(data.title === undefined ? {} : { title: data.title.trim() }),
          ...(data.description === undefined
            ? {}
            : { description: data.description.trim() }),
          ...(data.youtubeUrl === undefined
            ? {}
            : { youtubeUrl: data.youtubeUrl.trim() }),
          ...(data.thumbnailAlt === undefined
            ? {}
            : { thumbnailAlt: data.thumbnailAlt.trim() }),
          ...(data.thumbnailUrl === undefined
            ? {}
            : { thumbnailUrl: data.thumbnailUrl?.trim() || null }),
          isPublished,
          isFeatured,
          ...(data.publishedAt === undefined
            ? isPublished && existing.publishedAt === null
              ? { publishedAt: new Date() }
              : {}
            : {
                publishedAt: data.publishedAt
                  ? new Date(data.publishedAt)
                  : null,
              }),
          updatedAt: new Date(),
        })
        .where(eq(videosTable.id, params.data.id));
      return true;
    });
    if (!updated) {
      res.status(404).json({ error: "Video not found." });
      return;
    }
    const video = await loadVideo(params.data.id);
    if (!video) {
      res.status(500).json({ error: "Updated video could not be loaded." });
      return;
    }
    res.json(UpdateVideoResponse.parse(serializeVideo(video)));
  },
);

adminRouter.delete(
  "/admin/video-hub/videos/:id",
  async (req, res): Promise<void> => {
    const params = DeleteVideoParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [deleted] = await db
      .delete(videosTable)
      .where(eq(videosTable.id, params.data.id))
      .returning({ id: videosTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Video not found." });
      return;
    }
    res.sendStatus(204);
  },
);

router.use(adminRouter);

export default router;