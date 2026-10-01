import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpenText, ImagePlus, Pencil, Plus, Save, Star, Trash2, Upload, X } from "lucide-react";
import {
  getGetAdminArticleHubQueryKey,
  getGetArticleHubQueryKey,
  useCreateArticle,
  useCreateArticleCategory,
  useDeleteArticle,
  useDeleteArticleCategory,
  useGetAdminArticleHub,
  useRequestUploadUrl,
  useUpdateArticle,
  useUpdateArticleCategory,
  useUpdateArticleHubSettings,
} from "@workspace/api-client-react";
import type {
  Article,
  ArticleCategory,
  ArticleCategoryInput,
  ArticleCategoryUpdate,
  ArticleHubSettingsUpdate,
  ArticleInput,
  ArticleUpdate,
} from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string } | null;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const assetUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`) ? `${basePath}${path}` : path;
};
function errorMessage(error: unknown) {
  const candidate = error as { response?: { status?: number }; status?: number; message?: string };
  if (candidate?.response?.status === 403 || candidate?.status === 403) return "Your account is signed in, but it is not on the admin allowlist.";
  return candidate?.message || "Something went wrong. Please try again.";
}
function invalidateHub(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: getGetAdminArticleHubQueryKey() });
  void client.invalidateQueries({ queryKey: getGetArticleHubQueryKey() });
}
function slugify(value: string) {
  return value.toLocaleLowerCase().trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function dateTimeValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}
function dateToIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
const fieldClass = "mt-1.5 w-full rounded-xl border border-[#173958]/15 bg-white px-3.5 py-2.5 text-sm text-[#173958] outline-none transition placeholder:text-[#8b989e] focus:border-[#a3473c]/55 focus:ring-4 focus:ring-[#a3473c]/10";
function TextField({ label, value, onChange, required = false, multiline = false, type = "text", placeholder, testId }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; multiline?: boolean; type?: string; placeholder?: string; testId: string }) {
  return <label className="block text-sm font-bold text-[#29445b]">{label}{multiline ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} className={`${fieldClass} resize-y`} data-testid={testId} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} className={fieldClass} data-testid={testId} />}</label>;
}

function ImageUpload({ label, imageUrl, alt, onImageUrl, testId }: { label: string; imageUrl: string; alt: string; onImageUrl: (value: string) => void; testId: string }) {
  const requestUpload = useRequestUploadUrl();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const chooseFile = (selected: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : "");
    setError("");
  };
  const upload = async () => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Choose a PNG, JPEG or WebP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Images must be 5 MB or smaller."); return; }
    setUploading(true);
    setError("");
    try {
      const info = await requestUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
      const response = await fetch(info.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("The image upload could not be completed.");
      onImageUrl(info.objectPath);
      chooseFile(null);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUploading(false);
    }
  };
  return <div>
    <span className="block text-sm font-bold text-[#29445b]">{label}</span>
    <div className="mt-1.5 grid gap-3 sm:grid-cols-[150px_1fr]">
      <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[#173958]/10 bg-[#edf0eb]">
        {preview || imageUrl ? <img src={preview || assetUrl(imageUrl)} alt={preview ? "" : alt} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#8c999d]"><ImagePlus className="h-7 w-7" aria-hidden="true" /></div>}
      </div>
      <div className="flex flex-col justify-center rounded-xl border border-dashed border-[#173958]/20 bg-[#f8f8f4] p-4">
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-extrabold text-[#173958] hover:text-[#a3473c]"><ImagePlus className="h-4 w-4" aria-hidden="true" /><span className="max-w-full truncate">{file ? file.name : imageUrl ? "Choose a replacement image" : "Choose an image"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0] || null)} data-testid={`input-${testId}-file`} /></label>
        <p className="mt-2 text-xs text-[#77848a]">PNG, JPEG or WebP · up to 5 MB</p>
        {file ? <button type="button" onClick={() => void upload()} disabled={uploading} className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-[#173958] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50" data-testid={`button-upload-${testId}`}><Upload className="h-3.5 w-3.5" aria-hidden="true" />{uploading ? "Uploading…" : "Upload image"}</button> : null}
        {error ? <p className="mt-2 text-xs font-semibold text-red-700" role="alert" data-testid={`error-${testId}-upload`}>{error}</p> : null}
      </div>
    </div>
  </div>;
}

function SettingsEditor({ initial, onFlash }: { initial: { eyebrow: string; title: string; introduction: string; heroImageUrl: string | null; heroImageAlt: string }; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const update = useUpdateArticleHubSettings();
  const [eyebrow, setEyebrow] = useState(initial.eyebrow);
  const [title, setTitle] = useState(initial.title);
  const [introduction, setIntroduction] = useState(initial.introduction);
  const [heroImageUrl, setHeroImageUrl] = useState(initial.heroImageUrl || "");
  const [heroImageAlt, setHeroImageAlt] = useState(initial.heroImageAlt);
  useEffect(() => {
    setEyebrow(initial.eyebrow); setTitle(initial.title); setIntroduction(initial.introduction);
    setHeroImageUrl(initial.heroImageUrl || ""); setHeroImageAlt(initial.heroImageAlt);
  }, [initial.eyebrow, initial.title, initial.introduction, initial.heroImageUrl, initial.heroImageAlt]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const data: ArticleHubSettingsUpdate = { eyebrow: eyebrow.trim(), title: title.trim(), introduction: introduction.trim(), heroImageUrl: heroImageUrl || null, heroImageAlt: heroImageAlt.trim() };
      await update.mutateAsync({ data });
      invalidateHub(client);
      onFlash({ tone: "success", message: "Article Hub introduction saved." });
    } catch (failure) { onFlash({ tone: "error", message: errorMessage(failure) }); }
  };
  return <form onSubmit={(event) => void save(event)} className="rounded-[1.6rem] border border-[#173958]/10 bg-white p-5 shadow-[0_12px_35px_rgba(23,57,88,.04)] sm:p-7" data-testid="form-article-hub-settings">
    <div className="mb-5 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5e9dc] text-[#a3473c]"><BookOpenText className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#a3473c]">Public introduction</p><h3 className="mt-1 font-display text-xl font-extrabold text-[#173958]">Article Hub identity</h3></div></div>
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Eyebrow" value={eyebrow} onChange={setEyebrow} required testId="input-article-hub-eyebrow" />
      <TextField label="Heading" value={title} onChange={setTitle} required testId="input-article-hub-heading" />
      <div className="md:col-span-2"><TextField label="Introduction" value={introduction} onChange={setIntroduction} required multiline testId="textarea-article-hub-introduction" /></div>
      <div className="md:col-span-2"><ImageUpload label="Hero image" imageUrl={heroImageUrl} alt={heroImageAlt} onImageUrl={setHeroImageUrl} testId="article-hub-hero" /></div>
      <div className="md:col-span-2"><TextField label="Hero image alt text" value={heroImageAlt} onChange={setHeroImageAlt} testId="input-article-hub-hero-alt" /></div>
    </div>
    <div className="mt-5 flex justify-end"><button type="submit" disabled={update.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#173958] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#234c6a] disabled:opacity-50" data-testid="button-save-article-hub-settings"><Save className="h-4 w-4" aria-hidden="true" />{update.isPending ? "Saving…" : "Save introduction"}</button></div>
  </form>;
}

function CategoryManager({ categories, articles, onFlash }: { categories: ArticleCategory[]; articles: Article[]; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const create = useCreateArticleCategory();
  const update = useUpdateArticleCategory();
  const remove = useDeleteArticleCategory();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState("0");
  const [slugManual, setSlugManual] = useState(false);
  const start = (category?: ArticleCategory) => {
    setEditing(category?.id || "new");
    setName(category?.name || "");
    setSlug(category?.slug || "");
    setDescription(category?.description || "");
    setPosition(String(category?.position ?? categories.length));
    setSlugManual(Boolean(category));
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanSlug = slugify(slug);
    if (!cleanName || !cleanSlug) { onFlash({ tone: "error", message: "A category name and valid slug are required." }); return; }
    try {
      if (editing === "new") {
        const data: ArticleCategoryInput = { name: cleanName, slug: cleanSlug, description: description.trim(), position: Math.max(0, Number(position) || 0) };
        await create.mutateAsync({ data });
      } else if (editing) {
        const data: ArticleCategoryUpdate = { name: cleanName, slug: cleanSlug, description: description.trim(), position: Math.max(0, Number(position) || 0) };
        await update.mutateAsync({ id: editing, data });
      }
      invalidateHub(client);
      setEditing(null);
      onFlash({ tone: "success", message: editing === "new" ? "Category created." : "Category saved." });
    } catch (failure) { onFlash({ tone: "error", message: errorMessage(failure) }); }
  };
  const deleteCategory = async (category: ArticleCategory) => {
    if (!window.confirm(`Delete the “${category.name}” category? Categories assigned to articles may not be deleted.`)) return;
    try {
      await remove.mutateAsync({ id: category.id });
      invalidateHub(client);
      onFlash({ tone: "success", message: "Category deleted." });
    } catch (failure) { onFlash({ tone: "error", message: errorMessage(failure) }); }
  };
  const pending = create.isPending || update.isPending;
  return <section className="rounded-[1.6rem] border border-[#173958]/10 bg-white p-5 shadow-[0_12px_35px_rgba(23,57,88,.04)] sm:p-7" data-testid="section-article-categories">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#a3473c]">Taxonomy</p><h3 className="mt-1 font-display text-xl font-extrabold text-[#173958]">Categories</h3></div><button type="button" onClick={() => editing === "new" ? setEditing(null) : start()} className="inline-flex items-center gap-2 rounded-xl border border-[#173958]/15 px-3.5 py-2.5 text-sm font-bold text-[#173958] hover:bg-[#173958]/5" data-testid="button-add-article-category"><Plus className="h-4 w-4" aria-hidden="true" />{editing === "new" ? "Close" : "Add category"}</button></div>
    {editing ? <form onSubmit={(event) => void save(event)} className="mt-5 rounded-2xl bg-[#f5f5ef] p-4 sm:p-5" data-testid="form-article-category">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" value={name} onChange={(value) => { setName(value); if (!slugManual) setSlug(slugify(value)); }} required testId="input-article-category-name" />
        <TextField label="Slug" value={slug} onChange={(value) => { setSlug(value); setSlugManual(true); }} required testId="input-article-category-slug" />
        <TextField label="Description" value={description} onChange={setDescription} multiline testId="textarea-article-category-description" />
        <TextField label="Display position" value={position} onChange={setPosition} type="number" testId="input-article-category-position" />
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#536575] hover:bg-white" data-testid="button-cancel-article-category">Cancel</button><button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[#173958] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50" data-testid="button-save-article-category"><Save className="h-4 w-4" aria-hidden="true" />{pending ? "Saving…" : "Save category"}</button></div>
    </form> : null}
    <div className="mt-5 divide-y divide-[#173958]/10">
      {categories.length ? categories.map((category) => {
        const assigned = articles.filter((article) => article.categoryId === category.id).length;
        return <div key={category.id} className="flex flex-wrap items-center gap-3 py-3" data-testid={`row-article-category-${category.id}`}>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#173958]">{category.name}<span className="ml-2 rounded-full bg-[#edf0eb] px-2 py-0.5 text-[10px] font-bold text-[#65727b]">{assigned} {assigned === 1 ? "article" : "articles"}</span></p><p className="mt-1 text-xs text-[#79868c]">/{category.slug}{category.description ? ` · ${category.description}` : ""}</p></div>
          <button type="button" onClick={() => start(category)} className="rounded-lg p-2 text-[#536575] hover:bg-[#edf0eb] hover:text-[#173958]" aria-label={`Edit ${category.name}`} data-testid={`button-edit-category-${category.id}`}><Pencil className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" onClick={() => void deleteCategory(category)} disabled={remove.isPending} className="rounded-lg p-2 text-[#a13e39] hover:bg-[#f8e9e4] disabled:opacity-50" aria-label={`Delete ${category.name}`} data-testid={`button-delete-category-${category.id}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
        </div>;
      }) : <p className="py-8 text-center text-sm text-[#79868c]">No categories yet.</p>}
    </div>
  </section>;
}

