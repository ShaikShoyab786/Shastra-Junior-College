import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, RefreshCw, Save } from "lucide-react";
import {
  getGetAdminKnowledgeHubMenuQueryKey,
  getGetKnowledgeHubMenuQueryKey,
  useGetAdminKnowledgeHubMenu,
  useUpdateAdminKnowledgeHubMenu,
} from "@workspace/api-client-react";
import type { KnowledgeHubMenuSettings } from "@workspace/api-client-react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";

type Flash = { tone: "success" | "error"; message: string };

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
    "The Knowledge Hub menu could not be saved."
  );
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

export default function AdminKnowledgeHubMenuEditor({
  onFlash,
}: {
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const query = useGetAdminKnowledgeHubMenu({
    query: { queryKey: getGetAdminKnowledgeHubMenuQueryKey() },
  });
  const update = useUpdateAdminKnowledgeHubMenu();
  const [error, setError] = useState("");
  const form = useForm<KnowledgeHubMenuSettings>({
    defaultValues: {
      heading: { eyebrow: "", title: "", description: "" },
      items: [],
      ctaLabel: "",
    },
  });
  const items = form.watch("items");

  useEffect(() => {
    if (query.data) {
      form.reset({
        ...query.data,
        heading: { ...query.data.heading },
        items: query.data.items.slice().sort((a, b) => a.order - b.order),
      });
    }
  }, [form, query.data]);

  const moveItem = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const nextItems = items.slice();
    [nextItems[index], nextItems[nextIndex]] = [
      nextItems[nextIndex],
      nextItems[index],
    ];
    form.setValue(
      "items",
      nextItems.map((item, order) => ({ ...item, order })),
      { shouldDirty: true },
    );
    setError("");
  };

  const save = form.handleSubmit(async (draft) => {
    setError("");
    try {
      await update.mutateAsync({
        data: {
          heading: draft.heading,
          items: draft.items.map((item, order) => ({ ...item, order })),
          ctaLabel: draft.ctaLabel,
        },
      });
      await Promise.all([
        client.invalidateQueries({
          queryKey: getGetAdminKnowledgeHubMenuQueryKey(),
        }),
        client.invalidateQueries({
          queryKey: getGetKnowledgeHubMenuQueryKey(),
        }),
      ]);
      onFlash({ tone: "success", message: "Knowledge Hub mega menu saved." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  });

  if (query.isError) {
    return (
      <section
        className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6"
        role="alert"
      >
        <p className="font-bold text-red-800">
          Knowledge Hub menu could not be loaded.
        </p>
        <p className="mt-1 text-sm text-red-700">
          {errorMessage(query.error)}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-4 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white"
          data-testid="button-retry-knowledge-hub-menu"
        >
          <RefreshCw className="mr-2 inline h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      </section>
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <div
        className="mt-6 h-[560px] animate-pulse rounded-3xl bg-white"
        aria-label="Loading Knowledge Hub menu settings"
        data-testid="status-knowledge-hub-menu-loading"
      />
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={save}
        className="mt-6 space-y-6"
        data-testid="form-admin-knowledge-hub-menu"
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
          <p className="eyebrow text-[#e3212b]">Menu introduction</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
            Set the menu heading.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <TextField
              label="Eyebrow"
              value={form.watch("heading.eyebrow")}
              onChange={(value) => {
                form.setValue("heading.eyebrow", value, { shouldDirty: true });
                setError("");
              }}
              testId="input-knowledge-hub-menu-eyebrow"
            />
            <TextField
              label="Heading"
              value={form.watch("heading.title")}
              onChange={(value) => {
                form.setValue("heading.title", value, { shouldDirty: true });
                setError("");
              }}
              testId="input-knowledge-hub-menu-title"
            />
            <div className="md:col-span-2">
              <TextField
                label="Introductory description"
                value={form.watch("heading.description")}
                onChange={(value) => {
                  form.setValue("heading.description", value, {
                    shouldDirty: true,
                  });
                  setError("");
                }}
                multiline
                testId="textarea-knowledge-hub-menu-description"
              />
            </div>
            <TextField
              label="Explore button label"
              value={form.watch("ctaLabel")}
              onChange={(value) => {
                form.setValue("ctaLabel", value, { shouldDirty: true });
                setError("");
              }}
              testId="input-knowledge-hub-menu-cta"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
          <p className="eyebrow text-[#e3212b]">Four fixed destinations</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
            Edit the category summaries.
          </h2>
          <div className="mt-6 space-y-4">
            {items.map((item, index) => (
              <article
                key={item.key}
                className="rounded-2xl border border-slate-200 bg-[#fbfaf6] p-4 sm:p-5"
                data-testid={`card-admin-knowledge-hub-menu-${item.key}`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="font-bold text-[#0b3472]">
                    {item.key === "article-hub"
                      ? "Article Hub"
                      : item.key === "video-hub"
                        ? "Video Hub"
                        : item.key === "study-resources"
                          ? "Study Resources"
                          : "Exam Updates"}
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${item.title} up`}
                      className="rounded-lg p-2 text-[#0b3472] hover:bg-[#0b3472]/10 disabled:opacity-30"
                      data-testid={`button-move-knowledge-hub-menu-up-${item.key}`}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label={`Move ${item.title} down`}
                      className="rounded-lg p-2 text-[#0b3472] hover:bg-[#0b3472]/10 disabled:opacity-30"
                      data-testid={`button-move-knowledge-hub-menu-down-${item.key}`}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Display title"
                    value={form.watch(`items.${index}.title`)}
                    onChange={(value) => {
                      form.setValue(`items.${index}.title`, value, {
                        shouldDirty: true,
                      });
                      setError("");
                    }}
                    testId={`input-knowledge-hub-menu-title-${item.key}`}
                  />
                  <TextField
                    label="Short description"
                    value={form.watch(`items.${index}.description`)}
                    onChange={(value) => {
                      form.setValue(`items.${index}.description`, value, {
                        shouldDirty: true,
                      });
                      setError("");
                    }}
                    multiline
                    testId={`textarea-knowledge-hub-menu-description-${item.key}`}
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
            data-testid="status-knowledge-hub-menu-save-error"
          >
            {error}
          </p>
        ) : null}
        <div className="sticky bottom-4 flex justify-end">
          <button
            type="submit"
            disabled={update.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            data-testid="button-save-knowledge-hub-menu"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {update.isPending ? "Saving menu…" : "Save Knowledge Hub menu"}
          </button>
        </div>
      </form>
    </Form>
  );
}