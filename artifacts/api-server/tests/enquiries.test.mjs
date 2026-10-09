import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import test, { after, beforeEach } from "node:test";
import express from "express";
import { build } from "esbuild";

process.env.DATABASE_URL ??= "postgres://enquiry-test:enquiry-test@127.0.0.1:5432/enquiry-test";

const apiDirectory = path.resolve(import.meta.dirname, "..");
const buildDirectory = await mkdtemp(path.join(tmpdir(), "enquiry-test-build-"));
const routeBundlePath = path.join(buildDirectory, "enquiries.mjs");
after(async () => {
  await rm(buildDirectory, { recursive: true, force: true });
});

await build({
  absWorkingDir: apiDirectory,
  entryPoints: ["src/routes/enquiries.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: routeBundlePath,
  banner: {
    js: "import { createRequire as __testCreateRequire } from 'node:module'; globalThis.require = __testCreateRequire(import.meta.url);",
  },
  logLevel: "silent",
});

const { createEnquiriesRouter } = await import(pathToFileURL(routeBundlePath).href);

const homeFields = [
  { name: "fullName", label: "Full name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "message", label: "Message", type: "textarea", required: false },
];
const contactFields = [
  { name: "studentName", label: "Student name", type: "text", required: true },
  { name: "mobile", label: "Mobile number", type: "tel", required: true },
  {
    name: "course",
    label: "Course",
    type: "select",
    required: true,
    options: ["MPC", "BiPC"],
  },
  { name: "message", label: "Message", type: "textarea", required: false },
];
const enquiryId = "11111111-1111-4111-8111-111111111111";

function tableName(table) {
  return table?.[Symbol.for("drizzle:Name")];
}

function sqlParams(expression) {
  const values = [];
  const visit = (part) => {
    if (!part || typeof part !== "object") return;
    if (part.constructor?.name === "Param") {
      values.push(part.value);
      return;
    }
    if (Array.isArray(part.queryChunks)) {
      part.queryChunks.forEach(visit);
    }
  };
  visit(expression);
  return values;
}

function makeMemoryDatabase({ sections = [], initialEnquiries = [] } = {}) {
  const enquiries = new Map(initialEnquiries.map((item) => [item.id, { ...item }]));
  const notes = [];

  const selectRows = (table, condition) => {
    const name = tableName(table);
    const params = sqlParams(condition);
    if (name === "content_sections") {
      return sections.filter(
        (section) => section.pageSlug === params[0] && section.sectionKey === params[1],
      );
    }
    if (name === "site_enquiries") {
      if (params.length) {
        const enquiry = enquiries.get(params[0]);
        return enquiry && enquiry.deletedAt == null ? [enquiry] : [];
      }
      return [...enquiries.values()].filter((enquiry) => enquiry.deletedAt == null);
    }
    if (name === "site_enquiry_notes") {
      return notes
        .filter((note) => note.enquiryId === params[0])
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    }
    throw new Error(`Unexpected enquiry test query table: ${name}`);
  };

  const database = {
    select() {
      let table;
      let condition;
      const query = {
        from(value) {
          table = value;
          return query;
        },
        where(value) {
          condition = value;
          return query;
        },
        orderBy() {
          return query;
        },
        limit(count) {
          return Promise.resolve(selectRows(table, condition).slice(0, count));
        },
        then(resolve, reject) {
          return Promise.resolve(selectRows(table, condition)).then(resolve, reject);
        },
      };
      return query;
    },
    insert(table) {
      return {
        values(values) {
          return {
            returning: async () => {
              const name = tableName(table);
              if (name === "site_enquiries") {
                const now = new Date().toISOString();
                const created = {
                  id: randomUUID(),
                  answers: values.answers,
                  status: values.status,
                  followUpDate: null,
                  deletedAt: null,
                  createdAt: new Date(now),
                  updatedAt: new Date(now),
                };
                enquiries.set(created.id, created);
                return [created];
              }
              if (name === "site_enquiry_notes") {
                const created = {
                  id: randomUUID(),
                  ...values,
                  createdAt: new Date(),
                };
                notes.push(created);
                return [created];
              }
              throw new Error(`Unexpected enquiry test insert table: ${name}`);
            },
          };
        },
      };
    },
    update(table) {
      return {
        set(values) {
          return {
            where(condition) {
              return {
                returning: async () => {
                  assert.equal(tableName(table), "site_enquiries");
                  const enquiry = enquiries.get(sqlParams(condition)[0]);
                  if (!enquiry || enquiry.deletedAt != null) return [];
                  Object.assign(enquiry, values);
                  return [enquiry];
                },
              };
            },
          };
        },
      };
    },
  };

  return { database, enquiries, notes };
}

async function startApi(database) {
  const app = express();
  app.use(express.json());
  const adminMiddleware = (req, res, next) => {
    const userId = req.get("x-test-user");
    if (!userId) {
      res.status(401).json({ error: "Sign in to continue." });
      return;
    }
    if (userId !== "authorized-admin") {
      res.status(403).json({ error: "This account is not authorized." });
      return;
    }
    next();
  };
  app.use(
    createEnquiriesRouter({
      database,
      adminMiddleware,
      getUserId: (req) => req.get("x-test-user") ?? null,
    }),
  );
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();

  return {
    request: async (route, { user, ...options } = {}) => {
      const headers = new Headers(options.headers);
      if (user) headers.set("x-test-user", user);
      if (options.body !== undefined) headers.set("content-type", "application/json");
      return fetch(`http://127.0.0.1:${port}${route}`, {
        ...options,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    },
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

let activeApi;
beforeEach(async () => {
  await activeApi?.close();
  activeApi = undefined;
});
after(async () => {
  await activeApi?.close();
});

test("Home and Contact submissions use their own saved fields and allow an omitted optional Message", async () => {
  const memory = makeMemoryDatabase({
    sections: [
      {
        pageSlug: "home",
        sectionKey: "hero",
        content: { enquiryForm: { fields: homeFields } },
      },
      {
        pageSlug: "contact",
        sectionKey: "enquiry-form",
        content: { form: { fields: contactFields } },
      },
    ],
  });
  activeApi = await startApi(memory.database);

  const homeResponse = await activeApi.request("/enquiries", {
    method: "POST",
    body: {
      source: "home",
      values: { fullName: "  Asha Rao  ", email: "asha@example.com", message: " Please call " },
    },
  });
  assert.equal(homeResponse.status, 201);
  const homeReceipt = await homeResponse.json();
  assert.equal(homeReceipt.id.length > 0, true);
  assert.deepEqual(memory.enquiries.get(homeReceipt.id).answers, [
    { name: "fullName", label: "Full name", value: "Asha Rao" },
    { name: "email", label: "Email", value: "asha@example.com" },
    { name: "message", label: "Message", value: "Please call" },
  ]);

  const omittedMessageResponse = await activeApi.request("/enquiries", {
    method: "POST",
    body: { source: "home", values: { fullName: "Ravi", email: "ravi@example.com" } },
  });
  assert.equal(omittedMessageResponse.status, 201);
  const omittedMessageReceipt = await omittedMessageResponse.json();
  assert.equal(
    memory.enquiries.get(omittedMessageReceipt.id).answers.find((answer) => answer.name === "message")
      .value,
    "",
  );

  const contactResponse = await activeApi.request("/enquiries", {
    method: "POST",
    body: {
      source: "contact",
      values: { studentName: "Meera", mobile: "9876543210", course: "MPC" },
    },
  });
  assert.equal(contactResponse.status, 201);
  const contactReceipt = await contactResponse.json();
  assert.deepEqual(
    memory.enquiries.get(contactReceipt.id).answers.map(({ name }) => name),
    ["studentName", "mobile", "course", "message"],
  );
  assert.equal(
    memory.enquiries.get(contactReceipt.id).answers.find((answer) => answer.name === "message").value,
    "",
  );

  const wrongFormField = await activeApi.request("/enquiries", {
    method: "POST",
    body: {
      source: "contact",
      values: { fullName: "Asha", mobile: "9876543210", course: "MPC" },
    },
  });
  assert.equal(wrongFormField.status, 400);
});

test("status and date-only follow-up updates preserve valid dates and reject invalid calendar dates", async () => {
  const seed = {
    id: enquiryId,
    answers: [],
    status: "new",
    followUpDate: null,
    deletedAt: null,
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
  };
  const memory = makeMemoryDatabase({ initialEnquiries: [seed] });
  activeApi = await startApi(memory.database);

  const unauthorized = await activeApi.request(`/admin/enquiries/${enquiryId}`, {
    method: "PATCH",
    body: { status: "follow_up", followUpDate: "2026-10-09" },
  });
  assert.equal(unauthorized.status, 401);

  const update = await activeApi.request(`/admin/enquiries/${enquiryId}`, {
    method: "PATCH",
    user: "authorized-admin",
    body: { status: "follow_up", followUpDate: "2026-10-09" },
  });
  assert.equal(update.status, 200);
  assert.deepEqual(
    (({ status, followUpDate }) => ({ status, followUpDate }))(await update.json()),
    { status: "follow_up", followUpDate: "2026-10-09" },
  );

  for (const followUpDate of ["2026-02-29", "2026-04-31", "2026-10-9"]) {
    const invalid = await activeApi.request(`/admin/enquiries/${enquiryId}`, {
      method: "PATCH",
      user: "authorized-admin",
      body: { status: "reviewed", followUpDate },
    });
    assert.equal(invalid.status, 400, `${followUpDate} should be rejected`);
    assert.equal(memory.enquiries.get(enquiryId).status, "follow_up");
    assert.equal(memory.enquiries.get(enquiryId).followUpDate, "2026-10-09");
  }

  const clearDate = await activeApi.request(`/admin/enquiries/${enquiryId}`, {
    method: "PATCH",
    user: "authorized-admin",
    body: { status: "reviewed", followUpDate: null },
  });
  assert.equal(clearDate.status, 200);
  assert.deepEqual(
    (({ status, followUpDate }) => ({ status, followUpDate }))(await clearDate.json()),
    { status: "reviewed", followUpDate: null },
  );
});

test("private note history persists across requests and is only available to admins", async () => {
  const memory = makeMemoryDatabase({ initialEnquiries: [{
    id: enquiryId,
    answers: [],
    status: "new",
    followUpDate: null,
    deletedAt: null,
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
  }] });
  activeApi = await startApi(memory.database);

  const create = await activeApi.request(`/admin/enquiries/${enquiryId}/notes`, {
    method: "POST",
    user: "authorized-admin",
    body: { body: "  Parent asked for an afternoon call.  " },
  });
  assert.equal(create.status, 201);
  assert.equal((await create.json()).body, "Parent asked for an afternoon call.");

  const secondNote = await activeApi.request(`/admin/enquiries/${enquiryId}/notes`, {
    method: "POST",
    user: "authorized-admin",
    body: { body: "Confirm the course choice before sending the application pack." },
  });
  assert.equal(secondNote.status, 201);

  const anonymousRead = await activeApi.request(`/admin/enquiries/${enquiryId}/notes`);
  assert.equal(anonymousRead.status, 401);
  const unauthorizedRead = await activeApi.request(`/admin/enquiries/${enquiryId}/notes`, {
    user: "regular-staff",
  });
  assert.equal(unauthorizedRead.status, 403);
  const unauthorizedCreate = await activeApi.request(`/admin/enquiries/${enquiryId}/notes`, {
    method: "POST",
    user: "regular-staff",
    body: { body: "Should not be saved." },
  });
  assert.equal(unauthorizedCreate.status, 403);

  const history = await activeApi.request(`/admin/enquiries/${enquiryId}/notes`, {
    user: "authorized-admin",
  });
  assert.equal(history.status, 200);
  const historyItems = (await history.json()).items;
  assert.equal(historyItems.length, 2);
  assert.deepEqual(
    historyItems.map((item) => item.body),
    [
      "Parent asked for an afternoon call.",
      "Confirm the course choice before sending the application pack.",
    ],
  );
  assert.equal(historyItems[0].authorId, "authorized-admin");

  const inbox = await activeApi.request("/admin/enquiries", { user: "authorized-admin" });
  assert.equal(inbox.status, 200);
  assert.equal(JSON.stringify(await inbox.json()).includes("afternoon call"), false);
});
