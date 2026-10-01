import { and, eq, inArray, like, or, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "node:stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import {
  contentItemsTable,
  contentSectionsTable,
  coursesMenuSettingsTable,
  articleHubSettingsTable,
  articlesTable,
  videoHubSettingsTable,
  videosTable,
  db,
  siteSettingsTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxImageBytes = 2 * 1024 * 1024;
const maxPdfBytes = 10 * 1024 * 1024;

function streamResponse(
  response: Response,
  objectResponse: globalThis.Response,
): void {
  response.status(objectResponse.status);
  objectResponse.headers.forEach((value, key) => response.setHeader(key, value));
  if (objectResponse.body) {
    Readable.fromWeb(
      objectResponse.body as ReadableStream<Uint8Array>,
    ).pipe(response);
  } else {
    response.end();
  }
}

router.post(
  "/storage/uploads/request-url",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid upload details." });
      return;
    }

    const { name, size, contentType } = parsed.data;
    const isPdf = contentType === "application/pdf";
    const isAllowedType = isPdf
      ? name.toLowerCase().endsWith(".pdf")
      : allowedImageTypes.has(contentType);
    const maxFileBytes = isPdf ? maxPdfBytes : maxImageBytes;
    if (
      size < 1 ||
      size > maxFileBytes ||
      !isAllowedType
    ) {
      res.status(400).json({
        error: isPdf
          ? "Choose a PDF file with a .pdf extension no larger than 10 MB."
          : "Choose a PNG, JPEG, or WebP image no larger than 2 MB.",
      });
      return;
    }

    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Could not generate file upload URL.");
      res.status(500).json({ error: "File upload could not be started." });
    }
  },
);

router.get(
  "/storage/public-objects/*filePath",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join("/") : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: "File not found." });
        return;
      }
      streamResponse(res, await objectStorageService.downloadObject(file));
    } catch (error) {
      req.log.error({ err: error }, "Could not serve public App Storage object.");
      res.status(500).json({ error: "File could not be served." });
    }
  },
);

