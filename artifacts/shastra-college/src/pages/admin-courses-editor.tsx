import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  getGetAdminCoursesMenuQueryKey,
  getGetCoursesMenuQueryKey,
  useGetAdminCoursesMenu,
  useRequestUploadUrl,
  useUpdateAdminCoursesMenu,
} from "@workspace/api-client-react";
import type {
  CoursesMenuBenefit,
  CoursesMenuButton,
  CoursesMenuCard,
  CoursesMenuLink,
  CoursesMenuSettings,
} from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string };
type Draft = CoursesMenuSettings;
type ListKey = "courseCards" | "benefits" | "utilityLinks" | "ctaButtons";

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";

function errorMessage(error: unknown) {
  const candidate = error as { message?: string; response?: { data?: { error?: string } } };
  return candidate?.response?.data?.error || candidate?.message || "The Courses menu could not be saved. Please try again.";
}

function assetUrl(value: string | null) {
  if (!value) return "";
  return value.startsWith("/objects/") ? `/api/storage${value}` : value;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeSettings(value: CoursesMenuSettings): Draft {
  const order = <T extends { id: string; order: number }>(items: T[]) =>
    items
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index }));
  return {
    brandPanel: { ...value.brandPanel },
    heading: { ...value.heading },
    courseCards: order(value.courseCards),
    comingSoonCard: value.comingSoonCard ? { ...value.comingSoonCard } : null,
    benefits: order(value.benefits),
    utilityLinks: order(value.utilityLinks),
    ctaButtons: order(value.ctaButtons),
  };
}

function Field({
  label,
  value,
  onChange,
  testId,
  multiline = false,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} rows={3} placeholder={placeholder} className={`${inputClass} resize-y`} data-testid={testId} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.currentTarget.value)} placeholder={placeholder} className={inputClass} data-testid={testId} />
      )}
      {hint ? <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function Toggle({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: (checked: boolean) => void; testId: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} className="h-4 w-4 accent-[#0b3472]" data-testid={testId} />
      {label}
    </label>
  );
}

