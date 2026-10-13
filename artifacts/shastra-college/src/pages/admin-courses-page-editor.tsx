import { useEffect, useRef, useState, type FormEvent, type HTMLInputTypeAttribute, type ReactNode, type Ref } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Plus, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetAdminCoursesMenuQueryKey,
  getGetCmsPageQueryKey,
  getGetCoursesMenuQueryKey,
  useCreateContentItem,
  useDeleteContentItem,
  useGetAdminCmsPage,
  useGetAdminCoursesMenu,
  useRequestUploadUrl,
  useUpdateContentItem,
  useUpdateAdminCoursesMenu,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentItem, ContentItemInput, ContentSection, CoursesMenuCard } from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string };
type ContentDraft = { title: string; subtitle: string; content: Record<string, unknown>; isVisible: boolean };
type CmsItemDraft = {
  clientKey: string;
  id?: string;
  itemType: string;
  title: string;
  description: string;
  content: Record<string, unknown>;
  isVisible: boolean;
};
type BenefitDraft = { id: string; title: string; description: string; isVisible: boolean };

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";

function errorMessage(error: unknown) {
  const candidate = error as { message?: string; response?: { data?: { error?: string } } };
  return candidate?.response?.data?.error || candidate?.message || "The Courses page could not be saved. Please try again.";
}

function value(content: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) if (typeof content[key] === "string") return content[key] as string;
  return fallback;
}

function stringValue(content: Record<string, unknown>, key: string, fallback = "") {
  const candidate = content[key];
  return typeof candidate === "string" ? candidate : fallback;
}

function recordValue(candidate: unknown): Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate)
    ? candidate as Record<string, unknown>
    : {};
}

function draftFromItem(item: ContentItem): CmsItemDraft {
  return {
    clientKey: item.id,
    id: item.id,
    itemType: item.itemType,
    title: item.title,
    description: item.description || "",
    content: { ...item.content },
    isVisible: item.isVisible,
  };
}

function benefitDrafts(content: Record<string, unknown>): BenefitDraft[] {
  if (!Array.isArray(content.benefits)) return [];
  return content.benefits.map((candidate, index) => {
    const benefit = recordValue(candidate);
    return {
      id: typeof benefit.id === "string" ? benefit.id : `benefit-${index}`,
      title: typeof benefit.title === "string" ? benefit.title : "",
      description: typeof benefit.description === "string" ? benefit.description : "",
      isVisible: typeof benefit.isVisible === "boolean" ? benefit.isVisible : true,
    };
  });
}

