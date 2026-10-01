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
  X,
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
import type {
  ContentItem,
  ContentItemInput,
  ContentItemUpdate,
  ContentSection,
  HomePage,
} from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string } | null;
type CmsRecord = Record<string, unknown>;
type Role = "Student" | "Parent" | "Alumni";

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function assetUrl(path: string | null) {
  return path?.startsWith("/objects/") ? `/api/storage${path}` : path || "";
}

function errorMessage(error: unknown) {
  const candidate = error as { response?: { status?: number }; status?: number; message?: string };
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
  required = false,
  multiline = false,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  testId: string;
}) {
  const classes =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}{required ? <span className="ml-1 text-[#e3212b]">*</span> : null}
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} rows={4} className={classes} data-testid={testId} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className={classes} data-testid={testId} />
      )}
    </label>
  );
}

function SectionSettings({
  section,
  onFlash,
}: {
  section: ContentSection;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  const content = record(section.content);
  const [eyebrow, setEyebrow] = useState(text(content.eyebrow, "FROM OUR COMMUNITY"));
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle || "");

  useEffect(() => {
    const next = record(section.content);
    setEyebrow(text(next.eyebrow, "FROM OUR COMMUNITY"));
    setTitle(section.title);
    setSubtitle(section.subtitle || "");
  }, [section.content, section.id, section.subtitle, section.title]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      onFlash({ tone: "error", message: "A testimonials heading is required." });
      return;
    }
    update.mutate(
      {
        id: section.id,
        data: {
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: { ...content, eyebrow: eyebrow.trim() || "FROM OUR COMMUNITY" },
        },
      },
      {
        onSuccess: () => {
          invalidateHome(client);
          onFlash({ tone: "success", message: "Testimonials heading saved." });
        },
        onError: (error) => onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );
  };

  const toggleSection = () =>
    update.mutate(
      { id: section.id, data: { isVisible: !section.isVisible } },
      {
        onSuccess: () => {
          invalidateHome(client);
          onFlash({ tone: "success", message: section.isVisible ? "Testimonials hidden from the Home page." : "Testimonials shown on the Home page." });
        },
        onError: (error) => onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" data-testid="panel-testimonials-settings">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[#e3212b]">Home · Testimonials</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]">Voices from the Shastra community</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Shape the heading and supporting copy, then curate the stories that are ready for the public Home page.</p>
        </div>
        <button type="button" onClick={toggleSection} disabled={update.isPending} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#0b3472] transition hover:bg-slate-50 disabled:opacity-50" data-testid="button-toggle-section-testimonials">
          {section.isVisible ? <><EyeOff className="h-4 w-4" /> Hide section</> : <><Eye className="h-4 w-4" /> Show section</>}
        </button>
      </div>
      <form onSubmit={save} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Eyebrow" value={eyebrow} onChange={setEyebrow} required testId="input-testimonials-eyebrow" />
          <Input label="Heading" value={title} onChange={setTitle} required testId="input-testimonials-heading" />
        </div>
        <Input label="Supporting description" value={subtitle} onChange={setSubtitle} multiline testId="input-testimonials-description" />
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button type="submit" disabled={update.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e3212b] disabled:opacity-50" data-testid="button-save-testimonials-section">
            <Save className="h-4 w-4" /> {update.isPending ? "Saving…" : "Save section"}
          </button>
        </div>
      </form>
    </section>
  );
}

