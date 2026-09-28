import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
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

type Flash = { tone: "success" | "error"; message: string } | null;
type CmsRecord = Record<string, unknown>;
type FieldType = "text" | "email" | "tel" | "select";
type EnquiryField = {
  name: string;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
};
type EnquiryForm = {
  eyebrow: string;
  title: string;
  description: string;
  submitLabel: string;
  note: string;
  successMessage: string;
  fields: EnquiryField[];
};

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getEnquiryForm(content: CmsRecord): EnquiryForm {
  const raw = record(content.enquiryForm);
  const fields = Array.isArray(raw.fields)
    ? raw.fields.map((entry, index) => {
        const field = record(entry);
        const rawType = field.type;
        const type: FieldType =
          rawType === "email" || rawType === "tel" || rawType === "select"
            ? rawType
            : "text";
        return {
          name: text(field.name, `field${index + 1}`),
          type,
          label: text(field.label),
          placeholder: text(field.placeholder),
          required: field.required === true,
          options: Array.isArray(field.options)
            ? field.options.filter(
                (option): option is string => typeof option === "string",
              )
            : [],
        };
      })
    : [];

  return {
    eyebrow: text(raw.eyebrow, "ADMISSIONS ENQUIRY"),
    title: text(raw.title, "Talk with our team"),
    description: text(
      raw.description,
      "Share a few details about your interests so we can guide your next step.",
    ),
    submitLabel:
      text(raw.submitLabel, "Send enquiry") === "Preview enquiry"
        ? "Send enquiry"
        : text(raw.submitLabel, "Send enquiry"),
    note: text(raw.note).startsWith("Preview only")
      ? "Your details will be shared with the college admissions team."
      : text(
          raw.note,
          "Your details will be shared with the college admissions team.",
        ),
    successMessage: text(
      raw.successMessage,
      "Thank you. Our admissions team has received your enquiry.",
    ).startsWith("This preview is complete")
      ? "Thank you. Our admissions team has received your enquiry."
      : text(
          raw.successMessage,
          "Thank you. Our admissions team has received your enquiry.",
        ),
    fields,
  };
}

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: { status?: number };
    status?: number;
    message?: string;
  };
  if (candidate?.response?.status === 403 || candidate?.status === 403) {
    return "Your account is signed in, but it is not on the admin allowlist.";
  }
  return candidate?.message || "Something went wrong. Please try again.";
}

