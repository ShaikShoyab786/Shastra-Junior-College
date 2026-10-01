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
  CreateArticleBody,
  CreateArticleCategoryBody,
  CreateArticleCategoryResponse,
  CreateArticleResponse,
  DeleteArticleCategoryParams,
  DeleteArticleParams,
  GetAdminArticleHubResponse,
  GetArticleBySlugParams,
  GetArticleBySlugResponse,
  GetArticleHubResponse,
  UpdateArticleBody,
  UpdateArticleCategoryBody,
  UpdateArticleCategoryParams,
  UpdateArticleCategoryResponse,
  UpdateArticleHubSettingsBody,
  UpdateArticleHubSettingsResponse,
  UpdateArticleParams,
  UpdateArticleResponse,
} from "@workspace/api-zod";
import {
  articleCategoriesTable,
  articleHubSettingsTable,
  articlesTable,
  db,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const adminRouter: IRouter = Router();

type ArticleRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string;
  author: string;
  publishedAt: Date | null;
  isPublished: boolean;
  isFeatured: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

function serializeSettings(settings: typeof articleHubSettingsTable.$inferSelect) {
  return { ...settings, updatedAt: settings.updatedAt.toISOString() };
}

function serializeCategory(
  category: typeof articleCategoriesTable.$inferSelect,
) {
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function serializeArticle(article: ArticleRow) {
  return {
    ...article,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
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

function isSafeSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

async function loadArticleRows(includeUnpublished: boolean): Promise<ArticleRow[]> {
  const columns = {
    id: articlesTable.id,
    categoryId: articlesTable.categoryId,
    categoryName: articleCategoriesTable.name,
    categorySlug: articleCategoriesTable.slug,
    slug: articlesTable.slug,
    title: articlesTable.title,
    excerpt: articlesTable.excerpt,
    body: articlesTable.body,
    imageUrl: articlesTable.imageUrl,
    imageAlt: articlesTable.imageAlt,
    author: articlesTable.author,
    publishedAt: articlesTable.publishedAt,
    isPublished: articlesTable.isPublished,
    isFeatured: articlesTable.isFeatured,
    position: articlesTable.position,
    createdAt: articlesTable.createdAt,
    updatedAt: articlesTable.updatedAt,
  };
  const baseQuery = db
    .select(columns)
    .from(articlesTable)
    .innerJoin(
      articleCategoriesTable,
      eq(articlesTable.categoryId, articleCategoriesTable.id),
    );
  const rows = includeUnpublished
    ? await baseQuery.orderBy(
        asc(articlesTable.position),
        desc(articlesTable.publishedAt),
        asc(articlesTable.createdAt),
      )
    : await baseQuery
        .where(
          and(
            eq(articlesTable.isPublished, true),
            or(
              isNull(articlesTable.publishedAt),
              lte(articlesTable.publishedAt, new Date()),
            ),
          ),
        )
        .orderBy(
          desc(articlesTable.isFeatured),
          desc(articlesTable.publishedAt),
          asc(articlesTable.position),
        );
  return rows as ArticleRow[];
}

async function loadHub(includeUnpublished: boolean) {
  const [settings] = await db
    .select()
    .from(articleHubSettingsTable)
    .where(eq(articleHubSettingsTable.id, "primary"))
    .limit(1);
  if (!settings) return null;

  const categories = await db
    .select()
    .from(articleCategoriesTable)
    .orderBy(asc(articleCategoriesTable.position), asc(articleCategoriesTable.name));
  const articles = await loadArticleRows(includeUnpublished);
  return {
    settings: serializeSettings(settings),
    categories: categories.map(serializeCategory),
    articles: articles.map(serializeArticle),
  };
}

router.get("/article-hub", async (req, res): Promise<void> => {
  const content = await loadHub(false);
  if (!content) {
    res.status(503).json({ error: "Article Hub content is not ready." });
    return;
  }
  const parsed = GetArticleHubResponse.safeParse(content);
  if (!parsed.success) {
    req.log.error(
      { errors: parsed.error.flatten() },
      "Invalid public Article Hub response.",
    );
    res.status(500).json({ error: "Article Hub content could not be loaded." });
    return;
  }
  res.json(parsed.data);
});

router.get("/article-hub/articles/:slug", async (req, res): Promise<void> => {
  const params = GetArticleBySlugParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Article not found." });
    return;
  }
  const [row] = await db
    .select({
      id: articlesTable.id,
      categoryId: articlesTable.categoryId,
      categoryName: articleCategoriesTable.name,
      categorySlug: articleCategoriesTable.slug,
      slug: articlesTable.slug,
      title: articlesTable.title,
      excerpt: articlesTable.excerpt,
      body: articlesTable.body,
      imageUrl: articlesTable.imageUrl,
      imageAlt: articlesTable.imageAlt,
      author: articlesTable.author,
      publishedAt: articlesTable.publishedAt,
      isPublished: articlesTable.isPublished,
      isFeatured: articlesTable.isFeatured,
      position: articlesTable.position,
      createdAt: articlesTable.createdAt,
      updatedAt: articlesTable.updatedAt,
    })
    .from(articlesTable)
    .innerJoin(
      articleCategoriesTable,
      eq(articlesTable.categoryId, articleCategoriesTable.id),
    )
    .where(
      and(
        eq(articlesTable.slug, params.data.slug),
        eq(articlesTable.isPublished, true),
        or(
          isNull(articlesTable.publishedAt),
          lte(articlesTable.publishedAt, new Date()),
        ),
      ),
    )
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Article not found." });
    return;
  }
  const parsed = GetArticleBySlugResponse.safeParse({
    article: serializeArticle(row as ArticleRow),
  });
  if (!parsed.success) {
    req.log.error(
      { errors: parsed.error.flatten() },
      "Invalid public article response.",
    );
    res.status(500).json({ error: "Article could not be loaded." });
    return;
  }
  res.json(parsed.data);
});

adminRouter.use("/admin/article-hub", requireAdmin);

adminRouter.get("/admin/article-hub", async (req, res): Promise<void> => {
  const content = await loadHub(true);
  if (!content) {
    res.status(503).json({ error: "Article Hub content is not ready." });
    return;
  }
  const parsed = GetAdminArticleHubResponse.safeParse(content);
  if (!parsed.success) {
    req.log.error(
      { errors: parsed.error.flatten() },
      "Invalid admin Article Hub response.",
    );
    res.status(500).json({ error: "Article Hub content could not be loaded." });
    return;
  }
  res.json(parsed.data);
});

adminRouter.patch(
  "/admin/article-hub/settings",
  async (req, res): Promise<void> => {
    const parsed = UpdateArticleHubSettingsBody.safeParse(req.body);
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
    const [updated] = await db
      .update(articleHubSettingsTable)
      .set({
        ...rest,
        ...(heroImageUrl === undefined ? {} : { heroImageUrl }),
        updatedAt: new Date(),
      })
      .where(eq(articleHubSettingsTable.id, "primary"))
      .returning();
    if (!updated) {
      res.status(503).json({ error: "Article Hub settings are not ready." });
      return;
    }
    res.json(UpdateArticleHubSettingsResponse.parse(serializeSettings(updated)));
  },
);

adminRouter.post(
  "/admin/article-hub/categories",
  async (req, res): Promise<void> => {
    const parsed = CreateArticleCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    if (!isSafeSlug(parsed.data.slug)) {
      res.status(400).json({ error: "Use lowercase letters, numbers, and hyphens for the category slug." });
      return;
    }
    const [existing] = await db
      .select({ id: articleCategoriesTable.id })
      .from(articleCategoriesTable)
      .where(eq(articleCategoriesTable.slug, parsed.data.slug))
      .limit(1);
    if (existing) {
      res.status(400).json({ error: "That category slug is already in use." });
      return;
    }
    const [created] = await db
      .insert(articleCategoriesTable)
      .values({
        ...parsed.data,
        name: parsed.data.name.trim(),
        description: parsed.data.description.trim(),
      })
      .returning();
    res
      .status(201)
      .json(CreateArticleCategoryResponse.parse(serializeCategory(created)));
  },
);

adminRouter.patch(
  "/admin/article-hub/categories/:id",
  async (req, res): Promise<void> => {
    const params = UpdateArticleCategoryParams.safeParse(req.params);
    const parsed = UpdateArticleCategoryBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    if (parsed.data.slug !== undefined && !isSafeSlug(parsed.data.slug)) {
      res.status(400).json({ error: "Use lowercase letters, numbers, and hyphens for the category slug." });
      return;
    }
    const [existing] = await db
      .select({ id: articleCategoriesTable.id })
      .from(articleCategoriesTable)
      .where(eq(articleCategoriesTable.id, params.data.id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Category not found." });
      return;
    }
    if (parsed.data.slug) {
      const [slugMatch] = await db
        .select({ id: articleCategoriesTable.id })
        .from(articleCategoriesTable)
        .where(eq(articleCategoriesTable.slug, parsed.data.slug))
        .limit(1);
      if (slugMatch && slugMatch.id !== params.data.id) {
        res.status(400).json({ error: "That category slug is already in use." });
        return;
      }
    }
    const [updated] = await db
      .update(articleCategoriesTable)
      .set({
        ...parsed.data,
        ...(parsed.data.name === undefined ? {} : { name: parsed.data.name.trim() }),
        ...(parsed.data.description === undefined
          ? {}
          : { description: parsed.data.description.trim() }),
        updatedAt: new Date(),
      })
      .where(eq(articleCategoriesTable.id, params.data.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Category not found." });
      return;
    }
    res.json(UpdateArticleCategoryResponse.parse(serializeCategory(updated)));
  },
);

adminRouter.delete(
  "/admin/article-hub/categories/:id",
  async (req, res): Promise<void> => {
    const params = DeleteArticleCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [used] = await db
      .select({ id: articlesTable.id })
      .from(articlesTable)
      .where(eq(articlesTable.categoryId, params.data.id))
      .limit(1);
    if (used) {
      res.status(400).json({
        error: "Move or delete the category's articles before deleting this category.",
      });
      return;
    }
    const [deleted] = await db
      .delete(articleCategoriesTable)
      .where(eq(articleCategoriesTable.id, params.data.id))
      .returning({ id: articleCategoriesTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Category not found." });
      return;
    }
    res.sendStatus(204);
  },
);

adminRouter.post(
  "/admin/article-hub/articles",
  async (req, res): Promise<void> => {
    const parsed = CreateArticleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const data = parsed.data;
    if (!isSafeSlug(data.slug)) {
      res.status(400).json({ error: "Use lowercase letters, numbers, and hyphens for the article slug." });
      return;
    }
    if (!isSafeImageReference(data.imageUrl)) {
      res.status(400).json({
        error: "Article images must use an http(s) URL or a same-site asset path.",
      });
      return;
    }
    const [category] = await db
      .select({ id: articleCategoriesTable.id })
      .from(articleCategoriesTable)
      .where(eq(articleCategoriesTable.id, data.categoryId))
      .limit(1);
    if (!category) {
      res.status(400).json({ error: "Choose an existing article category." });
      return;
    }
    const [slugMatch] = await db
      .select({ id: articlesTable.id })
      .from(articlesTable)
      .where(eq(articlesTable.slug, data.slug))
      .limit(1);
    if (slugMatch) {
      res.status(400).json({ error: "That article slug is already in use." });
      return;
    }
    const article = await db.transaction(async (tx) => {
      if (data.isFeatured) {
        await tx
          .update(articlesTable)
          .set({ isFeatured: false, updatedAt: new Date() })
          .where(eq(articlesTable.isFeatured, true));
      }
      const [created] = await tx
        .insert(articlesTable)
        .values({
          ...data,
          slug: data.slug.trim(),
          title: data.title.trim(),
          excerpt: data.excerpt.trim(),
          author: data.author.trim(),
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt)
            : data.isPublished
              ? new Date()
              : null,
        })
        .returning();
      return created;
    });
    const [categoryRow] = await db
      .select()
      .from(articleCategoriesTable)
      .where(eq(articleCategoriesTable.id, article.categoryId))
      .limit(1);
    if (!categoryRow) {
      res.status(500).json({ error: "Article category could not be loaded." });
      return;
    }
    const parsedResponse = CreateArticleResponse.parse(
      serializeArticle({
        ...article,
        categoryName: categoryRow.name,
        categorySlug: categoryRow.slug,
      }),
    );
    res.status(201).json(parsedResponse);
  },
);

adminRouter.patch(
  "/admin/article-hub/articles/:id",
  async (req, res): Promise<void> => {
    const params = UpdateArticleParams.safeParse(req.params);
    const parsed = UpdateArticleBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const data = parsed.data;
    if (data.slug !== undefined && !isSafeSlug(data.slug)) {
      res.status(400).json({ error: "Use lowercase letters, numbers, and hyphens for the article slug." });
      return;
    }
    if (data.imageUrl !== undefined && !isSafeImageReference(data.imageUrl)) {
      res.status(400).json({
        error: "Article images must use an http(s) URL or a same-site asset path.",
      });
      return;
    }
    if (data.categoryId) {
      const [category] = await db
        .select({ id: articleCategoriesTable.id })
        .from(articleCategoriesTable)
        .where(eq(articleCategoriesTable.id, data.categoryId))
        .limit(1);
      if (!category) {
        res.status(400).json({ error: "Choose an existing article category." });
        return;
      }
    }
    if (data.slug) {
      const [slugMatch] = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(eq(articlesTable.slug, data.slug))
        .limit(1);
      if (slugMatch && slugMatch.id !== params.data.id) {
        res.status(400).json({ error: "That article slug is already in use." });
        return;
      }
    }
    const updated = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.id, params.data.id))
        .limit(1);
      if (!existing) return null;
      if (data.isFeatured) {
        await tx
          .update(articlesTable)
          .set({ isFeatured: false, updatedAt: new Date() })
          .where(
            and(
              eq(articlesTable.isFeatured, true),
              ne(articlesTable.id, params.data.id),
            ),
          );
      }
      const values = {
        ...data,
        ...(data.slug === undefined ? {} : { slug: data.slug.trim() }),
        ...(data.title === undefined ? {} : { title: data.title.trim() }),
        ...(data.excerpt === undefined ? {} : { excerpt: data.excerpt.trim() }),
        ...(data.author === undefined ? {} : { author: data.author.trim() }),
        ...(data.publishedAt === undefined
          ? data.isPublished && existing.publishedAt === null
            ? { publishedAt: new Date() }
            : {}
          : { publishedAt: data.publishedAt ? new Date(data.publishedAt) : null }),
        updatedAt: new Date(),
      };
      const [saved] = await tx
        .update(articlesTable)
        .set(values)
        .where(eq(articlesTable.id, params.data.id))
        .returning();
      return saved ?? null;
    });
    if (!updated) {
      res.status(404).json({ error: "Article not found." });
      return;
    }
    const [categoryRow] = await db
      .select()
      .from(articleCategoriesTable)
      .where(eq(articleCategoriesTable.id, updated.categoryId))
      .limit(1);
    if (!categoryRow) {
      res.status(500).json({ error: "Article category could not be loaded." });
      return;
    }
    res.json(
      UpdateArticleResponse.parse(
        serializeArticle({
          ...updated,
          categoryName: categoryRow.name,
          categorySlug: categoryRow.slug,
        }),
      ),
    );
  },
);

adminRouter.delete(
  "/admin/article-hub/articles/:id",
  async (req, res): Promise<void> => {
    const params = DeleteArticleParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [deleted] = await db
      .delete(articlesTable)
      .where(eq(articlesTable.id, params.data.id))
      .returning({ id: articlesTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Article not found." });
      return;
    }
    res.sendStatus(204);
  },
);

router.use(adminRouter);

export default router;