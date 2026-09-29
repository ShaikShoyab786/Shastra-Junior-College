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

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const value =
    parts.length > 1
      ? `${Array.from(parts[0])[0]}${Array.from(parts[1])[0]}`
      : parts[0]?.slice(0, 2) || "SC";
  return value.toUpperCase();
}

function assetUrl(path: string | null) {
  return path?.startsWith("/objects/") ? `/api/storage${path}` : path || "";
}

function errorMessage(error: unknown) {
  const candidate = error as { response?: { status?: number }; status?: number; message?: string };
  if (candidate?.response?.status === 403 || candidate?.status === 403) return "Your account is signed in, but it is not on the admin allowlist.";
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
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  testId: string;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}{required ? <span className="ml-1 text-[#e3212b]">*</span> : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
        data-testid={testId}
      />
    </label>
  );
}

function SectionVisibility({ section, onFlash }: { section: ContentSection; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  const toggle = () => update.mutate(
    { id: section.id, data: { isVisible: !section.isVisible } },
    {
      onSuccess: () => {
        invalidateHome(client);
        onFlash({ tone: "success", message: section.isVisible ? "Placement records hidden from the public site." : "Placement records shown on the public site." });
      },
      onError: (error) => onFlash({ tone: "error", message: errorMessage(error) }),
    },
  );
  return (
    <button type="button" onClick={toggle} disabled={update.isPending} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#0b3472] transition hover:bg-slate-50 disabled:opacity-50" data-testid="button-toggle-placement-section">
      {section.isVisible ? <><EyeOff className="h-4 w-4" /> Hide section</> : <><Eye className="h-4 w-4" /> Show section</>}
    </button>
  );
}

function PlacementItemForm({
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
  const [employer, setEmployer] = useState(text(initialContent.employer));
  const [role, setRole] = useState(text(initialContent.role));
  const [cohort, setCohort] = useState(text(initialContent.cohort));
  const [packageValue, setPackageValue] = useState(text(initialContent.package));
  const [altText, setAltText] = useState(text(initialContent.altText));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [isDemo, setIsDemo] = useState(initialContent.isDemo === true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    const content = record(initial?.content);
    setName(initial?.title || "");
    setEmployer(text(content.employer));
    setRole(text(content.role));
    setCohort(text(content.cohort));
    setPackageValue(text(content.package));
    setAltText(text(content.altText));
    setImageUrl(initial?.imageUrl || "");
    setIsDemo(content.isDemo === true);
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
  }, [initial?.id]);

  const selectFile = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
    setError("");
  };

  const upload = async () => {
    if (!selectedFile) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type)) {
      setError("Use a PNG, JPEG, or WebP photo.");
      return;
    }
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("Photos must be 2 MB or smaller.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploadInfo = await requestUpload.mutateAsync({ data: { name: selectedFile.name, size: selectedFile.size, contentType: selectedFile.type } });
      const response = await fetch(uploadInfo.uploadURL, { method: "PUT", headers: { "Content-Type": selectedFile.type }, body: selectedFile });
      if (!response.ok) throw new Error("The photo upload could not be completed.");
      setImageUrl(uploadInfo.objectPath);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      onFlash({ tone: "success", message: "Photo uploaded. Save the record to keep the change." });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUploading(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setError("Student name is required."); return; }
    if (!employer.trim()) { setError("Employer is required."); return; }
    if (!role.trim()) { setError("Role is required."); return; }
    if (imageUrl && !altText.trim()) { setError("Useful alt text is required when a photo is present."); return; }
    if (selectedFile) { setError("Upload the selected photo before saving."); return; }

    const content: CmsRecord = {
      ...initialContent,
      employer: employer.trim(),
      role: role.trim(),
      cohort: cohort.trim(),
      package: packageValue.trim(),
      altText: imageUrl ? altText.trim() : "",
      isDemo,
    };
    const common = {
      title: name.trim(),
      description: initial?.description ?? null,
      imageUrl: imageUrl || null,
      linkPath: initial?.linkPath ?? null,
      label: initial?.label ?? null,
      content,
      isVisible: initial?.isVisible ?? true,
      position: initial?.position ?? position,
    };

    if (initial) {
      const data: ContentItemUpdate = { ...common, itemType: "placement-record" };
      update.mutate({ id: initial.id, data }, {
        onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: "Placement record saved." }); onClose(); },
        onError: (failure) => setError(errorMessage(failure)),
      });
    } else {
      const data: ContentItemInput = { sectionId, itemType: "placement-record", ...common };
      create.mutate({ data }, {
        onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: "Placement record added." }); onClose(); },
        onError: (failure) => setError(errorMessage(failure)),
      });
    }
  };

  const pending = create.isPending || update.isPending || uploading;
  const preview = previewUrl || assetUrl(imageUrl);

  return (
    <form onSubmit={save} className="mt-4 rounded-2xl border border-[#0b3472]/15 bg-[#f5f8fc] p-4 sm:p-5" data-testid={`form-placement-record-${initial?.id || "new"}`}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Student name" value={name} onChange={setName} required placeholder="Enter the student name" testId={`input-placement-name-${initial?.id || "new"}`} />
        <Input label="Employer" value={employer} onChange={setEmployer} required placeholder="Enter the employer" testId={`input-placement-employer-${initial?.id || "new"}`} />
        <Input label="Role" value={role} onChange={setRole} required placeholder="Enter the role" testId={`input-placement-role-${initial?.id || "new"}`} />
        <Input label="Batch / Year" value={cohort} onChange={setCohort} placeholder="e.g. 2025–26" testId={`input-placement-cohort-${initial?.id || "new"}`} />
        <Input label="Package" value={packageValue} onChange={setPackageValue} placeholder="e.g. As reported by the college" testId={`input-placement-package-${initial?.id || "new"}`} />
        <Input label="Photo alt text" value={altText} onChange={setAltText} required={Boolean(imageUrl)} placeholder="Describe the student photo" testId={`input-placement-alt-${initial?.id || "new"}`} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[132px_1fr]">
        <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-[#e9eef7] shadow-sm">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" data-testid={`img-placement-preview-${initial?.id || "new"}`} /> : <div className="flex h-full items-center justify-center text-slate-300"><ImagePlus className="h-8 w-8" /></div>}
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#0b3472]">
            <ImagePlus className="h-5 w-5 shrink-0" />
            <span className="truncate">{selectedFile ? selectedFile.name : imageUrl ? "Choose a replacement photo" : "Choose an optional photo"}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0] || null)} data-testid={`input-placement-file-${initial?.id || "new"}`} />
          </label>
          <p className="mt-2 text-xs leading-5 text-slate-500">PNG, JPEG, or WebP. Maximum 2 MB.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedFile ? <button type="button" onClick={() => void upload()} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/20 px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/5 disabled:opacity-50" data-testid={`button-upload-placement-${initial?.id || "new"}`}><Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload photo"}</button> : null}
            {imageUrl ? <button type="button" onClick={() => { setImageUrl(""); setAltText(""); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" data-testid={`button-remove-placement-photo-${initial?.id || "new"}`}><X className="h-3.5 w-3.5" />Remove photo</button> : null}
          </div>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={isDemo} onChange={(event) => setIsDemo(event.target.checked)} className="h-4 w-4 accent-[#0b3472]" data-testid={`checkbox-placement-demo-${initial?.id || "new"}`} />
        Mark as illustrative sample
      </label>
      {error ? <p className="mt-3 text-sm font-semibold text-red-700" role="alert" data-testid={`error-placement-record-${initial?.id || "new"}`}>{error}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl px-3.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200/70" data-testid={`button-cancel-placement-${initial?.id || "new"}`}>Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2 text-sm font-bold text-white disabled:opacity-50" data-testid={`button-save-placement-${initial?.id || "new"}`}><Save className="h-4 w-4" />{pending ? "Saving…" : "Save record"}</button>
      </div>
    </form>
  );
}

function PlacementItems({ section, items, onFlash }: { section: ContentSection; items: ContentItem[]; onFlash: (flash: Flash) => void }) {
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
      onFlash({ tone: "success", message: "Placement order saved." });
    } catch (failure) {
      invalidateHome(client);
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };

  const toggle = (item: ContentItem) => update.mutate(
    { id: item.id, data: { isVisible: !item.isVisible } },
    {
      onSuccess: () => { invalidateHome(client); onFlash({ tone: "success", message: item.isVisible ? "Record unpublished." : "Record published." }); },
      onError: (failure) => onFlash({ tone: "error", message: errorMessage(failure) }),
    },
  );

  const deleteItem = (item: ContentItem) => {
    if (!window.confirm(`Delete “${item.title}” from placement records? This cannot be undone.`)) return;
    remove.mutate({ id: item.id }, {
      onSuccess: () => { invalidateHome(client); setEditing(null); onFlash({ tone: "success", message: "Placement record deleted." }); },
      onError: (failure) => onFlash({ tone: "error", message: errorMessage(failure) }),
    });
  };

  return (
    <div className="mt-8" data-testid="placement-record-list">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-[#e3212b]">Records</p>
          <h3 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Placement details</h3>
          <p className="mt-1 max-w-xl text-sm leading-5 text-slate-500">Manage every record shown in the public placement section. Hidden records remain available here for review.</p>
        </div>
        <button type="button" onClick={() => setEditing((current) => current === "new" ? null : "new")} className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/5" data-testid="button-add-placement-record">
          <Plus className="h-4 w-4" /> {editing === "new" ? "Close form" : "Add record"}
        </button>
      </div>

      {editing === "new" ? <section className="mb-5 rounded-2xl border border-[#0b3472]/15 bg-[#f5f8fc] p-4 sm:p-5" data-testid="panel-new-placement-record"><div className="flex items-start justify-between gap-3"><div><h4 className="font-display text-lg font-extrabold text-[#0b3472]">Add a placement record</h4><p className="mt-1 text-sm text-slate-500">Enter only details the college has authorized for publication.</p></div><button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white" data-testid="button-close-new-placement">Close</button></div><PlacementItemForm sectionId={section.id} position={nextPosition} onFlash={onFlash} onClose={() => setEditing(null)} /></section> : null}

      {ordered.length === 0 && editing !== "new" ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-500" data-testid="empty-admin-placement-records">No placement records yet. Add the first authorized record.</div>
      ) : (
        <div className="space-y-3">
          {ordered.map((item, index) => {
            const content = record(item.content);
            return (
              <div key={item.id} className={`rounded-2xl border border-slate-200 bg-white p-4 ${item.isVisible ? "" : "bg-slate-50"}`} data-testid={`row-placement-record-${item.id}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#e9eef7]">
                    {item.imageUrl ? <img src={assetUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-sm font-extrabold text-[#0b3472]">{initials(item.title)}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#0b3472]" data-testid={`text-admin-placement-name-${item.id}`}>{item.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{text(content.employer, "Employer not set")} · {text(content.role, "Role not set")} · {item.isVisible ? "Published" : "Unpublished"}{content.isDemo === true ? " · Illustrative sample" : ""}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <button type="button" onClick={() => toggle(item)} disabled={update.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`${item.isVisible ? "Unpublish" : "Publish"} ${item.title}`} data-testid={`button-toggle-placement-${item.id}`}>{item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    <button type="button" onClick={() => void move(item, -1)} disabled={index === 0 || update.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${item.title} up`} data-testid={`button-move-placement-up-${item.id}`}><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void move(item, 1)} disabled={index === ordered.length - 1 || update.isPending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${item.title} down`} data-testid={`button-move-placement-down-${item.id}`}><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setEditing(editing === item.id ? null : item.id)} className="rounded-lg px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/5" data-testid={`button-edit-placement-${item.id}`}>{editing === item.id ? "Close" : "Edit"}</button>
                    <button type="button" onClick={() => deleteItem(item)} disabled={remove.isPending} className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${item.title}`} data-testid={`button-delete-placement-${item.id}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {editing === item.id ? <PlacementItemForm key={item.id} sectionId={section.id} initial={item} position={item.position} onFlash={onFlash} onClose={() => setEditing(null)} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export type AdminPlacementRecordsEditorProps = {
  home: HomePage;
  onFlash: (flash: Flash) => void;
};

export default function AdminPlacementRecordsEditor({ home, onFlash }: AdminPlacementRecordsEditorProps) {
  const section = home.sections.find((candidate) => candidate.sectionKey === "placement-records");
  const items = section ? home.items.filter((item) => item.sectionId === section.id && item.itemType === "placement-record") : [];

  if (!section) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900" role="alert" data-testid="missing-placement-records-section">The placement records section is not available in the current CMS response. Create the section in the content service, then refresh this editor.</div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-placement-records-editor">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[#e3212b]">Placement records</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]">Global Placement Record</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Keep concise, authorized placement details accurate. The public heading is fixed and cannot be changed here.</p>
          </div>
          <SectionVisibility section={section} onFlash={onFlash} />
        </div>
        <PlacementItems section={section} items={items} onFlash={onFlash} />
      </section>
    </div>
  );
}

export { AdminPlacementRecordsEditor };