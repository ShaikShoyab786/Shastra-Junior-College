import { and, asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateExamCalendarEntryBody,
  CreateExamCalendarEntryResponse,
  CreateExamUpdateNoticeBody,
  CreateExamUpdateNoticeResponse,
  DeleteExamCalendarEntryParams,
  DeleteExamUpdateNoticeParams,
  GetAdminExamUpdatesResponse,
  GetExamUpdatesResponse,
  UpdateExamCalendarEntryBody,
  UpdateExamCalendarEntryParams,
  UpdateExamCalendarEntryResponse,
  UpdateExamUpdateNoticeBody,
  UpdateExamUpdateNoticeParams,
  UpdateExamUpdateNoticeResponse,
  UpdateExamUpdateSettingsBody,
  UpdateExamUpdateSettingsResponse,
} from "@workspace/api-zod";
import {
  db,
  examCalendarEntriesTable,
  examUpdateHubSettingsTable,
  examUpdateNoticesTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const adminRouter: IRouter = Router();

function isSecureSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function hasValidCalendarDates(
  startDate: string | null,
  endDate: string | null,
  dateStatus: string,
): boolean {
  if (
    (startDate && !isValidDateOnly(startDate)) ||
    (endDate && !isValidDateOnly(endDate))
  ) {
    return false;
  }
  if (endDate && !startDate) return false;
  if (startDate && endDate && endDate < startDate) return false;
  if (dateStatus === "to-be-announced") {
    return startDate === null && endDate === null;
  }
  return Boolean(startDate);
}

async function loadExamUpdates(includeUnpublished: boolean) {
  const [settings] = await db
    .select()
    .from(examUpdateHubSettingsTable)
    .where(eq(examUpdateHubSettingsTable.id, "primary"))
    .limit(1);

  if (!settings) return null;

  const noticeWhere = includeUnpublished
    ? undefined
    : eq(examUpdateNoticesTable.isPublished, true);
  const calendarWhere = includeUnpublished
    ? undefined
    : eq(examCalendarEntriesTable.isPublished, true);

  const noticesQuery = db
    .select()
    .from(examUpdateNoticesTable)
    .orderBy(
      asc(examUpdateNoticesTable.position),
      asc(examUpdateNoticesTable.examCode),
      asc(examUpdateNoticesTable.publishedOn),
    );
  const calendarQuery = db
    .select()
    .from(examCalendarEntriesTable)
    .orderBy(
      asc(examCalendarEntriesTable.position),
      asc(examCalendarEntriesTable.examCode),
      asc(examCalendarEntriesTable.examCycle),
      asc(examCalendarEntriesTable.startDate),
    );

  const [notices, calendarEntries] = await Promise.all([
    noticeWhere
      ? noticesQuery.where(noticeWhere)
      : noticesQuery,
    calendarWhere
      ? calendarQuery.where(calendarWhere)
      : calendarQuery,
  ]);

  return { settings, notices, calendarEntries };
}

router.get("/exam-updates", async (_req, res): Promise<void> => {
  const data = await loadExamUpdates(false);
  if (!data) {
    res.status(503).json({ error: "Exam Updates content is not available." });
    return;
  }
  res.json(GetExamUpdatesResponse.parse(data));
});

adminRouter.use(requireAdmin);

adminRouter.get("/", async (_req, res): Promise<void> => {
  const data = await loadExamUpdates(true);
  if (!data) {
    res.status(503).json({ error: "Exam Updates content is not available." });
    return;
  }
  res.json(GetAdminExamUpdatesResponse.parse(data));
});

adminRouter.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateExamUpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [settings] = await db
    .update(examUpdateHubSettingsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(examUpdateHubSettingsTable.id, "primary"))
    .returning();
  if (!settings) {
    res.status(503).json({ error: "Exam Updates settings are not available." });
    return;
  }
  res.json(UpdateExamUpdateSettingsResponse.parse(settings));
});