function TestimonialForm({
  sectionId,
  initial,
  position,
  onFlash,
  onClose,
}: {
  sectionId: string;
  initial?: ContentItem;
  position: number;
  onFlash: (flash: Flash) => void;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const create = useCreateContentItem();
  const update = useUpdateContentItem();
  const requestUpload = useRequestUploadUrl();
  const initialContent = record(initial?.content);
  const [name, setName] = useState(initial?.title || "");
  const [feedback, setFeedback] = useState(initial?.description || "");
  const [role, setRole] = useState<Role>((["Student", "Parent", "Alumni"] as string[]).includes(text(initialContent.role)) ? text(initialContent.role) as Role : "Student");
  const [course, setCourse] = useState(text(initialContent.course));
  const [altText, setAltText] = useState(text(initialContent.altText));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [showOnHome, setShowOnHome] = useState(initialContent.showOnHome !== false);
  const [showOnCoursePages, setShowOnCoursePages] = useState(
    initialContent.showOnCoursePages === true,
  );
  const [isDemo, setIsDemo] = useState(initialContent.isDemo === true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const content = record(initial?.content);
    setName(initial?.title || "");
    setFeedback(initial?.description || "");
    setRole((["Student", "Parent", "Alumni"] as string[]).includes(text(content.role)) ? text(content.role) as Role : "Student");
    setCourse(text(content.course));
    setAltText(text(content.altText));
    setImageUrl(initial?.imageUrl || "");
    setShowOnHome(content.showOnHome !== false);
    setShowOnCoursePages(content.showOnCoursePages === true);
    setIsDemo(content.isDemo === true);
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
  }, [initial?.id]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
    setError("");
  };

  const upload = async () => {
    if (!selectedFile) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type)) {
      setError("Use a PNG, JPEG, or WebP portrait.");
      return;
    }
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("Portraits must be 2 MB or smaller.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploadInfo = await requestUpload.mutateAsync({ data: { name: selectedFile.name, size: selectedFile.size, contentType: selectedFile.type } });
      const response = await fetch(uploadInfo.uploadURL, { method: "PUT", headers: { "Content-Type": selectedFile.type }, body: selectedFile });
      if (!response.ok) throw new Error("The portrait upload could not be completed.");
      setImageUrl(uploadInfo.objectPath);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      onFlash({ tone: "success", message: "Portrait uploaded. Save the testimonial to keep the change." });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUploading(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setError("Person name is required."); return; }
    if (!feedback.trim()) { setError("Feedback is required."); return; }
    if (imageUrl && !altText.trim()) { setError("Useful alt text is required when a portrait is present."); return; }
    if (selectedFile) { setError("Upload the selected portrait before saving."); return; }
    const content: CmsRecord = { ...initialContent, role, course: course.trim(), showOnHome, showOnCoursePages, isDemo, altText: imageUrl ? altText.trim() : "" };
    const common = {
      title: name.trim(),
      description: feedback.trim(),
      imageUrl: imageUrl || null,
      linkPath: null,
      label: null,
      content,
      isVisible: initial?.isVisible ?? true,
      position: initial?.position ?? position,
    };
    const options = {
      onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: initial ? "Testimonial saved." : "Testimonial added." }); onClose(); },
      onError: (failure: unknown) => setError(errorMessage(failure)),
    };
    if (initial) {
      const data: ContentItemUpdate = { ...common, itemType: "testimonial" };
      update.mutate({ id: initial.id, data }, options);
    } else {
      const data: ContentItemInput = { sectionId, itemType: "testimonial", ...common };
      create.mutate({ data }, options);
    }
  };

  const pending = create.isPending || update.isPending || uploading;
  const preview = previewUrl || assetUrl(imageUrl);
  return (
    <form onSubmit={save} className="mt-4 rounded-2xl border border-[#0b3472]/15 bg-[#f5f8fc] p-4 sm:p-5" data-testid={`form-testimonial-${initial?.id || "new"}`}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Person name" value={name} onChange={setName} required placeholder="e.g. Ananya Reddy" testId={`input-testimonial-name-${initial?.id || "new"}`} />
        <label className="block text-sm font-bold text-slate-700">Role<span className="ml-1 text-[#e3212b]">*</span>
          <select value={role} onChange={(event) => setRole(event.target.value as Role)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10" data-testid={`select-testimonial-role-${initial?.id || "new"}`}>
            <option value="Student">Student</option><option value="Parent">Parent</option><option value="Alumni">Alumni</option>
          </select>
        </label>
        <Input label="Course / year (optional)" value={course} onChange={setCourse} placeholder="e.g. MPC · 2024–25" testId={`input-testimonial-course-${initial?.id || "new"}`} />
        <Input label="Portrait alt text" value={altText} onChange={setAltText} required={Boolean(imageUrl)} placeholder="Describe the portrait" testId={`input-testimonial-alt-${initial?.id || "new"}`} />
      </div>
      <div className="mt-4"><Input label="Feedback" value={feedback} onChange={setFeedback} required multiline placeholder="What did this person value about learning at Shastra?" testId={`textarea-testimonial-feedback-${initial?.id || "new"}`} /></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[132px_1fr]">
        <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-[#e9eef7] shadow-sm">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" data-testid={`img-testimonial-preview-${initial?.id || "new"}`} /> : <div className="flex h-full items-center justify-center text-slate-300"><ImagePlus className="h-8 w-8" /></div>}
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#0b3472]"><ImagePlus className="h-5 w-5 shrink-0" /><span className="truncate">{selectedFile ? selectedFile.name : imageUrl ? "Choose a replacement portrait" : "Choose an optional portrait"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0] || null)} data-testid={`input-testimonial-file-${initial?.id || "new"}`} /></label>
          <p className="mt-2 text-xs leading-5 text-slate-500">PNG, JPEG, or WebP. Maximum 2 MB.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedFile ? <button type="button" onClick={() => void upload()} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/20 px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/5 disabled:opacity-50" data-testid={`button-upload-testimonial-${initial?.id || "new"}`}><Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload portrait"}</button> : null}
            {imageUrl ? <button type="button" onClick={() => { setImageUrl(""); setAltText(""); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" data-testid={`button-remove-testimonial-photo-${initial?.id || "new"}`}><X className="h-3.5 w-3.5" />Remove portrait</button> : null}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={showOnHome} onChange={(event) => setShowOnHome(event.target.checked)} className="h-4 w-4 accent-[#0b3472]" data-testid={`checkbox-testimonial-home-${initial?.id || "new"}`} /> Show on Home</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={showOnCoursePages} onChange={(event) => setShowOnCoursePages(event.target.checked)} className="h-4 w-4 accent-[#0b3472]" data-testid={`checkbox-testimonial-courses-${initial?.id || "new"}`} /> Show on all course pages</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={isDemo} onChange={(event) => setIsDemo(event.target.checked)} className="h-4 w-4 accent-[#0b3472]" data-testid={`checkbox-testimonial-demo-${initial?.id || "new"}`} /> Starter record</label>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-700" role="alert" data-testid={`error-testimonial-${initial?.id || "new"}`}>{error}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl px-3.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200/70" data-testid={`button-cancel-testimonial-${initial?.id || "new"}`}>Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2 text-sm font-bold text-white disabled:opacity-50" data-testid={`button-save-testimonial-${initial?.id || "new"}`}><Save className="h-4 w-4" />{pending ? "Saving…" : "Save testimonial"}</button>
      </div>
    </form>
  );
}

function TestimonialItems({ section, items, onFlash }: { section: ContentSection; items: ContentItem[]; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const update = useUpdateContentItem();
  const remove = useDeleteContentItem();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const ordered = useMemo(() => [...items].sort((a, b) => a.position - b.position), [items]);
  const nextPosition = ordered.length ? Math.max(...ordered.map((item) => item.position)) + 1 : 0;

  const move = async (item: ContentItem, direction: -1 | 1) => {
    const index = ordered.findIndex((candidate) => candidate.id === item.id);
    const target = ordered[index + direction];
    if (!target) return;
    try {
      await Promise.all([
        update.mutateAsync({ id: item.id, data: { position: target.position } }),
        update.mutateAsync({ id: target.id, data: { position: item.position } }),
      ]);
      invalidateHome(client);
      onFlash({ tone: "success", message: "Testimonial order saved." });
    } catch (failure) {
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };

  const toggle = (item: ContentItem) =>
    update.mutate({ id: item.id, data: { isVisible: !item.isVisible } }, {
      onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: item.isVisible ? "Testimonial unpublished." : "Testimonial published." }); },
      onError: (failure) => onFlash({ tone: "error", message: errorMessage(failure) }),
    });

  const deleteItem = (item: ContentItem) => {
    if (!window.confirm(`Delete “${item.title}” from testimonials? This cannot be undone.`)) return;
    remove.mutate({ id: item.id }, {
      onSuccess: () => { invalidateHome(client); setEditing(null); onFlash({ tone: "success", message: "Testimonial deleted." }); },
      onError: (failure) => onFlash({ tone: "error", message: errorMessage(failure) }),
    });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" data-testid="panel-testimonial-items">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow text-[#e3212b]">Stories</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Testimonial records</h2><p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">Published records use separate Show on Home and Show on all course pages settings. Hidden records stay here for review.</p></div>
        <button type="button" onClick={() => setEditing((current) => current === "new" ? null : "new")} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/5" data-testid="button-add-testimonial"><Plus className="h-4 w-4" />{editing === "new" ? "Close form" : "Add testimonial"}</button>
      </div>
      {editing === "new" ? <TestimonialForm sectionId={section.id} position={nextPosition} onFlash={onFlash} onClose={() => setEditing(null)} /> : null}
      {!ordered.length && editing !== "new" ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-500" data-testid="empty-admin-testimonials">No testimonial records yet. Add the first story from the Shastra community.</div> : null}
      <div className="mt-6 space-y-3">
        {ordered.map((item, index) => {
          const content = record(item.content);
          const role = text(content.role, "Student");
          return (
            <div key={item.id} className={`rounded-2xl border border-slate-200 p-4 ${item.isVisible ? "bg-white" : "bg-slate-50"}`} data-testid={`row-testimonial-${item.id}`}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#e9eef7]">{item.imageUrl ? <img src={assetUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs font-extrabold text-[#0b3472]">{item.title.slice(0, 2).toUpperCase()}</span>}</div>
                <div className="min-w-0 flex-1"><p className="truncate font-bold text-[#0b3472]" data-testid={`text-admin-testimonial-name-${item.id}`}>{item.title}</p><p className="mt-1 truncate text-xs text-slate-500">{role} · {item.isVisible ? "Published" : "Unpublished"} · {content.showOnHome === true ? "On Home" : "Off Home"} · {content.showOnCoursePages === true ? "On course pages" : "Off course pages"}</p>{content.isDemo === true ? <span className="mt-2 inline-flex rounded-full border border-[#e3212b]/20 bg-[#e3212b]/[.07] px-2 py-1 text-[10px] font-bold uppercase tracking-[.13em] text-[#c71927]" data-testid={`badge-testimonial-demo-${item.id}`}>Demo record</span> : null}</div>
                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" onClick={() => toggle(item)} disabled={update.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`${item.isVisible ? "Unpublish" : "Publish"} ${item.title}`} data-testid={`button-toggle-testimonial-${item.id}`}>{item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  <button type="button" onClick={() => void move(item, -1)} disabled={index === 0 || update.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${item.title} up`} data-testid={`button-move-testimonial-up-${item.id}`}><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => void move(item, 1)} disabled={index === ordered.length - 1 || update.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${item.title} down`} data-testid={`button-move-testimonial-down-${item.id}`}><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setEditing(editing === item.id ? null : item.id)} className="rounded-lg px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/5" data-testid={`button-edit-testimonial-${item.id}`}>{editing === item.id ? "Close" : "Edit"}</button>
                  <button type="button" onClick={() => deleteItem(item)} disabled={remove.isPending} className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${item.title}`} data-testid={`button-delete-testimonial-${item.id}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {editing === item.id ? <TestimonialForm key={item.id} sectionId={section.id} initial={item} position={item.position} onFlash={onFlash} onClose={() => setEditing(null)} /> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export type AdminTestimonialsEditorProps = { home: HomePage; onFlash: (flash: Flash) => void };

export default function AdminTestimonialsEditor({ home, onFlash }: AdminTestimonialsEditorProps) {
  const section = home.sections.find((candidate) => candidate.pageSlug === "home" && candidate.sectionKey === "testimonials");
  const items = section ? home.items.filter((item) => item.sectionId === section.id && item.itemType === "testimonial") : [];
  if (!section) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900" role="alert" data-testid="missing-testimonials-section">The testimonials section is not available in the current CMS response. Refresh after the content service has initialized it.</div>;
  return <div className="space-y-6" data-testid="admin-testimonials-editor"><SectionSettings section={section} onFlash={onFlash} /><TestimonialItems section={section} items={items} onFlash={onFlash} /></div>;
}

export { AdminTestimonialsEditor };