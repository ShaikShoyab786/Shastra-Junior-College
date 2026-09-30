import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Plus, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetAdminCoursesMenuQueryKey,
  getGetCmsPageQueryKey,
  getGetCoursesMenuQueryKey,
  useGetAdminCmsPage,
  useGetAdminCoursesMenu,
  useRequestUploadUrl,
  useUpdateAdminCoursesMenu,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentSection, CoursesMenuCard } from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string };
type ContentDraft = { title: string; subtitle: string; content: Record<string, unknown>; isVisible: boolean };

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";

function errorMessage(error: unknown) {
  const candidate = error as { message?: string; response?: { data?: { error?: string } } };
  return candidate?.response?.data?.error || candidate?.message || "The Courses page could not be saved. Please try again.";
}

function value(content: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) if (typeof content[key] === "string") return content[key] as string;
  return fallback;
}

function newId() {
  return `course-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function Field({ label, value: fieldValue, onChange, multiline = false, testId, hint }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; testId: string; hint?: string }) {
  return <label className="block text-sm font-bold text-slate-700">{label}{multiline ? <textarea value={fieldValue} onChange={(event) => onChange(event.currentTarget.value)} rows={4} className={`${inputClass} resize-y`} data-testid={testId} /> : <input value={fieldValue} onChange={(event) => onChange(event.currentTarget.value)} className={inputClass} data-testid={testId} />}{hint ? <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span> : null}</label>;
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

export default function AdminCoursesPageEditor({ onFlash }: { onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const page = useGetAdminCmsPage("courses", { query: { queryKey: getGetAdminCmsPageQueryKey("courses") } });
  const menu = useGetAdminCoursesMenu({ query: { queryKey: getGetAdminCoursesMenuQueryKey() } });
  const updateSection = useUpdateContentSection();
  const updateMenu = useUpdateAdminCoursesMenu();
  const requestUpload = useRequestUploadUrl();
  const [sections, setSections] = useState<Record<string, { source: ContentSection; draft: ContentDraft }>>({});
  const [cards, setCards] = useState<CoursesMenuCard[]>([]);
  const [error, setError] = useState("");
  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const uploadRef = useRef(requestUpload.mutateAsync);
  uploadRef.current = requestUpload.mutateAsync;

  useEffect(() => {
    if (!page.data) return;
    const next: Record<string, { source: ContentSection; draft: ContentDraft }> = {};
    page.data.sections.filter((section) => ["hero", "regular-pathways", "pathways"].includes(section.sectionKey.toLowerCase())).forEach((section) => {
      next[section.sectionKey.toLowerCase()] = { source: section, draft: { title: section.title, subtitle: section.subtitle || "", content: { ...section.content }, isVisible: section.isVisible } };
    });
    setSections(next);
  }, [page.data]);
  useEffect(() => { if (menu.data) setCards(menu.data.courseCards.slice().sort((a, b) => a.order - b.order)); }, [menu.data]);

  const upload = async (file: File) => {
    setUploadsInProgress((count) => count + 1);
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPEG, or WebP image.");
      if (file.size > 2 * 1024 * 1024) throw new Error("Images must be 2 MB or smaller.");
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
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try {
      for (const card of cards) {
        if (card.isVisible && (!card.title.trim() || !card.category.trim() || !card.description.trim())) throw new Error(`Complete the title, category, and description for “${card.title || card.id}”.`);
        if (card.imageUrl?.trim() && !card.imageAlt.trim()) throw new Error(`Add useful alt text for the image on “${card.title || card.id}”.`);
      }
      for (const item of Object.values(sections)) {
        const heroImage = value(item.draft.content, ["imageUrl", "heroImageUrl"]);
        if (heroImage && !value(item.draft.content, ["imageAlt", "alt"]).trim()) throw new Error("Add useful alt text for the hero image.");
        await updateSection.mutateAsync({ id: item.source.id, data: { title: item.draft.title, subtitle: item.draft.subtitle || null, content: item.draft.content, isVisible: item.draft.isVisible } });
      }
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
  return <form onSubmit={save} className="space-y-6" data-testid="form-admin-explore-courses">
     {hero ? <Panel eyebrow="Explore Courses / Hero" title="Set the welcome." testId="panel-admin-explore-hero"><div className="grid gap-4 md:grid-cols-2"><Field label="Headline" value={hero.draft.title} onChange={(next) => patchSection("hero", { title: next })} testId="input-explore-hero-headline" /><Field label="Eyebrow" value={value(hero.draft.content, ["eyebrow"])} onChange={(next) => updateContent("hero", "eyebrow", next)} testId="input-explore-hero-eyebrow" /><div className="md:col-span-2"><Field label="Supporting description" value={hero.draft.subtitle} onChange={(next) => { patchSection("hero", { subtitle: next }); updateContent("hero", "description", next); }} multiline testId="textarea-explore-hero-description" /></div><Field label="Primary button label" value={value(hero.draft.content, ["ctaLabel", "primaryLabel"], "Explore courses")} onChange={(next) => updateContent("hero", "ctaLabel", next)} testId="input-explore-hero-cta" /><Toggle label="Show Hero publicly" checked={hero.draft.isVisible} onChange={(next) => patchSection("hero", { isVisible: next })} testId="checkbox-explore-hero-visible" /></div><div className="mt-5"><ImageField section="explore" draft={hero.draft} onChange={(key, next) => updateContent("hero", key, next)} upload={upload} /></div></Panel> : <Panel eyebrow="Explore Courses / Hero" title="Hero section is not available." testId="panel-admin-explore-hero-missing"><p className="text-sm text-slate-500">Create the Courses Hero section through the existing CMS setup before editing it here.</p></Panel>}
     {pathway ? <Panel eyebrow="Explore Courses / Regular Pathways" title="Explain the options." testId="panel-admin-explore-pathways"><div className="grid gap-4 md:grid-cols-2"><Field label="Section eyebrow" value={value(pathway.draft.content, ["eyebrow"], "REGULAR PATHWAYS")} onChange={(next) => updateContent(pathwayKey, "eyebrow", next)} testId="input-explore-pathways-eyebrow" /><Field label="Section title" value={pathway.draft.title} onChange={(next) => patchSection(pathwayKey, { title: next })} testId="input-explore-pathways-title" /><div className="md:col-span-2"><Field label="Intro description" value={pathway.draft.subtitle} onChange={(next) => patchSection(pathwayKey, { subtitle: next })} multiline testId="textarea-explore-pathways-description" /></div><Toggle label="Show Regular Pathways publicly" checked={pathway.draft.isVisible} onChange={(next) => patchSection(pathwayKey, { isVisible: next })} testId="checkbox-explore-pathways-visible" /></div></Panel> : <Panel eyebrow="Explore Courses / Regular Pathways" title="Regular Pathways section is not available." testId="panel-admin-explore-pathways-missing"><p className="text-sm text-slate-500">Create the Regular Pathways section through the existing CMS setup before editing it here.</p></Panel>}
     <Panel eyebrow="Shared Courses menu records" title="Manage the visible pathways." testId="panel-admin-explore-course-records"><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm leading-6 text-slate-500">These records power both the Courses mega menu and the public Courses page. Changes made here are shared; there is no second course list.</p><button type="button" onClick={() => setCards((current) => [...current, { id: newId(), order: current.length, title: "", category: "", description: "", destination: "", isVisible: false, icon: null, tint: null, imageUrl: null, imageAlt: "" }])} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 px-3.5 py-2.5 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/[.05]" data-testid="button-add-explore-course"><Plus className="h-4 w-4" /> Add pathway</button></div><div className="mt-5 space-y-3">{cards.length ? cards.map((card, index) => <CourseRow key={card.id} card={card} index={index} count={cards.length} onChange={(next) => setCards((current) => current.map((item) => item.id === next.id ? next : item))} onMove={(direction) => moveCard(index, direction)} onDelete={() => { if (window.confirm(`Remove “${card.title || "this pathway"}” from the shared course records?`)) setCards((current) => current.filter((item) => item.id !== card.id).map((item, order) => ({ ...item, order }))); }} upload={upload} />) : <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">No shared course records yet. Add the first confirmed pathway.</div>}</div></Panel>
    {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert" data-testid="error-admin-explore-courses-save">{error}</p> : null}
     <div className="sticky bottom-4 flex justify-end"><button type="submit" disabled={updateSection.isPending || updateMenu.isPending || requestUpload.isPending || uploadsInProgress > 0} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_25px_rgba(11,52,114,.2)] disabled:opacity-50" data-testid="button-save-admin-explore-courses"><Save className="h-4 w-4" />{updateSection.isPending || updateMenu.isPending ? "Saving Courses page…" : uploadsInProgress > 0 ? "Uploading image…" : "Save Courses page"}</button></div>
  </form>;
}