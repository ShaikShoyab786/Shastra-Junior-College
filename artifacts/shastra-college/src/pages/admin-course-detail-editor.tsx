import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Plus, Save, Trash2, Upload } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useCreateContentItem,
  useDeleteContentItem,
  useGetAdminCmsPage,
  useRequestUploadUrl,
  useUpdateContentItem,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentItem, ContentItemInput, ContentSection } from "@workspace/api-client-react";
import { Link } from "wouter";
import { courseSectionKey, type CourseDetail } from "./course-detail-config";

type Flash = { tone: "success" | "error"; message: string };
type SectionDraft = {
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
  isVisible: boolean;
};
type HighlightDraft = {
  clientKey: string;
  id?: string;
  category: string;
  title: string;
  description: string;
  isVisible: boolean;
};

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(content: Record<string, unknown>, key: string) {
  return typeof content[key] === "string" ? content[key] as string : "";
}

function errorMessage(error: unknown) {
  const candidate = error as { message?: string; response?: { data?: { error?: string } } };
  return candidate?.response?.data?.error || candidate?.message || "The course page could not be saved. Please try again.";
}

function newId() {
  return `course-highlight-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function draftFromSection(section: ContentSection): SectionDraft {
  return {
    title: section.title,
    subtitle: section.subtitle || "",
    content: { ...recordValue(section.content) },
    isVisible: section.isVisible,
  };
}

function draftFromItem(item: ContentItem): HighlightDraft {
  return {
    clientKey: item.id,
    id: item.id,
    category: stringValue(recordValue(item.content), "category"),
    title: item.title,
    description: item.description || "",
    isVisible: item.isVisible,
  };
}

function Field({
  label,
  value,
  onChange,
  testId,
  multiline = false,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
  multiline?: boolean;
  hint?: string;
  type?: "text" | "url";
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} rows={4} className={`${inputClass} resize-y`} data-testid={testId} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.currentTarget.value)} className={inputClass} data-testid={testId} />
      )}
      {hint ? <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function Panel({
  eyebrow,
  title,
  children,
  testId,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7" data-testid={testId}>
      <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SectionToggle({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  testId: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} className="h-4 w-4 accent-[#0b3472]" data-testid={testId} />
      {label}
    </label>
  );
}

function HighlightRow({
  entry,
  index,
  count,
  onChange,
  onMove,
  onDelete,
}: {
  entry: HighlightDraft;
  index: number;
  count: number;
  onChange: (entry: HighlightDraft) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <article className={`rounded-2xl border p-4 ${entry.isVisible ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`} data-testid={`row-course-highlight-${entry.clientKey}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#0b3472]">{entry.title || "New highlight"}</p>
          <p className="mt-1 text-xs text-slate-500">{entry.isVisible ? "Published" : "Hidden"} · order {index + 1}</p>
        </div>
        <button type="button" onClick={() => onChange({ ...entry, isVisible: !entry.isVisible })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`${entry.isVisible ? "Hide" : "Show"} ${entry.title || "highlight"}`} data-testid={`button-toggle-course-highlight-${entry.clientKey}`}>
          {entry.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${entry.title || "highlight"} up`} data-testid={`button-move-course-highlight-up-${entry.clientKey}`}><ArrowUp className="h-4 w-4" /></button>
        <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${entry.title || "highlight"} down`} data-testid={`button-move-course-highlight-down-${entry.clientKey}`}><ArrowDown className="h-4 w-4" /></button>
        <button type="button" onClick={onDelete} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label={`Remove ${entry.title || "highlight"}`} data-testid={`button-remove-course-highlight-${entry.clientKey}`}><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Category label" value={entry.category} onChange={(next) => onChange({ ...entry, category: next })} testId={`input-course-highlight-category-${entry.clientKey}`} hint="Keep this short, such as “Core subject” or “Exam pathway.”" />
        <Field label="Highlight title" value={entry.title} onChange={(next) => onChange({ ...entry, title: next })} testId={`input-course-highlight-title-${entry.clientKey}`} />
        <div className="md:col-span-2"><Field label="Description" value={entry.description} onChange={(next) => onChange({ ...entry, description: next })} multiline testId={`textarea-course-highlight-description-${entry.clientKey}`} /></div>
      </div>
    </article>
  );
}

