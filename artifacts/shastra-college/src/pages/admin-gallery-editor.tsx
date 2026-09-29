import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getGetAdminHomeQueryKey,
  getGetHomePageQueryKey,
  useCreateContentItem,
  useDeleteContentItem,
  useRequestUploadUrl,
  useUpdateContentItem,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentItem, ContentItemInput, ContentSection, HomePage } from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string } | null;
type CmsRecord = Record<string, unknown>;
const categories = ["Campus", "Library", "Classrooms", "Placements", "Buildings", "Events"] as const;
type GalleryCategory = (typeof categories)[number];

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as CmsRecord) : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function errorMessage(error: unknown) {
  const candidate = error as { response?: { status?: number }; status?: number; message?: string };
  if (candidate?.response?.status === 403 || candidate?.status === 403) return "Your account is signed in, but it is not on the admin allowlist.";
  return candidate?.message || "Something went wrong. Please try again.";
}

function assetUrl(path: string | null) {
  if (!path) return "";
  return path.startsWith("/objects/") ? `/api/storage${path}` : path;
}

function invalidateHome(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() });
  void client.invalidateQueries({ queryKey: getGetHomePageQueryKey() });
}

function Input({ label, value, onChange, placeholder, multiline = false, required = false, testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; required?: boolean; testId: string }) {
  const className = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";
  return <label className="block text-sm font-bold text-slate-700">{label}{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} rows={3} className={className} data-testid={testId} /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className={className} data-testid={testId} />}</label>;
}

