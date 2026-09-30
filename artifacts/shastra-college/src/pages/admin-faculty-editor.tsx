import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
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
import type { ContentItem, ContentItemInput, ContentSection, JsonObject } from "@workspace/api-client-react";

type RecordValue = Record<string, unknown>;
type Flash = { tone: "success" | "error"; message: string } | null;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const leadershipRoles = [
  "Chairman",
  "Board Director",
  "Principal",
  "Faculty",
] as const;
type LeadershipRole = (typeof leadershipRoles)[number];
type ProfileForm = {
  name: string;
  professionalTitle: string;
  leadershipRole: LeadershipRole;
  showOnAboutBoard: boolean;
  shortDescription: string;
  qualifications: string;
  subjects: string;
  experience: string;
  biography: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  website: string;
  imageUrl: string;
  isVisible: boolean;
  showOnHome: boolean;
};

function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : {};
}
function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
function isLeadershipProfile(item: ContentItem) {
  return text(record(item.content).leadershipRole, "Faculty") !== "Faculty";
}
function errorMessage(error: unknown) {
  const candidate = error as { message?: string; status?: number; response?: { status?: number } };
  if (candidate?.status === 403 || candidate?.response?.status === 403) return "Your account is signed in, but it is not on the admin allowlist.";
  return candidate?.message || "Something went wrong. Please try again.";
}
function assetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)
    ? `${basePath}${path}`
    : path;
}
function contentFor(item?: ContentItem): ProfileForm {
  const content = record(item?.content);
  const links = record(content.socialLinks);
  const subjects = Array.isArray(content.subjectsTaught) ? content.subjectsTaught.filter((subject): subject is string => typeof subject === "string") : [];
  const savedRole = text(content.leadershipRole);
  return {
    name: item?.title || "",
    professionalTitle: text(content.professionalTitle),
    leadershipRole: leadershipRoles.includes(savedRole as LeadershipRole)
      ? (savedRole as LeadershipRole)
      : "Faculty",
    showOnAboutBoard: content.showOnAboutBoard === true,
    shortDescription: text(content.shortDescription, item?.description || ""),
    qualifications: text(content.qualifications),
    subjects: subjects.join(", "),
    experience: text(content.experience),
    biography: text(content.biography),
    linkedin: text(links.linkedin),
    facebook: text(links.facebook),
    instagram: text(links.instagram),
    website: text(links.website),
    imageUrl: item?.imageUrl || "",
    isVisible: item?.isVisible ?? true,
    showOnHome: content.showOnHome === true,
  };
}
function Input({ label, value, onChange, placeholder, multiline = false, type = "text", required = false, testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; type?: string; required?: boolean; testId: string }) {
  const className = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0B3472]/50 focus:ring-4 focus:ring-[#0B3472]/10";
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} rows={4} className={className} data-testid={testId} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className={className} data-testid={testId} />}
    </label>
  );
}
function invalidate(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: getGetAdminCmsPageQueryKey("faculty") });
  void client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("faculty") });
}