router.get(
  "/storage/objects/*path",
  async (req: Request, res: Response): Promise<void> => {
    const raw = req.params.path;
    const objectPath = Array.isArray(raw) ? raw.join("/") : raw;
    if (!/^uploads\/[0-9a-f-]{36}$/i.test(objectPath)) {
      res.status(404).json({ error: "Object not found." });
      return;
    }

    try {
      const [settings] = await db
        .select({ logoUrl: siteSettingsTable.logoUrl })
        .from(siteSettingsTable)
        .where(eq(siteSettingsTable.id, "primary"))
        .limit(1);
      const logoDoesNotMatch =
        settings?.logoUrl !== `/objects/${objectPath}` &&
        settings?.logoUrl !== `/api/storage/objects/${objectPath}`;
      const [galleryImage] = await db
        .select({ id: contentItemsTable.id })
        .from(contentItemsTable)
        .innerJoin(
          contentSectionsTable,
          eq(contentItemsTable.sectionId, contentSectionsTable.id),
        )
        .where(
          and(
            inArray(contentSectionsTable.pageSlug, ["home", "gallery"]),
            eq(contentSectionsTable.sectionKey, "gallery"),
            or(
              eq(contentItemsTable.imageUrl, `/objects/${objectPath}`),
              eq(
                contentItemsTable.imageUrl,
                `/api/storage/objects/${objectPath}`,
              ),
            ),
          ),
        )
        .limit(1);
      const [placementRecordImage] = await db
        .select({ id: contentItemsTable.id })
        .from(contentItemsTable)
        .innerJoin(
          contentSectionsTable,
          eq(contentItemsTable.sectionId, contentSectionsTable.id),
        )
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "home"),
            eq(contentSectionsTable.sectionKey, "placement-records"),
            eq(contentItemsTable.itemType, "placement-record"),
            or(
              eq(contentItemsTable.imageUrl, `/objects/${objectPath}`),
              eq(
                contentItemsTable.imageUrl,
                `/api/storage/objects/${objectPath}`,
              ),
            ),
          ),
        )
        .limit(1);
      const [facultyPortrait] = await db
        .select({ id: contentItemsTable.id })
        .from(contentItemsTable)
        .innerJoin(
          contentSectionsTable,
          eq(contentItemsTable.sectionId, contentSectionsTable.id),
        )
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "faculty"),
            eq(contentSectionsTable.sectionKey, "faculty"),
            eq(contentItemsTable.itemType, "faculty-profile"),
            or(
              eq(contentItemsTable.imageUrl, `/objects/${objectPath}`),
              eq(
                contentItemsTable.imageUrl,
                `/api/storage/objects/${objectPath}`,
              ),
            ),
          ),
        )
        .limit(1);
      const aboutSections = await db
        .select({ content: contentSectionsTable.content })
        .from(contentSectionsTable)
        .where(eq(contentSectionsTable.pageSlug, "about"));
      const aboutImageUrls = aboutSections
        .map(({ content }) => {
          if (
            typeof content !== "object" ||
            content === null ||
            Array.isArray(content)
          ) {
            return undefined;
          }
          const imageUrl = (content as Record<string, unknown>).imageUrl;
          return typeof imageUrl === "string" ? imageUrl : undefined;
        })
        .filter((imageUrl): imageUrl is string => imageUrl !== undefined);
      const aboutImageMatches =
        aboutImageUrls.includes(`/objects/${objectPath}`) ||
        aboutImageUrls.includes(`/api/storage/objects/${objectPath}`);
      const [coursesMenu] = await db
        .select({ content: coursesMenuSettingsTable.content })
        .from(coursesMenuSettingsTable)
        .where(eq(coursesMenuSettingsTable.id, "primary"))
        .limit(1);
      const courseMenuContent = coursesMenu?.content;
      const coursesMenuImageUrls = courseMenuContent
        ? [
            courseMenuContent.brandPanel.logoImageUrl,
            courseMenuContent.brandPanel.backgroundImageUrl,
            ...courseMenuContent.courseCards.map((card) => card.imageUrl),
          ]
        : [];
      const coursesMenuImageMatches =
        coursesMenuImageUrls.includes(`/objects/${objectPath}`) ||
        coursesMenuImageUrls.includes(`/api/storage/objects/${objectPath}`);
      const [courseHeroImage] = await db
        .select({ id: contentSectionsTable.id })
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "courses"),
            like(contentSectionsTable.sectionKey, "course-%-hero"),
            or(
              sql`${contentSectionsTable.content}->>'imageUrl' = ${`/objects/${objectPath}`}`,
              sql`${contentSectionsTable.content}->>'imageUrl' = ${`/api/storage/objects/${objectPath}`}`,
            ),
          ),
        )
        .limit(1);
      const [courseCurriculumPdf] = await db
        .select({ id: contentSectionsTable.id })
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "courses"),
            like(contentSectionsTable.sectionKey, "course-%-curriculum"),
            or(
              sql`${contentSectionsTable.content}->>'pdfPath' = ${`/objects/${objectPath}`}`,
              sql`${contentSectionsTable.content}->>'pdfPath' = ${`/api/storage/objects/${objectPath}`}`,
            ),
          ),
        )
        .limit(1);
      const [articleHubHeroImage] = await db
        .select({ id: articleHubSettingsTable.id })
        .from(articleHubSettingsTable)
        .where(
          or(
            eq(
              articleHubSettingsTable.heroImageUrl,
              `/objects/${objectPath}`,
            ),
            eq(
              articleHubSettingsTable.heroImageUrl,
              `/api/storage/objects/${objectPath}`,
            ),
          ),
        )
        .limit(1);
      const [articleCoverImage] = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(
          or(
            eq(articlesTable.imageUrl, `/objects/${objectPath}`),
            eq(articlesTable.imageUrl, `/api/storage/objects/${objectPath}`),
          ),
        )
        .limit(1);
      const [videoHubHeroImage] = await db
        .select({ id: videoHubSettingsTable.id })
        .from(videoHubSettingsTable)
        .where(
          or(
            eq(videoHubSettingsTable.heroImageUrl, `/objects/${objectPath}`),
            eq(
              videoHubSettingsTable.heroImageUrl,
              `/api/storage/objects/${objectPath}`,
            ),
          ),
        )
        .limit(1);
      const [videoThumbnail] = await db
        .select({ id: videosTable.id })
        .from(videosTable)
        .where(
          or(
            eq(videosTable.thumbnailUrl, `/objects/${objectPath}`),
            eq(videosTable.thumbnailUrl, `/api/storage/objects/${objectPath}`),
          ),
        )
        .limit(1);

      if (
        logoDoesNotMatch &&
        !galleryImage &&
        !placementRecordImage &&
        !facultyPortrait &&
        !aboutImageMatches &&
        !coursesMenuImageMatches &&
        !courseHeroImage &&
        !courseCurriculumPdf &&
        !articleHubHeroImage &&
        !articleCoverImage &&
        !videoHubHeroImage &&
        !videoThumbnail
      ) {
        res.status(404).json({ error: "Object not found." });
        return;
      }

      const file = await objectStorageService.getObjectEntityFile(
        `/objects/${objectPath}`,
      );
      streamResponse(res, await objectStorageService.downloadObject(file));
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Object not found." });
        return;
      }
      req.log.error({ err: error }, "Could not serve a college media object.");
      res.status(500).json({ error: "Image could not be served." });
    }
  },
);

export default router;