function SectionEditor({ section, onFlash }: { section: ContentSection; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  const [eyebrow, setEyebrow] = useState(text(record(section.content).eyebrow, "Life at Shastra"));
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle || "");
  useEffect(() => {
    setEyebrow(text(record(section.content).eyebrow, "Life at Shastra"));
    setTitle(section.title);
    setSubtitle(section.subtitle || "");
  }, [section.id, section.content, section.title, section.subtitle]);
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { onFlash({ tone: "error", message: "A gallery heading is required." }); return; }
    update.mutate({ id: section.id, data: {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      content: { ...record(section.content), eyebrow: eyebrow.trim() || "Life at Shastra" },
    } }, {
      onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: "Gallery introduction saved." }); },
      onError: (error) => onFlash({ tone: "error", message: errorMessage(error) }),
    });
  };
  return <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl bg-[#f5f8fc] p-4 sm:grid-cols-[.8fr_1.2fr] sm:p-5">
    <Input label="Eyebrow" value={eyebrow} onChange={setEyebrow} placeholder="Life at Shastra" testId="input-gallery-section-eyebrow" />
    <Input label="Gallery heading" value={title} onChange={setTitle} required testId="input-gallery-section-title" />
    <Input label="Gallery description" value={subtitle} onChange={setSubtitle} multiline testId="input-gallery-section-subtitle" />
    <div className="sm:col-span-2 flex justify-end"><button type="submit" disabled={update.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#082859] disabled:opacity-50" data-testid="button-save-gallery-section"><Save className="h-4 w-4" />{update.isPending ? "Saving…" : "Save introduction"}</button></div>
  </form>;
}

function GalleryItemEditor({ sectionId, initial, position, onFlash, onClose }: { sectionId: string; initial?: ContentItem; position: number; onFlash: (flash: Flash) => void; onClose: () => void }) {
  const client = useQueryClient();
  const create = useCreateContentItem();
  const update = useUpdateContentItem();
  const requestUpload = useRequestUploadUrl();
  const initialContent = record(initial?.content);
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState<GalleryCategory>(categories.includes(text(initialContent.category) as GalleryCategory) ? text(initialContent.category) as GalleryCategory : "Campus");
  const [altText, setAltText] = useState(text(initialContent.altText, initial?.title || ""));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [isDemo, setIsDemo] = useState(initialContent.isDemo === true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    const content = record(initial?.content);
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setCategory(categories.includes(text(content.category) as GalleryCategory) ? text(content.category) as GalleryCategory : "Campus");
    setAltText(text(content.altText, initial?.title || ""));
    setImageUrl(initial?.imageUrl || "");
    setIsDemo(content.isDemo === true);
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
  }, [initial?.id]);

  const upload = async () => {
    if (!selectedFile) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type)) { setError("Use a PNG, JPEG, or WebP image."); return; }
    if (selectedFile.size > 2 * 1024 * 1024) { setError("Gallery images must be 2 MB or smaller."); return; }
    setUploading(true); setError("");
    try {
      const uploadInfo = await requestUpload.mutateAsync({ data: { name: selectedFile.name, size: selectedFile.size, contentType: selectedFile.type } });
      const response = await fetch(uploadInfo.uploadURL, { method: "PUT", headers: { "Content-Type": selectedFile.type }, body: selectedFile });
      if (!response.ok) throw new Error("The image upload could not be completed.");
      setImageUrl(uploadInfo.objectPath);
      setSelectedFile(null);
      onFlash({ tone: "success", message: "Image uploaded. Save the entry to publish the change." });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUploading(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { setError("Add a title for this image."); return; }
    if (!altText.trim()) { setError("Add useful alt text for this image."); return; }
    if (selectedFile) { setError("Upload the selected image before saving."); return; }
    if (!imageUrl) { setError("Upload an image before saving this gallery entry."); return; }
    const data: ContentItemInput = {
      sectionId,
      itemType: "gallery-image",
      title: title.trim(),
      description: description.trim() || null,
      imageUrl,
      linkPath: null,
      label: null,
      content: {
        ...initialContent,
        category,
        altText: altText.trim(),
        isDemo,
        showOnHome: initialContent.showOnHome === true,
      },
      isVisible: initial?.isVisible ?? true,
      position: initial?.position ?? position,
    };
    const options = {
      onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: initial ? "Gallery entry saved." : "Gallery image added." }); onClose(); },
      onError: (failure: unknown) => setError(errorMessage(failure)),
    };
    if (initial) update.mutate({ id: initial.id, data }, options);
    else create.mutate({ data }, options);
  };

  const pending = create.isPending || update.isPending || uploading;
  return <form onSubmit={save} className="mt-4 rounded-2xl border border-[#0b3472]/15 bg-[#f5f8fc] p-4 sm:p-5" data-testid={`form-gallery-item-${initial?.id || "new"}`}>
    <div className="grid gap-4 md:grid-cols-2">
      <Input label="Image title" value={title} onChange={setTitle} required placeholder="e.g. The library reading room" testId={`input-gallery-title-${initial?.id || "new"}`} />
      <label className="block text-sm font-bold text-slate-700">Category<select value={category} onChange={(event) => setCategory(event.target.value as GalleryCategory)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800" data-testid={`select-gallery-category-${initial?.id || "new"}`}>{categories.map((option) => <option value={option} key={option}>{option}</option>)}</select></label>
      <Input label="Description" value={description} onChange={setDescription} multiline placeholder="A short, specific caption for prospective families." testId={`textarea-gallery-description-${initial?.id || "new"}`} />
      <Input label="Alt text" value={altText} onChange={setAltText} required placeholder="Describe what is visible in the image" testId={`input-gallery-alt-text-${initial?.id || "new"}`} />
    </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
       <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-white">{imageUrl || previewUrl ? <img src={previewUrl || assetUrl(imageUrl)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><ImagePlus className="h-8 w-8" /></div>}</div>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
         <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#0b3472]"><ImagePlus className="h-5 w-5" /><span className="truncate">{selectedFile ? selectedFile.name : imageUrl ? "Choose a replacement image" : "Choose an image"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] || null; if (previewUrl) URL.revokeObjectURL(previewUrl); setSelectedFile(file); setPreviewUrl(file ? URL.createObjectURL(file) : ""); }} data-testid={`input-gallery-file-${initial?.id || "new"}`} /></label>
         <p className="mt-2 text-xs leading-5 text-slate-500">PNG, JPEG, or WebP. Maximum 2 MB.</p>
        {selectedFile ? <button type="button" onClick={() => void upload()} disabled={uploading} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/20 px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/5 disabled:opacity-50" data-testid={`button-upload-gallery-${initial?.id || "new"}`}><Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload image"}</button> : null}
      </div>
    </div>
    <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={isDemo} onChange={(event) => setIsDemo(event.target.checked)} className="h-4 w-4 accent-[#0b3472]" data-testid={`checkbox-gallery-demo-${initial?.id || "new"}`} /> Mark as demo image</label>
    {error ? <p className="mt-3 text-sm font-semibold text-red-700" role="alert" data-testid={`error-gallery-item-${initial?.id || "new"}`}>{error}</p> : null}
    <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-3.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200/70" data-testid={`button-cancel-gallery-${initial?.id || "new"}`}>Cancel</button><button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2 text-sm font-bold text-white disabled:opacity-50" data-testid={`button-save-gallery-${initial?.id || "new"}`}><Save className="h-4 w-4" />{pending ? "Saving…" : "Save image"}</button></div>
  </form>;
}

