import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminStudyResourcesQueryKey,
  getGetStudyResourcesQueryKey,
  useCreateStudyResource,
  useCreateStudyResourceCategory,
  useDeleteStudyResource,
  useDeleteStudyResourceCategory,
  useGetAdminStudyResources,
  useRequestUploadUrl,
  useUpdateStudyResource,
  useUpdateStudyResourceCategory,
  useUpdateStudyResourceSettings,
} from "@workspace/api-client-react";
import type {
  StudyResource,
  StudyResourceCategory,
  StudyResourceCategoryInput,
  StudyResourceCategoryUpdate,
  StudyResourceInput,
  StudyResourceSettingsUpdate,
  StudyResourceUpdate,
} from "@workspace/api-client-react";
import { ArrowUpRight, FileText, ImagePlus, Pencil, Plus, Trash2, Upload } from "lucide-react";

type Flash = { tone: "success" | "error"; message: string };
type Props = { onFlash: (flash: Flash) => void };
type Section = "resources" | "categories" | "settings";
type ResourceDraft = Omit<StudyResourceInput, "publishedAt"> & {
  id?: string;
  publishedAt: string;
};
type SettingsDraft = StudyResourceSettingsUpdate;
type CategoryDraft = StudyResourceCategoryUpdate & {
  id: string;
};

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
const buttonClass =
  "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#173958]/15 bg-white px-3.5 py-2 text-sm font-bold text-[#173958] transition hover:border-[#a3473c]/40 hover:text-[#a3473c] disabled:cursor-not-allowed disabled:opacity-50";

const blankResource = (categoryId = ""): ResourceDraft => ({
  categoryId,
  title: "",
  description: "",
  resourceType: "study-notes",
  fileUrl: "",
  fileName: "",
  fileSizeBytes: 0,
  isDemo: true,
  thumbnailUrl: null,
  thumbnailAlt: "",
  publishedAt: "",
  isPublished: false,
  position: 0,
});

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

