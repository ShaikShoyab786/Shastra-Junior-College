import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { Router, type IRouter, type Request, type RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import {
  CreateAdminEnquiryNoteBody,
  CreateAdminEnquiryNoteParams,
  CreateAdminEnquiryNoteResponse,
  CreateEnquiryBody,
  CreateEnquiryResponse,
  DeleteEnquiryParams,
  DeleteEnquiryResponse,
  GetAdminEnquiriesResponse,
  GetAdminEnquiryNotesParams,
  GetAdminEnquiryNotesResponse,
  RestoreEnquiryParams,
  RestoreEnquiryResponse,
  UpdateEnquiryBody,
  UpdateEnquiryParams,
  UpdateEnquiryResponse,
} from "@workspace/api-zod";
import {
  contentSectionsTable,
  db,
  siteEnquiriesTable,
  siteEnquiryNotesTable,
  type EnquiryAnswer,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

type ConfiguredField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
};

const fallbackEnquiryFields: ConfiguredField[] = [
  {
    name: "name",
    label: "Your name",
    type: "text",
    required: true,
    options: [],
  },
  {
    name: "email",
    label: "Email address",
    type: "email",
    required: true,
    options: [],
  },
  {
    name: "phone",
    label: "Phone number",
    type: "tel",
    required: false,
    options: [],
  },
  {
    name: "message",
    label: "Message",
    type: "textarea",
    required: false,
    options: [],
  },
];

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function configuredFields(value: unknown): ConfiguredField[] {
  const content = object(value);
  const nested = isRecord(content.form)
    ? content.form
    : isRecord(content.enquiryForm)
      ? content.enquiryForm
      : {};
  const form = { ...content, ...nested };
  const rawFields = form.fields ?? form.formFields ?? form.inputs;
  if (!Array.isArray(rawFields)) return [];
  return rawFields.flatMap((entry) => {
    const field = object(entry);
    const nameValue = field.name ?? field.key ?? field.id;
    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    if (!name) return [];
    const labelValue = field.label ?? field.title ?? name;
    const label = typeof labelValue === "string" ? labelValue : name;
    const typeValue = field.type ?? field.inputType;
    const rawOptions = Array.isArray(field.options) ? field.options : [];
    return [
      {
        name,
        label,
        type: typeof typeValue === "string" ? typeValue.toLowerCase() : "text",
        required: field.required === true || field.isRequired === true,
        options: rawOptions.flatMap((option) => {
          if (typeof option === "string" || typeof option === "number") {
            return [String(option)];
          }
          const optionRecord = object(option);
          const optionLabel =
            typeof optionRecord.label === "string"
              ? optionRecord.label
              : typeof optionRecord.title === "string"
                ? optionRecord.title
                : "";
          const optionValue =
            typeof optionRecord.value === "string" ||
            typeof optionRecord.value === "number"
              ? String(optionRecord.value)
              : typeof optionRecord.id === "string" ||
                  typeof optionRecord.id === "number"
                ? String(optionRecord.id)
                : optionLabel;
          return optionValue ? [optionValue] : [];
        }),
      },
    ];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function serializeEnquiry(enquiry: typeof siteEnquiriesTable.$inferSelect) {
  return {
    id: enquiry.id,
    answers: enquiry.answers,
    status: enquiry.status === "handled" ? "reviewed" : enquiry.status,
    followUpDate: enquiry.followUpDate,
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
  };
}

function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

type EnquiriesRouterDependencies = {
  database?: typeof db;
  getUserId?: (req: Request) => string | null;
  adminMiddleware?: RequestHandler;
};

export function createEnquiriesRouter({
  database = db,
  getUserId = (req) => getAuth(req).userId,
  adminMiddleware = requireAdmin,
}: EnquiriesRouterDependencies = {}): IRouter {
  const router: IRouter = Router();
  const adminRouter: IRouter = Router();

  router.post("/enquiries", async (req, res): Promise<void> => {
    const parsed = CreateEnquiryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Please check the enquiry details." });
      return;
    }

    const sourcePage = parsed.data.source;
    const [formSection] = await database
      .select({ content: contentSectionsTable.content })
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, sourcePage),
          eq(
            contentSectionsTable.sectionKey,
            sourcePage === "contact" ? "enquiry-form" : "hero",
          ),
        ),
      )
      .limit(1);
    const fields = configuredFields(formSection?.content);
    const activeFields = fields.length > 0 ? fields : fallbackEnquiryFields;

    const submitted = parsed.data.values;
    const allowedNames = new Set(activeFields.map((field) => field.name));
    if (Object.keys(submitted).some((name) => !allowedNames.has(name))) {
      res
        .status(400)
        .json({ error: "The enquiry form has changed. Please reload and try again." });
      return;
    }

    const answers: EnquiryAnswer[] = [];
    for (const field of activeFields) {
      const rawValue = submitted[field.name] ?? "";
      const value = rawValue.trim();
      if (field.required && !value) {
        res.status(400).json({ error: `${field.label} is required.` });
        return;
      }
      if (value.length > 1000) {
        res.status(400).json({ error: `${field.label} is too long.` });
        return;
      }
      if (
        field.type === "email" &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        res.status(400).json({ error: `Enter a valid ${field.label.toLowerCase()}.` });
        return;
      }
      if (field.type === "number" && value && !Number.isFinite(Number(value))) {
        res.status(400).json({ error: `Enter a valid ${field.label.toLowerCase()}.` });
        return;
      }
      if (field.type === "select" && value && !field.options.includes(value)) {
        res.status(400).json({ error: `Choose a valid ${field.label.toLowerCase()}.` });
        return;
      }
      answers.push({ name: field.name, label: field.label, value });
    }

    const [created] = await database
      .insert(siteEnquiriesTable)
      .values({ answers, status: "new" })
      .returning();
    if (!created) {
      res.status(500).json({ error: "Your enquiry could not be saved." });
      return;
    }

    res.status(201).json(
      CreateEnquiryResponse.parse({
        id: created.id,
        receivedAt: created.createdAt.toISOString(),
      }),
    );
  });

  adminRouter.use("/admin", adminMiddleware);

  adminRouter.get("/admin/enquiries", async (req, res): Promise<void> => {
    const enquiries = await database
      .select()
      .from(siteEnquiriesTable)
      .where(isNull(siteEnquiriesTable.deletedAt))
      .orderBy(desc(siteEnquiriesTable.createdAt));

    const parsed = GetAdminEnquiriesResponse.safeParse({
      items: enquiries.map(serializeEnquiry),
    });
    if (!parsed.success) {
      req.log.error(
        { errors: parsed.error.flatten() },
        "Invalid admin enquiries response.",
      );
      res.status(500).json({ error: "Enquiries could not be loaded." });
      return;
    }

    res.json(parsed.data);
  });

  adminRouter.patch("/admin/enquiries/:id", async (req, res): Promise<void> => {
    const params = UpdateEnquiryParams.safeParse(req.params);
    const body = UpdateEnquiryBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid enquiry status." });
      return;
    }

    if (
      body.data.followUpDate !== undefined &&
      body.data.followUpDate !== null &&
      !isValidDateOnly(body.data.followUpDate)
    ) {
      res.status(400).json({ error: "Enter a valid follow-up date." });
      return;
    }

    const updates: Partial<typeof siteEnquiriesTable.$inferInsert> = {
      status: body.data.status,
      updatedAt: new Date(),
    };
    if (body.data.followUpDate !== undefined) {
      updates.followUpDate = body.data.followUpDate;
    }

    const [updated] = await database
      .update(siteEnquiriesTable)
      .set(updates)
      .where(
        and(
          eq(siteEnquiriesTable.id, params.data.id),
          isNull(siteEnquiriesTable.deletedAt),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Enquiry not found." });
      return;
    }

    res.json(UpdateEnquiryResponse.parse(serializeEnquiry(updated)));
  });

  adminRouter.get(
    "/admin/enquiries/:id/notes",
    async (req, res): Promise<void> => {
      const params = GetAdminEnquiryNotesParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: "Invalid enquiry ID." });
        return;
      }

      const [enquiry] = await database
        .select({ id: siteEnquiriesTable.id })
        .from(siteEnquiriesTable)
        .where(
          and(
            eq(siteEnquiriesTable.id, params.data.id),
            isNull(siteEnquiriesTable.deletedAt),
          ),
        )
        .limit(1);
      if (!enquiry) {
        res.status(404).json({ error: "Enquiry not found." });
        return;
      }

      const notes = await database
        .select()
        .from(siteEnquiryNotesTable)
        .where(eq(siteEnquiryNotesTable.enquiryId, params.data.id))
        .orderBy(asc(siteEnquiryNotesTable.createdAt));

      res.json(
        GetAdminEnquiryNotesResponse.parse({
          items: notes.map((note) => ({
            id: note.id,
            enquiryId: note.enquiryId,
            authorId: note.authorId,
            body: note.body,
            createdAt: note.createdAt.toISOString(),
          })),
        }),
      );
    },
  );

  adminRouter.post(
    "/admin/enquiries/:id/notes",
    async (req, res): Promise<void> => {
      const params = CreateAdminEnquiryNoteParams.safeParse(req.params);
      const body = CreateAdminEnquiryNoteBody.safeParse(req.body);
      if (!params.success || !body.success || !body.data.body.trim()) {
        res.status(400).json({ error: "Enter a private note before saving." });
        return;
      }

      const [enquiry] = await database
        .select({ id: siteEnquiriesTable.id })
        .from(siteEnquiriesTable)
        .where(
          and(
            eq(siteEnquiriesTable.id, params.data.id),
            isNull(siteEnquiriesTable.deletedAt),
          ),
        )
        .limit(1);
      if (!enquiry) {
        res.status(404).json({ error: "Enquiry not found." });
        return;
      }

      const authorId = getUserId(req);
      if (!authorId) {
        res.status(401).json({ error: "Sign in to continue." });
        return;
      }

      const [created] = await database
        .insert(siteEnquiryNotesTable)
        .values({
          enquiryId: params.data.id,
          authorId,
          body: body.data.body.trim(),
        })
        .returning();
      if (!created) {
        res.status(500).json({ error: "The private note could not be saved." });
        return;
      }

      res.status(201).json(
        CreateAdminEnquiryNoteResponse.parse({
          id: created.id,
          enquiryId: created.enquiryId,
          authorId: created.authorId,
          body: created.body,
          createdAt: created.createdAt.toISOString(),
        }),
      );
    },
  );

  adminRouter.delete("/admin/enquiries/:id", async (req, res): Promise<void> => {
    const params = DeleteEnquiryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid enquiry ID." });
      return;
    }

    const [deleted] = await database
      .update(siteEnquiriesTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(siteEnquiriesTable.id, params.data.id),
          isNull(siteEnquiriesTable.deletedAt),
        ),
      )
      .returning({ id: siteEnquiriesTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Enquiry not found." });
      return;
    }

    res.json(DeleteEnquiryResponse.parse({ id: deleted.id }));
  });

  adminRouter.post(
    "/admin/enquiries/:id/restore",
    async (req, res): Promise<void> => {
      const params = RestoreEnquiryParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: "Invalid enquiry ID." });
        return;
      }

      const [restored] = await database
        .update(siteEnquiriesTable)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(
          and(
            eq(siteEnquiriesTable.id, params.data.id),
            isNotNull(siteEnquiriesTable.deletedAt),
          ),
        )
        .returning({ id: siteEnquiriesTable.id });
      if (!restored) {
        res.status(404).json({ error: "Deleted enquiry not found." });
        return;
      }

      res.json(RestoreEnquiryResponse.parse({ id: restored.id }));
    },
  );

  router.use(adminRouter);

  return router;
}

export default createEnquiriesRouter();