function Panel({ children, title, eyebrow, testId }: { children: ReactNode; title: string; eyebrow: string; testId: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7" data-testid={testId}>
      <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ImageField({
  label,
  value,
  alt,
  onValue,
  onAlt,
  onUpload,
  testId,
}: {
  label: string;
  value: string | null;
  alt: string;
  onValue: (value: string | null) => void;
  onAlt: (value: string) => void;
  onUpload: (file: File) => Promise<void>;
  testId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const preview = file ? URL.createObjectURL(file) : assetUrl(value);
  useEffect(() => () => { if (file && preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [file, preview]);
  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-[#f8fafc] p-4">
      <div className="flex gap-4">
        <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e9eef7]">
          {preview ? <img src={preview} alt={alt} className="h-full w-full object-cover" data-testid={`img-${testId}-preview`} /> : <ImagePlus className="h-6 w-6 text-[#0b3472]/30" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#0b3472]">{label}</p>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472]">
            <Upload className="h-3.5 w-3.5" /> {file ? file.name : "Choose image"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => setFile(event.currentTarget.files?.[0] || null)} data-testid={`input-${testId}-file`} />
          </label>
          {file ? <button type="button" onClick={() => setFile(null)} className="ml-2 rounded-lg px-2 py-2 text-xs font-bold text-slate-500 hover:bg-white" data-testid={`button-clear-${testId}-file`}><X className="inline h-3.5 w-3.5" /> Clear</button> : null}
        </div>
      </div>
      <Field label="Image URL or stored object path" value={value || ""} onChange={(next) => onValue(next || null)} testId={`input-${testId}-url`} placeholder="/objects/… or https://…" />
      <Field label="Useful alt text" value={alt} onChange={onAlt} testId={`input-${testId}-alt`} hint="Required whenever an image is present." />
      {file ? <button type="button" disabled={uploading} onClick={async () => { setUploading(true); setUploadError(""); try { await onUpload(file); setFile(null); } catch (failure) { setUploadError(failure instanceof Error ? failure.message : "The image upload could not be completed."); } finally { setUploading(false); } }} className="inline-flex items-center gap-2 rounded-lg bg-[#0b3472] px-3 py-2 text-xs font-bold text-white disabled:opacity-50" data-testid={`button-upload-${testId}`}><Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload and use image"}</button> : null}
      {uploadError ? <p className="text-xs font-semibold text-red-700" role="alert" data-testid={`error-upload-${testId}`}>{uploadError}</p> : null}
    </div>
  );
}

function RowActions({ visible, onVisible, onUp, onDown, onDelete, first, last, id, label }: { visible: boolean; onVisible: () => void; onUp: () => void; onDown: () => void; onDelete: () => void; first: boolean; last: boolean; id: string; label: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={onVisible} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`${visible ? "Hide" : "Show"} ${label}`} data-testid={`button-toggle-courses-${id}`}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      <button type="button" onClick={onUp} disabled={first} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25" aria-label={`Move ${label} up`} data-testid={`button-move-courses-up-${id}`}><ArrowUp className="h-4 w-4" /></button>
      <button type="button" onClick={onDown} disabled={last} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25" aria-label={`Move ${label} down`} data-testid={`button-move-courses-down-${id}`}><ArrowDown className="h-4 w-4" /></button>
      <button type="button" onClick={onDelete} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label={`Remove ${label}`} data-testid={`button-remove-courses-${id}`}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function CourseForm({ card, setCard, upload }: { card: CoursesMenuCard; setCard: (next: CoursesMenuCard) => void; upload: (file: File) => Promise<string> }) {
  const update = <K extends keyof CoursesMenuCard>(key: K, value: CoursesMenuCard[K]) => setCard({ ...card, [key]: value });
  return (
    <div className="mt-4 grid gap-4 rounded-2xl border border-[#0b3472]/10 bg-[#f7f9fc] p-4 md:grid-cols-2">
      <Field label="Title" value={card.title} onChange={(value) => update("title", value)} testId={`input-course-title-${card.id}`} />
      <Field label="Category" value={card.category} onChange={(value) => update("category", value)} testId={`input-course-category-${card.id}`} />
      <div className="md:col-span-2"><Field label="Description" value={card.description} onChange={(value) => update("description", value)} multiline testId={`textarea-course-description-${card.id}`} /></div>
      <Field label="Destination" value={card.destination} onChange={(value) => update("destination", value)} testId={`input-course-destination-${card.id}`} hint="Use an internal path or safe HTTPS URL." />
      <Field label="Icon label (optional)" value={card.icon || ""} onChange={(value) => update("icon", value || null)} testId={`input-course-icon-${card.id}`} />
      <ImageField label="Course image (optional)" value={card.imageUrl} alt={card.imageAlt} onValue={(value) => update("imageUrl", value)} onAlt={(value) => update("imageAlt", value)} onUpload={async (file) => update("imageUrl", await upload(file))} testId={`course-image-${card.id}`} />
      <div className="space-y-4">
        <Field label="Tint hex (optional)" value={card.tint || ""} onChange={(value) => update("tint", value || null)} testId={`input-course-tint-${card.id}`} placeholder="#DCE7F8" />
        <Toggle label="Visible in public menu" checked={card.isVisible} onChange={(value) => update("isVisible", value)} testId={`checkbox-course-visible-${card.id}`} />
      </div>
    </div>
  );
}

function BenefitForm({ item, setItem }: { item: CoursesMenuBenefit; setItem: (next: CoursesMenuBenefit) => void }) {
  return <div className="mt-4 grid gap-4 rounded-2xl border border-[#0b3472]/10 bg-[#f7f9fc] p-4 md:grid-cols-2"><Field label="Title" value={item.title} onChange={(value) => setItem({ ...item, title: value })} testId={`input-benefit-title-${item.id}`} /><Field label="Icon label (optional)" value={item.icon || ""} onChange={(value) => setItem({ ...item, icon: value || null })} testId={`input-benefit-icon-${item.id}`} /><div className="md:col-span-2"><Field label="Description" value={item.description} onChange={(value) => setItem({ ...item, description: value })} multiline testId={`textarea-benefit-description-${item.id}`} /></div><Toggle label="Visible in public menu" checked={item.isVisible} onChange={(value) => setItem({ ...item, isVisible: value })} testId={`checkbox-benefit-visible-${item.id}`} /></div>;
}

function LinkForm({ item, setItem, cta = false }: { item: CoursesMenuLink | CoursesMenuButton; setItem: (next: CoursesMenuLink | CoursesMenuButton) => void; cta?: boolean }) {
  return <div className="mt-4 grid gap-4 rounded-2xl border border-[#0b3472]/10 bg-[#f7f9fc] p-4 md:grid-cols-2"><Field label="Label" value={item.label} onChange={(value) => setItem({ ...item, label: value })} testId={`input-${cta ? "cta" : "utility"}-label-${item.id}`} /><Field label="Destination" value={item.destination} onChange={(value) => setItem({ ...item, destination: value })} testId={`input-${cta ? "cta" : "utility"}-destination-${item.id}`} /><Toggle label="Visible in public menu" checked={item.isVisible} onChange={(value) => setItem({ ...item, isVisible: value })} testId={`checkbox-${cta ? "cta" : "utility"}-visible-${item.id}`} />{cta ? <label className="block text-sm font-bold text-slate-700">Button style<select value={(item as CoursesMenuButton).variant} onChange={(event) => setItem({ ...item, variant: event.currentTarget.value as "primary" | "secondary" })} className={inputClass} data-testid={`select-cta-variant-${item.id}`}><option value="primary">Primary</option><option value="secondary">Secondary</option></select></label> : null}</div>;
}

export default function AdminCoursesEditor({ onFlash }: { onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const query = useGetAdminCoursesMenu({ query: { queryKey: getGetAdminCoursesMenuQueryKey() } });
  const update = useUpdateAdminCoursesMenu();
  const requestUpload = useRequestUploadUrl();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [openCard, setOpenCard] = useState<string | null>(null);
  const uploadMutationRef = useRef(requestUpload.mutateAsync);
  uploadMutationRef.current = requestUpload.mutateAsync;

  useEffect(() => {
    if (query.data) setDraft(normalizeSettings(query.data));
  }, [query.data]);

  const setDraftValue = (next: Draft) => {
    setDraft(normalizeSettings(next));
    setError("");
  };
  const upload = async (file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPEG, or WebP image.");
    if (file.size > 2 * 1024 * 1024) throw new Error("Images must be 2 MB or smaller.");
    const info = await uploadMutationRef.current({ data: { name: file.name, size: file.size, contentType: file.type } });
    const response = await fetch(info.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!response.ok) throw new Error("The image upload could not be completed.");
    return info.objectPath;
  };
  const updateList = <K extends ListKey>(key: K, items: Draft[K]) => setDraftValue({ ...draft!, [key]: items } as Draft);
  const reorder = (key: ListKey, index: number, direction: -1 | 1) => {
    if (!draft) return;
    const items = [...draft[key]] as Array<{ id: string; order: number }>;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    updateList(key, items.map((item, nextOrder) => ({ ...item, order: nextOrder })) as Draft[typeof key]);
  };
  const remove = (key: ListKey, index: number, label: string) => {
    if (!draft || !window.confirm(`Remove “${label || "this entry"}” from the Courses menu?`)) return;
    updateList(key, draft[key].filter((_, itemIndex) => itemIndex !== index).map((item, order) => ({ ...item, order })) as Draft[typeof key]);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setError("");
    try {
      if (draft.brandPanel.logoImageUrl && !draft.brandPanel.logoImageAlt.trim()) throw new Error("Useful alt text is required for the brand logo.");
      if (draft.brandPanel.backgroundImageUrl && !draft.brandPanel.backgroundImageAlt.trim()) throw new Error("Useful alt text is required for the brand background image.");
      for (const card of draft.courseCards) {
        if (card.imageUrl && !card.imageAlt.trim()) throw new Error(`Useful alt text is required for the image on “${card.title || card.id}”.`);
        if (card.isVisible && (!card.title.trim() || !card.category.trim() || !card.description.trim() || !card.destination.trim())) throw new Error(`Complete the title, category, description, and destination for visible course “${card.title || card.id}”.`);
      }
      await update.mutateAsync({ data: draft });
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetAdminCoursesMenuQueryKey() }),
        client.invalidateQueries({ queryKey: getGetCoursesMenuQueryKey() }),
      ]);
      onFlash({ tone: "success", message: "Courses menu saved. The public menu will use the updated content on its next open." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };
  const addCard = () => {
    if (!draft) return;
    const card: CoursesMenuCard = { id: newId("course"), order: draft.courseCards.length, title: "", category: "", description: "", destination: "", isVisible: false, icon: null, tint: null, imageUrl: null, imageAlt: "" };
    setOpenCard(card.id);
    updateList("courseCards", [...draft.courseCards, card]);
  };
  const pending = update.isPending || requestUpload.isPending;
  const orderedCards = useMemo(() => draft?.courseCards || [], [draft?.courseCards]);

  if (query.isError) return <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6" role="alert" data-testid="error-admin-courses-load"><p className="font-bold text-red-800">Courses menu could not be loaded.</p><p className="mt-1 text-sm text-red-700">{errorMessage(query.error)}</p><button type="button" onClick={() => void query.refetch()} className="mt-4 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white" data-testid="button-retry-admin-courses"><RefreshCw className="mr-2 inline h-3.5 w-3.5" /> Try again</button></section>;
  if (query.isLoading || !draft) return <div className="mt-6 h-[520px] animate-pulse rounded-3xl bg-white" data-testid="loading-admin-courses" />;

  return (
    <form onSubmit={save} className="space-y-6" data-testid="form-admin-courses">
      <Panel eyebrow="Courses menu / brand panel" title="Set the first impression" testId="panel-admin-courses-brand">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="College name" value={draft.brandPanel.collegeName} onChange={(value) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, collegeName: value } })} testId="input-courses-brand-college-name" />
          <Field label="Tagline" value={draft.brandPanel.tagline} onChange={(value) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, tagline: value } })} testId="input-courses-brand-tagline" />
          <Field label="Headline" value={draft.brandPanel.headline} onChange={(value) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, headline: value } })} testId="input-courses-brand-headline" />
          <Field label="Supporting text" value={draft.brandPanel.supportingText} onChange={(value) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, supportingText: value } })} multiline testId="textarea-courses-brand-supporting-text" />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <ImageField label="Brand logo" value={draft.brandPanel.logoImageUrl} alt={draft.brandPanel.logoImageAlt} onValue={(value) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, logoImageUrl: value } })} onAlt={(value) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, logoImageAlt: value } })} onUpload={async (file) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, logoImageUrl: await upload(file) } })} testId="courses-brand-logo" />
          <ImageField label="Brand background" value={draft.brandPanel.backgroundImageUrl} alt={draft.brandPanel.backgroundImageAlt} onValue={(value) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, backgroundImageUrl: value } })} onAlt={(value) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, backgroundImageAlt: value } })} onUpload={async (file) => setDraftValue({ ...draft, brandPanel: { ...draft.brandPanel, backgroundImageUrl: await upload(file) } })} testId="courses-brand-background" />
        </div>
      </Panel>

      <Panel eyebrow="Courses menu / heading" title="Name the pathway section" testId="panel-admin-courses-heading">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Eyebrow" value={draft.heading.eyebrow} onChange={(value) => setDraftValue({ ...draft, heading: { ...draft.heading, eyebrow: value } })} testId="input-courses-heading-eyebrow" />
          <Field label="Title" value={draft.heading.title} onChange={(value) => setDraftValue({ ...draft, heading: { ...draft.heading, title: value } })} testId="input-courses-heading-title" />
          <Field label="Pathway badge (optional)" value={draft.heading.pathwayBadge || ""} onChange={(value) => setDraftValue({ ...draft, heading: { ...draft.heading, pathwayBadge: value || null } })} testId="input-courses-heading-badge" />
        </div>
      </Panel>

      <Panel eyebrow="Confirmed destinations" title="Course cards" testId="panel-admin-course-cards">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm leading-6 text-slate-500">Starter pathway records remain hidden until title, category, description, and destination are confirmed.</p><button type="button" onClick={addCard} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 px-3.5 py-2.5 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/[.05]" data-testid="button-add-course-card"><Plus className="h-4 w-4" /> Add course card</button></div>
        <div className="mt-5 space-y-3">
          {orderedCards.length ? orderedCards.map((card, index) => (
            <div key={card.id} className={`rounded-2xl border p-4 ${card.isVisible ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`} data-testid={`row-admin-course-card-${card.id}`}>
              <div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><p className="truncate font-bold text-[#0b3472]">{card.title || "Untitled course card"}</p><p className="mt-1 text-xs text-slate-500">{card.category || "Category not set"} · {card.isVisible ? "Visible" : "Hidden"} · order {card.order + 1}</p></div><RowActions visible={card.isVisible} onVisible={() => updateList("courseCards", orderedCards.map((item) => item.id === card.id ? { ...item, isVisible: !item.isVisible } : item))} onUp={() => reorder("courseCards", index, -1)} onDown={() => reorder("courseCards", index, 1)} onDelete={() => remove("courseCards", index, card.title)} first={index === 0} last={index === orderedCards.length - 1} id={card.id} label={card.title || card.id} /><button type="button" onClick={() => setOpenCard(openCard === card.id ? null : card.id)} className="rounded-lg px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/[.06]" data-testid={`button-edit-course-card-${card.id}`}>{openCard === card.id ? "Close editor" : "Edit"}</button></div>
              {openCard === card.id ? <CourseForm card={card} setCard={(next) => updateList("courseCards", orderedCards.map((item) => item.id === card.id ? next : item))} upload={upload} /> : null}
            </div>
          )) : <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500" data-testid="empty-admin-course-cards">No course cards yet. Add a card when a confirmed destination is ready.</div>}
        </div>
      </Panel>

      <CollectionPanel title="Benefits" eyebrow="Supporting proof points" items={draft.benefits} type="benefit" onAdd={() => updateList("benefits", [...draft.benefits, { id: newId("benefit"), order: draft.benefits.length, title: "", description: "", icon: null, isVisible: false }])} onReorder={(index, direction) => reorder("benefits", index, direction)} onRemove={(index, label) => remove("benefits", index, label)} onToggle={(item) => updateList("benefits", draft.benefits.map((current) => current.id === item.id ? { ...current, isVisible: !current.isVisible } : current))} renderItem={(item, index) => <BenefitRow key={item.id} item={item} index={index} items={draft.benefits} onChange={(next) => updateList("benefits", draft.benefits.map((current) => current.id === item.id ? next : current))} />} />
      <CollectionPanel title="Utility links" eyebrow="Secondary destinations" items={draft.utilityLinks} type="utility" onAdd={() => updateList("utilityLinks", [...draft.utilityLinks, { id: newId("utility"), order: draft.utilityLinks.length, label: "", destination: "", isVisible: false }])} onReorder={(index, direction) => reorder("utilityLinks", index, direction)} onRemove={(index, label) => remove("utilityLinks", index, label)} onToggle={(item) => updateList("utilityLinks", draft.utilityLinks.map((current) => current.id === item.id ? { ...current, isVisible: !current.isVisible } : current))} renderItem={(item) => <LinkRow key={item.id} item={item} onChange={(next) => updateList("utilityLinks", draft.utilityLinks.map((current) => current.id === item.id ? next as CoursesMenuLink : current))} />} />
      <CollectionPanel title="Call-to-action buttons" eyebrow="Conversion actions" items={draft.ctaButtons} type="cta" onAdd={() => updateList("ctaButtons", [...draft.ctaButtons, { id: newId("cta"), order: draft.ctaButtons.length, label: "", destination: "", variant: "primary", isVisible: false }])} onReorder={(index, direction) => reorder("ctaButtons", index, direction)} onRemove={(index, label) => remove("ctaButtons", index, label)} onToggle={(item) => updateList("ctaButtons", draft.ctaButtons.map((current) => current.id === item.id ? { ...current, isVisible: !current.isVisible } : current))} renderItem={(item) => <LinkRow key={item.id} item={item} onChange={(next) => updateList("ctaButtons", draft.ctaButtons.map((current) => current.id === item.id ? next as CoursesMenuButton : current))} cta />} />

      <Panel eyebrow="Optional status card" title="Coming soon card" testId="panel-admin-courses-coming-soon">
        {draft.comingSoonCard ? <div className="grid gap-4 md:grid-cols-2"><Field label="Title" value={draft.comingSoonCard.title} onChange={(value) => setDraftValue({ ...draft, comingSoonCard: { ...draft.comingSoonCard!, title: value } })} testId="input-courses-coming-soon-title" /><Field label="Status label" value={draft.comingSoonCard.statusLabel} onChange={(value) => setDraftValue({ ...draft, comingSoonCard: { ...draft.comingSoonCard!, statusLabel: value } })} testId="input-courses-coming-soon-status" /><div className="md:col-span-2"><Field label="Description" value={draft.comingSoonCard.description} onChange={(value) => setDraftValue({ ...draft, comingSoonCard: { ...draft.comingSoonCard!, description: value } })} multiline testId="textarea-courses-coming-soon-description" /></div><Toggle label="Show non-clickable card in public menu" checked={draft.comingSoonCard.isVisible} onChange={(value) => setDraftValue({ ...draft, comingSoonCard: { ...draft.comingSoonCard!, isVisible: value } })} testId="checkbox-courses-coming-soon-visible" /><button type="button" onClick={() => setDraftValue({ ...draft, comingSoonCard: null })} className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-red-700 hover:bg-red-50" data-testid="button-remove-courses-coming-soon"><Trash2 className="h-3.5 w-3.5" /> Remove card</button></div> : <button type="button" onClick={() => setDraftValue({ ...draft, comingSoonCard: { title: "", description: "", statusLabel: "", isVisible: false } })} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 px-3.5 py-2.5 text-sm font-bold text-[#0b3472]" data-testid="button-add-courses-coming-soon"><Plus className="h-4 w-4" /> Add optional coming-soon card</button>}
      </Panel>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700" role="alert" data-testid="error-admin-courses-save">{error}</p> : null}
      <div className="sticky bottom-4 flex justify-end"><button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_25px_rgba(11,52,114,.2)] hover:bg-[#082859] disabled:opacity-50" data-testid="button-save-admin-courses"><Save className="h-4 w-4" />{pending ? "Saving menu…" : "Save Courses menu"}</button></div>
    </form>
  );
}