function newId() {
  return `course-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function Field({ label, value: fieldValue, onChange, multiline = false, testId, hint, type = "text", inputRef }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; testId: string; hint?: string; type?: HTMLInputTypeAttribute; inputRef?: Ref<HTMLInputElement> }) {
  return <label className="block text-sm font-bold text-slate-700">{label}{multiline ? <textarea value={fieldValue} onChange={(event) => onChange(event.currentTarget.value)} rows={4} className={`${inputClass} resize-y`} data-testid={testId} /> : <input ref={inputRef} type={type} value={fieldValue} onChange={(event) => onChange(event.currentTarget.value)} className={inputClass} data-testid={testId} />}{hint ? <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span> : null}</label>;
}

function Toggle({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: (value: boolean) => void; testId: string }) {
  return <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} className="h-4 w-4 accent-[#0b3472]" data-testid={testId} />{label}</label>;
}

function Panel({ eyebrow, title, children, testId }: { eyebrow: string; title: string; children: ReactNode; testId: string }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7" data-testid={testId}><p className="eyebrow text-[#e3212b]">{eyebrow}</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">{title}</h2><div className="mt-6">{children}</div></section>;
}

function ImageField({ section, draft, onChange, upload }: { section: string; draft: ContentDraft; onChange: (key: string, value: unknown) => void; upload: (file: File) => Promise<string> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const imageUrl = value(draft.content, ["imageUrl", "heroImageUrl"]);
  const imageAlt = value(draft.content, ["imageAlt", "alt"]);
  const updateImage = async (file: File) => {
    setBusy(true); setError("");
    try { onChange("imageUrl", await upload(file)); } catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  };
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-[#f8fafc] p-4">
    <div className="flex gap-4">
      <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8eef8]">{imageUrl ? <img src={imageUrl.startsWith("/objects/") ? `/api/storage${imageUrl}` : imageUrl} alt={imageAlt} className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-[#0b3472]/30" />}</div>
      <label className="inline-flex h-fit cursor-pointer items-center gap-2 rounded-lg border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472]"><Upload className="h-3.5 w-3.5" />{busy ? "Uploading…" : "Upload hero image"}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void updateImage(file); }} data-testid={`input-${section}-hero-image-file`} /></label>
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Hero image URL" value={imageUrl} onChange={(next) => onChange("imageUrl", next)} testId={`input-${section}-image-url`} /><Field label="Image alt text" value={imageAlt} onChange={(next) => onChange("imageAlt", next)} testId={`input-${section}-image-alt`} hint="Describe the image for families using assistive technology." /></div>
    {error ? <p className="mt-3 text-xs font-semibold text-red-700" role="alert">{error}</p> : null}
  </div>;
}

function CourseRow({ card, index, count, onChange, onMove, onDelete, upload }: { card: CoursesMenuCard; index: number; count: number; onChange: (card: CoursesMenuCard) => void; onMove: (direction: -1 | 1) => void; onDelete: () => void; upload: (file: File) => Promise<string> }) {
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const imagePreview = card.imageUrl?.startsWith("/objects/") ? `/api/storage${card.imageUrl}` : card.imageUrl || "";
  const uploadImage = async (file: File) => {
    setUploadBusy(true); setUploadError("");
    try {
      const imageUrl = await upload(file);
      onChange({ ...card, imageUrl });
    } catch (failure) {
      setUploadError(errorMessage(failure));
    } finally {
      setUploadBusy(false);
    }
  };
  return <article className={`rounded-2xl border p-4 ${card.isVisible ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`} data-testid={`row-admin-explore-course-${card.id}`}>
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1"><p className="truncate font-bold text-[#0b3472]">{card.title || "Untitled pathway"}</p><p className="mt-1 text-xs text-slate-500">{card.category || "Category not set"} · {card.isVisible ? "Published" : "Hidden"} · order {index + 1}</p></div>
      <button type="button" onClick={() => onChange({ ...card, isVisible: !card.isVisible })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`${card.isVisible ? "Hide" : "Publish"} ${card.title || "pathway"}`} data-testid={`button-toggle-explore-course-${card.id}`}>{card.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move pathway up"><ArrowUp className="h-4 w-4" /></button>
      <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move pathway down"><ArrowDown className="h-4 w-4" /></button>
      <button type="button" onClick={onDelete} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label={`Remove ${card.title || "pathway"}`} data-testid={`button-remove-explore-course-${card.id}`}><Trash2 className="h-4 w-4" /></button>
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Full course title" value={card.title} onChange={(next) => onChange({ ...card, title: next })} testId={`input-explore-course-title-${card.id}`} />
      <Field label="Category" value={card.category} onChange={(next) => onChange({ ...card, category: next })} testId={`input-explore-course-category-${card.id}`} />
      <div className="md:col-span-2"><Field label="Description" value={card.description} onChange={(next) => onChange({ ...card, description: next })} multiline testId={`textarea-explore-course-description-${card.id}`} /></div>
      <Field label="Configured destination" value={card.destination} onChange={(next) => onChange({ ...card, destination: next })} testId={`input-explore-course-destination-${card.id}`} hint="Use an existing page path (for example, /contact) or an HTTP(S) URL. Blank values, unknown paths, and /courses self-links show no card action." />
      <Field label="Icon label (optional)" value={card.icon || ""} onChange={(next) => onChange({ ...card, icon: next || null })} testId={`input-explore-course-icon-${card.id}`} />
      <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8fafc] p-3 md:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8eef8]">{imagePreview ? <img src={imagePreview} alt={card.imageAlt} className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-[#0b3472]/30" />}</div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472]"><Upload className="h-3.5 w-3.5" />{uploadBusy ? "Uploading…" : "Upload course image"}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploadBusy} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} data-testid={`input-explore-course-image-file-${card.id}`} /></label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Course image URL" value={card.imageUrl || ""} onChange={(next) => onChange({ ...card, imageUrl: next || null })} testId={`input-explore-course-image-url-${card.id}`} />
          <Field label="Course image alt text" value={card.imageAlt} onChange={(next) => onChange({ ...card, imageAlt: next })} testId={`input-explore-course-image-alt-${card.id}`} hint="Required when a course image is set." />
        </div>
        {uploadError ? <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{uploadError}</p> : null}
      </div>
    </div>
  </article>;
}

function EntryActions({ title, isVisible, index, count, onToggle, onMove, onDelete }: {
  title: string;
  isVisible: boolean;
  index: number;
  count: number;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  return <div className="flex shrink-0 items-center gap-1">
    <button type="button" onClick={onToggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`${isVisible ? "Hide" : "Publish"} ${title}`}><span className="text-xs font-bold">{isVisible ? "Hide" : "Show"}</span></button>
    <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${title} up`}><ArrowUp className="h-4 w-4" /></button>
    <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${title} down`}><ArrowDown className="h-4 w-4" /></button>
    <button type="button" onClick={onDelete} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label={`Remove ${title}`}><Trash2 className="h-4 w-4" /></button>
  </div>;
}

function BatchDraftRow({ entry, index, count, onChange, onMove, onDelete }: {
  entry: CmsItemDraft;
  index: number;
  count: number;
  onChange: (entry: CmsItemDraft) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const content = recordValue(entry.content);
  const updateContent = (key: string, next: string) => onChange({ ...entry, content: { ...content, [key]: next } });
  return <article className={`rounded-2xl border p-4 ${entry.isVisible ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`} data-testid={`row-admin-course-batch-${entry.clientKey}`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0 flex-1"><p className="truncate font-bold text-[#0b3472]">{entry.title || "New batch"}</p><p className="mt-1 text-xs text-slate-500">{entry.isVisible ? "Published" : "Hidden"} · order {index + 1}</p></div>
      <EntryActions title={entry.title || "batch"} isVisible={entry.isVisible} index={index} count={count} onToggle={() => onChange({ ...entry, isVisible: !entry.isVisible })} onMove={onMove} onDelete={onDelete} />
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Batch title" value={entry.title} onChange={(next) => onChange({ ...entry, title: next })} testId={`input-course-batch-title-${entry.clientKey}`} />
      <Field label="Status" value={stringValue(content, "status")} onChange={(next) => updateContent("status", next)} testId={`input-course-batch-status-${entry.clientKey}`} />
      <Field label="Start date" value={stringValue(content, "startDate")} onChange={(next) => updateContent("startDate", next)} type="date" testId={`input-course-batch-start-date-${entry.clientKey}`} />
      <Field label="Target exam" value={stringValue(content, "targetExam")} onChange={(next) => updateContent("targetExam", next)} testId={`input-course-batch-target-exam-${entry.clientKey}`} />
      <div className="md:col-span-2"><Field label="Description" value={entry.description} onChange={(next) => onChange({ ...entry, description: next })} multiline testId={`textarea-course-batch-description-${entry.clientKey}`} /></div>
    </div>
  </article>;
}

function ScheduleDraftRow({ entry, index, count, onChange, onMove, onDelete }: {
  entry: CmsItemDraft;
  index: number;
  count: number;
  onChange: (entry: CmsItemDraft) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const content = recordValue(entry.content);
  const updateContent = (key: string, next: string) => onChange({ ...entry, content: { ...content, [key]: next } });
  return <article className={`rounded-2xl border p-4 ${entry.isVisible ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`} data-testid={`row-admin-course-schedule-${entry.clientKey}`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0 flex-1"><p className="truncate font-bold text-[#0b3472]">{entry.title || "New schedule entry"}</p><p className="mt-1 text-xs text-slate-500">{entry.isVisible ? "Published" : "Hidden"} · order {index + 1}</p></div>
      <EntryActions title={entry.title || "schedule entry"} isVisible={entry.isVisible} index={index} count={count} onToggle={() => onChange({ ...entry, isVisible: !entry.isVisible })} onMove={onMove} onDelete={onDelete} />
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <Field label="Activity or subject" value={entry.title} onChange={(next) => onChange({ ...entry, title: next })} testId={`input-course-schedule-title-${entry.clientKey}`} />
      <Field label="Start time" value={stringValue(content, "startTime")} onChange={(next) => updateContent("startTime", next)} testId={`input-course-schedule-start-${entry.clientKey}`} hint="For example, 8:00 AM" />
      <Field label="End time" value={stringValue(content, "endTime")} onChange={(next) => updateContent("endTime", next)} testId={`input-course-schedule-end-${entry.clientKey}`} hint="For example, 10:00 AM" />
    </div>
  </article>;
}

export default function AdminCoursesPageEditor({ onFlash }: { onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const page = useGetAdminCmsPage("courses", { query: { queryKey: getGetAdminCmsPageQueryKey("courses") } });
  const menu = useGetAdminCoursesMenu({ query: { queryKey: getGetAdminCoursesMenuQueryKey() } });
  const createItem = useCreateContentItem();
  const updateItem = useUpdateContentItem();
  const deleteItem = useDeleteContentItem();
  const updateSection = useUpdateContentSection();
  const updateMenu = useUpdateAdminCoursesMenu();
  const requestUpload = useRequestUploadUrl();
  const [sections, setSections] = useState<Record<string, { source: ContentSection; draft: ContentDraft }>>({});
  const [courseItems, setCourseItems] = useState<{ batches: CmsItemDraft[]; schedule: CmsItemDraft[] }>({ batches: [], schedule: [] });
  const [cards, setCards] = useState<CoursesMenuCard[]>([]);
  const [pathwayDraft, setPathwayDraft] = useState<CoursesMenuCard | null>(null);
  const [pathwaySaving, setPathwaySaving] = useState(false);
  const [savedPathwayId, setSavedPathwayId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const pathwayTitleRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef(requestUpload.mutateAsync);
  uploadRef.current = requestUpload.mutateAsync;

  useEffect(() => {
    if (!page.data) return;
    const next: Record<string, { source: ContentSection; draft: ContentDraft }> = {};
    page.data.sections.filter((section) => ["hero", "regular-pathways", "pathways", "batch-details-schedule", "admissions-cta"].includes(section.sectionKey.toLowerCase())).forEach((section) => {
      next[section.sectionKey.toLowerCase()] = { source: section, draft: { title: section.title, subtitle: section.subtitle || "", content: { ...section.content }, isVisible: section.isVisible } };
    });
    const batchSection = page.data.sections.find((section) => section.sectionKey.toLowerCase() === "batch-details-schedule");
    const items = batchSection
      ? page.data.items.filter((item) => item.sectionId === batchSection.id)
      : [];
    setSections(next);
    setCourseItems({
      batches: items.filter((item) => item.itemType === "course-batch").sort((a, b) => a.position - b.position).map(draftFromItem),
      schedule: items.filter((item) => item.itemType === "course-schedule").sort((a, b) => a.position - b.position).map(draftFromItem),
    });
  }, [page.data]);
  useEffect(() => { if (menu.data) setCards(menu.data.courseCards.slice().sort((a, b) => a.order - b.order)); }, [menu.data]);
  useEffect(() => { if (pathwayDraft) requestAnimationFrame(() => pathwayTitleRef.current?.focus()); }, [pathwayDraft]);
  useEffect(() => {
    if (!savedPathwayId) return;
    document.querySelector(`[data-testid="row-admin-explore-course-${savedPathwayId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setSavedPathwayId(null);
  }, [savedPathwayId, cards]);

  const upload = async (file: File) => {
    setUploadsInProgress((count) => count + 1);
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPEG, or WebP image.");
      if (file.size > 10 * 1024 * 1024) throw new Error("Images must be 10 MB or smaller.");
      const info = await uploadRef.current({ data: { name: file.name, size: file.size, contentType: file.type } });
      const response = await fetch(info.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("The image upload could not be completed.");
      return info.objectPath;
    } finally {
      setUploadsInProgress((count) => Math.max(0, count - 1));
    }
  };
  const patchSection = (key: string, patch: Partial<ContentDraft>) => setSections((current) => current[key] ? { ...current, [key]: { ...current[key], draft: { ...current[key].draft, ...patch } } } : current);
  const updateContent = (key: string, contentKey: string, contentValue: unknown) => {
    setSections((current) => current[key] ? { ...current, [key]: { ...current[key], draft: { ...current[key].draft, content: { ...current[key].draft.content, [contentKey]: contentValue } } } } : current);
  };
  const moveCard = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= cards.length) return;
    const next = cards.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setCards(next.map((card, order) => ({ ...card, order })));
  };
  const openPathwayDraft = () => setPathwayDraft({
    id: newId(),
    order: cards.length,
    title: "",
    category: "",
    description: "",
    destination: "",
    isVisible: false,
    icon: null,
    tint: null,
    imageUrl: null,
    imageAlt: "",
  });
  const discardPathwayDraft = () => {
    setPathwayDraft(null);
    setError("");
  };
  const savePathwayDraft = async () => {
    if (!pathwayDraft) return;
    const title = pathwayDraft.title.trim();
    const category = pathwayDraft.category.trim();
    const description = pathwayDraft.description.trim();
    if (!title || !category || !description) {
      setError("Enter a pathway title, category, and description before saving.");
      return;
    }
    const nextCards = [...cards, { ...pathwayDraft, title, category, description }]
      .map((card, order) => ({ ...card, order }));
    const newPathwayId = pathwayDraft.id;
    setPathwaySaving(true);
    setError("");
    try {
      const updated = await updateMenu.mutateAsync({ data: { courseCards: nextCards } });
      setCards(nextCards);
      client.setQueryData(getGetAdminCoursesMenuQueryKey(), updated);
      await client.invalidateQueries({ queryKey: getGetCoursesMenuQueryKey() });
      setPathwayDraft(null);
      setSavedPathwayId(newPathwayId);
      onFlash({ tone: "success", message: pathwayDraft.isVisible ? "Pathway saved and published." : "Pathway saved as hidden. Publish it when it is ready." });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPathwaySaving(false);
    }
  };
  const updateCourseItem = (list: "batches" | "schedule", next: CmsItemDraft) => {
    setCourseItems((current) => ({
      ...current,
      [list]: current[list].map((entry) => entry.clientKey === next.clientKey ? next : entry),
    }));
  };
  const moveCourseItem = (list: "batches" | "schedule", index: number, direction: -1 | 1) => {
    setCourseItems((current) => {
      const target = index + direction;
      if (target < 0 || target >= current[list].length) return current;
      const reordered = current[list].slice();
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return { ...current, [list]: reordered };
    });
  };
  const addCourseItem = (list: "batches" | "schedule") => {
    const isBatch = list === "batches";
    const clientKey = newId();
    const draft: CmsItemDraft = {
      clientKey,
      itemType: isBatch ? "course-batch" : "course-schedule",
      title: "",
      description: "",
      content: isBatch
        ? { status: "Upcoming", startDate: "", targetExam: "" }
        : { startTime: "", endTime: "" },
      isVisible: false,
    };
    setCourseItems((current) => ({ ...current, [list]: [...current[list], draft] }));
  };
  const pathwayWarnings = cards.filter((card) =>
    !card.title.trim() || card.title.trim().toLowerCase() === "untitled pathway",
  );
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    const currentPage = page.data;
    if (!currentPage) {
      setError("The Courses page is still loading. Please try again.");
      return;
    }
    try {
      for (const card of cards) {
        if (card.isVisible && (!card.title.trim() || !card.category.trim())) throw new Error(`Complete the title and category for “${card.title || card.id}”.`);
        if (card.imageUrl?.trim() && !card.imageAlt.trim()) throw new Error(`Add useful alt text for the image on “${card.title || card.id}”.`);
      }
      const batchSection = sections["batch-details-schedule"];
      const admissionsSection = sections["admissions-cta"];
      if (!batchSection || !admissionsSection) throw new Error("The Batch Details & Schedule or Admissions section is not available.");
      const batchContent = batchSection.draft.content;
      for (const [key, label] of [["eyebrow", "Batch section eyebrow"], ["batchHeading", "Upcoming Batches heading"], ["batchDescription", "Upcoming Batches description"], ["scheduleHeading", "Daily Schedule heading"], ["scheduleDescription", "Daily Schedule description"]] as const) {
        if (!stringValue(batchContent, key).trim()) throw new Error(`${label} is required.`);
      }
      if (!batchSection.draft.title.trim() || !batchSection.draft.subtitle.trim()) throw new Error("Complete the Batch Details & Schedule heading and supporting text.");
      for (const batch of courseItems.batches) {
        const content = recordValue(batch.content);
        if (!batch.title.trim() || !batch.description.trim() || !stringValue(content, "status").trim() || !/^\d{4}-\d{2}-\d{2}$/.test(stringValue(content, "startDate")) || !stringValue(content, "targetExam").trim()) {
          throw new Error(`Complete the title, description, status, start date, and target exam for “${batch.title || "new batch"}”.`);
        }
      }
      for (const entry of courseItems.schedule) {
        const content = recordValue(entry.content);
        if (!entry.title.trim() || !stringValue(content, "startTime").trim() || !stringValue(content, "endTime").trim()) {
          throw new Error(`Complete the activity and both times for “${entry.title || "new schedule entry"}”.`);
        }
      }
      const admissionsContent = admissionsSection.draft.content;
      const benefits = benefitDrafts(admissionsContent);
      if (!stringValue(admissionsContent, "eyebrow").trim()) throw new Error("The Admissions CTA eyebrow is required.");
      if (!admissionsSection.draft.title.trim() || !admissionsSection.draft.subtitle.trim()) throw new Error("Complete the Admissions CTA heading and supporting text.");
      if (benefits.some((benefit) => !benefit.title.trim() || !benefit.description.trim())) throw new Error("Complete or remove each Admissions benefit item.");
      for (const item of Object.values(sections)) {
        const heroImage = value(item.draft.content, ["imageUrl", "heroImageUrl"]);
        if (heroImage && !value(item.draft.content, ["imageAlt", "alt"]).trim()) throw new Error("Add useful alt text for the hero image.");
        await updateSection.mutateAsync({ id: item.source.id, data: { title: item.draft.title, subtitle: item.draft.subtitle || null, content: item.draft.content, isVisible: item.draft.isVisible } });
      }
      const managedSectionId = batchSection.source.id;
      const managedType = new Set(["course-batch", "course-schedule"]);
      const savedItemIds = new Set([...courseItems.batches, ...courseItems.schedule].flatMap((entry) => entry.id ? [entry.id] : []));
      for (const item of currentPage.items) {
        if (item.sectionId === managedSectionId && managedType.has(item.itemType) && !savedItemIds.has(item.id)) {
          await deleteItem.mutateAsync({ id: item.id });
        }
      }
      const persistList = async (list: CmsItemDraft[], itemType: string) => {
        for (const [position, entry] of list.entries()) {
          const input: ContentItemInput = {
            sectionId: managedSectionId,
            itemType,
            title: entry.title.trim(),
            description: entry.description.trim() || null,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: entry.content,
            isVisible: entry.isVisible,
            position,
          };
          if (entry.id) {
            await updateItem.mutateAsync({ id: entry.id, data: input });
          } else {
            const created = await createItem.mutateAsync({ data: input });
            setCourseItems((current) => ({
              ...current,
              [itemType === "course-batch" ? "batches" : "schedule"]: current[itemType === "course-batch" ? "batches" : "schedule"].map((draft) =>
                draft.clientKey === entry.clientKey ? { ...draft, id: created.id } : draft,
              ),
            }));
          }
        }
      };
      await persistList(courseItems.batches, "course-batch");
      await persistList(courseItems.schedule, "course-schedule");
      await updateMenu.mutateAsync({ data: { courseCards: cards.map((card, order) => ({ ...card, order })) } });
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetAdminCmsPageQueryKey("courses") }),
        client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("courses") }),
        client.invalidateQueries({ queryKey: getGetAdminCoursesMenuQueryKey() }),
        client.invalidateQueries({ queryKey: getGetCoursesMenuQueryKey() }),
      ]);
      onFlash({ tone: "success", message: "Courses page saved." });
    } catch (failure) { setError(errorMessage(failure)); }
  };
  if (page.isError || menu.isError) return <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6" role="alert" data-testid="error-admin-courses-page-load"><p className="font-bold text-red-800">Courses page could not be loaded.</p><p className="mt-1 text-sm text-red-700">{errorMessage(page.error || menu.error)}</p><button type="button" onClick={() => { void page.refetch(); void menu.refetch(); }} className="mt-4 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white"><RefreshCw className="mr-2 inline h-3.5 w-3.5" /> Try again</button></section>;
  if (page.isLoading || menu.isLoading || !page.data || !menu.data || Object.keys(sections).length === 0) return <div className="mt-6 h-[620px] animate-pulse rounded-3xl bg-white" data-testid="loading-admin-courses-page" />;
  const hero = sections.hero;
  const pathway = sections["regular-pathways"] || sections.pathways;
  const pathwayKey = sections["regular-pathways"] ? "regular-pathways" : "pathways";
  const batchSection = sections["batch-details-schedule"];
  const admissionsSection = sections["admissions-cta"];
  const admissionsBenefits = admissionsSection ? benefitDrafts(admissionsSection.draft.content) : [];
  const updateBenefit = (id: string, patch: Partial<BenefitDraft>) => {
    updateContent("admissions-cta", "benefits", admissionsBenefits.map((benefit) => benefit.id === id ? { ...benefit, ...patch } : benefit));
  };
  const moveBenefit = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= admissionsBenefits.length) return;
    const next = admissionsBenefits.slice();
    [next[index], next[target]] = [next[target], next[index]];
    updateContent("admissions-cta", "benefits", next);
  };
  return <form onSubmit={save} className="space-y-6" data-testid="form-admin-explore-courses">
     {hero ? <Panel eyebrow="Explore Courses / Hero" title="Set the welcome." testId="panel-admin-explore-hero"><div className="grid gap-4 md:grid-cols-2"><Field label="Headline" value={hero.draft.title} onChange={(next) => patchSection("hero", { title: next })} testId="input-explore-hero-headline" /><Field label="Eyebrow" value={value(hero.draft.content, ["eyebrow"])} onChange={(next) => updateContent("hero", "eyebrow", next)} testId="input-explore-hero-eyebrow" /><div className="md:col-span-2"><Field label="Supporting description" value={hero.draft.subtitle} onChange={(next) => { patchSection("hero", { subtitle: next }); updateContent("hero", "description", next); }} multiline testId="textarea-explore-hero-description" /></div><Field label="Primary button label" value={value(hero.draft.content, ["ctaLabel", "primaryLabel"], "Explore courses")} onChange={(next) => updateContent("hero", "ctaLabel", next)} testId="input-explore-hero-cta" /><Toggle label="Show Hero publicly" checked={hero.draft.isVisible} onChange={(next) => patchSection("hero", { isVisible: next })} testId="checkbox-explore-hero-visible" /></div><div className="mt-5"><ImageField section="explore" draft={hero.draft} onChange={(key, next) => updateContent("hero", key, next)} upload={upload} /></div></Panel> : <Panel eyebrow="Explore Courses / Hero" title="Hero section is not available." testId="panel-admin-explore-hero-missing"><p className="text-sm text-slate-500">Create the Courses Hero section through the existing CMS setup before editing it here.</p></Panel>}
     {pathway ? <Panel eyebrow="Explore Courses / Regular Pathways" title="Explain the options." testId="panel-admin-explore-pathways"><div className="grid gap-4 md:grid-cols-2"><Field label="Section eyebrow" value={value(pathway.draft.content, ["eyebrow"], "REGULAR PATHWAYS")} onChange={(next) => updateContent(pathwayKey, "eyebrow", next)} testId="input-explore-pathways-eyebrow" /><Field label="Section title" value={pathway.draft.title} onChange={(next) => patchSection(pathwayKey, { title: next })} testId="input-explore-pathways-title" /><div className="md:col-span-2"><Field label="Intro description" value={pathway.draft.subtitle} onChange={(next) => patchSection(pathwayKey, { subtitle: next })} multiline testId="textarea-explore-pathways-description" /></div><Toggle label="Show Regular Pathways publicly" checked={pathway.draft.isVisible} onChange={(next) => patchSection(pathwayKey, { isVisible: next })} testId="checkbox-explore-pathways-visible" /></div></Panel> : <Panel eyebrow="Explore Courses / Regular Pathways" title="Regular Pathways section is not available." testId="panel-admin-explore-pathways-missing"><p className="text-sm text-slate-500">Create the Regular Pathways section through the existing CMS setup before editing it here.</p></Panel>}
      {batchSection ? <Panel eyebrow="Explore Courses / Batch Details & Schedule" title="Set the batch information." testId="panel-admin-course-batch-schedule"><div className="grid gap-4 md:grid-cols-2"><Field label="Section eyebrow" value={stringValue(batchSection.draft.content, "eyebrow")} onChange={(next) => updateContent("batch-details-schedule", "eyebrow", next)} testId="input-course-batches-eyebrow" /><Field label="Section heading" value={batchSection.draft.title} onChange={(next) => patchSection("batch-details-schedule", { title: next })} testId="input-course-batches-title" /><div className="md:col-span-2"><Field label="Supporting text" value={batchSection.draft.subtitle} onChange={(next) => patchSection("batch-details-schedule", { subtitle: next })} multiline testId="textarea-course-batches-description" /></div><Field label="Upcoming Batches heading" value={stringValue(batchSection.draft.content, "batchHeading")} onChange={(next) => updateContent("batch-details-schedule", "batchHeading", next)} testId="input-course-batch-list-heading" /><Field label="Upcoming Batches description" value={stringValue(batchSection.draft.content, "batchDescription")} onChange={(next) => updateContent("batch-details-schedule", "batchDescription", next)} testId="input-course-batch-list-description" /><Field label="Daily Schedule heading" value={stringValue(batchSection.draft.content, "scheduleHeading")} onChange={(next) => updateContent("batch-details-schedule", "scheduleHeading", next)} testId="input-course-schedule-heading" /><Field label="Daily Schedule description" value={stringValue(batchSection.draft.content, "scheduleDescription")} onChange={(next) => updateContent("batch-details-schedule", "scheduleDescription", next)} testId="input-course-schedule-description" /><Toggle label="Show Batch Details & Schedule publicly" checked={batchSection.draft.isVisible} onChange={(next) => patchSection("batch-details-schedule", { isVisible: next })} testId="checkbox-course-batches-visible" /></div>
        <div className="mt-7 grid gap-6 xl:grid-cols-2">
          <div><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-lg font-extrabold text-[#0b3472]">Upcoming batches</h3><p className="mt-1 text-xs text-slate-500">Add preparation batches with a start date and target examination.</p></div><button type="button" onClick={() => addCourseItem("batches")} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/[.05]" data-testid="button-add-course-batch"><Plus className="h-4 w-4" /> Add batch</button></div><div className="mt-4 space-y-3">{courseItems.batches.length ? courseItems.batches.map((entry, index) => <BatchDraftRow key={entry.clientKey} entry={entry} index={index} count={courseItems.batches.length} onChange={(next) => updateCourseItem("batches", next)} onMove={(direction) => moveCourseItem("batches", index, direction)} onDelete={() => setCourseItems((current) => ({ ...current, batches: current.batches.filter((item) => item.clientKey !== entry.clientKey) }))} />) : <p className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">No batch entries. Add a batch to display its details publicly.</p>}</div></div>
          <div><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-lg font-extrabold text-[#0b3472]">Daily schedule</h3><p className="mt-1 text-xs text-slate-500">Set the activity and its start and end times.</p></div><button type="button" onClick={() => addCourseItem("schedule")} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/[.05]" data-testid="button-add-course-schedule"><Plus className="h-4 w-4" /> Add schedule entry</button></div><div className="mt-4 space-y-3">{courseItems.schedule.length ? courseItems.schedule.map((entry, index) => <ScheduleDraftRow key={entry.clientKey} entry={entry} index={index} count={courseItems.schedule.length} onChange={(next) => updateCourseItem("schedule", next)} onMove={(direction) => moveCourseItem("schedule", index, direction)} onDelete={() => setCourseItems((current) => ({ ...current, schedule: current.schedule.filter((item) => item.clientKey !== entry.clientKey) }))} />) : <p className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">No schedule entries. Add the daily schedule when it is ready to publish.</p>}</div></div>
        </div>
      </Panel> : <Panel eyebrow="Explore Courses / Batch Details & Schedule" title="Section is not available." testId="panel-admin-course-batch-schedule-missing"><p className="text-sm text-slate-500">The new section will appear here after Courses content is initialized.</p></Panel>}
      {admissionsSection ? <Panel eyebrow="Explore Courses / Admissions CTA" title="Guide families to admissions." testId="panel-admin-course-admissions"><div className="grid gap-4 md:grid-cols-2"><Field label="Section eyebrow" value={stringValue(admissionsSection.draft.content, "eyebrow")} onChange={(next) => updateContent("admissions-cta", "eyebrow", next)} testId="input-course-admissions-eyebrow" /><Field label="Section heading" value={admissionsSection.draft.title} onChange={(next) => patchSection("admissions-cta", { title: next })} testId="input-course-admissions-title" /><div className="md:col-span-2"><Field label="Supporting text" value={admissionsSection.draft.subtitle} onChange={(next) => patchSection("admissions-cta", { subtitle: next })} multiline testId="textarea-course-admissions-description" /></div><p className="self-end pb-2 text-sm text-slate-500">Button text: <strong>Talk with Admissions</strong>. Destination: the existing Contact page (/contact).</p><Toggle label="Show Admissions CTA publicly" checked={admissionsSection.draft.isVisible} onChange={(next) => patchSection("admissions-cta", { isVisible: next })} testId="checkbox-course-admissions-visible" /></div>
        <div className="mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-lg font-extrabold text-[#0b3472]">Benefit items</h3><p className="mt-1 text-xs text-slate-500">Keep each item concise and useful to prospective families.</p></div><button type="button" onClick={() => updateContent("admissions-cta", "benefits", [...admissionsBenefits, { id: newId(), title: "", description: "", isVisible: true }])} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/[.05]" data-testid="button-add-course-admissions-benefit"><Plus className="h-4 w-4" /> Add benefit</button></div>
          <div className="mt-4 space-y-3">{admissionsBenefits.map((benefit, index) => <article key={benefit.id} className={`rounded-2xl border p-4 ${benefit.isVisible ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`} data-testid={`row-course-admissions-benefit-${benefit.id}`}><div className="flex items-center justify-between gap-2"><p className="font-bold text-[#0b3472]">{benefit.title || "New benefit"}</p><div className="flex items-center gap-1"><button type="button" onClick={() => updateBenefit(benefit.id, { isVisible: !benefit.isVisible })} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100">{benefit.isVisible ? "Hide" : "Show"}</button><button type="button" disabled={index === 0} onClick={() => moveBenefit(index, -1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move benefit up"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={index === admissionsBenefits.length - 1} onClick={() => moveBenefit(index, 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move benefit down"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => updateContent("admissions-cta", "benefits", admissionsBenefits.filter((item) => item.id !== benefit.id))} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label={`Remove ${benefit.title || "benefit"}`}><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-3 grid gap-4 md:grid-cols-2"><Field label="Benefit title" value={benefit.title} onChange={(next) => updateBenefit(benefit.id, { title: next })} testId={`input-course-benefit-title-${benefit.id}`} /><Field label="Benefit description" value={benefit.description} onChange={(next) => updateBenefit(benefit.id, { description: next })} testId={`input-course-benefit-description-${benefit.id}`} /></div></article>)}</div>
        </div>
      </Panel> : <Panel eyebrow="Explore Courses / Admissions CTA" title="Section is not available." testId="panel-admin-course-admissions-missing"><p className="text-sm text-slate-500">The new section will appear here after Courses content is initialized.</p></Panel>}
      <Panel eyebrow="Future Courses sections" title="Coming Soon" testId="panel-admin-courses-coming-soon"><p className="text-sm leading-6 text-slate-500">Additional Courses page sections will be added here when their content and editing controls are ready. This note is visible only in Admin.</p></Panel>
       <Panel eyebrow="Shared Courses menu records" title="Manage the four courses." testId="panel-admin-explore-course-records"><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm leading-6 text-slate-500">These records power both the Courses mega menu and the public Courses page. Changes made here are shared; there is no second course list.</p><button type="button" onClick={openPathwayDraft} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 px-3.5 py-2.5 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/[.05]" data-testid="button-add-explore-course"><Plus className="h-4 w-4" /> Add course</button></div>
        {pathwayWarnings.length ? <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status" data-testid="warning-course-pathway-review"><strong>Review saved pathway records.</strong> {pathwayWarnings.length} pathway record{pathwayWarnings.length === 1 ? " is" : "s are"} blank or named “Untitled pathway”. They have been preserved; edit or remove them manually after review.</div> : null}
        <div className="mt-5 space-y-3">{cards.length ? cards.map((card, index) => <CourseRow key={card.id} card={card} index={index} count={cards.length} onChange={(next) => setCards((current) => current.map((item) => item.id === next.id ? next : item))} onMove={(direction) => moveCard(index, direction)} onDelete={() => { if (window.confirm(`Remove “${card.title || "this pathway"}” from the shared course records?`)) setCards((current) => current.filter((item) => item.id !== card.id).map((item, order) => ({ ...item, order }))); }} upload={upload} />) : <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">No shared course records yet. Add the first confirmed pathway.</div>}</div>
      </Panel>
      {pathwayDraft ? <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4" data-testid="dialog-add-explore-course-backdrop"><section className="my-auto w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="dialog-add-explore-course-title" data-testid="dialog-add-explore-course"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[#e3212b]">Explore Courses</p><h2 id="dialog-add-explore-course-title" className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Add a pathway</h2><p className="mt-2 text-sm leading-6 text-slate-500">This pathway is only a draft until you save it. New pathways start hidden for staff review.</p></div><button type="button" onClick={discardPathwayDraft} disabled={pathwaySaving} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50" aria-label="Close new pathway editor">Close</button></div><div className="mt-6 grid gap-4 md:grid-cols-2"><Field label="Full course title" value={pathwayDraft.title} onChange={(next) => setPathwayDraft((current) => current ? { ...current, title: next } : current)} inputRef={pathwayTitleRef} testId="input-new-explore-course-title" /><Field label="Category" value={pathwayDraft.category} onChange={(next) => setPathwayDraft((current) => current ? { ...current, category: next } : current)} testId="input-new-explore-course-category" /><div className="md:col-span-2"><Field label="Description" value={pathwayDraft.description} onChange={(next) => setPathwayDraft((current) => current ? { ...current, description: next } : current)} multiline testId="textarea-new-explore-course-description" /></div><Field label="Destination (optional)" value={pathwayDraft.destination} onChange={(next) => setPathwayDraft((current) => current ? { ...current, destination: next } : current)} testId="input-new-explore-course-destination" hint="Use an existing page path or an HTTP(S) URL." /><Field label="Icon label (optional)" value={pathwayDraft.icon || ""} onChange={(next) => setPathwayDraft((current) => current ? { ...current, icon: next || null } : current)} testId="input-new-explore-course-icon" /><Toggle label="Publish pathway after saving" checked={pathwayDraft.isVisible} onChange={(next) => setPathwayDraft((current) => current ? { ...current, isVisible: next } : current)} testId="checkbox-new-explore-course-visible" /></div><div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={discardPathwayDraft} disabled={pathwaySaving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50" data-testid="button-cancel-new-explore-course">Cancel</button><button type="button" onClick={() => void savePathwayDraft()} disabled={pathwaySaving || updateMenu.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50" data-testid="button-save-new-explore-course"><Save className="h-4 w-4" />{pathwaySaving ? "Saving pathway…" : "Save pathway"}</button></div></section></div> : null}
     {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert" data-testid="error-admin-explore-courses-save">{error}</p> : null}
      <div className="sticky bottom-4 flex justify-end"><button type="submit" disabled={updateSection.isPending || updateMenu.isPending || createItem.isPending || updateItem.isPending || deleteItem.isPending || requestUpload.isPending || uploadsInProgress > 0} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_25px_rgba(11,52,114,.2)] disabled:opacity-50" data-testid="button-save-admin-explore-courses"><Save className="h-4 w-4" />{updateSection.isPending || updateMenu.isPending || createItem.isPending || updateItem.isPending || deleteItem.isPending ? "Saving Courses page…" : uploadsInProgress > 0 ? "Uploading image…" : "Save Courses page"}</button></div>
  </form>;
}