adminRouter.post("/notices", async (req, res): Promise<void> => {
  const parsed = CreateExamUpdateNoticeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!isSecureSourceUrl(parsed.data.sourceUrl)) {
    res.status(400).json({ error: "Enter a secure official source URL." });
    return;
  }
  if (parsed.data.publishedOn && !isValidDateOnly(parsed.data.publishedOn)) {
    res.status(400).json({ error: "Enter a valid publication date." });
    return;
  }

  const [notice] = await db
    .insert(examUpdateNoticesTable)
    .values(parsed.data)
    .returning();
  if (!notice) {
    res.status(500).json({ error: "The notice could not be created." });
    return;
  }
  res.status(201).json(CreateExamUpdateNoticeResponse.parse(notice));
});

adminRouter.patch("/notices/:id", async (req, res): Promise<void> => {
  const params = UpdateExamUpdateNoticeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateExamUpdateNoticeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!isSecureSourceUrl(parsed.data.sourceUrl)) {
    res.status(400).json({ error: "Enter a secure official source URL." });
    return;
  }
  if (parsed.data.publishedOn && !isValidDateOnly(parsed.data.publishedOn)) {
    res.status(400).json({ error: "Enter a valid publication date." });
    return;
  }

  const [notice] = await db
    .update(examUpdateNoticesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(examUpdateNoticesTable.id, params.data.id))
    .returning();
  if (!notice) {
    res.status(404).json({ error: "Notice not found." });
    return;
  }
  res.json(UpdateExamUpdateNoticeResponse.parse(notice));
});

adminRouter.delete("/notices/:id", async (req, res): Promise<void> => {
  const params = DeleteExamUpdateNoticeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(examUpdateNoticesTable)
    .where(eq(examUpdateNoticesTable.id, params.data.id))
    .returning({ id: examUpdateNoticesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Notice not found." });
    return;
  }
  res.sendStatus(204);
});

adminRouter.post("/calendar", async (req, res): Promise<void> => {
  const parsed = CreateExamCalendarEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!isSecureSourceUrl(parsed.data.sourceUrl)) {
    res.status(400).json({ error: "Enter a secure official source URL." });
    return;
  }
  if (
    !hasValidCalendarDates(
      parsed.data.startDate,
      parsed.data.endDate,
      parsed.data.dateStatus,
    )
  ) {
    res.status(400).json({
      error:
        "Use no dates for To be announced, or provide a start date and an end date after it.",
    });
    return;
  }

  const [entry] = await db
    .insert(examCalendarEntriesTable)
    .values(parsed.data)
    .returning();
  if (!entry) {
    res.status(500).json({ error: "The calendar entry could not be created." });
    return;
  }
  res.status(201).json(CreateExamCalendarEntryResponse.parse(entry));
});

adminRouter.patch("/calendar/:id", async (req, res): Promise<void> => {
  const params = UpdateExamCalendarEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateExamCalendarEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!isSecureSourceUrl(parsed.data.sourceUrl)) {
    res.status(400).json({ error: "Enter a secure official source URL." });
    return;
  }
  if (
    !hasValidCalendarDates(
      parsed.data.startDate,
      parsed.data.endDate,
      parsed.data.dateStatus,
    )
  ) {
    res.status(400).json({
      error:
        "Use no dates for To be announced, or provide a start date and an end date after it.",
    });
    return;
  }

  const [entry] = await db
    .update(examCalendarEntriesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(examCalendarEntriesTable.id, params.data.id))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Calendar entry not found." });
    return;
  }
  res.json(UpdateExamCalendarEntryResponse.parse(entry));
});

adminRouter.delete("/calendar/:id", async (req, res): Promise<void> => {
  const params = DeleteExamCalendarEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(examCalendarEntriesTable)
    .where(eq(examCalendarEntriesTable.id, params.data.id))
    .returning({ id: examCalendarEntriesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Calendar entry not found." });
    return;
  }
  res.sendStatus(204);
});

router.use("/admin/exam-updates", adminRouter);

export default router;