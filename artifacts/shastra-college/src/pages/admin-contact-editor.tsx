import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CircleHelp,
  FileText,
  LoaderCircle,
  Mail,
  Save,
} from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useGetAdminCmsPage,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentSection } from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string };
type CmsRecord = Record<string, unknown>;
type EnquiryField = CmsRecord & {
  name: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
};
type EnquiryFormCopy = CmsRecord & {
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

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown): string {
  const candidate = error as {
    message?: string;
    response?: { status?: number };
    status?: number;
  };
  if (candidate?.response?.status === 403 || candidate?.status === 403) {
    return "Your account is signed in, but it is not on the staff allowlist.";
  }
  return candidate?.message || "This contact content could not be saved. Please try again.";
}

function invalidateContact(client: ReturnType<typeof useQueryClient>) {
  void Promise.all([
    client.invalidateQueries({ queryKey: getGetAdminCmsPageQueryKey("contact") }),
    client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("contact") }),
  ]);
}

function Field({
  label,
  value,
  onChange,
  testId,
  multiline = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
  multiline?: boolean;
  hint?: string;
}) {
  const classes =
    "mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {hint ? <span className="ml-2 text-xs font-medium text-slate-400">{hint}</span> : null}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          rows={3}
          className={`${classes} resize-y`}
          data-testid={testId}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          className={classes}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function EditorCard({
  icon,
  eyebrow,
  title,
  description,
  children,
  testId,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  testId: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-[1.65rem] border border-[#0b3472]/10 bg-[#fffefa] shadow-[0_14px_38px_rgba(11,52,114,.055)]"
      data-testid={testId}
    >
      <div className="flex gap-4 border-b border-[#0b3472]/[.08] px-5 py-5 sm:px-7 sm:py-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0b3472]/[.07] text-[#0b3472]">
          {icon}
        </span>
        <div>
          <p className="eyebrow text-[#c07823]">{eyebrow}</p>
          <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-[#0b3472] sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>
    </section>
  );
}

function SaveButton({
  pending,
  testId,
  children,
}: {
  pending: boolean;
  testId: string;
  children: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(11,52,114,.14)] transition hover:bg-[#082859] disabled:cursor-not-allowed disabled:opacity-55"
      data-testid={testId}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
      {pending ? "Saving…" : children}
    </button>
  );
}

function SectionMessage({ message }: { message: string }) {
  return message ? (
    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
      {message}
    </p>
  ) : null;
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
  const [eyebrow, setEyebrow] = useState(stringValue(content.eyebrow));
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setEyebrow(stringValue(record(section.content).eyebrow));
    setTitle(section.title);
    setSubtitle(section.subtitle || "");
    setError("");
  }, [section.id, section.updatedAt]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a title before saving.");
      return;
    }
    setError("");
    try {
      await update.mutateAsync({
        id: section.id,
        data: {
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: { ...content, eyebrow: eyebrow.trim() },
        },
      });
      invalidateContact(client);
      onFlash({ tone: "success", message: "Contact introduction saved." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  return (
    <EditorCard
      icon={<FileText className="h-5 w-5" aria-hidden="true" />}
      eyebrow="Contact page · introduction"
      title="Hero copy"
      description="The opening message visitors see when they reach the Contact page."
      testId="card-contact-hero-editor"
    >
      <form onSubmit={(event) => void save(event)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={eyebrow} onChange={setEyebrow} testId="input-contact-hero-eyebrow" />
          <Field label="Title" value={title} onChange={setTitle} testId="input-contact-hero-title" />
          <div className="md:col-span-2">
            <Field label="Supporting text" value={subtitle} onChange={setSubtitle} multiline testId="textarea-contact-hero-subtitle" />
          </div>
        </div>
        <SectionMessage message={error} />
        <div className="mt-5 flex justify-end">
          <SaveButton pending={update.isPending} testId="button-save-contact-hero">Save introduction</SaveButton>
        </div>
      </form>
    </EditorCard>
  );
}

function readFields(value: unknown): EnquiryField[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const field = record(entry);
    return {
      ...field,
      name: stringValue(field.name),
      type: stringValue(field.type),
      label: stringValue(field.label),
      placeholder: stringValue(field.placeholder),
      required: field.required === true,
      options: Array.isArray(field.options)
        ? field.options.filter((option): option is string => typeof option === "string")
        : [],
    };
  });
}

function EnquiryEditor({
  section,
  onFlash,
}: {
  section: ContentSection;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  const originalContent = record(section.content);
  const originalForm = record(originalContent.enquiryForm);
  const [form, setForm] = useState<EnquiryFormCopy>(() => ({
    ...originalForm,
    eyebrow: stringValue(originalForm.eyebrow),
    title: stringValue(originalForm.title),
    description: stringValue(originalForm.description),
    submitLabel: stringValue(originalForm.submitLabel),
    note: stringValue(originalForm.note),
    successMessage: stringValue(originalForm.successMessage),
    fields: readFields(originalForm.fields),
  }));
  const [error, setError] = useState("");

  useEffect(() => {
    const next = record(record(section.content).enquiryForm);
    setForm({
      ...next,
      eyebrow: stringValue(next.eyebrow),
      title: stringValue(next.title),
      description: stringValue(next.description),
      submitLabel: stringValue(next.submitLabel),
      note: stringValue(next.note),
      successMessage: stringValue(next.successMessage),
      fields: readFields(next.fields),
    });
    setError("");
  }, [section.id, section.updatedAt]);

  const setCopy = (key: keyof Omit<EnquiryFormCopy, "fields">, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Add a form title before saving.");
      return;
    }
    if (
      form.fields.some((field) => !field.name.trim() || !field.label.trim()) ||
      new Set(form.fields.map((field) => field.name.trim().toLowerCase())).size !== form.fields.length
    ) {
      setError("Every field needs a label and unique field key.");
      return;
    }
    setError("");
    try {
      const latestContent = record(section.content);
      const latestForm = record(latestContent.enquiryForm);
      const { fields: _fields, ...copyWithoutFields } = form;
      await update.mutateAsync({
        id: section.id,
        data: {
          content: {
            ...latestContent,
            enquiryForm: {
              ...latestForm,
              ...copyWithoutFields,
              ...(Array.isArray(latestForm.fields)
                ? { fields: form.fields.map((field) => ({ ...field })) }
                : {}),
            },
          },
        },
      });
      invalidateContact(client);
      onFlash({ tone: "success", message: "Enquiry form content saved." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const editField = (index: number, changes: Partial<EnquiryField>) => {
    setForm((current) => ({
      ...current,
      fields: current.fields.map((field, fieldIndex) =>
        index === fieldIndex ? { ...field, ...changes } : field,
      ),
    }));
  };

  return (
    <EditorCard
      icon={<Mail className="h-5 w-5" aria-hidden="true" />}
      eyebrow="Contact page · submissions"
      title="Enquiry form"
      description="Update the form introduction, confirmation copy, and the fields visitors use to contact the college."
      testId="card-contact-enquiry-editor"
    >
      {!Array.isArray(originalForm.fields) ? (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" data-testid="notice-contact-form-fields-missing">
          Form fields are not present in the saved page content. No fields have been added; saving will keep the current field list unchanged. Empty copy fields below reflect missing saved values, not suggested defaults.
        </p>
      ) : null}
      <form onSubmit={(event) => void save(event)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={form.eyebrow} onChange={(value) => setCopy("eyebrow", value)} testId="input-contact-form-eyebrow" />
          <Field label="Title" value={form.title} onChange={(value) => setCopy("title", value)} testId="input-contact-form-title" />
          <div className="md:col-span-2">
            <Field label="Description" value={form.description} onChange={(value) => setCopy("description", value)} multiline testId="textarea-contact-form-description" />
          </div>
          <Field label="Submit button label" value={form.submitLabel} onChange={(value) => setCopy("submitLabel", value)} testId="input-contact-form-submit-label" />
          <Field label="Privacy note" value={form.note} onChange={(value) => setCopy("note", value)} testId="input-contact-form-note" />
          <div className="md:col-span-2">
            <Field label="Success message" value={form.successMessage} onChange={(value) => setCopy("successMessage", value)} multiline testId="textarea-contact-form-success-message" />
          </div>
        </div>

        <div className="mt-7 border-t border-[#0b3472]/10 pt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow text-[#c07823]">Form structure</p>
              <h3 className="mt-1 font-display text-lg font-extrabold text-[#0b3472]">Visitor fields</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {form.fields.length} {form.fields.length === 1 ? "field" : "fields"}
            </span>
          </div>
          {form.fields.length ? (
            <div className="space-y-3">
              {form.fields.map((field, index) => (
                <div key={`${field.name}-${index}`} className="rounded-2xl border border-[#0b3472]/10 bg-[#f8f8f4] p-4 sm:p-5" data-testid={`row-contact-form-field-${index}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="eyebrow text-slate-500">Field {String(index + 1).padStart(2, "0")}</span>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) => editField(index, { required: event.currentTarget.checked })}
                        className="h-4 w-4 accent-[#0b3472]"
                        data-testid={`checkbox-contact-form-field-required-${index}`}
                      />
                      Required
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Field key" value={field.name} onChange={(value) => editField(index, { name: value })} testId={`input-contact-form-field-name-${index}`} />
                    <Field label="Field label" value={field.label} onChange={(value) => editField(index, { label: value })} testId={`input-contact-form-field-label-${index}`} />
                    <Field label="Placeholder" value={field.placeholder} onChange={(value) => editField(index, { placeholder: value })} testId={`input-contact-form-field-placeholder-${index}`} />
                    <label className="block text-sm font-bold text-slate-700">
                      Field type
                      <select
                        value={field.type}
                        onChange={(event) => editField(index, { type: event.currentTarget.value })}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
                        data-testid={`select-contact-form-field-type-${index}`}
                      >
                        {field.type && !["text", "email", "tel", "select"].includes(field.type) ? <option value={field.type}>{field.type}</option> : null}
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="tel">Telephone</option>
                        <option value="select">Select list</option>
                      </select>
                    </label>
                    {field.type === "select" ? (
                      <Field
                        label="Options"
                        hint="Separate with commas"
                        value={field.options.join(", ")}
                        onChange={(value) => editField(index, { options: value.split(",").map((option) => option.trim()).filter(Boolean) })}
                        testId={`input-contact-form-field-options-${index}`}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#0b3472]/20 bg-[#f8f8f4] px-5 py-6 text-sm leading-6 text-slate-600" data-testid="empty-contact-form-fields">
              No enquiry fields are currently recorded in this section.
            </div>
          )}
        </div>
        <SectionMessage message={error} />
        <div className="mt-5 flex justify-end">
          <SaveButton pending={update.isPending} testId="button-save-contact-enquiry-form">Save form content</SaveButton>
        </div>
      </form>
    </EditorCard>
  );
}

function FaqSettings({
  section,
  onFlash,
  onNavigate,
}: {
  section: ContentSection;
  onFlash: (flash: Flash) => void;
  onNavigate: (destination: "faqs") => void;
}) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  const content = record(section.content);
  const [eyebrow, setEyebrow] = useState(stringValue(content.eyebrow));
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setEyebrow(stringValue(record(section.content).eyebrow));
    setTitle(section.title);
    setSubtitle(section.subtitle || "");
    setError("");
  }, [section.id, section.updatedAt]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a title before saving.");
      return;
    }
    setError("");
    try {
      await update.mutateAsync({
        id: section.id,
        data: {
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: { ...content, eyebrow: eyebrow.trim() },
        },
      });
      invalidateContact(client);
      onFlash({ tone: "success", message: "FAQ section heading saved." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  return (
    <EditorCard
      icon={<CircleHelp className="h-5 w-5" aria-hidden="true" />}
      eyebrow="Contact page · common questions"
      title="FAQ section settings"
      description="Edit the heading and introduction only. Questions and answers remain in the existing FAQ manager."
      testId="card-contact-faq-settings"
    >
      <form onSubmit={(event) => void save(event)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={eyebrow} onChange={setEyebrow} testId="input-contact-faq-eyebrow" />
          <Field label="Title" value={title} onChange={setTitle} testId="input-contact-faq-title" />
          <div className="md:col-span-2">
            <Field label="Supporting text" value={subtitle} onChange={setSubtitle} multiline testId="textarea-contact-faq-subtitle" />
          </div>
        </div>
        <SectionMessage message={error} />
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate("faqs")}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/20 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:bg-[#0b3472]/[.04]"
            data-testid="button-contact-open-faq-manager"
          >
            Manage FAQ answers
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <SaveButton pending={update.isPending} testId="button-save-contact-faq-settings">Save FAQ heading</SaveButton>
        </div>
      </form>
    </EditorCard>
  );
}

export default function AdminContactEditor({
  onFlash,
  onNavigate,
}: {
  onFlash: (flash: Flash) => void;
  onNavigate: (destination: "faqs") => void;
}) {
  const page = useGetAdminCmsPage("contact", {
    query: { queryKey: getGetAdminCmsPageQueryKey("contact") },
  });

  if (page.isLoading) {
    return (
      <div className="mt-6 space-y-5" aria-busy="true" data-testid="loading-admin-contact">
        <div className="h-36 animate-pulse rounded-[1.65rem] bg-white" />
        <div className="h-80 animate-pulse rounded-[1.65rem] bg-white" />
        <div className="h-56 animate-pulse rounded-[1.65rem] bg-white" />
      </div>
    );
  }

  if (page.isError || !page.data) {
    return (
      <section className="mt-6 rounded-[1.65rem] border border-red-200 bg-red-50 p-6 sm:p-8" role="alert" data-testid="error-admin-contact">
        <p className="eyebrow text-[#ba1824]">Contact page</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]">Contact content could not be loaded.</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-red-900/75">The saved page data is needed before edits can be made. Please retry the connection.</p>
        <button
          type="button"
          onClick={() => void page.refetch()}
          className="focus-ring mt-5 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white"
          data-testid="button-retry-admin-contact"
        >
          Try again
        </button>
      </section>
    );
  }

  const sections = page.data.sections;
  const hero = sections.find((section) => section.pageSlug === "contact" && section.sectionKey === "hero");
  const enquiry = sections.find((section) => section.pageSlug === "contact" && section.sectionKey === "enquiry-form");
  const faqs = sections.find((section) => section.pageSlug === "contact" && section.sectionKey === "faqs");
  const missing = [
    !hero ? "hero" : null,
    !enquiry ? "enquiry-form" : null,
    !faqs ? "faqs" : null,
  ].filter((key): key is string => Boolean(key));

  return (
    <div className="mt-6 space-y-5 pb-8" data-testid="admin-contact-editor">
      <header className="relative overflow-hidden rounded-[1.65rem] bg-[#0b3472] px-5 py-6 text-white shadow-[0_16px_38px_rgba(11,52,114,.16)] sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-1 -top-10 h-44 w-44 rounded-full border border-white/10" />
        <div className="relative">
          <p className="eyebrow text-[#ffc7a0]">Public website · Contact</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">A clear way to connect.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/85">
            Maintain the contact introduction, enquiry form, and FAQ section heading. Changes are saved to the existing page sections.
          </p>
        </div>
      </header>

      {missing.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950" role="status" data-testid="notice-contact-sections-missing">
          <strong className="font-extrabold">Some seeded content is missing.</strong>{" "}
          {missing.join(", ")} {missing.length === 1 ? "section is" : "sections are"} not in the current Contact page response. No replacement content has been created.
        </div>
      ) : null}

      {hero ? <HeroEditor key={hero.id} section={hero} onFlash={onFlash} /> : null}
      {enquiry ? <EnquiryEditor key={enquiry.id} section={enquiry} onFlash={onFlash} /> : null}
      {faqs ? <FaqSettings key={faqs.id} section={faqs} onFlash={onFlash} onNavigate={onNavigate} /> : null}
    </div>
  );
}