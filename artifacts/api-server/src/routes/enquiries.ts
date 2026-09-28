import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateEnquiryBody,
  CreateEnquiryResponse,
  DeleteEnquiryParams,
  DeleteEnquiryResponse,
  GetAdminEnquiriesResponse,
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
  type EnquiryAnswer,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();
const adminRouter: IRouter = Router();

type ConfiguredField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
};

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function configuredFields(value: unknown): ConfiguredField[] {
  const form = object(object(value).enquiryForm);
  if (!Array.isArray(form.fields)) return [];
  return form.fields.flatMap((entry) => {
    const field = object(entry);
    if (typeof field.name !== "string" || typeof field.label !== "string") {
      return [];
    }
    return [
      {
        name: field.name,
        label: field.label,
        type: typeof field.type === "string" ? field.type : "text",
        required: field.required === true,
        options: Array.isArray(field.options)
          ? field.options.filter(
              (option): option is string => typeof option === "string",
            )
          : [],
      },
    ];
  });
}

function serializeEnquiry(enquiry: typeof siteEnquiriesTable.$inferSelect) {
  return {
    id: enquiry.id,
    answers: enquiry.answers,
    status: enquiry.status === "handled" ? "reviewed" : enquiry.status,
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
  };
}

router.post("/enquiries", async (req, res): Promise<void> => {
  const parsed = CreateEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the enquiry details." });
    return;
  }

  const [hero] = await db
    .select({ content: contentSectionsTable.content })
    .from(contentSectionsTable)
    .where(
      and(
        eq(contentSectionsTable.pageSlug, "home"),
        eq(contentSectionsTable.sectionKey, "hero"),
      ),
    )
    .limit(1);
  const fields = configuredFields(hero?.content);
  if (fields.length === 0) {
    res.status(503).json({ error: "The enquiry form is not available." });
    return;
  }

  const submitted = parsed.data.values;
  const allowedNames = new Set(fields.map((field) => field.name));
  if (Object.keys(submitted).some((name) => !allowedNames.has(name))) {
    res.status(400).json({ error: "The enquiry form has changed. Please reload and try again." });
    return;
  }

  const answers: EnquiryAnswer[] = [];
  for (const field of fields) {
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
    if (field.type === "select" && value && !field.options.includes(value)) {
      res.status(400).json({ error: `Choose a valid ${field.label.toLowerCase()}.` });
      return;
    }
    answers.push({ name: field.name, label: field.label, value });
  }

  const [created] = await db
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

adminRouter.use("/admin", requireAdmin);

adminRouter.get("/admin/enquiries", async (req, res): Promise<void> => {
  const enquiries = await db
    .select()
    .from(siteEnquiriesTable)
    .where(isNull(siteEnquiriesTable.deletedAt))
    .orderBy(desc(siteEnquiriesTable.createdAt))
    .limit(100);

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

  const [updated] = await db
    .update(siteEnquiriesTable)
    .set({ status: body.data.status, updatedAt: new Date() })
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

adminRouter.delete("/admin/enquiries/:id", async (req, res): Promise<void> => {
  const params = DeleteEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid enquiry ID." });
    return;
  }

  const [deleted] = await db
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

    const [restored] = await db
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

export default router;