function ImageEditor({
  course,
  imageUrl,
  imageAlt,
  onChange,
  upload,
}: {
  course: CourseDetail;
  imageUrl: string;
  imageAlt: string;
  onChange: (key: string, value: string) => void;
  upload: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = imageUrl.startsWith("/objects/") ? `/api/storage${imageUrl}` : imageUrl;
  const [previewFailed, setPreviewFailed] = useState(false);
  useEffect(() => setPreviewFailed(false), [preview]);

  const selectFile = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      onChange("imageUrl", await upload(file));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-[#f8fafc] p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8eef8]">
          {preview && !previewFailed ? <img src={preview} alt={imageAlt} onError={() => setPreviewFailed(true)} className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-[#0b3472]/30" aria-hidden="true" />}
        </div>
        <label className="inline-flex h-fit cursor-pointer items-center gap-2 rounded-lg border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472]">
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />{busy ? "Uploading…" : "Upload hero image"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void selectFile(file); event.currentTarget.value = ""; }} data-testid={`input-course-${course.slug}-hero-image-file`} />
        </label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Hero image URL" value={imageUrl} onChange={(next) => onChange("imageUrl", next)} testId={`input-course-${course.slug}-hero-image-url`} type="url" />
        <Field label="Image alt text" value={imageAlt} onChange={(next) => onChange("imageAlt", next)} testId={`input-course-${course.slug}-hero-image-alt`} hint="Describe the image for families using assistive technology." />
      </div>
      {error ? <p className="mt-3 text-xs font-semibold text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}

export default function AdminCourseDetailEditor({
  course,
  onFlash,
}: {
  course: CourseDetail;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const page = useGetAdminCmsPage("courses", { query: { queryKey: getGetAdminCmsPageQueryKey("courses") } });
  const createItem = useCreateContentItem();
  const updateItemMutation = useUpdateContentItem();
  const deleteItem = useDeleteContentItem();
  const updateSection = useUpdateContentSection();
  const requestUpload = useRequestUploadUrl();
  const [hero, setHero] = useState<SectionDraft | null>(null);
  const [highlightsSection, setHighlightsSection] = useState<SectionDraft | null>(null);
  const [items, setItems] = useState<HighlightDraft[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);

  const heroSource = page.data?.sections.find((section) => section.sectionKey === courseSectionKey(course.slug, "hero"));
  const highlightsSource = page.data?.sections.find((section) => section.sectionKey === courseSectionKey(course.slug, "highlights"));

  useEffect(() => {
    if (!page.data || !heroSource || !highlightsSource) return;
    setHero(draftFromSection(heroSource));
    setHighlightsSection(draftFromSection(highlightsSource));
    setItems(
      page.data.items
        .filter((item) => item.sectionId === highlightsSource.id && item.itemType === "course-highlight")
        .sort((a, b) => a.position - b.position)
        .map(draftFromItem),
    );
    setError("");
  }, [course.slug, page.data, heroSource, highlightsSource]);

  const upload = async (file: File) => {
    setUploadsInProgress((count) => count + 1);
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPEG, or WebP image.");
      if (file.size > 2 * 1024 * 1024) throw new Error("Images must be 2 MB or smaller.");
      const info = await requestUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
      const response = await fetch(info.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("The image upload could not be completed.");
      return info.objectPath;
    } finally {
      setUploadsInProgress((count) => Math.max(0, count - 1));
    }
  };

  const patchSectionContent = (
    section: "hero" | "highlights",
    key: string,
    value: unknown,
  ) => {
    const setter = section === "hero" ? setHero : setHighlightsSection;
    setter((current) => current ? { ...current, content: { ...current.content, [key]: value } } : current);
  };

  const updateHighlightDraft = (next: HighlightDraft) => setItems((current) => current.map((item) => item.clientKey === next.clientKey ? next : item));
  const moveItem = (index: number, direction: -1 | 1) => setItems((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = current.slice();
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const currentPage = page.data;
    if (!currentPage || !heroSource || !highlightsSource || !hero || !highlightsSection) {
      setError("This course page is still loading. Please try again.");
      return;
    }
    const heroContent = recordValue(hero.content);
    const highlightsContent = recordValue(highlightsSection.content);
    const imageUrl = stringValue(heroContent, "imageUrl");
    const imageAlt = stringValue(heroContent, "imageAlt");
    if (hero.isVisible) {
      if (!hero.title.trim() || !hero.subtitle.trim() || !stringValue(heroContent, "eyebrow").trim() || !stringValue(heroContent, "primaryCtaLabel").trim()) {
        setError("For a published Hero, complete the eyebrow, title, introduction, and primary action label.");
        return;
      }
      if (imageUrl.trim() && !imageAlt.trim()) {
        setError("Add useful alt text for the hero image, or remove the image.");
        return;
      }
    }
    if (highlightsSection.isVisible) {
      if (!highlightsSection.title.trim() || !highlightsSection.subtitle.trim() || !stringValue(highlightsContent, "eyebrow").trim()) {
        setError("For published Quick Course Highlights, complete the label, heading, and introduction.");
        return;
      }
      if (!items.some((item) => item.isVisible)) {
        setError("Publish at least one highlight item, or hide the Quick Course Highlights section.");
        return;
      }
    }
    for (const item of items) {
      if (!item.category.trim() || !item.title.trim() || !item.description.trim()) {
        setError(`Complete or remove the highlight “${item.title || "New highlight"}”.`);
        return;
      }
    }

    setSaving(true);
    try {
      await updateSection.mutateAsync({
        id: heroSource.id,
        data: { title: hero.title.trim(), subtitle: hero.subtitle.trim() || null, content: hero.content, isVisible: hero.isVisible },
      });
      await updateSection.mutateAsync({
        id: highlightsSource.id,
        data: { title: highlightsSection.title.trim(), subtitle: highlightsSection.subtitle.trim() || null, content: highlightsSection.content, isVisible: highlightsSection.isVisible },
      });

      const savedItemIds = new Set(items.flatMap((item) => item.id ? [item.id] : []));
      for (const existing of currentPage.items) {
        if (existing.sectionId === highlightsSource.id && existing.itemType === "course-highlight" && !savedItemIds.has(existing.id)) {
          await deleteItem.mutateAsync({ id: existing.id });
        }
      }
      for (const [position, item] of items.entries()) {
        const input: ContentItemInput = {
          sectionId: highlightsSource.id,
          itemType: "course-highlight",
          title: item.title.trim(),
          description: item.description.trim(),
          imageUrl: null,
          linkPath: null,
          label: null,
          content: { category: item.category.trim() },
          isVisible: item.isVisible,
          position,
        };
        if (item.id) {
          await updateItemMutation.mutateAsync({ id: item.id, data: input });
        } else {
          await createItem.mutateAsync({ data: input });
        }
      }
      await client.invalidateQueries({ queryKey: getGetAdminCmsPageQueryKey("courses") });
      await client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("courses") });
      onFlash({ tone: "success", message: `${course.name} course page saved.` });
    } catch (failure) {
      setError(errorMessage(failure));
      await client.invalidateQueries({ queryKey: getGetAdminCmsPageQueryKey("courses") });
      await client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("courses") });
    } finally {
      setSaving(false);
    }
  };

  if (page.isLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500" aria-busy="true" data-testid={`status-admin-course-${course.slug}-loading`}>Loading {course.name} course content…</div>;
  }
  if (page.isError || !page.data || !heroSource || !highlightsSource || !hero || !highlightsSection) {
    return <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700" role="alert" data-testid={`status-admin-course-${course.slug}-error`}>The saved course sections are unavailable. Restart the site content service and reload this page.</div>;
  }

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-6" data-testid={`form-admin-course-${course.slug}`}>
      {course.slug === "integrated" ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950" role="status" data-testid="notice-integrated-course-draft">
          The project has no verified Integrated course description yet. This page starts unpublished; add confirmed course details before publishing either section.
        </div>
      ) : null}

      <Panel eyebrow={`${course.name} / Section 1`} title="Hero" testId={`panel-admin-course-${course.slug}-hero`}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Section label" value={stringValue(recordValue(hero.content), "eyebrow")} onChange={(value) => patchSectionContent("hero", "eyebrow", value)} testId={`input-course-${course.slug}-hero-eyebrow`} />
          <Field label="Course title" value={hero.title} onChange={(value) => setHero((current) => current ? { ...current, title: value } : current)} testId={`input-course-${course.slug}-hero-title`} />
          <div className="md:col-span-2"><Field label="Introduction" value={hero.subtitle} onChange={(value) => setHero((current) => current ? { ...current, subtitle: value } : current)} multiline testId={`textarea-course-${course.slug}-hero-introduction`} hint="Use verified course information. Leave this blank while unpublished if details have not been confirmed." /></div>
          <Field label="Optional status label" value={stringValue(recordValue(hero.content), "statusLabel")} onChange={(value) => patchSectionContent("hero", "statusLabel", value)} testId={`input-course-${course.slug}-hero-status`} hint="Leave blank unless the status is confirmed and current." />
          <Field label="Duration (optional)" value={stringValue(recordValue(hero.content), "duration")} onChange={(value) => patchSectionContent("hero", "duration", value)} testId={`input-course-${course.slug}-hero-duration`} />
          <Field label="Study mode (optional)" value={stringValue(recordValue(hero.content), "studyMode")} onChange={(value) => patchSectionContent("hero", "studyMode", value)} testId={`input-course-${course.slug}-hero-study-mode`} />
          <Field label="Primary action label" value={stringValue(recordValue(hero.content), "primaryCtaLabel")} onChange={(value) => patchSectionContent("hero", "primaryCtaLabel", value)} testId={`input-course-${course.slug}-hero-primary-cta`} hint="The button uses the existing college enquiry page." />
          <Field label="Secondary action label" value={stringValue(recordValue(hero.content), "secondaryCtaLabel")} onChange={(value) => patchSectionContent("hero", "secondaryCtaLabel", value)} testId={`input-course-${course.slug}-hero-secondary-cta`} hint="The button returns visitors to the existing Courses overview." />
          <div className="md:col-span-2">
            <ImageEditor
              course={course}
              imageUrl={stringValue(recordValue(hero.content), "imageUrl")}
              imageAlt={stringValue(recordValue(hero.content), "imageAlt")}
              onChange={(key, value) => patchSectionContent("hero", key, value)}
              upload={upload}
            />
          </div>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <SectionToggle label="Publish Hero" checked={hero.isVisible} onChange={(value) => setHero((current) => current ? { ...current, isVisible: value } : current)} testId={`checkbox-course-${course.slug}-hero-visible`} />
        </div>
      </Panel>

      <Panel eyebrow={`${course.name} / Section 2`} title="Quick Course Highlights" testId={`panel-admin-course-${course.slug}-highlights`}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Section label" value={stringValue(recordValue(highlightsSection.content), "eyebrow")} onChange={(value) => patchSectionContent("highlights", "eyebrow", value)} testId={`input-course-${course.slug}-highlights-eyebrow`} />
          <Field label="Section heading" value={highlightsSection.title} onChange={(value) => setHighlightsSection((current) => current ? { ...current, title: value } : current)} testId={`input-course-${course.slug}-highlights-title`} />
          <div className="md:col-span-2"><Field label="Introduction" value={highlightsSection.subtitle} onChange={(value) => setHighlightsSection((current) => current ? { ...current, subtitle: value } : current)} multiline testId={`textarea-course-${course.slug}-highlights-introduction`} /></div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">{items.length} highlight{items.length === 1 ? "" : "s"} · reorder to set the public display order</p>
          <button type="button" onClick={() => setItems((current) => [...current, { clientKey: newId(), category: "", title: "", description: "", isVisible: false }])} className="inline-flex items-center gap-2 rounded-lg border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#f4f7fb]" data-testid={`button-add-course-${course.slug}-highlight`}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add highlight
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {items.length ? items.map((item, index) => (
            <HighlightRow
              key={item.clientKey}
              entry={item}
              index={index}
              count={items.length}
              onChange={updateHighlightDraft}
              onMove={(direction) => moveItem(index, direction)}
              onDelete={() => setItems((current) => current.filter((candidate) => candidate.clientKey !== item.clientKey))}
            />
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
              No highlights yet. Add verified course details before publishing this section.
            </div>
          )}
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <SectionToggle label="Publish Quick Course Highlights" checked={highlightsSection.isVisible} onChange={(value) => setHighlightsSection((current) => current ? { ...current, isVisible: value } : current)} testId={`checkbox-course-${course.slug}-highlights-visible`} />
        </div>
      </Panel>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert" data-testid={`error-admin-course-${course.slug}`}>{error}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/courses/${course.slug}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#0b3472] underline underline-offset-4" data-testid={`link-preview-course-${course.slug}`}>
          Preview {course.name} page
        </Link>
        <button type="submit" disabled={saving || uploadsInProgress > 0 || updateSection.isPending || createItem.isPending || updateItemMutation.isPending || deleteItem.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white disabled:opacity-50" data-testid={`button-save-course-${course.slug}`}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {uploadsInProgress ? "Wait for upload…" : saving ? "Saving course page…" : "Save course page"}
        </button>
      </div>
    </form>
  );
}