function ProfileFormEditor({ section, initial, position, onClose, onFlash }: { section: ContentSection; initial?: ContentItem; position: number; onClose: () => void; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const create = useCreateContentItem();
  const update = useUpdateContentItem();
  const upload = useRequestUploadUrl();
  const [form, setForm] = useState<ProfileForm>(() => contentFor(initial));
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => setForm(contentFor(initial)), [initial?.id]);
  const set = <Key extends keyof ProfileForm>(key: Key, value: ProfileForm[Key]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadPortrait = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for the portrait.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const response = await upload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
      const result = await fetch(response.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!result.ok) throw new Error("The portrait upload could not be completed.");
      set("imageUrl", response.objectPath);
      onFlash({ tone: "success", message: "Portrait uploaded. Save the profile to publish the change." });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUploading(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.professionalTitle.trim()) {
      setError("Add a name and professional title.");
      return;
    }
    const content: JsonObject = {
      ...(initial?.content || {}),
      professionalTitle: form.professionalTitle.trim(),
      leadershipRole: form.leadershipRole,
      showOnAboutBoard: form.showOnAboutBoard,
      shortDescription: form.shortDescription.trim(),
      qualifications: form.qualifications.trim(),
      subjectsTaught: form.subjects.split(",").map((subject) => subject.trim()).filter(Boolean),
      experience: form.experience.trim(),
      biography: form.biography.trim(),
      socialLinks: { linkedin: form.linkedin.trim(), facebook: form.facebook.trim(), instagram: form.instagram.trim(), website: form.website.trim() },
      showOnHome: form.showOnHome,
    };
    const data: ContentItemInput = {
      sectionId: section.id,
      itemType: "faculty-profile",
      title: form.name.trim(),
      description: form.shortDescription.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      linkPath: null,
      label: null,
      content,
      isVisible: form.isVisible,
      position: initial?.position ?? position,
    };
    const options = {
      onSuccess: () => {
        invalidate(client);
        onFlash({ tone: "success", message: initial ? "Faculty profile saved." : "Faculty profile added." });
        onClose();
      },
      onError: (failure: unknown) => setError(errorMessage(failure)),
    };
    if (initial) update.mutate({ id: initial.id, data }, options);
    else create.mutate({ data }, options);
  };
  const pending = create.isPending || update.isPending || uploading;
  return (
    <form onSubmit={save} className="rounded-2xl border border-[#0B3472]/15 bg-[#f5f8fc] p-4 sm:p-6" data-testid={`form-faculty-profile-${initial?.id || "new"}`}>
      <div className="flex items-start justify-between gap-4">
        <div><p className="eyebrow text-[#E3212B]">{initial ? "Edit profile" : "New profile"}</p><h3 className="mt-1 font-display text-2xl font-extrabold text-[#0B3472]">{initial ? form.name || "Faculty profile" : "Add faculty profile"}</h3></div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-200" aria-label="Close profile editor" data-testid="button-close-faculty-editor"><X className="h-5 w-5" /></button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Input label="Name" value={form.name} onChange={(value) => set("name", value)} required testId="input-faculty-name" />
        <Input label="Professional title" value={form.professionalTitle} onChange={(value) => set("professionalTitle", value)} required placeholder="Senior lecturer" testId="input-faculty-title" />
        <label className="block text-sm font-semibold text-slate-700">
          Leadership role
          <select
            value={form.leadershipRole}
            onChange={(event) =>
              set("leadershipRole", event.currentTarget.value as LeadershipRole)
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0B3472]/50 focus:ring-4 focus:ring-[#0B3472]/10"
            data-testid="select-faculty-leadership-role"
          >
            {leadershipRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <Input label="Short description" value={form.shortDescription} onChange={(value) => set("shortDescription", value)} multiline testId="input-faculty-short-description" />
        <Input label="Qualifications" value={form.qualifications} onChange={(value) => set("qualifications", value)} multiline testId="input-faculty-qualifications" />
        <Input label="Subjects taught" value={form.subjects} onChange={(value) => set("subjects", value)} placeholder="Mathematics, Statistics, Economics" testId="input-faculty-subjects" />
        <Input label="Experience" value={form.experience} onChange={(value) => set("experience", value)} placeholder="12 years" testId="input-faculty-experience" />
      </div>
      <div className="mt-4"><Input label="Full biography" value={form.biography} onChange={(value) => set("biography", value)} multiline testId="textarea-faculty-biography" /></div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-bold text-[#0B3472]">Portrait and professional links</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex items-end gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#e7edf5]">{form.imageUrl ? <img src={assetUrl(form.imageUrl)} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="mx-auto mt-6 h-7 w-7 text-[#0B3472]/30" />}</div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#0B3472]/20 px-3 py-2.5 text-sm font-bold text-[#0B3472] hover:bg-[#0B3472]/5">
              <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload portrait"}
              <input type="file" accept="image/*" className="sr-only" onChange={uploadPortrait} disabled={pending} data-testid="input-upload-faculty-portrait" />
            </label>
          </div>
          <div />
          <Input label="LinkedIn URL" value={form.linkedin} onChange={(value) => set("linkedin", value)} type="url" testId="input-faculty-linkedin" />
          <Input label="Facebook URL" value={form.facebook} onChange={(value) => set("facebook", value)} type="url" testId="input-faculty-facebook" />
          <Input label="Instagram URL" value={form.instagram} onChange={(value) => set("instagram", value)} type="url" testId="input-faculty-instagram" />
          <Input label="Website URL" value={form.website} onChange={(value) => set("website", value)} type="url" testId="input-faculty-website" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.isVisible} onChange={(event) => set("isVisible", event.target.checked)} className="h-4 w-4 accent-[#0B3472]" data-testid="checkbox-faculty-published" /> Published on Faculty page</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.showOnHome} onChange={(event) => set("showOnHome", event.target.checked)} className="h-4 w-4 accent-[#E3212B]" data-testid="checkbox-faculty-home-preview" /> Show on Home Preview</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.showOnAboutBoard} onChange={(event) => set("showOnAboutBoard", event.target.checked)} className="h-4 w-4 accent-[#E3212B]" data-testid="checkbox-faculty-about-board" /> Show on About Board</label>
      </div>
      {error ? <p className="mt-4 text-sm font-semibold text-red-700" role="alert" data-testid="error-faculty-profile">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/70" data-testid="button-cancel-faculty-profile">Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[#0B3472] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#082859] disabled:opacity-50" data-testid="button-save-faculty-profile"><Save className="h-4 w-4" /> {pending ? "Saving…" : "Save profile"}</button>
      </div>
    </form>
  );
}

function ConfirmDelete({ item, onCancel, onConfirm, pending }: { item: ContentItem; onCancel: () => void; onConfirm: () => void; pending: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1b35]/50 p-5" role="presentation">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="delete-faculty-title">
        <p className="eyebrow text-[#E3212B]">Remove profile</p>
        <h2 id="delete-faculty-title" className="mt-2 font-display text-2xl font-extrabold text-[#0B3472]">Delete {item.title}?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">This removes the profile from the Faculty page and cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100" data-testid="button-cancel-delete-faculty">Keep profile</button><button type="button" onClick={onConfirm} disabled={pending} className="rounded-xl bg-[#b71927] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50" data-testid="button-confirm-delete-faculty">{pending ? "Deleting…" : "Delete profile"}</button></div>
      </div>
    </div>
  );
}

