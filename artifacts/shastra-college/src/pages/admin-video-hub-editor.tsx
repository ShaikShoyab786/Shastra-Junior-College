import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminVideoHubQueryKey,
  getGetVideoHubQueryKey,
  useCreateVideo,
  useCreateVideoCategory,
  useDeleteVideo,
  useDeleteVideoCategory,
  useGetAdminVideoHub,
  useRequestUploadUrl,
  useUpdateVideo,
  useUpdateVideoCategory,
  useUpdateVideoHubSettings,
} from "@workspace/api-client-react";
import type {
  Video,
  VideoCategory,
  VideoCategoryInput,
  VideoCategoryUpdate,
  VideoHubSettingsUpdate,
  VideoInput,
  VideoUpdate,
} from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string } | null;
type Section = "videos" | "categories" | "settings";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const assetUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)
    ? `${basePath}${path}`
    : path;
};
const fieldClass =
  "mt-1.5 w-full rounded-xl border border-[#173958]/15 bg-white px-3.5 py-2.5 text-sm text-[#173958] outline-none transition placeholder:text-[#8b989e] focus:border-[#a3473c]/55 focus:ring-4 focus:ring-[#a3473c]/10";

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: { status?: number; data?: { error?: string } };
    status?: number;
    message?: string;
  };
  if (candidate?.response?.status === 403 || candidate?.status === 403) {
    return "Your account is signed in, but it is not on the admin allowlist.";
  }
  return (
    candidate?.response?.data?.error ||
    candidate?.message ||
    "Something went wrong. Please try again."
  );
}

function invalidateHub(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: getGetAdminVideoHubQueryKey() });
  void client.invalidateQueries({ queryKey: getGetVideoHubQueryKey() });
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

