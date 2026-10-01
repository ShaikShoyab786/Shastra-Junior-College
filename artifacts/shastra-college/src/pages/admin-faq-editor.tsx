import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  getGetAdminHomeQueryKey,
  getGetHomePageQueryKey,
  useCreateContentItem,
  useDeleteContentItem,
  useUpdateContentItem,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type {
  ContentItem,
  ContentItemInput,
  ContentSection,
  HomePage,
} from "@workspace/api-client-react";
import { FAQ_PAGE_TARGETS, faqPageTargets } from "@/lib/faq-page-targets";

type Flash = { tone: "success" | "error"; message: string };
type AdminFaqEditorProps = {
  home: HomePage;
  onFlash: (flash: Flash) => void;
};
type PageTarget = (typeof FAQ_PAGE_TARGETS)[number]["value"];
type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: { status?: number };
    status?: number;
    message?: string;
  };
  if (candidate?.response?.status === 403 || candidate?.status === 403) {
    return "Your account is signed in, but it is not on the staff allowlist.";
  }
  return candidate?.message || "The change could not be saved. Please try again.";
}

function invalidateHome(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() });
  void client.invalidateQueries({ queryKey: getGetHomePageQueryKey() });
}

function Field({
  label,
  value,
  onChange,
  testId,
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const className =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          rows={3}
          required={required}
          className={`${className} resize-y`}
          data-testid={testId}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          required={required}
          className={className}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function SectionCopyEditor({
  section,
  onFlash,
}: {
  section: ContentSection;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const updateSection = useUpdateContentSection();
  const [eyebrow, setEyebrow] = useState(
    typeof section.content.eyebrow === "string" ? section.content.eyebrow : "",
  );
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.subtitle || "");

  useEffect(() => {
    setEyebrow(
      typeof section.content.eyebrow === "string"
        ? section.content.eyebrow
        : "",
    );
    setTitle(section.title);
    setDescription(section.subtitle || "");
  }, [section.id, section.updatedAt]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      onFlash({ tone: "error", message: "Add a title before saving." });
      return;
    }
    updateSection.mutate(
      {
        id: section.id,
        data: {
          title: title.trim(),
          subtitle: description.trim() || null,
          content: { ...section.content, eyebrow: eyebrow.trim() },
        },
      },
      {
        onSuccess: () => {
          invalidateHome(client);
          onFlash({ tone: "success", message: "FAQ section details saved." });
        },
        onError: (error) =>
          onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );
  };

  return (
    <form
      onSubmit={save}
      className="rounded-3xl border border-[#0b3472]/10 bg-white p-5 shadow-[0_12px_34px_rgba(11,52,114,.045)] sm:p-7"
      data-testid="form-faq-section"
    >
      <div className="mb-6 flex items-start gap-4 border-b border-[#0b3472]/10 pb-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c07823]/10 text-[#b56c19]">
          <span className="font-display text-lg font-extrabold">?</span>
        </span>
        <div>
          <p className="eyebrow text-[#c07823]">Home page content</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#0b3472]">
            FAQ section
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#53657d]">
            Manage the introduction and where this section is published.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Eyebrow"
          value={eyebrow}
          onChange={setEyebrow}
          testId="input-faq-eyebrow"
        />
        <Field
          label="Title"
          value={title}
          onChange={setTitle}
          required
          testId="input-faq-title"
        />
        <div className="md:col-span-2">
          <Field
            label="Description"
            value={description}
            onChange={setDescription}
            multiline
            testId="textarea-faq-description"
          />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-4 border-t border-[#0b3472]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm font-bold text-[#0b3472]">
          <input
            type="checkbox"
            checked={section.isVisible}
            disabled={updateSection.isPending}
            onChange={(event) => {
              const isVisible = event.currentTarget.checked;
              updateSection.mutate(
                { id: section.id, data: { isVisible } },
                {
                  onSuccess: () => {
                    invalidateHome(client);
                    onFlash({
                      tone: "success",
                      message: isVisible
                        ? "FAQ section is now visible."
                        : "FAQ section is hidden.",
                    });
                  },
                  onError: (error) =>
                    onFlash({ tone: "error", message: errorMessage(error) }),
                },
              );
            }}
            className="h-4 w-4 accent-[#0b3472]"
            data-testid="checkbox-faq-section-visible"
          />
          <span className="inline-flex items-center gap-2">
            {section.isVisible ? (
              <Eye className="h-4 w-4" aria-hidden="true" />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            )}
          Show FAQ section on public pages
          </span>
        </label>
        <button
          type="submit"
          disabled={updateSection.isPending}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#082859] disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="button-save-faq-section"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {updateSection.isPending ? "Saving…" : "Save section"}
        </button>
      </div>
    </form>
  );
}

function FaqItemForm({
  section,
  initial,
  position,
  onFlash,
  onClose,
}: {
  section: ContentSection;
  initial?: ContentItem;
  position: number;
  onFlash: (flash: Flash) => void;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const createItem = useCreateContentItem();
  const updateItem = useUpdateContentItem();
  const content = asRecord(initial?.content);
  const [question, setQuestion] = useState(initial?.title || "");
  const [answer, setAnswer] = useState(initial?.description || "");
  const [targets, setTargets] = useState<PageTarget[]>(
    initial ? faqPageTargets(initial) : [],
  );
  const [visible, setVisible] = useState(initial?.isVisible ?? true);
  const [error, setError] = useState("");
  const pending = createItem.isPending || updateItem.isPending;

  useEffect(() => {
    setQuestion(initial?.title || "");
    setAnswer(initial?.description || "");
    setTargets(initial ? faqPageTargets(initial) : []);
    setVisible(initial?.isVisible ?? true);
    setError("");
  }, [initial?.id, initial?.updatedAt]);

  const toggleTarget = (target: PageTarget, checked: boolean) => {
    setTargets((current) =>
      checked
        ? [...current, target].filter(
            (value, index, values) => values.indexOf(value) === index,
          )
        : current.filter((value) => value !== target),
    );
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError("Enter both a question and an answer.");
      return;
    }
    if (targets.length === 0) {
      setError("Choose at least one page for this question.");
      return;
    }
    setError("");
    const data: ContentItemInput = {
      sectionId: section.id,
      itemType: "faq",
      title: question.trim(),
      description: answer.trim(),
      imageUrl: initial?.imageUrl ?? null,
      linkPath: initial?.linkPath ?? null,
      label: initial?.label ?? null,
      content: { ...content, pageTargets: targets },
      isVisible: visible,
      position: initial?.position ?? position,
    };
    const options = {
      onSuccess: () => {
        invalidateHome(client);
        onFlash({
          tone: "success",
          message: initial ? "Question updated." : "Question added.",
        });
        onClose();
      },
      onError: (failure: unknown) => setError(errorMessage(failure)),
    };
    if (initial) updateItem.mutate({ id: initial.id, data }, options);
    else createItem.mutate({ data }, options);
  };

  return (
    <form
      onSubmit={save}
      className="mt-4 rounded-2xl border border-[#0b3472]/15 bg-[#f6f8fb] p-4 sm:p-5"
      data-testid={`form-faq-item-${initial?.id || "new"}`}
    >
      <div className="grid gap-4">
        <Field
          label="Question"
          value={question}
          onChange={setQuestion}
          required
          testId={`input-faq-question-${initial?.id || "new"}`}
        />
        <Field
          label="Answer"
          value={answer}
          onChange={setAnswer}
          multiline
          required
          testId={`textarea-faq-answer-${initial?.id || "new"}`}
        />
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm font-bold text-slate-700">
          Display this question on
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {FAQ_PAGE_TARGETS.map((target) => (
            <label
              key={target.value}
              className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0b3472]"
            >
              <input
                type="checkbox"
                checked={targets.includes(target.value)}
                onChange={(event) =>
                  toggleTarget(target.value, event.currentTarget.checked)
                }
                className="h-4 w-4 accent-[#0b3472]"
                data-testid={`checkbox-faq-target-${target.value}-${initial?.id || "new"}`}
              />
              {target.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => setVisible(event.currentTarget.checked)}
          className="h-4 w-4 accent-[#0b3472]"
          data-testid={`checkbox-faq-visible-${initial?.id || "new"}`}
        />
        Publish this question
      </label>
      {error ? (
        <p
          className="mt-3 text-sm font-semibold text-red-700"
          role="alert"
          data-testid={`error-faq-item-${initial?.id || "new"}`}
        >
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="focus-ring inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/70"
          data-testid={`button-cancel-faq-item-${initial?.id || "new"}`}
        >
          <X className="h-4 w-4" aria-hidden="true" /> Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#082859] disabled:opacity-50"
          data-testid={`button-save-faq-item-${initial?.id || "new"}`}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {pending ? "Saving…" : "Save question"}
        </button>
      </div>
    </form>
  );
}

export default function AdminFaqEditor({
  home,
  onFlash,
}: AdminFaqEditorProps) {
  const client = useQueryClient();
  const deleteItem = useDeleteContentItem();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const section = home.sections.find(
    (candidate) =>
      candidate.pageSlug === "home" && candidate.sectionKey === "faqs",
  );
  const items = useMemo(
    () =>
      (section
        ? home.items.filter(
            (item) => item.sectionId === section.id && item.itemType === "faq",
          )
        : []
      ).sort((first, second) => first.position - second.position),
    [home.items, section?.id],
  );
  if (!section) {
    return (
      <section
        className="rounded-3xl border border-[#0b3472]/10 bg-white p-6 shadow-[0_12px_34px_rgba(11,52,114,.045)] sm:p-8"
        data-testid="status-faq-section-missing"
      >
        <p className="eyebrow text-[#c07823]">Home page content</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]">
          FAQ section unavailable
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#53657d]">
          The Home FAQ section is not present in the current page content.
        </p>
      </section>
    );
  }
  const nextPosition = items.length
    ? Math.max(...items.map((item) => item.position)) + 1
    : 0;
  const remove = async (item: ContentItem) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try {
      await deleteItem.mutateAsync({ id: item.id });
      invalidateHome(client);
      onFlash({ tone: "success", message: "Question deleted." });
      if (editing === item.id) setEditing(null);
    } catch (error) {
      onFlash({ tone: "error", message: errorMessage(error) });
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-faq-editor">
      <SectionCopyEditor section={section} onFlash={onFlash} />
      <section className="rounded-3xl border border-[#0b3472]/10 bg-white p-5 shadow-[0_12px_34px_rgba(11,52,114,.045)] sm:p-7">
        <div className="flex flex-col gap-4 border-b border-[#0b3472]/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-[#c07823]">Questions & answers</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#0b3472]">
              {items.length} {items.length === 1 ? "question" : "questions"}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#53657d]">
              Assign each answer to the public pages where it belongs.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditing((current) => (current === "new" ? null : "new"))
            }
            aria-expanded={editing === "new"}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-[#0b3472]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:bg-[#0b3472]/5"
            data-testid="button-add-faq"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {editing === "new" ? "Close form" : "Add question"}
          </button>
        </div>

        {editing === "new" ? (
          <FaqItemForm
            key="new-faq-item"
            section={section}
            position={nextPosition}
            onFlash={onFlash}
            onClose={() => setEditing(null)}
          />
        ) : null}

        {items.length ? (
          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <article
                key={item.id}
                className={`rounded-2xl border border-[#0b3472]/10 p-4 sm:p-5 ${
                  item.isVisible ? "bg-white" : "bg-[#f7f8fa]"
                }`}
                data-testid={`row-faq-${item.id}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b3472]/[.06] font-mono text-[10px] font-bold text-[#c07823]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold leading-6 text-[#0b3472]" data-testid={`text-faq-question-${item.id}`}>
                        {item.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#53657d]">
                        {item.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] ${item.isVisible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {item.isVisible ? "Published" : "Hidden"}
                        </span>
                        {faqPageTargets(item).map((target) => (
                          <span
                            key={target}
                            className="rounded-full border border-[#0b3472]/10 bg-[#f7f8fa] px-2.5 py-1 text-[10px] font-bold text-[#53657d]"
                            data-testid={`badge-faq-target-${target}-${item.id}`}
                          >
                            {FAQ_PAGE_TARGETS.find((entry) => entry.value === target)?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() =>
                        setEditing((current) =>
                          current === item.id ? null : item.id,
                        )
                      }
                      aria-expanded={editing === item.id}
                      className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/5"
                      data-testid={`button-edit-faq-${item.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      {editing === item.id ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(item)}
                      disabled={deleteItem.isPending}
                      aria-label={`Delete question: ${item.title}`}
                      className="focus-ring rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      data-testid={`button-delete-faq-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {editing === item.id ? (
                  <FaqItemForm
                    key={item.id}
                    section={section}
                    initial={item}
                    position={item.position}
                    onFlash={onFlash}
                    onClose={() => setEditing(null)}
                  />
                ) : null}
              </article>
            ))}
          </div>
        ) : editing !== "new" ? (
          <div
            className="mt-5 rounded-2xl border border-dashed border-[#0b3472]/20 bg-[#f8f9fb] px-5 py-12 text-center"
            data-testid="empty-faq-items"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b3472]/[.06] font-display text-xl font-extrabold text-[#0b3472]">
              ?
            </span>
            <p className="mt-4 font-display text-lg font-extrabold text-[#0b3472]">
              No questions yet
            </p>
            <p className="mt-1 text-sm leading-6 text-[#53657d]">
              Add a question and assign it to the right public pages.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}