export default function AdminFacultyEditor() {
  const client = useQueryClient();
  const query = useGetAdminCmsPage("faculty", { query: { enabled: true, queryKey: getGetAdminCmsPageQueryKey("faculty") } });
  const updateSection = useUpdateContentSection();
  const updateItem = useUpdateContentItem();
  const removeItem = useDeleteContentItem();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [confirming, setConfirming] = useState<ContentItem | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const section = query.data?.sections.find((candidate) => candidate.sectionKey === "faculty");
  const items = useMemo(() => query.data?.items.filter((item) => item.sectionId === section?.id && item.itemType === "faculty-profile").sort((a, b) => {
    return Number(isLeadershipProfile(b)) - Number(isLeadershipProfile(a)) || a.position - b.position;
  }) || [], [query.data?.items, section?.id]);
  const visibleCount = items.filter((item) => item.isVisible).length;

  const toggleSection = () => {
    if (!section) return;
    updateSection.mutate({ id: section.id, data: { isVisible: !section.isVisible } }, { onSuccess: () => { invalidate(client); setFlash({ tone: "success", message: `Faculty section ${section.isVisible ? "hidden" : "published"}.` }); }, onError: (error) => setFlash({ tone: "error", message: errorMessage(error) }) });
  };
  const toggleItem = (item: ContentItem) => {
    updateItem.mutate({ id: item.id, data: { isVisible: !item.isVisible } }, { onSuccess: () => { invalidate(client); setFlash({ tone: "success", message: `${item.title} ${item.isVisible ? "unpublished" : "published"}.` }); }, onError: (error) => setFlash({ tone: "error", message: errorMessage(error) }) });
  };
  const move = async (item: ContentItem, direction: -1 | 1) => {
    const index = items.findIndex((candidate) => candidate.id === item.id);
    const target = items[index + direction];
    if (!target) return;
    if (isLeadershipProfile(item) !== isLeadershipProfile(target)) return;
    try {
      await Promise.all([updateItem.mutateAsync({ id: item.id, data: { position: target.position } }), updateItem.mutateAsync({ id: target.id, data: { position: item.position } })]);
      invalidate(client);
      setFlash({ tone: "success", message: "Faculty order saved." });
    } catch (error) { setFlash({ tone: "error", message: errorMessage(error) }); }
  };
  const deleteItem = () => {
    if (!confirming) return;
    removeItem.mutate({ id: confirming.id }, { onSuccess: () => { invalidate(client); setConfirming(null); setFlash({ tone: "success", message: "Faculty profile deleted." }); }, onError: (error) => setFlash({ tone: "error", message: errorMessage(error) }) });
  };

  if (query.isLoading) return <div className="space-y-4 p-4 sm:p-8" data-testid="status-admin-faculty-loading"><div className="h-9 w-64 animate-pulse rounded bg-slate-200" /><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /></div>;
  if (query.isError || !query.data) return <div className="p-6" data-testid="status-admin-faculty-error"><div className="rounded-2xl border border-red-200 bg-red-50 p-5"><p className="font-bold text-red-800">Faculty editor could not load.</p><button type="button" onClick={() => query.refetch()} className="mt-3 rounded-lg bg-[#0B3472] px-3 py-2 text-sm font-bold text-white" data-testid="button-retry-admin-faculty">Try again</button></div></div>;
  if (!section) return <div className="p-6" data-testid="empty-admin-faculty"><div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8"><h2 className="font-display text-2xl font-extrabold text-[#0B3472]">Faculty section not found</h2><p className="mt-2 text-sm text-slate-600">Ask an administrator to create the Faculty CMS section before adding profiles.</p></div></div>;

  return (
    <div className="min-h-full bg-[#f7f9fc] p-4 sm:p-8" data-testid="admin-faculty-editor">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div><p className="eyebrow text-[#E3212B]">Pages / Faculty</p><h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[#0B3472]">Faculty profiles</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Keep the teaching team’s public profiles accurate, welcoming, and easy for families to understand.</p></div>
          <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3472] px-4 py-3 text-sm font-bold text-white hover:bg-[#082859]" data-testid="button-add-faculty"><Plus className="h-4 w-4" /> Add profile</button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#0B3472]/10 bg-white p-4">
          <div><p className="text-sm font-bold text-[#0B3472]">{visibleCount} of {items.length} profiles published</p><p className="mt-1 text-xs text-slate-500">Leadership profiles appear first, followed by teaching faculty.</p></div>
          <button type="button" onClick={toggleSection} disabled={updateSection.isPending} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#0B3472] hover:bg-slate-50 disabled:opacity-50" data-testid="button-toggle-faculty-section">{section.isVisible ? <><EyeOff className="h-4 w-4" /> Hide Faculty page</> : <><Eye className="h-4 w-4" /> Publish Faculty page</>}</button>
        </div>
        {flash ? <div className={`mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${flash.tone === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`} role="status" data-testid="status-admin-faculty-message"><span className="flex items-center gap-2">{flash.tone === "success" ? <Check className="h-4 w-4" /> : null}{flash.message}</span><button type="button" onClick={() => setFlash(null)} aria-label="Dismiss message" data-testid="button-dismiss-admin-faculty-message"><X className="h-4 w-4" /></button></div> : null}
        {editing === "new" ? <div className="mt-6"><ProfileFormEditor section={section} position={items.length ? Math.max(...items.map((item) => item.position)) + 1 : 0} onClose={() => setEditing(null)} onFlash={setFlash} /></div> : null}
        <div className="mt-6 space-y-3" data-testid="list-admin-faculty">
          {items.length ? items.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(11,52,114,.04)]" data-testid={`row-admin-faculty-${item.id}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#e7edf5]">{item.imageUrl ? <img src={assetUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-display text-2xl font-extrabold text-[#0B3472]/40">{item.title.charAt(0)}</div>}</div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl font-extrabold text-[#0B3472]">{item.title}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${item.isVisible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.isVisible ? "Published" : "Unpublished"}</span></div><p className="mt-1 text-sm text-slate-500">{text(record(item.content).professionalTitle, "Faculty member")}</p><p className="mt-2 text-xs font-semibold text-[#0B3472]/70">{text(record(item.content).leadershipRole, "Faculty")} · {record(item.content).showOnAboutBoard === true ? "On About Board" : "Not on About Board"}</p><p className="mt-1 text-xs font-semibold text-slate-400">{record(item.content).showOnHome === true ? "Shown on Home Preview" : "Not on Home Preview"}</p></div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                   <button type="button" onClick={() => move(item, -1)} disabled={index === 0 || updateItem.isPending || isLeadershipProfile(items[index - 1] || item) !== isLeadershipProfile(item)} className="rounded-lg border border-slate-200 p-2 text-[#0B3472] hover:bg-slate-50 disabled:opacity-30" aria-label={`Move ${item.title} up`} data-testid={`button-move-faculty-up-${item.id}`}><ArrowUp className="h-4 w-4" /></button>
                   <button type="button" onClick={() => move(item, 1)} disabled={index === items.length - 1 || updateItem.isPending || isLeadershipProfile(items[index + 1] || item) !== isLeadershipProfile(item)} className="rounded-lg border border-slate-200 p-2 text-[#0B3472] hover:bg-slate-50 disabled:opacity-30" aria-label={`Move ${item.title} down`} data-testid={`button-move-faculty-down-${item.id}`}><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => toggleItem(item)} disabled={updateItem.isPending} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#0B3472] hover:bg-slate-50 disabled:opacity-50" data-testid={`button-toggle-faculty-${item.id}`}>{item.isVisible ? "Unpublish" : "Publish"}</button>
                  <button type="button" onClick={() => setEditing(item.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#0B3472] hover:bg-slate-50" data-testid={`button-edit-faculty-${item.id}`}>Edit</button>
                  <button type="button" onClick={() => setConfirming(item)} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50" aria-label={`Delete ${item.title}`} data-testid={`button-delete-faculty-${item.id}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {editing === item.id ? <div className="mt-4"><ProfileFormEditor section={section} initial={item} position={item.position} onClose={() => setEditing(null)} onFlash={setFlash} /></div> : null}
            </div>
          )) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-display text-2xl font-extrabold text-[#0B3472]">No faculty profiles yet</h2><p className="mt-2 text-sm text-slate-500">Add the first profile to begin shaping the public Faculty page.</p></div>}
        </div>
      </div>
      {confirming ? <ConfirmDelete item={confirming} onCancel={() => setConfirming(null)} onConfirm={deleteItem} pending={removeItem.isPending} /> : null}
    </div>
  );
}