function TextField({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
  type = "text",
  placeholder,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
  testId: string;
}) {
  return (
    <label className="block text-sm font-bold text-[#29445b]">
      {label}
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
          className={`${fieldClass} resize-y`}
          data-testid={testId}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
          className={fieldClass}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function ImageUpload({
  label,
  imageUrl,
  alt,
  onImageUrl,
  testId,
}: {
  label: string;
  imageUrl: string;
  alt: string;
  onImageUrl: (value: string) => void;
  testId: string;
}) {
  const requestUpload = useRequestUploadUrl();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const chooseFile = (selected: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : "");
    setError("");
  };

  const upload = async () => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Images must be 2 MB or smaller.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const info = await requestUpload.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type },
      });
      const response = await fetch(info.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("The image upload could not be completed.");
      onImageUrl(info.objectPath);
      setFile(null);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="block text-sm font-bold text-[#29445b]">{label}</span>
      <div className="mt-1.5 grid gap-3 sm:grid-cols-[150px_1fr]">
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[#173958]/10 bg-[#edf0eb]">
          {preview || imageUrl ? (
            <img
              src={preview || assetUrl(imageUrl)}
              alt={preview ? "" : alt}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#8c999d]">
              <span className="text-xs font-semibold">No image selected</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-dashed border-[#173958]/20 bg-[#f8f8f4] p-4">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-extrabold text-[#173958] hover:text-[#a3473c]">
            <span className="max-w-full truncate">
              {file
                ? file.name
                : imageUrl
                  ? "Choose a replacement image"
                  : "Choose an image"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0] || null)}
              data-testid={`input-${testId}-file`}
            />
          </label>
          <p className="mt-2 text-xs text-[#77848a]">
            PNG, JPEG or WebP · up to 2 MB
          </p>
          {file ? (
            <button
              type="button"
              onClick={() => void upload()}
              disabled={uploading}
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-[#173958] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
              data-testid={`button-upload-${testId}`}
            >
              {uploading ? "Uploading…" : "Upload image"}
            </button>
          ) : null}
          {error ? (
            <p
              className="mt-2 text-xs font-semibold text-red-700"
              role="alert"
              data-testid={`error-${testId}-upload`}
            >
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SettingsEditor({
  initial,
  onFlash,
}: {
  initial: {
    eyebrow: string;
    title: string;
    introduction: string;
    heroImageUrl: string | null;
    heroImageAlt: string;
  };
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const update = useUpdateVideoHubSettings();
  const [eyebrow, setEyebrow] = useState(initial.eyebrow);
  const [title, setTitle] = useState(initial.title);
  const [introduction, setIntroduction] = useState(initial.introduction);
  const [heroImageUrl, setHeroImageUrl] = useState(initial.heroImageUrl || "");
  const [heroImageAlt, setHeroImageAlt] = useState(initial.heroImageAlt);
  const [error, setError] = useState("");

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (heroImageUrl.trim() && !heroImageAlt.trim()) {
      setError("Add alternative text for the hero image.");
      return;
    }
    setError("");
    const data: VideoHubSettingsUpdate = {
      eyebrow: eyebrow.trim(),
      title: title.trim(),
      introduction: introduction.trim(),
      heroImageUrl: heroImageUrl.trim() || null,
      heroImageAlt: heroImageAlt.trim(),
    };
    try {
      await update.mutateAsync({ data });
      invalidateHub(client);
      onFlash({ tone: "success", message: "Video Hub settings saved." });
    } catch (failure) {
      setError(errorMessage(failure));
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };

  return (
    <form
      onSubmit={(event) => void save(event)}
      className="grid gap-6 rounded-2xl border border-[#173958]/10 bg-white p-5 shadow-sm sm:p-7"
      data-testid="form-video-hub-settings"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Eyebrow"
          value={eyebrow}
          onChange={setEyebrow}
          required
          testId="input-video-hub-eyebrow"
        />
        <TextField
          label="Page title"
          value={title}
          onChange={setTitle}
          required
          testId="input-video-hub-title"
        />
      </div>
      <TextField
        label="Introduction"
        value={introduction}
        onChange={setIntroduction}
        required
        multiline
        testId="input-video-hub-introduction"
      />
      <ImageUpload
        label="Hero image"
        imageUrl={heroImageUrl}
        alt={heroImageAlt}
        onImageUrl={setHeroImageUrl}
        testId="video-hub-hero"
      />
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Hero image alternative text"
          value={heroImageAlt}
          onChange={setHeroImageAlt}
          required={Boolean(heroImageUrl.trim())}
          testId="input-video-hub-hero-alt"
        />
      </div>
      {error ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <button
          type="submit"
          disabled={update.isPending}
          className="rounded-xl bg-[#173958] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#214a70] disabled:opacity-50"
          data-testid="button-save-video-hub-settings"
        >
          {update.isPending ? "Saving…" : "Save page settings"}
        </button>
      </div>
    </form>
  );
}

function CategoryForm({
  initial,
  position,
  onCancel,
  onSaved,
  onFlash,
}: {
  initial: VideoCategory | null;
  position: number;
  onCancel: () => void;
  onSaved: () => void;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const create = useCreateVideoCategory();
  const update = useUpdateVideoCategory();
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [order, setOrder] = useState(String(initial?.position ?? position));
  const [error, setError] = useState("");

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const data: VideoCategoryInput | VideoCategoryUpdate = {
      name: name.trim(),
      slug: slugify(slug || name),
      description: description.trim(),
      position: Math.max(0, Number(order) || 0),
    };
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, data });
      } else {
        await create.mutateAsync({ data: data as VideoCategoryInput });
      }
      invalidateHub(client);
      onFlash({
        tone: "success",
        message: initial ? "Category updated." : "Category created.",
      });
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };

  return (
    <form
      onSubmit={(event) => void save(event)}
      className="grid gap-4 rounded-2xl border border-[#173958]/10 bg-[#f8f8f4] p-5 sm:grid-cols-2"
      data-testid="form-video-category"
    >
      <TextField
        label="Category name"
        value={name}
        onChange={(value) => {
          setName(value);
          if (!initial) setSlug(slugify(value));
        }}
        required
        testId="input-video-category-name"
      />
      <TextField
        label="Category slug"
        value={slug}
        onChange={setSlug}
        required
        testId="input-video-category-slug"
      />
      <TextField
        label="Description"
        value={description}
        onChange={setDescription}
        multiline
        testId="input-video-category-description"
      />
      <TextField
        label="Position"
        value={order}
        onChange={setOrder}
        type="number"
        testId="input-video-category-position"
      />
      {error ? (
        <p className="text-sm font-semibold text-red-700 sm:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={create.isPending || update.isPending}
          className="rounded-xl bg-[#173958] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          data-testid="button-save-video-category"
        >
          {create.isPending || update.isPending ? "Saving…" : "Save category"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-[#173958]/15 px-4 py-2.5 text-sm font-bold text-[#173958]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function VideoForm({
  categories,
  initial,
  position,
  onCancel,
  onSaved,
  onFlash,
}: {
  categories: VideoCategory[];
  initial: Video | null;
  position: number;
  onCancel: () => void;
  onSaved: () => void;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const create = useCreateVideo();
  const update = useUpdateVideo();
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId || categories[0]?.id || "",
  );
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl || "");
  const [thumbnailAlt, setThumbnailAlt] = useState(initial?.thumbnailAlt || "");
  const [publishedAt, setPublishedAt] = useState(
    dateTimeValue(initial?.publishedAt),
  );
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [order, setOrder] = useState(String(initial?.position ?? position));
  const [error, setError] = useState("");

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryId) {
      setError("Create a category before adding a video.");
      return;
    }
    if (isPublished && thumbnailUrl.trim() && !thumbnailAlt.trim()) {
      setError("Add alternative text for the published thumbnail.");
      return;
    }
    const shared = {
      categoryId,
      title: title.trim(),
      description: description.trim(),
      youtubeUrl: youtubeUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || null,
      thumbnailAlt: thumbnailAlt.trim(),
      publishedAt: dateToIso(publishedAt),
      isPublished,
      isFeatured,
      position: Math.max(0, Number(order) || 0),
    };
    setError("");
    try {
      if (initial) {
        await update.mutateAsync({
          id: initial.id,
          data: shared as VideoUpdate,
        });
      } else {
        await create.mutateAsync({ data: shared as VideoInput });
      }
      invalidateHub(client);
      onFlash({
        tone: "success",
        message: initial ? "Video updated." : "Video created.",
      });
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };

  return (
    <form
      onSubmit={(event) => void save(event)}
      className="grid gap-5 rounded-2xl border border-[#173958]/10 bg-white p-5 shadow-sm sm:p-7"
      data-testid="form-video"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Video title"
          value={title}
          onChange={setTitle}
          required
          testId="input-video-title"
        />
        <label className="block text-sm font-bold text-[#29445b]">
          Category
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
            className={fieldClass}
            data-testid="select-video-category"
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TextField
        label="YouTube video URL"
        value={youtubeUrl}
        onChange={setYoutubeUrl}
        required
        type="url"
        placeholder="https://www.youtube.com/watch?v=..."
        testId="input-video-youtube-url"
      />
      <TextField
        label="Description"
        value={description}
        onChange={setDescription}
        multiline
        testId="input-video-description"
      />
      <ImageUpload
        label="Thumbnail image"
        imageUrl={thumbnailUrl}
        alt={thumbnailAlt}
        onImageUrl={setThumbnailUrl}
        testId="video-thumbnail"
      />
      {thumbnailUrl ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <TextField
              label="Thumbnail alternative text"
              value={thumbnailAlt}
              onChange={setThumbnailAlt}
              required={isPublished}
              testId="input-video-thumbnail-alt"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setThumbnailUrl("");
              setThumbnailAlt("");
            }}
            className="rounded-xl border border-[#173958]/15 px-4 py-2.5 text-sm font-bold text-[#173958]"
            data-testid="button-remove-video-thumbnail"
          >
            Remove image
          </button>
        </div>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Publish date (optional)"
          value={publishedAt}
          onChange={setPublishedAt}
          type="datetime-local"
          testId="input-video-published-at"
        />
        <TextField
          label="Position"
          value={order}
          onChange={setOrder}
          type="number"
          testId="input-video-position"
        />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <label className="inline-flex items-center gap-2 text-sm font-bold text-[#29445b]">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            data-testid="checkbox-video-published"
          />
          Published
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-bold text-[#29445b]">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
            data-testid="checkbox-video-featured"
          />
          Featured video
        </label>
      </div>
      {error ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={create.isPending || update.isPending}
          className="rounded-xl bg-[#173958] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
          data-testid="button-save-video"
        >
          {create.isPending || update.isPending
            ? "Saving…"
            : initial
              ? "Save video"
              : "Add video"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-[#173958]/15 px-5 py-3 text-sm font-bold text-[#173958]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminVideoHubEditor({
  onFlash,
}: {
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const hub = useGetAdminVideoHub();
  const deleteVideo = useDeleteVideo();
  const deleteCategory = useDeleteVideoCategory();
  const [section, setSection] = useState<Section>("videos");
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VideoCategory | null>(
    null,
  );
  const [error, setError] = useState("");

  if (hub.isLoading) {
    return (
      <div className="mt-8 grid gap-4" aria-busy="true">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }
  if (hub.isError || !hub.data) {
    return (
      <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
        <p className="font-bold text-[#173958]">Video Hub content could not be loaded.</p>
        <button
          type="button"
          onClick={() => void hub.refetch()}
          className="mt-4 rounded-xl bg-[#173958] px-4 py-2.5 text-sm font-bold text-white"
          data-testid="button-retry-admin-video-hub"
        >
          Try again
        </button>
      </div>
    );
  }

  const { settings, categories, videos } = hub.data;
  const closeVideoForm = () => {
    setShowVideoForm(false);
    setEditingVideo(null);
  };
  const closeCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };
  const removeVideo = async (video: Video) => {
    if (!window.confirm(`Delete “${video.title}”? This cannot be undone.`)) return;
    setError("");
    try {
      await deleteVideo.mutateAsync({ id: video.id });
      invalidateHub(client);
      onFlash({ tone: "success", message: "Video deleted." });
    } catch (failure) {
      setError(errorMessage(failure));
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };
  const removeCategory = async (category: VideoCategory) => {
    if (!window.confirm(`Delete the “${category.name}” category?`)) return;
    setError("");
    try {
      await deleteCategory.mutateAsync({ id: category.id });
      invalidateHub(client);
      onFlash({ tone: "success", message: "Category deleted." });
    } catch (failure) {
      setError(errorMessage(failure));
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };

  return (
    <section className="mt-8">
      <div className="flex flex-wrap gap-2 border-b border-[#173958]/10 pb-4">
        {(
          [
            ["videos", "Videos"],
            ["categories", "Categories"],
            ["settings", "Page settings"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSection(value)}
            className={`rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
              section === value
                ? "bg-[#173958] text-white"
                : "bg-white text-[#173958] hover:bg-[#173958]/5"
            }`}
            aria-pressed={section === value}
            data-testid={`button-video-hub-tab-${value}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {section === "settings" ? (
        <div className="mt-5">
          <SettingsEditor initial={settings} onFlash={onFlash} />
        </div>
      ) : null}

      {section === "categories" ? (
        <div className="mt-5 space-y-4">
          {!showCategoryForm ? (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryForm(true);
              }}
              className="rounded-xl bg-[#173958] px-4 py-2.5 text-sm font-extrabold text-white"
              data-testid="button-add-video-category"
            >
              Add category
            </button>
          ) : (
            <CategoryForm
              key={editingCategory?.id || "new-category"}
              initial={editingCategory}
              position={categories.length}
              onCancel={closeCategoryForm}
              onSaved={closeCategoryForm}
              onFlash={onFlash}
            />
          )}
          <div className="grid gap-3">
            {categories.map((category) => {
              const hasVideos = videos.some(
                (video) => video.categoryId === category.id,
              );
              return (
                <div
                  key={category.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#173958]/10 bg-white p-4 sm:p-5"
                  data-testid={`row-video-category-${category.id}`}
                >
                  <div>
                    <h3 className="font-extrabold text-[#173958]">{category.name}</h3>
                    <p className="mt-1 text-xs text-[#71808a]">
                      {category.slug} · {videos.filter((video) => video.categoryId === category.id).length} videos
                    </p>
                    {category.description ? (
                      <p className="mt-2 max-w-2xl text-sm text-[#536575]">
                        {category.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryForm(true);
                      }}
                      className="rounded-lg border border-[#173958]/15 px-3 py-2 text-xs font-bold text-[#173958]"
                      data-testid={`button-edit-video-category-${category.id}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeCategory(category)}
                      disabled={hasVideos || deleteCategory.isPending}
                      title={hasVideos ? "Move or delete its videos before deleting this category." : undefined}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      data-testid={`button-delete-video-category-${category.id}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {section === "videos" ? (
        <div className="mt-5 space-y-4">
          {!showVideoForm ? (
            <button
              type="button"
              onClick={() => {
                setEditingVideo(null);
                setShowVideoForm(true);
                setError("");
              }}
              disabled={!categories.length}
              className="rounded-xl bg-[#173958] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
              data-testid="button-add-video"
            >
              Add video
            </button>
          ) : (
            <VideoForm
              key={editingVideo?.id || "new-video"}
              categories={categories}
              initial={editingVideo}
              position={videos.length}
              onCancel={closeVideoForm}
              onSaved={closeVideoForm}
              onFlash={onFlash}
            />
          )}
          {!categories.length ? (
            <p className="rounded-xl bg-[#f8f8f4] p-4 text-sm text-[#536575]">
              Add a category before creating videos.
            </p>
          ) : null}
          <div className="grid gap-3">
            {[...videos]
              .sort((a, b) => a.position - b.position)
              .map((video) => (
                <div
                  key={video.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#173958]/10 bg-white p-4 sm:flex-row sm:items-center sm:p-5"
                  data-testid={`row-video-${video.id}`}
                >
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-[#e7ece8] sm:w-36">
                    {video.thumbnailUrl ? (
                      <img
                        src={assetUrl(video.thumbnailUrl)}
                        alt={video.thumbnailAlt}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-bold text-[#71808a]">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#a3473c]">
                      <span>{video.categoryName}</span>
                      {video.isFeatured ? <span>Featured</span> : null}
                      <span>{video.isPublished ? "Published" : "Draft"}</span>
                    </div>
                    <h3 className="mt-1 font-extrabold text-[#173958]">{video.title}</h3>
                    <p className="mt-1 truncate text-xs text-[#71808a]">
                      {video.youtubeUrl}
                    </p>
                    {video.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-[#536575]">
                        {video.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVideo(video);
                        setShowVideoForm(true);
                        setError("");
                      }}
                      className="rounded-lg border border-[#173958]/15 px-3 py-2 text-xs font-bold text-[#173958]"
                      data-testid={`button-edit-video-${video.id}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeVideo(video)}
                      disabled={deleteVideo.isPending}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
                      data-testid={`button-delete-video-${video.id}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}