function CollectionPanel({ title, eyebrow, items, type, onAdd, onReorder, onRemove, onToggle, renderItem }: { title: string; eyebrow: string; items: Array<{ id: string; order: number; title?: string; label?: string; isVisible: boolean }>; type: string; onAdd: () => void; onReorder: (index: number, direction: -1 | 1) => void; onRemove: (index: number, label: string) => void; onToggle: (item: any) => void; renderItem: (item: any, index: number) => ReactNode }) {
  return <Panel eyebrow={eyebrow} title={title} testId={`panel-admin-courses-${type}`}><div className="flex justify-end"><button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 px-3.5 py-2.5 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/[.05]" data-testid={`button-add-courses-${type}`}><Plus className="h-4 w-4" /> Add {type}</button></div><div className="mt-5 space-y-3">{items.map((item, index) => <div key={item.id} className={`rounded-2xl border p-4 ${item.isVisible ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`} data-testid={`row-admin-courses-${type}-${item.id}`}><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1">{renderItem(item, index)}</div><RowActions visible={item.isVisible} onVisible={() => onToggle(item)} onUp={() => onReorder(index, -1)} onDown={() => onReorder(index, 1)} onDelete={() => onRemove(index, item.title || item.label || item.id)} first={index === 0} last={index === items.length - 1} id={item.id} label={item.title || item.label || item.id} /></div></div>)}{!items.length ? <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500" data-testid={`empty-admin-courses-${type}`}>No {type} entries yet.</div> : null}</div></Panel>;
}

function BenefitRow({ item, index: _index, items: _items, onChange }: { item: CoursesMenuBenefit; index: number; items: CoursesMenuBenefit[]; onChange: (next: CoursesMenuBenefit) => void }) {
  return <><p className="font-bold text-[#0b3472]">{item.title || "Untitled benefit"}</p><p className="mt-1 text-xs text-slate-500">{item.description || "Description not set"} · {item.isVisible ? "Visible" : "Hidden"}</p><BenefitForm item={item} setItem={onChange} /></>;
}

function LinkRow({ item, onChange, cta = false }: { item: CoursesMenuLink | CoursesMenuButton; onChange: (next: CoursesMenuLink | CoursesMenuButton) => void; cta?: boolean }) {
  return <><p className="font-bold text-[#0b3472]">{item.label || "Untitled link"}</p><p className="mt-1 text-xs text-slate-500">{item.destination || "Destination not set"} · {item.isVisible ? "Visible" : "Hidden"}</p><LinkForm item={item} setItem={onChange} cta={cta} /></>;
}