function invalidateHome(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() });
  void client.invalidateQueries({ queryKey: getGetHomePageQueryKey() });
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  multiline = false,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  testId: string;
}) {
  const className =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0B3472]/50 focus:ring-4 focus:ring-[#0B3472]/10";
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          rows={3}
          className={className}
          data-testid={testId}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className={className}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function SectionVisibility({
  section,
  onFlash,
}: {
  section: ContentSection;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  return (
    <button
      type="button"
      onClick={() =>
        update.mutate(
          { id: section.id, data: { isVisible: !section.isVisible } },
          {
            onSuccess: () => {
              invalidateHome(client);
              onFlash({
                tone: "success",
                message: `${section.title} ${
                  section.isVisible ? "hidden" : "shown"
                } on the public Home page.`,
              });
            },
            onError: (error) =>
              onFlash({ tone: "error", message: errorMessage(error) }),
          },
        )
      }
      disabled={update.isPending}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0B3472] transition hover:bg-slate-50 disabled:opacity-50"
      aria-label={`${section.isVisible ? "Hide" : "Show"} ${section.title}`}
      data-testid={`button-toggle-section-${section.sectionKey}`}
    >
      {section.isVisible ? (
        <>
          <EyeOff className="h-4 w-4" /> Hide section
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" /> Show section
        </>
      )}
    </button>
  );
}

function SectionDetails({
  section,
  onFlash,
}: {
  section: ContentSection;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  const isPathways = section.sectionKey === "programs";
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle || "");

  useEffect(() => {
    setTitle(section.title);
    setSubtitle(section.subtitle || "");
  }, [section.id, section.subtitle, section.title]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      onFlash({ tone: "error", message: "A section heading is required." });
      return;
    }
    update.mutate(
      {
        id: section.id,
        data: isPathways
          ? { title: title.trim() }
          : { title: title.trim(), subtitle: subtitle.trim() || null },
      },
      {
        onSuccess: () => {
          invalidateHome(client);
          onFlash({ tone: "success", message: "Section heading saved." });
        },
        onError: (error) =>
          onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );
  };

  return (
    <form onSubmit={save} className="mt-5 rounded-2xl bg-slate-50 p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={isPathways ? "Pathways section title" : "Section heading"}
          value={title}
          onChange={setTitle}
          placeholder={isPathways ? "EXPLORE PROGRAM PATHWAYS:" : undefined}
          required
          testId={`input-section-heading-${section.sectionKey}`}
        />
        {!isPathways ? (
          <Input
            label="Section description"
            value={subtitle}
            onChange={setSubtitle}
            testId={`input-section-description-${section.sectionKey}`}
          />
        ) : null}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={update.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B3472] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#082859] disabled:opacity-50"
          data-testid={`button-save-section-${section.sectionKey}`}
        >
          <Save className="h-4 w-4" />
          {update.isPending ? "Saving…" : "Save heading"}
        </button>
      </div>
    </form>
  );
}

function HeroEditor({
  section,
  onFlash,
}: {
  section: ContentSection;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  const content = record(section.content);
  const [eyebrow, setEyebrow] = useState(text(content.eyebrow));
  const [headline, setHeadline] = useState(text(content.headline, section.title));
  const [introduction, setIntroduction] = useState(
    text(content.introduction, section.subtitle || ""),
  );
  const [primaryLabel, setPrimaryLabel] = useState(
    text(content.primaryLabel, "Explore pathways"),
  );
  const [secondaryLabel, setSecondaryLabel] = useState(
    text(content.secondaryLabel, "Enquire"),
  );
  const [form, setForm] = useState(() => getEnquiryForm(content));

  useEffect(() => {
    const currentContent = record(section.content);
    setEyebrow(text(currentContent.eyebrow));
    setHeadline(text(currentContent.headline, section.title));
    setIntroduction(
      text(currentContent.introduction, section.subtitle || ""),
    );
    setPrimaryLabel(text(currentContent.primaryLabel, "Explore pathways"));
    setSecondaryLabel(text(currentContent.secondaryLabel, "Enquire"));
    setForm(getEnquiryForm(currentContent));
  }, [section.content, section.id, section.subtitle, section.title]);

  const updateForm = (patch: Partial<EnquiryForm>) =>
    setForm((current) => ({ ...current, ...patch }));
  const updateField = (index: number, patch: Partial<EnquiryField>) =>
    updateForm({
      fields: form.fields.map((field, current) =>
        current === index ? { ...field, ...patch } : field,
      ),
    });

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (
      !headline.trim() ||
      !form.eyebrow.trim() ||
      !form.title.trim() ||
      !form.submitLabel.trim() ||
      !form.note.trim() ||
      !form.successMessage.trim()
    ) {
      onFlash({
        tone: "error",
        message: "Complete the hero and enquiry form copy.",
      });
      return;
    }
    if (
      form.fields.some(
        (field) =>
          !field.name.trim() ||
          !field.label.trim() ||
          (field.type === "select" && field.options.length === 0),
      )
    ) {
      onFlash({
        tone: "error",
        message:
          "Each form field needs a name and label; select fields need an option.",
      });
      return;
    }
    const fieldNames = form.fields.map((field) => field.name.trim().toLowerCase());
    if (new Set(fieldNames).size !== fieldNames.length) {
      onFlash({
        tone: "error",
        message: "Each enquiry field needs a unique field key.",
      });
      return;
    }

    update.mutate(
      {
        id: section.id,
        data: {
          content: {
            ...content,
            eyebrow: eyebrow.trim(),
            headline: headline.trim(),
            introduction: introduction.trim(),
            primaryLabel: primaryLabel.trim(),
            primaryPath: "#programs",
            secondaryLabel: secondaryLabel.trim(),
            secondaryPath: "#enquire",
            enquiryForm: form,
          },
        },
      },
      {
        onSuccess: () => {
          invalidateHome(client);
          onFlash({ tone: "success", message: "Hero and enquiry form saved." });
        },
        onError: (error) =>
          onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );
  };

  return (
    <form onSubmit={save} className="mt-5 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Eyebrow"
          value={eyebrow}
          onChange={setEyebrow}
          testId="input-hero-eyebrow"
        />
        <Input
          label="Primary button text"
          value={primaryLabel}
          onChange={setPrimaryLabel}
          testId="input-hero-primary-label"
        />
        <Input
          label="Headline"
          value={headline}
          onChange={setHeadline}
          required
          testId="input-hero-headline"
        />
        <Input
          label="Secondary button text"
          value={secondaryLabel}
          onChange={setSecondaryLabel}
          testId="input-hero-secondary-label"
        />
      </div>
      <Input
        label="Short description"
        value={introduction}
        onChange={setIntroduction}
        multiline
        testId="input-hero-description"
      />

      <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="mb-4">
          <p className="eyebrow text-[#E3212B]">Enquiry form</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Submissions are stored in the staff dashboard for follow-up.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Form eyebrow"
            value={form.eyebrow}
            onChange={(value) => updateForm({ eyebrow: value })}
            required
            testId="input-enquiry-eyebrow"
          />
          <Input
            label="Form heading"
            value={form.title}
            onChange={(value) => updateForm({ title: value })}
            required
            testId="input-enquiry-title"
          />
          <Input
            label="Submit button text"
            value={form.submitLabel}
            onChange={(value) => updateForm({ submitLabel: value })}
            required
            testId="input-enquiry-submit-label"
          />
          <Input
            label="Form description"
            value={form.description}
            onChange={(value) => updateForm({ description: value })}
            multiline
            testId="input-enquiry-description"
          />
          <Input
            label="Privacy note"
            value={form.note}
            onChange={(value) => updateForm({ note: value })}
            required
            testId="input-enquiry-note"
          />
          <Input
            label="Success message"
            value={form.successMessage}
            onChange={(value) => updateForm({ successMessage: value })}
            required
            multiline
            testId="input-enquiry-success-message"
          />
        </div>

        <div className="mt-5 space-y-4">
          {form.fields.map((field, index) => (
            <div
              key={`${field.name}-${index}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              data-testid={`row-enquiry-field-${index}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#0B3472]">
                  Field {index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    updateForm({
                      fields: form.fields.filter(
                        (_, current) => current !== index,
                      ),
                    })
                  }
                  className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                  aria-label={`Remove field ${index + 1}`}
                  data-testid={`button-remove-enquiry-field-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Field key"
                  value={field.name}
                  onChange={(value) => updateField(index, { name: value })}
                  required
                  testId={`input-enquiry-field-name-${index}`}
                />
                <Input
                  label="Field label"
                  value={field.label}
                  onChange={(value) => updateField(index, { label: value })}
                  required
                  testId={`input-enquiry-field-label-${index}`}
                />
                <Input
                  label="Placeholder"
                  value={field.placeholder}
                  onChange={(value) =>
                    updateField(index, { placeholder: value })
                  }
                  testId={`input-enquiry-field-placeholder-${index}`}
                />
                <label className="block text-sm font-semibold text-slate-700">
                  Field type
                  <select
                    value={field.type}
                    onChange={(event) =>
                      updateField(index, {
                        type: event.target.value as FieldType,
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
                    data-testid={`select-enquiry-field-type-${index}`}
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Telephone</option>
                    <option value="select">Select list</option>
                  </select>
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) =>
                      updateField(index, { required: event.target.checked })
                    }
                    className="h-4 w-4 accent-[#0B3472]"
                    data-testid={`checkbox-enquiry-field-required-${index}`}
                  />
                  Required
                </label>
                {field.type === "select" ? (
                  <Input
                    label="Options, separated by commas"
                    value={field.options.join(", ")}
                    onChange={(value) =>
                      updateField(index, {
                        options: value
                          .split(",")
                          .map((option) => option.trim())
                          .filter(Boolean),
                      })
                    }
                    required
                    testId={`input-enquiry-field-options-${index}`}
                  />
                ) : null}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              updateForm({
                fields: [
                  ...form.fields,
                  {
                    name: `field${form.fields.length + 1}`,
                    type: "text",
                    label: "",
                    placeholder: "",
                    required: false,
                    options: [],
                  },
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#0B3472]/30 px-3.5 py-2.5 text-sm font-bold text-[#0B3472] hover:bg-[#0B3472]/5"
            data-testid="button-add-enquiry-field"
          >
            <Plus className="h-4 w-4" /> Add form field
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={update.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B3472] px-5 py-3 text-sm font-bold text-white hover:bg-[#082859] disabled:opacity-50"
          data-testid="button-save-hero"
        >
          <Save className="h-4 w-4" />
          {update.isPending ? "Saving…" : "Save hero"}
        </button>
      </div>
    </form>
  );
}

function ItemEditor({
  sectionId,
  kind,
  initial,
  position,
  onFlash,
  onClose,
}: {
  sectionId: string;
  kind: "pathway" | "statistic";
  initial?: ContentItem;
  position: number;
  onFlash: (flash: Flash) => void;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const create = useCreateContentItem();
  const update = useUpdateContentItem();
  const isStatistic = kind === "statistic";
  const initialContent = record(initial?.content);
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [value, setValue] = useState(
    String(typeof initialContent.value === "number" ? initialContent.value : 0),
  );
  const [prefix, setPrefix] = useState(text(initialContent.prefix));
  const [suffix, setSuffix] = useState(text(initialContent.suffix));
  const [isDemo, setIsDemo] = useState(initialContent.isDemo !== false);
  const [error, setError] = useState("");

  const save = (event: FormEvent) => {
    event.preventDefault();
    const numericValue = Number(value);
    if (!title.trim()) {
      setError(isStatistic ? "Add a label for this statistic." : "Add a title.");
      return;
    }
    if (
      isStatistic &&
      (!Number.isSafeInteger(numericValue) || numericValue < 0)
    ) {
      setError("Enter a whole number of zero or higher.");
      return;
    }

    const content: CmsRecord = isStatistic
      ? {
          ...initialContent,
          value: numericValue,
          prefix: prefix.trim(),
          suffix: suffix.trim(),
          isDemo,
        }
      : initialContent;
    const data: ContentItemInput = {
      sectionId,
      itemType: isStatistic ? "statistic" : "program",
      title: title.trim(),
      description: isStatistic
        ? description.trim() || null
        : initial?.description ?? null,
      imageUrl: isStatistic ? null : initial?.imageUrl ?? null,
      linkPath: isStatistic ? null : "/",
      label: isStatistic ? null : initial?.label ?? null,
      content,
      isVisible: initial?.isVisible ?? true,
      position: initial?.position ?? position,
    };
    const options = {
      onSuccess: () => {
        invalidateHome(client);
        onFlash({
          tone: "success",
          message: initial
            ? isStatistic
              ? "Statistic saved."
              : "Pathway saved."
            : isStatistic
              ? "Statistic added."
              : "Pathway added.",
        });
        onClose();
      },
      onError: (failure: unknown) => setError(errorMessage(failure)),
    };

    if (initial) update.mutate({ id: initial.id, data }, options);
    else create.mutate({ data }, options);
  };

  const pending = create.isPending || update.isPending;
  return (
    <form
      onSubmit={save}
      className="mt-4 rounded-2xl border border-[#0B3472]/15 bg-[#f5f8fc] p-4 sm:p-5"
      data-testid={`form-${kind}-${initial?.id || "new"}`}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={isStatistic ? "Statistic label" : "Pathway title"}
          value={title}
          onChange={setTitle}
          required
          testId={`input-${kind}-title-${initial?.id || "new"}`}
        />
        {isStatistic ? (
          <Input
            label="Value"
            value={value}
            onChange={setValue}
            type="number"
            required
            testId={`input-statistic-value-${initial?.id || "new"}`}
          />
        ) : null}
        {isStatistic ? (
          <>
            <Input
              label="Prefix (optional)"
              value={prefix}
              onChange={setPrefix}
              placeholder="e.g. +"
              testId={`input-statistic-prefix-${initial?.id || "new"}`}
            />
            <Input
              label="Suffix (optional)"
              value={suffix}
              onChange={setSuffix}
              placeholder="e.g. %"
              testId={`input-statistic-suffix-${initial?.id || "new"}`}
            />
          </>
        ) : null}
      </div>
      {isStatistic ? (
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={isDemo}
            onChange={(event) => setIsDemo(event.target.checked)}
            className="h-4 w-4 accent-[#0B3472]"
            data-testid={`checkbox-statistic-demo-${initial?.id || "new"}`}
          />
          Demo value (not verified)
        </label>
      ) : null}
      {error ? (
        <p
          className="mt-3 text-sm font-semibold text-red-700"
          role="alert"
          data-testid={`error-${kind}-${initial?.id || "new"}`}
        >
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-3.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200/70"
          data-testid={`button-cancel-${kind}-${initial?.id || "new"}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B3472] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          data-testid={`button-save-${kind}-${initial?.id || "new"}`}
        >
          <Save className="h-4 w-4" />
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function ItemList({
  section,
  items,
  kind,
  onFlash,
}: {
  section: ContentSection;
  items: ContentItem[];
  kind: "pathway" | "statistic";
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const update = useUpdateContentItem();
  const remove = useDeleteContentItem();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const orderedItems = useMemo(
    () => [...items].sort((a, b) => a.position - b.position),
    [items],
  );
  const nextPosition =
    orderedItems.length === 0
      ? 0
      : Math.max(...orderedItems.map((item) => item.position)) + 1;
  const isStatistic = kind === "statistic";
  const visiblePathwayCount = orderedItems.filter((item) => item.isVisible).length;

  const move = async (item: ContentItem, direction: -1 | 1) => {
    const index = orderedItems.findIndex((candidate) => candidate.id === item.id);
    const target = orderedItems[index + direction];
    if (!target) return;
    try {
      await Promise.all([
        update.mutateAsync({
          id: item.id,
          data: { position: target.position },
        }),
        update.mutateAsync({
          id: target.id,
          data: { position: item.position },
        }),
      ]);
      invalidateHome(client);
      onFlash({ tone: "success", message: "Display order saved." });
    } catch (error) {
      onFlash({ tone: "error", message: errorMessage(error) });
    }
  };

  const deleteItem = (item: ContentItem) => {
    if (!isStatistic && item.isVisible && visiblePathwayCount <= 1) {
      onFlash({
        tone: "error",
        message: "Keep at least one pathway visible on the homepage.",
      });
      return;
    }
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    remove.mutate(
      { id: item.id },
      {
        onSuccess: () => {
          invalidateHome(client);
          onFlash({
            tone: "success",
            message: isStatistic ? "Statistic deleted." : "Pathway deleted.",
          });
        },
        onError: (error) =>
          onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );
  };

  const togglePathwayVisibility = (item: ContentItem) => {
    if (item.isVisible && visiblePathwayCount <= 1) {
      onFlash({
        tone: "error",
        message: "Keep at least one pathway visible on the homepage.",
      });
      return;
    }
    const isVisible = !item.isVisible;
    update.mutate(
      { id: item.id, data: { isVisible } },
      {
        onSuccess: () => {
          invalidateHome(client);
          onFlash({
            tone: "success",
            message: isVisible
              ? "Pathway shown on the homepage."
              : "Pathway hidden from the homepage.",
          });
        },
        onError: (error) =>
          onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );
  };

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-extrabold text-[#0B3472]">
            {isStatistic ? "Statistics" : "Pathways"}
          </h3>
          {isStatistic ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Sample values are marked demo until replaced with approved,
              verified figures.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              At least one pathway stays visible on the homepage.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#0B3472]/15 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0B3472] hover:bg-[#0B3472]/5"
          data-testid={`button-add-${kind}`}
        >
          <Plus className="h-4 w-4" />
          Add {isStatistic ? "statistic" : "pathway"}
        </button>
      </div>

      {orderedItems.length === 0 && editing !== "new" ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          No {isStatistic ? "statistics" : "pathways"} yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orderedItems.map((item, index) => {
            const itemContent = record(item.content);
            return (
              <div
                key={item.id}
                className={`rounded-2xl border border-slate-200 bg-white p-4 ${
                  !item.isVisible && !isStatistic ? "bg-slate-50" : ""
                }`}
                data-testid={`row-${kind}-${item.id}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#0B3472]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {isStatistic
                        ? `Value: ${text(String(itemContent.value ?? 0))}${
                            itemContent.isDemo === true ? " · Demo" : ""
                          }`
                        : item.isVisible
                          ? "Shown on homepage"
                          : "Hidden from homepage"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isStatistic ? (
                      <button
                        type="button"
                        onClick={() => togglePathwayVisibility(item)}
                        disabled={update.isPending}
                        aria-label={`${item.isVisible ? "Hide" : "Show"} ${item.title} on the public homepage`}
                        title={
                          item.isVisible
                            ? "Hide from public homepage"
                            : "Show on public homepage"
                        }
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        data-testid={`button-toggle-pathway-${item.id}`}
                      >
                        {item.isVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void move(item, -1)}
                      disabled={index === 0 || update.isPending}
                      aria-label={`Move ${item.title} up`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      data-testid={`button-move-up-${kind}-${item.id}`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(item, 1)}
                      disabled={
                        index === orderedItems.length - 1 || update.isPending
                      }
                      aria-label={`Move ${item.title} down`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      data-testid={`button-move-down-${kind}-${item.id}`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing(editing === item.id ? null : item.id)
                      }
                      className="rounded-lg px-3 py-2 text-xs font-bold text-[#0B3472] hover:bg-[#0B3472]/5"
                      data-testid={`button-edit-${kind}-${item.id}`}
                    >
                      {editing === item.id ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item)}
                      disabled={remove.isPending}
                      aria-label={`Delete ${item.title}`}
                      className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      data-testid={`button-delete-${kind}-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {editing === item.id ? (
                  <ItemEditor
                    key={item.id}
                    sectionId={section.id}
                    kind={kind}
                    initial={item}
                    position={item.position}
                    onFlash={onFlash}
                    onClose={() => setEditing(null)}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      {editing === "new" ? (
        <ItemEditor
          key={`${kind}-new`}
          sectionId={section.id}
          kind={kind}
          position={nextPosition}
          onFlash={onFlash}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function ContentSectionPanel({
  section,
  children,
  onFlash,
}: {
  section: ContentSection;
  children: React.ReactNode;
  onFlash: (flash: Flash) => void;
}) {
  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      data-testid={`panel-home-section-${section.sectionKey}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[#E3212B]">
            {section.sectionKey === "hero"
              ? "01 · Hero"
              : section.sectionKey === "programs"
                ? "02 · Explore Pathways"
                : "03 · Statistics"}
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0B3472]">
            {section.sectionKey === "hero" ? "Homepage introduction" : section.title}
          </h2>
        </div>
        <SectionVisibility section={section} onFlash={onFlash} />
      </div>
      {children}
    </section>
  );
}

export default function AdminHomeEditor({
  home,
  onFlash,
  sectionKey,
}: {
  home: HomePage;
  onFlash: (flash: Flash) => void;
  sectionKey: "hero" | "programs" | "statistics";
}) {
  const sections = useMemo(
    () =>
      new Map(
        home.sections.map((section) => [section.sectionKey, section] as const),
      ),
    [home.sections],
  );
  const hero = sections.get("hero");
  const programs = sections.get("programs");
  const statistics = sections.get("statistics");
  const itemsBySection = (section?: ContentSection) =>
    section
      ? home.items.filter((item) => item.sectionId === section.id)
      : [];

  return (
    <div className="space-y-6">
      {sectionKey === "hero" && hero ? (
        <ContentSectionPanel section={hero} onFlash={onFlash}>
          <HeroEditor section={hero} onFlash={onFlash} />
        </ContentSectionPanel>
      ) : sectionKey === "hero" ? (
        <MissingSection title="Hero" />
      ) : null}

      {sectionKey === "programs" && programs ? (
        <ContentSectionPanel section={programs} onFlash={onFlash}>
          <SectionDetails section={programs} onFlash={onFlash} />
          <ItemList
            section={programs}
            items={itemsBySection(programs)}
            kind="pathway"
            onFlash={onFlash}
          />
        </ContentSectionPanel>
      ) : sectionKey === "programs" ? (
        <MissingSection title="Explore Pathways" />
      ) : null}

      {sectionKey === "statistics" && statistics ? (
        <ContentSectionPanel section={statistics} onFlash={onFlash}>
          <SectionDetails section={statistics} onFlash={onFlash} />
          <ItemList
            section={statistics}
            items={itemsBySection(statistics)}
            kind="statistic"
            onFlash={onFlash}
          />
        </ContentSectionPanel>
      ) : sectionKey === "statistics" ? (
        <MissingSection title="Statistics" />
      ) : null}
    </div>
  );
}

function MissingSection({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      {title} content is not available yet. Refresh the editor after the content
      service has initialized.
    </div>
  );
}