function GalleryItems({ section, items, onFlash }: { section: ContentSection; items: ContentItem[]; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const update = useUpdateContentItem();
  const remove = useDeleteContentItem();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const orderedItems = useMemo(() => [...items].sort((a, b) => a.position - b.position), [items]);
  const nextPosition = orderedItems.length ? Math.max(...orderedItems.map((item) => item.position)) + 1 : 0;
  const move = async (item: ContentItem, direction: -1 | 1) => {
    const index = orderedItems.findIndex((candidate) => candidate.id === item.id);
    const target = orderedItems[index + direction];
    if (!target) return;
    try {
      await Promise.all([update.mutateAsync({ id: item.id, data: { position: target.position } }), update.mutateAsync({ id: target.id, data: { position: item.position } })]);
      invalidateHome(client); onFlash({ tone: "success", message: "Gallery order saved." });
    } catch (failure) { onFlash({ tone: "error", message: errorMessage(failure) }); }
  };
  const toggle = (item: ContentItem) => update.mutate({ id: item.id, data: { isVisible: !item.isVisible } }, { onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: item.isVisible ? "Image hidden from the public gallery." : "Image shown in the public gallery." }); }, onError: (failure) => onFlash({ tone: "error", message: errorMessage(failure) }) });
  const toggleHomePreview = async (item: ContentItem) => {
    const itemContent = record(item.content);
    const category = text(itemContent.category, "Campus");
    const showOnHome = itemContent.showOnHome !== true;

    try {
      if (showOnHome) {
        const previousFeatured = orderedItems.find((candidate) => {
          const candidateContent = record(candidate.content);
          return (
            candidate.id !== item.id &&
            candidateContent.showOnHome === true &&
            text(candidateContent.category, "Campus") === category
          );
        });

        if (previousFeatured) {
          await update.mutateAsync({
            id: previousFeatured.id,
            data: {
              content: { ...record(previousFeatured.content), showOnHome: false },
            },
          });
        }
      }

      await update.mutateAsync({
        id: item.id,
        data: { content: { ...itemContent, showOnHome } },
      });
      invalidateHome(client);
      onFlash({
        tone: "success",
        message: showOnHome
          ? `${category} image selected for the homepage preview.`
          : `${category} image removed from the homepage preview.`,
      });
    } catch (failure) {
      invalidateHome(client);
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };
  const deleteItem = (item: ContentItem) => {
    if (!window.confirm(`Delete “${item.title}” from the gallery?`)) return;
    remove.mutate({ id: item.id }, { onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: "Gallery image deleted." }); }, onError: (failure) => onFlash({ tone: "error", message: errorMessage(failure) }) });
  };
  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-[#e3212b]">Gallery collection</p>
          <h3 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Campus stories</h3>
          <p className="mt-1 max-w-xl text-sm leading-5 text-slate-500">
            Select one image in each category to feature it on the homepage. Hidden images stay out of the public gallery and preview.
          </p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#0b3472]/15 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/5" data-testid="button-add-gallery-image">
          <Plus className="h-4 w-4" />Add image
        </button>
      </div>
      {orderedItems.length === 0 && editing !== "new" ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-500" data-testid="empty-admin-gallery">
          No gallery images yet. Add the first view of campus life.
        </div>
      ) : (
        <div className="space-y-3">
          {orderedItems.map((item, index) => {
            const itemContent = record(item.content);
            return (
              <div key={item.id} className={`rounded-2xl border border-slate-200 bg-white p-4 ${item.isVisible ? "" : "bg-slate-50"}`} data-testid={`row-gallery-${item.id}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.imageUrl ? <img src={assetUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#0b3472]">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {text(itemContent.category, "Campus")} · {item.isVisible ? "Shown publicly" : "Hidden"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <label className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-[#0b3472] hover:bg-[#0b3472]/5">
                      <input
                        type="checkbox"
                        checked={itemContent.showOnHome === true}
                        onChange={() => void toggleHomePreview(item)}
                        disabled={update.isPending}
                        aria-label={`Show ${item.title} in the homepage gallery preview`}
                        className="h-4 w-4 accent-[#0b3472]"
                        data-testid={`checkbox-home-gallery-${item.id}`}
                      />
                      <span>Home preview</span>
                    </label>
                    <button type="button" onClick={() => toggle(item)} disabled={update.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`${item.isVisible ? "Hide" : "Show"} ${item.title}`} data-testid={`button-toggle-gallery-${item.id}`}>
                      {item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => void move(item, -1)} disabled={index === 0 || update.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${item.title} up`} data-testid={`button-move-gallery-up-${item.id}`}>
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => void move(item, 1)} disabled={index === orderedItems.length - 1 || update.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${item.title} down`} data-testid={`button-move-gallery-down-${item.id}`}>
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setEditing(editing === item.id ? null : item.id)} className="rounded-lg px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/5" data-testid={`button-edit-gallery-${item.id}`}>
                      {editing === item.id ? "Close" : "Edit"}
                    </button>
                    <button type="button" onClick={() => deleteItem(item)} disabled={remove.isPending} className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${item.title}`} data-testid={`button-delete-gallery-${item.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {editing === item.id ? <GalleryItemEditor key={item.id} sectionId={section.id} initial={item} position={item.position} onFlash={onFlash} onClose={() => setEditing(null)} /> : null}
              </div>
            );
          })}
        </div>
      )}
      {editing === "new" ? <GalleryItemEditor key="gallery-new" sectionId={section.id} position={nextPosition} onFlash={onFlash} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

export default function AdminGalleryEditor({ home, onFlash }: { home: HomePage; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const updateSection = useUpdateContentSection();
  const section = home.sections.find((candidate) => candidate.sectionKey.toLowerCase() === "gallery");
  const items = section ? home.items.filter((item) => item.sectionId === section.id && item.itemType === "gallery-image") : [];
  if (!section) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900" data-testid="missing-gallery-section">The gallery section is not available in the current CMS response. Create the section in the existing content service, then refresh this editor.</div>;
  return <div className="space-y-6" data-testid="admin-gallery-editor">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-[#e3212b]">04 · Gallery</p><h2 className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]">Public gallery</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Keep the collection current with carefully captioned views of the college. Only visible gallery images appear on the public page.</p></div><button type="button" onClick={() => updateSection.mutate({ id: section.id, data: { isVisible: !section.isVisible } }, { onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: section.isVisible ? "Gallery hidden from the public site." : "Gallery shown on the public site." }); }, onError: (failure) => onFlash({ tone: "error", message: errorMessage(failure) }) })} disabled={updateSection.isPending} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#0b3472] hover:bg-slate-50 disabled:opacity-50" data-testid="button-toggle-gallery-section">{section.isVisible ? <><EyeOff className="h-4 w-4" />Hide gallery</> : <><Eye className="h-4 w-4" />Show gallery</>}</button></div>
      <SectionEditor section={section} onFlash={onFlash} />
      <GalleryItems section={section} items={items} onFlash={onFlash} />
    </section>
  </div>;
}