function ArticleEditor({ initial, categories, position, onFlash, onClose }: { initial?: Article; categories: ArticleCategory[]; position: number; onFlash: (flash: Flash) => void; onClose: () => void }) {
  const client = useQueryClient();
  const create = useCreateArticle();
  const update = useUpdateArticle();
  const [categoryId, setCategoryId] = useState(initial?.categoryId || categories[0]?.id || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [body, setBody] = useState(initial?.body || "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [publishedAt, setPublishedAt] = useState(dateTimeValue(initial?.publishedAt));
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [articlePosition, setArticlePosition] = useState(String(initial?.position ?? position));
  const [slugManual, setSlugManual] = useState(Boolean(initial));
  const [error, setError] = useState("");
  useEffect(() => {
    setCategoryId(initial?.categoryId || categories[0]?.id || "");
    setTitle(initial?.title || ""); setSlug(initial?.slug || ""); setExcerpt(initial?.excerpt || "");
    setBody(initial?.body || ""); setImageUrl(initial?.imageUrl || ""); setImageAlt(initial?.imageAlt || "");
    setAuthor(initial?.author || ""); setPublishedAt(dateTimeValue(initial?.publishedAt));
    setIsPublished(initial?.isPublished ?? false); setIsFeatured(initial?.isFeatured ?? false);
    setArticlePosition(String(initial?.position ?? position)); setSlugManual(Boolean(initial)); setError("");
  }, [initial?.id, categories, position]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const cleanSlug = slugify(slug);
    if (!categoryId) { setError("Create a category before adding an article."); return; }
    if (!cleanSlug) { setError("A valid article slug is required."); return; }
    const common = {
      categoryId, slug: cleanSlug, title: title.trim(), excerpt: excerpt.trim(), body: body.trim(),
      imageUrl: imageUrl || null, imageAlt: imageAlt.trim(), author: author.trim(),
      publishedAt: dateToIso(publishedAt), isPublished, isFeatured,
      position: Math.max(0, Number(articlePosition) || 0),
    };
    try {
      if (initial) {
        const data: ArticleUpdate = common;
        await update.mutateAsync({ id: initial.id, data });
      } else {
        const data: ArticleInput = common;
        await create.mutateAsync({ data });
      }
      invalidateHub(client);
      onFlash({ tone: "success", message: initial ? "Article saved." : "Article created." });
      onClose();
    } catch (failure) { setError(errorMessage(failure)); }
  };
  const pending = create.isPending || update.isPending;
  return <form onSubmit={(event) => void save(event)} className="mt-4 rounded-2xl border border-[#173958]/10 bg-[#f6f6f1] p-4 sm:p-6" data-testid={`form-article-${initial?.id || "new"}`}>
    <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a3473c]">{initial ? "Edit article" : "New article"}</p><h4 className="mt-1 font-display text-xl font-extrabold text-[#173958]">{initial ? initial.title : "Create an article"}</h4></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[#536575] hover:bg-white" aria-label="Close article editor" data-testid="button-close-article-editor"><X className="h-4 w-4" aria-hidden="true" /></button></div>
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Title" value={title} onChange={(value) => { setTitle(value); if (!slugManual) setSlug(slugify(value)); }} required testId="input-article-title" />
      <TextField label="Slug" value={slug} onChange={(value) => { setSlug(value); setSlugManual(true); }} required testId="input-article-slug" />
      <label className="block text-sm font-bold text-[#29445b]">Category<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required className={fieldClass} data-testid="select-article-category">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <TextField label="Author" value={author} onChange={setAuthor} required testId="input-article-author" />
      <div className="md:col-span-2"><TextField label="Excerpt" value={excerpt} onChange={setExcerpt} required multiline testId="textarea-article-excerpt" /></div>
      <div className="md:col-span-2"><TextField label="Full article body" value={body} onChange={setBody} required multiline testId="textarea-article-body" /></div>
      <div className="md:col-span-2"><ImageUpload label="Article image" imageUrl={imageUrl} alt={imageAlt} onImageUrl={setImageUrl} testId={`article-${initial?.id || "new"}`} /></div>
      <div className="md:col-span-2"><TextField label="Image alt text" value={imageAlt} onChange={setImageAlt} testId="input-article-image-alt" /></div>
      <TextField label="Publication date and time" value={publishedAt} onChange={setPublishedAt} type="datetime-local" testId="input-article-publication-date" />
      <TextField label="Display position" value={articlePosition} onChange={setArticlePosition} type="number" testId="input-article-position" />
    </div>
    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#173958]/10 pt-4">
      <label className="inline-flex items-center gap-2 text-sm font-bold text-[#29445b]"><input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} className="h-4 w-4 accent-[#173958]" data-testid="checkbox-article-published" />Published</label>
      <label className="inline-flex items-center gap-2 text-sm font-bold text-[#29445b]"><input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} className="h-4 w-4 accent-[#a3473c]" data-testid="checkbox-article-featured" /><Star className="h-4 w-4 text-[#a3473c]" aria-hidden="true" />Featured article</label>
    </div>
    {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert" data-testid="error-article-form">{error}</p> : null}
    <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#536575] hover:bg-white" data-testid="button-cancel-article">Cancel</button><button type="submit" disabled={pending || !categories.length} className="inline-flex items-center gap-2 rounded-xl bg-[#173958] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50" data-testid="button-save-article"><Save className="h-4 w-4" aria-hidden="true" />{pending ? "Saving…" : initial ? "Save article" : "Create article"}</button></div>
  </form>;
}

function ArticlesManager({ articles, categories, onFlash }: { articles: Article[]; categories: ArticleCategory[]; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const remove = useDeleteArticle();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const ordered = useMemo(() => [...articles].sort((a, b) => a.position - b.position), [articles]);
  const nextPosition = ordered.length ? Math.max(...ordered.map((article) => article.position)) + 1 : 0;
  const deleteArticle = async (article: Article) => {
    if (!window.confirm(`Delete “${article.title}” from the Article Hub? This cannot be undone.`)) return;
    try {
      await remove.mutateAsync({ id: article.id });
      invalidateHub(client);
      onFlash({ tone: "success", message: "Article deleted." });
    } catch (failure) { onFlash({ tone: "error", message: errorMessage(failure) }); }
  };
  return <section className="rounded-[1.6rem] border border-[#173958]/10 bg-white p-5 shadow-[0_12px_35px_rgba(23,57,88,.04)] sm:p-7" data-testid="section-article-manager">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#a3473c]">Publishing desk</p><h3 className="mt-1 font-display text-xl font-extrabold text-[#173958]">Articles</h3><p className="mt-1 text-sm text-[#79868c]">Edit article details and arrange their display order.</p></div><button type="button" onClick={() => setEditing((value) => value === "new" ? null : "new")} disabled={!categories.length} className="inline-flex items-center gap-2 rounded-xl bg-[#173958] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#234c6a] disabled:opacity-50" data-testid="button-add-article"><Plus className="h-4 w-4" aria-hidden="true" />{editing === "new" ? "Close form" : "Add article"}</button></div>
    {editing === "new" ? <ArticleEditor key="article-new" categories={categories} position={nextPosition} onFlash={onFlash} onClose={() => setEditing(null)} /> : null}
    {!categories.length ? <div className="mt-5 rounded-xl border border-[#ead9bd] bg-[#fbf4e6] p-4 text-sm text-[#6c5635]">Create a category before adding an article.</div> : null}
    {ordered.length ? <div className="mt-5 space-y-3">{ordered.map((article) => <div key={article.id} className="rounded-2xl border border-[#173958]/10 p-4" data-testid={`row-article-${article.id}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[#edf0eb]">{article.imageUrl ? <img src={assetUrl(article.imageUrl)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#8c999d]"><BookOpenText className="h-5 w-5" aria-hidden="true" /></div>}</div>
        <div className="min-w-0 flex-1"><p className="truncate font-extrabold text-[#173958]">{article.title}</p><p className="mt-1 text-xs text-[#79868c]">{article.categoryName} · {article.isPublished ? "Published" : "Draft"}{article.isFeatured ? " · Featured" : ""} · Position {article.position}</p><p className="mt-1 truncate text-xs text-[#79868c]">/{article.slug}</p></div>
        {article.isFeatured ? <span className="inline-flex items-center gap-1 rounded-full bg-[#f6edda] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#8a6423]"><Star className="h-3 w-3" aria-hidden="true" />Featured</span> : null}
        <div className="flex items-center gap-1"><button type="button" onClick={() => setEditing(editing === article.id ? null : article.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-[#173958] hover:bg-[#edf0eb]" data-testid={`button-edit-article-${article.id}`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />{editing === article.id ? "Close" : "Edit"}</button><button type="button" onClick={() => void deleteArticle(article)} disabled={remove.isPending} className="rounded-lg p-2 text-[#a13e39] hover:bg-[#f8e9e4] disabled:opacity-50" aria-label={`Delete ${article.title}`} data-testid={`button-delete-article-${article.id}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>
      </div>
      {editing === article.id ? <ArticleEditor key={article.id} initial={article} categories={categories} position={article.position} onFlash={onFlash} onClose={() => setEditing(null)} /> : null}
    </div>)}</div> : !editing && categories.length ? <div className="mt-5 rounded-2xl border border-dashed border-[#173958]/15 px-6 py-12 text-center" data-testid="empty-admin-articles"><BookOpenText className="mx-auto h-8 w-8 text-[#a3473c]" aria-hidden="true" /><p className="mt-3 font-display text-lg font-extrabold text-[#173958]">No articles yet</p><p className="mt-1 text-sm text-[#79868c]">Add an article to begin the journal.</p></div> : null}
  </section>;
}

export default function AdminArticleHubEditor({ onFlash }: { onFlash: (flash: Flash) => void }) {
  const hub = useGetAdminArticleHub({ query: { queryKey: getGetAdminArticleHubQueryKey() } });
  if (hub.isLoading) return <div className="space-y-5" aria-busy="true" data-testid="status-admin-article-hub-loading"><div className="h-28 animate-pulse rounded-3xl bg-[#e9ece6]" /><div className="h-56 animate-pulse rounded-3xl bg-[#e9ece6]" /><div className="h-72 animate-pulse rounded-3xl bg-[#e9ece6]" /></div>;
  if (hub.isError || !hub.data) return <div className="rounded-3xl border border-red-200 bg-red-50 p-7" role="alert" data-testid="status-admin-article-hub-error"><h2 className="font-display text-xl font-extrabold text-red-900">Article Hub could not load.</h2><p className="mt-2 text-sm text-red-800">{errorMessage(hub.error)}</p><button type="button" onClick={() => void hub.refetch()} className="mt-4 rounded-xl bg-[#173958] px-4 py-2.5 text-sm font-bold text-white" data-testid="button-retry-admin-article-hub">Retry</button></div>;
  return <div className="space-y-5" data-testid="admin-article-hub-editor">
    <header className="rounded-[1.6rem] bg-[#173958] px-5 py-6 text-white sm:px-7"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#e7bd69]">Pages / Knowledge Hub</p><h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Article Hub</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Manage the journal introduction, subjects and published reading.</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-white/80"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{hub.data.articles.length} articles</span><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{hub.data.categories.length} categories</span><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{hub.data.articles.filter((article) => article.isPublished).length} published</span></div></header>
    <SettingsEditor initial={hub.data.settings} onFlash={onFlash} />
    <CategoryManager categories={hub.data.categories} articles={hub.data.articles} onFlash={onFlash} />
    <ArticlesManager articles={hub.data.articles} categories={hub.data.categories} onFlash={onFlash} />
  </div>;
}