function invalidateStudyResources(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({
    queryKey: getGetAdminStudyResourcesQueryKey(),
  });
  void client.invalidateQueries({ queryKey: getGetStudyResourcesQueryKey() });
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  type = "text",
  min,
  testId,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  type?: string;
  min?: number;
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
          className={`${fieldClass} resize-y`}
          data-testid={testId}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          min={min}
          className={fieldClass}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function imageAltText(resource: StudyResource) {
  return resource.thumbnailAlt || resource.title;
}

export default function AdminStudyResourcesEditor({ onFlash }: Props) {
  const client = useQueryClient();
  const hub = useGetAdminStudyResources();
  const requestUpload = useRequestUploadUrl();
  const updateSettings = useUpdateStudyResourceSettings();
  const createCategory = useCreateStudyResourceCategory();
  const updateCategory = useUpdateStudyResourceCategory();
  const deleteCategory = useDeleteStudyResourceCategory();
  const createResource = useCreateStudyResource();
  const updateResource = useUpdateStudyResource();
  const deleteResource = useDeleteStudyResource();
  const [section, setSection] = useState<Section>("resources");
  const [settings, setSettings] = useState<SettingsDraft>({
    eyebrow: "",
    title: "",
    introduction: "",
    heroImageUrl: null,
    heroImageAlt: "",
  });
  const [resource, setResource] = useState<ResourceDraft>(blankResource());
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hub.data) return;
    setSettings({
      eyebrow: hub.data.settings.eyebrow,
      title: hub.data.settings.title,
      introduction: hub.data.settings.introduction,
      heroImageUrl: hub.data.settings.heroImageUrl,
      heroImageAlt: hub.data.settings.heroImageAlt,
    });
    setResource((current) =>
      current.categoryId || current.id
        ? current
        : blankResource(hub.data.categories[0]?.id ?? ""),
    );
  }, [hub.data]);

  const uploadFile = async (file: File, kind: "pdf" | "image") => {
    setUploading(true);
    setError("");
    try {
      let contentType = file.type.toLowerCase();
      if (kind === "pdf") {
        if (
          !file.name.toLowerCase().endsWith(".pdf") ||
          (contentType &&
            !["application/pdf", "application/x-pdf"].includes(contentType))
        ) {
          throw new Error("Choose a PDF file with a .pdf extension.");
        }
        if (file.size < 1 || file.size > 10 * 1024 * 1024) {
          throw new Error("PDF files must be 10 MB or smaller.");
        }
        if ((await file.slice(0, 5).text()) !== "%PDF-") {
          throw new Error("The selected file does not appear to be a valid PDF.");
        }
        contentType = "application/pdf";
      } else {
        if (!["image/png", "image/jpeg", "image/webp"].includes(contentType)) {
          throw new Error("Choose a PNG, JPEG, or WebP cover image.");
        }
        if (file.size < 1 || file.size > 2 * 1024 * 1024) {
          throw new Error("Cover images must be 2 MB or smaller.");
        }
      }

      const info = await requestUpload.mutateAsync({
        data: { name: file.name, size: file.size, contentType },
      });
      const response = await fetch(info.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!response.ok) {
        throw new Error(
          kind === "pdf"
            ? "The PDF upload could not be completed."
            : "The cover image upload could not be completed.",
        );
      }
      return { objectPath: info.objectPath, fileName: file.name, size: file.size };
    } finally {
      setUploading(false);
    }
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      await updateSettings.mutateAsync({ data: settings });
      invalidateStudyResources(client);
      onFlash({ tone: "success", message: "Study Resources page settings saved." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const payload: StudyResourceCategoryInput = {
      name: newCategoryName.trim(),
      slug: slugify(newCategoryName),
      description: newCategoryDescription.trim(),
      position: hub.data?.categories.length ?? 0,
    };
    if (!payload.slug) {
      setError("Enter a category name.");
      return;
    }
    try {
      await createCategory.mutateAsync({ data: payload });
      setNewCategoryName("");
      setNewCategoryDescription("");
      invalidateStudyResources(client);
      onFlash({ tone: "success", message: "Category added." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const saveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryDraft) return;
    setError("");
    const payload: StudyResourceCategoryUpdate = {
      name: categoryDraft.name?.trim(),
      slug: categoryDraft.slug?.trim(),
      description: categoryDraft.description?.trim(),
      position: categoryDraft.position,
    };
    try {
      await updateCategory.mutateAsync({
        id: categoryDraft.id,
        data: payload,
      });
      setCategoryDraft(null);
      invalidateStudyResources(client);
      onFlash({ tone: "success", message: "Category updated." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const removeCategory = async (item: StudyResourceCategory) => {
    if (
      !window.confirm(
        `Delete the "${item.name}" category? Categories with resources cannot be deleted.`,
      )
    ) {
      return;
    }
    setError("");
    try {
      await deleteCategory.mutateAsync({ id: item.id });
      invalidateStudyResources(client);
      onFlash({ tone: "success", message: "Category deleted." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const resetResourceForm = () => {
    setResource(blankResource(hub.data?.categories[0]?.id ?? ""));
  };

  const editResource = (item: StudyResource) => {
    setResource({
      id: item.id,
      categoryId: item.categoryId,
      title: item.title,
      description: item.description,
      resourceType: item.resourceType as ResourceDraft["resourceType"],
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      fileSizeBytes: item.fileSizeBytes,
      isDemo: item.isDemo,
      thumbnailUrl: item.thumbnailUrl,
      thumbnailAlt: item.thumbnailAlt,
      publishedAt: dateTimeValue(item.publishedAt),
      isPublished: item.isPublished,
      position: item.position,
    });
    setSection("resources");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const payload = {
      categoryId: resource.categoryId,
      title: resource.title.trim(),
      description: resource.description.trim(),
      resourceType: resource.resourceType,
      fileUrl: resource.fileUrl,
      fileName: resource.fileName,
      fileSizeBytes: resource.fileSizeBytes,
      isDemo: resource.isDemo,
      thumbnailUrl: resource.thumbnailUrl,
      thumbnailAlt: resource.thumbnailAlt.trim(),
      publishedAt: resource.publishedAt
        ? new Date(resource.publishedAt).toISOString()
        : null,
      isPublished: resource.isPublished,
      position: Number(resource.position),
    };
    try {
      if (resource.id) {
        const update: StudyResourceUpdate = payload;
        await updateResource.mutateAsync({
          id: resource.id,
          data: update,
        });
        onFlash({ tone: "success", message: "Study resource updated." });
      } else {
        const create: StudyResourceInput = payload;
        await createResource.mutateAsync({ data: create });
        onFlash({ tone: "success", message: "Study resource added." });
      }
      resetResourceForm();
      invalidateStudyResources(client);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const removeResource = async (item: StudyResource) => {
    if (!window.confirm(`Delete "${item.title}" from Study Resources?`)) return;
    setError("");
    try {
      await deleteResource.mutateAsync({ id: item.id });
      if (resource.id === item.id) resetResourceForm();
      invalidateStudyResources(client);
      onFlash({ tone: "success", message: "Study resource deleted." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  if (hub.isLoading) {
    return (
      <div className="mt-8 rounded-2xl border border-[#173958]/10 bg-white p-8 text-sm text-[#52616a]">
        Loading Study Resources content…
      </div>
    );
  }

  if (hub.isError || !hub.data) {
    return (
      <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8">
        <p className="text-sm font-semibold text-red-700">
          {errorMessage(hub.error)}
        </p>
        <button
          type="button"
          onClick={() => void hub.refetch()}
          className={`${buttonClass} mt-4`}
          data-testid="button-retry-admin-study-resources"
        >
          Retry
        </button>
      </div>
    );
  }

  const categories = hub.data.categories;
  const resources = hub.data.resources;
  const tabs: { id: Section; label: string; count?: number }[] = [
    { id: "resources", label: "Documents", count: resources.length },
    { id: "categories", label: "Categories", count: categories.length },
    { id: "settings", label: "Page settings" },
  ];

  return (
    <section
      className="mt-8 overflow-hidden rounded-[1.6rem] border border-[#173958]/10 bg-white shadow-[0_16px_45px_rgba(23,57,88,.06)]"
      data-testid="admin-study-resources-editor"
    >
      <div className="flex flex-wrap gap-2 border-b border-[#173958]/10 bg-[#f8f8f4] p-3 sm:p-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSection(tab.id);
              setError("");
            }}
            aria-pressed={section === tab.id}
            className={`focus-ring rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
              section === tab.id
                ? "bg-[#12335a] text-white"
                : "text-[#52616a] hover:bg-white hover:text-[#12335a]"
            }`}
            data-testid={`button-study-resources-tab-${tab.id}`}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className="ml-2 opacity-70">{tab.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 sm:mx-7"
          data-testid="text-study-resources-error"
        >
          {error}
        </div>
      ) : null}

      {section === "settings" ? (
        <form onSubmit={saveSettings} className="space-y-5 p-5 sm:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Eyebrow"
              value={settings.eyebrow ?? ""}
              onChange={(value) => setSettings((current) => ({ ...current, eyebrow: value }))}
              required
              testId="input-study-resources-eyebrow"
            />
            <TextField
              label="Page title"
              value={settings.title ?? ""}
              onChange={(value) => setSettings((current) => ({ ...current, title: value }))}
              required
              testId="input-study-resources-title"
            />
            <div className="md:col-span-2">
              <TextField
                label="Introduction"
                value={settings.introduction ?? ""}
                onChange={(value) =>
                  setSettings((current) => ({ ...current, introduction: value }))
                }
                multiline
                required
                testId="textarea-study-resources-introduction"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#29445b]">
                Hero image path
                <input
                  type="text"
                  value={settings.heroImageUrl ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      heroImageUrl: event.target.value || null,
                    }))
                  }
                  className={fieldClass}
                  placeholder="/article-images/article-hub-hero.jpg"
                  data-testid="input-study-resources-hero-path"
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className={`${buttonClass} cursor-pointer`}>
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  {uploading ? "Uploading image…" : "Upload hero image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={uploading}
                    onChange={async (event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (!file) return;
                      try {
                        const uploaded = await uploadFile(file, "image");
                        setSettings((current) => ({
                          ...current,
                          heroImageUrl: uploaded.objectPath,
                        }));
                      } catch (failure) {
                        setError(errorMessage(failure));
                      }
                    }}
                    data-testid="input-study-resources-hero-image"
                  />
                </label>
                {settings.heroImageUrl ? (
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() =>
                      setSettings((current) => ({ ...current, heroImageUrl: null }))
                    }
                    data-testid="button-remove-study-resources-hero"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove image
                  </button>
                ) : null}
              </div>
              {settings.heroImageUrl ? (
                <div className="mt-4 aspect-[2.4] max-w-2xl overflow-hidden rounded-2xl border border-[#173958]/10 bg-[#edf0eb]">
                  <img
                    src={assetUrl(settings.heroImageUrl)}
                    alt={settings.heroImageAlt ?? ""}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <TextField
                label="Hero image alt text"
                value={settings.heroImageAlt ?? ""}
                onChange={(value) =>
                  setSettings((current) => ({ ...current, heroImageAlt: value }))
                }
                testId="input-study-resources-hero-alt"
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-[#173958]/10 pt-5">
            <button
              type="submit"
              disabled={updateSettings.isPending || uploading}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#12335a] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0b2748] disabled:opacity-50"
              data-testid="button-save-study-resources-settings"
            >
              {updateSettings.isPending ? "Saving…" : "Save page settings"}
            </button>
          </div>
        </form>
      ) : null}

      {section === "categories" ? (
        <div className="space-y-6 p-5 sm:p-7">
          <form
            onSubmit={addCategory}
            className="grid gap-4 rounded-2xl border border-[#173958]/10 bg-[#fafaf7] p-4 md:grid-cols-[.8fr_1.4fr_auto] md:items-end"
          >
            <TextField
              label="New category"
              value={newCategoryName}
              onChange={setNewCategoryName}
              required
              testId="input-new-study-resource-category"
            />
            <TextField
              label="Description"
              value={newCategoryDescription}
              onChange={setNewCategoryDescription}
              testId="input-new-study-resource-category-description"
            />
            <button
              type="submit"
              disabled={createCategory.isPending}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#12335a] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
              data-testid="button-add-study-resource-category"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add category
            </button>
          </form>

          <div className="divide-y divide-[#173958]/10">
            {categories.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                {categoryDraft?.id === item.id ? (
                  <form onSubmit={saveCategory} className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Category name"
                      value={categoryDraft.name ?? ""}
                      onChange={(value) =>
                        setCategoryDraft((current) =>
                          current ? { ...current, name: value } : current,
                        )
                      }
                      required
                      testId={`input-study-resource-category-name-${item.id}`}
                    />
                    <TextField
                      label="Category slug"
                      value={categoryDraft.slug ?? ""}
                      onChange={(value) =>
                        setCategoryDraft((current) =>
                          current ? { ...current, slug: slugify(value) } : current,
                        )
                      }
                      required
                      testId={`input-study-resource-category-slug-${item.id}`}
                    />
                    <div className="md:col-span-2">
                      <TextField
                        label="Description"
                        value={categoryDraft.description ?? ""}
                        onChange={(value) =>
                          setCategoryDraft((current) =>
                            current ? { ...current, description: value } : current,
                          )
                        }
                        testId={`input-study-resource-category-description-${item.id}`}
                      />
                    </div>
                    <TextField
                      label="Display order"
                      value={categoryDraft.position ?? 0}
                      onChange={(value) =>
                        setCategoryDraft((current) =>
                          current
                            ? { ...current, position: Number(value) }
                            : current,
                        )
                      }
                      type="number"
                      min={0}
                      testId={`input-study-resource-category-position-${item.id}`}
                    />
                    <div className="flex items-end gap-2">
                      <button type="submit" className={buttonClass} disabled={updateCategory.isPending}>
                        Save category
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryDraft(null)}
                        className={buttonClass}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-[#173958]">{item.name}</h3>
                      <p className="mt-1 text-xs text-[#728087]">
                        /{item.slug} · {resources.filter((r) => r.categoryId === item.id).length} documents
                      </p>
                      {item.description ? (
                        <p className="mt-1 text-sm text-[#52616a]">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryDraft({
                            id: item.id,
                            slug: item.slug,
                            name: item.name,
                            description: item.description,
                            position: item.position,
                          })
                        }
                        className={buttonClass}
                        data-testid={`button-edit-study-resource-category-${item.id}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeCategory(item)}
                        className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-3.5 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-study-resource-category-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {section === "resources" ? (
        <div className="grid gap-8 p-5 sm:p-7 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold text-[#173958]">
                  Resource documents
                </h2>
                <p className="mt-1 text-sm text-[#6b7a82]">
                  Upload PDFs, add cover images, and publish documents.
                </p>
              </div>
              <button
                type="button"
                onClick={resetResourceForm}
                className={buttonClass}
                data-testid="button-new-study-resource"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New document
              </button>
            </div>
            <div className="space-y-3">
              {resources.map((item) => (
                <article
                  key={item.id}
                  className={`flex gap-3 rounded-2xl border p-3 transition ${
                    resource.id === item.id
                      ? "border-[#a3473c]/40 bg-[#fbf6f1]"
                      : "border-[#173958]/10 bg-white"
                  }`}
                  data-testid={`admin-study-resource-${item.id}`}
                >
                  <div className="hidden h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-[#e7ece8] sm:block">
                    {item.thumbnailUrl ? (
                      <img
                        src={assetUrl(item.thumbnailUrl)}
                        alt={imageAltText(item)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileText className="h-7 w-7 text-[#829198]" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold leading-snug text-[#173958]">{item.title}</h3>
                      {item.isDemo ? (
                        <span className="rounded-full bg-[#f5e4b8] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#755719]">
                          Sample
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          item.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#6b7a82]">
                      {item.categoryName} · {item.fileName}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editResource(item)}
                        className={`${buttonClass} min-h-8 px-3 py-1 text-xs`}
                        data-testid={`button-edit-study-resource-${item.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      <a
                        href={assetUrl(item.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className={`${buttonClass} min-h-8 px-3 py-1 text-xs`}
                        data-testid={`link-preview-study-resource-${item.id}`}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        Open PDF
                      </a>
                      <button
                        type="button"
                        onClick={() => void removeResource(item)}
                        className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-study-resource-${item.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {resources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#173958]/20 px-5 py-12 text-center text-sm text-[#6b7a82]">
                  No documents yet. Add a PDF with the form.
                </div>
              ) : null}
            </div>
          </div>

          <form
            onSubmit={saveResource}
            className="h-fit space-y-4 rounded-2xl border border-[#173958]/10 bg-[#fafaf7] p-4 sm:p-5"
            data-testid="form-study-resource"
          >
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#a3473c]">
                {resource.id ? "Edit document" : "New document"}
              </p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-[#173958]">
                {resource.id ? resource.title || "Update resource" : "Add a study resource"}
              </h2>
            </div>
            <label className="block text-sm font-bold text-[#29445b]">
              Category
              <select
                value={resource.categoryId}
                onChange={(event) =>
                  setResource((current) => ({ ...current, categoryId: event.target.value }))
                }
                required
                className={fieldClass}
                data-testid="select-study-resource-category"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Title"
              value={resource.title}
              onChange={(value) => setResource((current) => ({ ...current, title: value }))}
              required
              testId="input-study-resource-title"
            />
            <TextField
              label="Description"
              value={resource.description}
              onChange={(value) =>
                setResource((current) => ({ ...current, description: value }))
              }
              multiline
              testId="textarea-study-resource-description"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-[#29445b]">
                Resource type
                <select
                  value={resource.resourceType}
                  onChange={(event) =>
                    setResource((current) => ({
                      ...current,
                      resourceType: event.target.value as ResourceDraft["resourceType"],
                    }))
                  }
                  className={fieldClass}
                  data-testid="select-study-resource-type"
                >
                  <option value="study-notes">Study notes</option>
                  <option value="practice-paper">Practice paper</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="revision-guide">Revision guide</option>
                  <option value="study-planner">Study planner</option>
                </select>
              </label>
              <TextField
                label="Display order"
                value={resource.position}
                onChange={(value) =>
                  setResource((current) => ({ ...current, position: Number(value) }))
                }
                type="number"
                min={0}
                testId="input-study-resource-position"
              />
            </div>
            <div className="rounded-xl border border-[#173958]/10 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#52616a]">
                    PDF document
                  </p>
                  <p className="mt-1 truncate text-sm text-[#173958]">
                    {resource.fileName || "No PDF selected"}
                  </p>
                </div>
                <label className={`${buttonClass} cursor-pointer`}>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {uploading ? "Uploading…" : resource.fileUrl ? "Replace PDF" : "Upload PDF"}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                    disabled={uploading}
                    onChange={async (event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (!file) return;
                      try {
                        const uploaded = await uploadFile(file, "pdf");
                        setResource((current) => ({
                          ...current,
                          fileUrl: uploaded.objectPath,
                          fileName: uploaded.fileName,
                          fileSizeBytes: uploaded.size,
                        }));
                      } catch (failure) {
                        setError(errorMessage(failure));
                      }
                    }}
                    data-testid="input-study-resource-pdf"
                  />
                </label>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
              <div className="aspect-[1.4] overflow-hidden rounded-xl border border-[#173958]/10 bg-[#e7ece8]">
                {resource.thumbnailUrl ? (
                  <img
                    src={assetUrl(resource.thumbnailUrl)}
                    alt={resource.thumbnailAlt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#829198]">
                    <ImagePlus className="h-7 w-7" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center gap-2">
                <p className="text-sm font-bold text-[#29445b]">Cover image</p>
                <label className={`${buttonClass} w-fit cursor-pointer`}>
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  {uploading ? "Uploading…" : "Upload cover"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={uploading}
                    onChange={async (event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (!file) return;
                      try {
                        const uploaded = await uploadFile(file, "image");
                        setResource((current) => ({
                          ...current,
                          thumbnailUrl: uploaded.objectPath,
                          thumbnailAlt: current.thumbnailAlt || current.title,
                        }));
                      } catch (failure) {
                        setError(errorMessage(failure));
                      }
                    }}
                    data-testid="input-study-resource-cover"
                  />
                </label>
              </div>
            </div>
            <TextField
              label="Cover image alt text"
              value={resource.thumbnailAlt}
              onChange={(value) =>
                setResource((current) => ({ ...current, thumbnailAlt: value }))
              }
              testId="input-study-resource-cover-alt"
            />
            <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-[#173958]/10 bg-white p-3">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#29445b]">
                <input
                  type="checkbox"
                  checked={resource.isDemo}
                  onChange={(event) =>
                    setResource((current) => ({ ...current, isDemo: event.target.checked }))
                  }
                  className="h-4 w-4 accent-[#12335a]"
                  data-testid="checkbox-study-resource-sample"
                />
                Show Sample label
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#29445b]">
                <input
                  type="checkbox"
                  checked={resource.isPublished}
                  onChange={(event) =>
                    setResource((current) => ({
                      ...current,
                      isPublished: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#12335a]"
                  data-testid="checkbox-study-resource-published"
                />
                Published
              </label>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#173958]/10 pt-4">
              {resource.id ? (
                <button
                  type="button"
                  onClick={resetResourceForm}
                  className={buttonClass}
                  data-testid="button-cancel-study-resource-edit"
                >
                  Cancel edit
                </button>
              ) : null}
              <button
                type="submit"
                disabled={
                  uploading ||
                  createResource.isPending ||
                  updateResource.isPending ||
                  !resource.categoryId ||
                  !resource.fileUrl
                }
                className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#12335a] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0b2748] disabled:opacity-50"
                data-testid="button-save-study-resource"
              >
                {createResource.isPending || updateResource.isPending
                  ? "Saving…"
                  : resource.id
                    ? "Save changes"
                    : "Add document"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}