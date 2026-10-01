import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Save } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useGetAdminCmsPage,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentSection } from "@workspace/api-client-react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";

type CategoryKey =
  | "article-hub"
  | "video-hub"
  | "study-resources"
  | "exam-updates";
type CategoryDraft = {
  key: CategoryKey;
  title: string;
  description: string;
};
type LandingDraft = {
  eyebrow: string;
  title: string;
  subtitle: string;
  categories: CategoryDraft[];
};
type Flash = { tone: "success" | "error"; message: string };

const categoryKeys: CategoryKey[] = [
  "article-hub",
  "video-hub",
  "study-resources",
  "exam-updates",
];
const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";

function errorMessage(error: unknown) {
  const candidate = error as {
    message?: string;
    response?: { data?: { error?: string } };
  };
  return (
    candidate?.response?.data?.error ||
    candidate?.message ||
    "The Knowledge Hub page could not be saved."
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function draftFromSection(section: ContentSection): LandingDraft | null {
  if (!isRecord(section.content) || !Array.isArray(section.content.categories)) {
    return null;
  }
  const categories = section.content.categories;
  if (categories.length !== categoryKeys.length) return null;

  const parsed = categories.map((value) => {
    if (!isRecord(value) || typeof value.key !== "string") return null;
    if (
      !categoryKeys.includes(value.key as CategoryKey) ||
      typeof value.title !== "string" ||
      typeof value.description !== "string"
    ) {
      return null;
    }
    return {
      key: value.key as CategoryKey,
      title: value.title,
      description: value.description,
    };
  });
  if (parsed.some((category) => category === null)) return null;
  const validCategories = parsed as CategoryDraft[];
  if (
    new Set(validCategories.map((category) => category.key)).size !==
    categoryKeys.length
  ) {
    return null;
  }

  return {
    eyebrow:
      typeof section.content.eyebrow === "string"
        ? section.content.eyebrow
        : "",
    title: section.title,
    subtitle: section.subtitle || "",
    categories: validCategories.sort(
      (a, b) => categoryKeys.indexOf(a.key) - categoryKeys.indexOf(b.key),
    ),
  };
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  testId: string;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          rows={3}
          className={`${inputClass} resize-y`}
          data-testid={testId}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          className={inputClass}
          data-testid={testId}
        />
      )}
    </label>
  );
}

export default function AdminKnowledgeHubPageEditor({
  onFlash,
}: {
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const page = useGetAdminCmsPage("knowledge-hub", {
    query: { queryKey: getGetAdminCmsPageQueryKey("knowledge-hub") },
  });
  const updateSection = useUpdateContentSection();
  const [error, setError] = useState("");
  const section = page.data?.sections.find(
    (candidate) => candidate.sectionKey === "hub-landing",
  );
  const form = useForm<LandingDraft>({
    defaultValues: {
      eyebrow: "",
      title: "",
      subtitle: "",
      categories: [],
    },
  });

  useEffect(() => {
    if (!section) return;
    const nextDraft = draftFromSection(section);
    if (nextDraft) {
      form.reset(nextDraft);
      setError("");
    }
  }, [form, section]);

  const save = form.handleSubmit(async (draft) => {
    if (!section) return;
    setError("");
    try {
      await updateSection.mutateAsync({
        id: section.id,
        data: {
          title: draft.title,
          subtitle: draft.subtitle || null,
          content: {
            ...section.content,
            eyebrow: draft.eyebrow,
            categories: draft.categories.map((category) => ({ ...category })),
          },
        },
      });
      await Promise.all([
        client.invalidateQueries({
          queryKey: getGetAdminCmsPageQueryKey("knowledge-hub"),
        }),
        client.invalidateQueries({
          queryKey: getGetCmsPageQueryKey("knowledge-hub"),
        }),
      ]);
      onFlash({ tone: "success", message: "Knowledge Hub page saved." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  });

  if (page.isError) {
    return (
      <section
        className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6"
        role="alert"
      >
        <p className="font-bold text-red-800">
          Knowledge Hub page settings could not be loaded.
        </p>
        <p className="mt-1 text-sm text-red-700">
          {errorMessage(page.error)}
        </p>
        <button
          type="button"
          onClick={() => void page.refetch()}
          className="mt-4 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white"
          data-testid="button-retry-knowledge-hub-page"
        >
          <RefreshCw className="mr-2 inline h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      </section>
    );
  }

  if (page.isLoading) {
    return (
      <div
        className="mt-6 h-[560px] animate-pulse rounded-3xl bg-white"
        aria-label="Loading Knowledge Hub page settings"
        data-testid="status-knowledge-hub-page-loading"
      />
    );
  }

  if (!section || !draftFromSection(section)) {
    return (
      <p
        className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900"
        role="alert"
        data-testid="status-knowledge-hub-page-settings-missing"
      >
        The Knowledge Hub landing content is incomplete. Reload the page settings
        or contact a site administrator.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={save}
        className="mt-6 space-y-6"
        data-testid="form-admin-knowledge-hub-page"
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
          <p className="eyebrow text-[#e3212b]">Landing page introduction</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
            Edit the page heading and introduction.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <TextField
              label="Eyebrow"
              value={form.watch("eyebrow")}
              onChange={(value) => {
                form.setValue("eyebrow", value, { shouldDirty: true });
                setError("");
              }}
              testId="input-knowledge-hub-page-eyebrow"
            />
            <TextField
              label="Page title"
              value={form.watch("title")}
              onChange={(value) => {
                form.setValue("title", value, { shouldDirty: true });
                setError("");
              }}
              testId="input-knowledge-hub-page-title"
            />
            <div className="md:col-span-2">
              <TextField
                label="Introduction"
                value={form.watch("subtitle")}
                onChange={(value) => {
                  form.setValue("subtitle", value, { shouldDirty: true });
                  setError("");
                }}
                multiline
                testId="textarea-knowledge-hub-page-introduction"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
          <p className="eyebrow text-[#e3212b]">Hub sections</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
            Edit the four section summaries.
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {form.watch("categories").map((category, index) => (
              <article
                key={category.key}
                className="rounded-2xl border border-slate-200 bg-[#fbfaf6] p-4 sm:p-5"
                data-testid={`card-admin-knowledge-hub-page-${category.key}`}
              >
                <h3 className="font-bold text-[#0b3472]">{category.title}</h3>
                <div className="mt-4 space-y-4">
                  <TextField
                    label="Section title"
                    value={form.watch(`categories.${index}.title`)}
                    onChange={(value) => {
                      form.setValue(`categories.${index}.title`, value, {
                        shouldDirty: true,
                      });
                      setError("");
                    }}
                    testId={`input-knowledge-hub-page-title-${category.key}`}
                  />
                  <TextField
                    label="Section description"
                    value={form.watch(`categories.${index}.description`)}
                    onChange={(value) => {
                      form.setValue(
                        `categories.${index}.description`,
                        value,
                        { shouldDirty: true },
                      );
                      setError("");
                    }}
                    multiline
                    testId={`textarea-knowledge-hub-page-description-${category.key}`}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            role="alert"
            data-testid="status-knowledge-hub-page-save-error"
          >
            {error}
          </p>
        ) : null}
        <div className="sticky bottom-4 flex justify-end">
          <button
            type="submit"
            disabled={updateSection.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            data-testid="button-save-knowledge-hub-page"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {updateSection.isPending ? "Saving page…" : "Save page settings"}
          </button>
        </div>
      </form>
    </Form>
  );
}