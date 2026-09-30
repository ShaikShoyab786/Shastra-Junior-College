import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Save, Trash2, X } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useGetAdminCmsPage,
  useRequestUploadUrl,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentSection } from "@workspace/api-client-react";

type FlashMessage = { tone: "success" | "error"; message: string };

type WhoWeAreDraft = {
  eyebrow: string;
  title: string;
  paragraphs: string;
  imageUrl: string;
  imageAlt: string;
  imageRemoved: boolean;
  visionTitle: string;
  visionText: string;
  missionTitle: string;
  missionPoints: string;
};

const emptyDraft: WhoWeAreDraft = {
  eyebrow: "",
  title: "",
  paragraphs: "",
  imageUrl: "",
  imageAlt: "",
  imageRemoved: false,
  visionTitle: "",
  visionText: "",
  missionTitle: "",
  missionPoints: "",
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function draftFrom(section: ContentSection): WhoWeAreDraft {
  const content = record(section.content);
  return {
    eyebrow: text(content.eyebrow),
    title: section.title,
    paragraphs: textList(content.paragraphs).join("\n\n"),
    imageUrl: text(content.imageUrl),
    imageAlt: text(content.imageAlt),
    imageRemoved: content.imageRemoved === true,
    visionTitle: text(content.visionTitle),
    visionText: text(content.visionText),
    missionTitle: text(content.missionTitle),
    missionPoints: textList(content.missionPoints).join("\n"),
  };
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  rows = 4,
  hint,
  testId,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  testId: string;
  maxLength?: number;
}) {
  const className =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#0b3472] focus:ring-2 focus:ring-[#0b3472]/10";

  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          rows={rows}
          maxLength={maxLength}
          className={`${className} resize-y`}
          data-testid={testId}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          maxLength={maxLength}
          className={className}
          data-testid={testId}
        />
      )}
      {hint ? (
        <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The subsection could not be saved. Please try again.";
}

function assetUrl(path: string): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  if (path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)) {
    return `${basePath}${path}`;
  }
  return path;
}

export default function AdminAboutWhoWeAreEditor({
  onFlash,
}: {
  onFlash: (flash: FlashMessage) => void;
}) {
  const client = useQueryClient();
  const page = useGetAdminCmsPage("about", {
    query: { queryKey: getGetAdminCmsPageQueryKey("about") },
  });
  const update = useUpdateContentSection();
  const requestUpload = useRequestUploadUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const section = page.data?.sections.find(
    (candidate) => candidate.sectionKey === "who-we-are",
  );
  const [draft, setDraft] = useState(emptyDraft);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (section) setDraft(draftFrom(section));
  }, [section?.id, section?.updatedAt]);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl("");
      return;
    }
    const preview = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [selectedFile]);

  const set = (key: keyof WhoWeAreDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const imageWillBePresent = Boolean(
    selectedFile || (!draft.imageRemoved && draft.imageUrl.trim()),
  );

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!section) return;

    const paragraphs = draft.paragraphs
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const missionPoints = draft.missionPoints
      .split("\n")
      .map((point) => point.trim())
      .filter(Boolean);

    if (
      !draft.title.trim() ||
      !draft.eyebrow.trim() ||
      paragraphs.length === 0 ||
      (imageWillBePresent && !draft.imageAlt.trim()) ||
      !draft.visionTitle.trim() ||
      !draft.visionText.trim() ||
      !draft.missionTitle.trim() ||
      missionPoints.length === 0
    ) {
      setError(
        "Complete all headings, descriptions, and image alt text, and include at least one paragraph and mission point.",
      );
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = draft.imageRemoved ? "" : draft.imageUrl.trim();
      if (selectedFile) {
        if (!["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type)) {
          throw new Error("Use a PNG, JPEG, or WebP image.");
        }
        if (selectedFile.size > 2 * 1024 * 1024) {
          throw new Error("The About image must be 2 MB or smaller.");
        }
        const uploadInfo = await requestUpload.mutateAsync({
          data: {
            name: selectedFile.name,
            size: selectedFile.size,
            contentType: selectedFile.type,
          },
        });
        const response = await fetch(uploadInfo.uploadURL, {
          method: "PUT",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        if (!response.ok) {
          throw new Error("The image upload could not be completed.");
        }
        imageUrl = uploadInfo.objectPath;
      }

      await update.mutateAsync({
        id: section.id,
        data: {
          title: draft.title.trim(),
          content: {
            ...record(section.content),
            eyebrow: draft.eyebrow.trim(),
            paragraphs,
            imageUrl,
            imageAlt: imageUrl ? draft.imageAlt.trim() : "",
            imageRemoved: !imageUrl,
            visionTitle: draft.visionTitle.trim(),
            visionText: draft.visionText.trim(),
            missionTitle: draft.missionTitle.trim(),
            missionPoints,
          },
        },
      });
      await Promise.all([
        client.invalidateQueries({
          queryKey: getGetAdminCmsPageQueryKey("about"),
        }),
        client.invalidateQueries({
          queryKey: getGetCmsPageQueryKey("about"),
        }),
      ]);
      setDraft((current) => ({
        ...current,
        imageUrl,
        imageAlt: imageUrl ? current.imageAlt.trim() : "",
        imageRemoved: !imageUrl,
      }));
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onFlash({ tone: "success", message: "Who We Are subsection saved." });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setIsSaving(false);
    }
  };

  if (page.isLoading) {
    return (
      <div className="mt-6 h-96 animate-pulse rounded-3xl bg-white" />
    );
  }

  if (page.isError || !page.data) {
    return (
      <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="font-bold text-red-800">
          About subsections could not be loaded.
        </p>
        <button
          type="button"
          onClick={() => void page.refetch()}
          className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-red-800"
          data-testid="button-retry-about-subsections"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!section) {
    return (
      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-bold text-amber-900">
          The Who We Are subsection is not available yet.
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-800">
          Restart the API server to create the default About subsection.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
        <div className="mb-6">
          <p className="eyebrow text-[#e3212b]">Public About page</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
            Story and introduction
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Write a short introduction to Shastra and its approach to student
            learning.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Eyebrow"
            value={draft.eyebrow}
            onChange={(value) => set("eyebrow", value)}
            testId="input-about-who-eyebrow"
            maxLength={100}
          />
          <Field
            label="Section heading"
            value={draft.title}
            onChange={(value) => set("title", value)}
            testId="input-about-who-title"
            maxLength={120}
          />
          <div className="md:col-span-2">
            <Field
              label="Introduction paragraphs"
              value={draft.paragraphs}
              onChange={(value) => set("paragraphs", value)}
              multiline
              rows={8}
              hint="Separate paragraphs with a blank line."
              testId="textarea-about-who-paragraphs"
              maxLength={5000}
            />
          </div>
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-bold text-slate-800">Who We Are image</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Replace or delete the image. Changes take effect when you save
                this subsection.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)]">
              <div className="space-y-4">
                {imageWillBePresent ? (
                  <Field
                    label="Image alt text"
                    value={draft.imageAlt}
                    onChange={(value) => set("imageAlt", value)}
                    hint="Describe the learning scene for screen readers."
                    testId="input-about-who-image-alt"
                    maxLength={500}
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-500">
                    Add an image to enter its alt text.
                  </p>
                )}
                <div>
                  <label
                    className="block text-sm font-semibold text-slate-700"
                    htmlFor="about-who-we-are-image-upload"
                  >
                    Change or replace image
                  </label>
                  <input
                    ref={fileInputRef}
                    id="about-who-we-are-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] || null;
                      setSelectedFile(file);
                      if (file) {
                        setDraft((current) => ({
                          ...current,
                          imageRemoved: false,
                        }));
                      }
                    }}
                    disabled={isSaving}
                    className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0b3472]/5 file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#0b3472] hover:file:bg-[#0b3472]/10 disabled:opacity-60"
                    data-testid="input-about-who-image-upload"
                  />
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    PNG, JPEG, or WebP; maximum 2 MB. The selected file uploads
                    when you save.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The current photo is demo artwork; replace it with an
                    approved college image when available.
                  </p>
                  {selectedFile ? (
                    <p className="mt-1 text-xs font-semibold text-[#0b3472]">
                      New image selected: {selectedFile.name}
                    </p>
                  ) : null}
                  {selectedFile ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white"
                      data-testid="button-clear-about-who-image"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear selected image
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setDraft((current) => ({
                        ...current,
                        imageUrl: "",
                        imageAlt: "",
                        imageRemoved: true,
                      }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={isSaving || draft.imageRemoved}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    data-testid="button-delete-about-who-image"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete image
                  </button>
                  {draft.imageRemoved ? (
                    <p className="mt-2 text-xs font-medium text-red-700">
                      Image removal is pending. Save Who We Are to confirm.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#e8edf4]">
                {localPreviewUrl ||
                (!draft.imageRemoved && draft.imageUrl) ? (
                  <img
                    src={
                      localPreviewUrl ||
                      (draft.imageUrl ? assetUrl(draft.imageUrl) : "")
                    }
                    alt={draft.imageAlt}
                    className="aspect-[4/3] w-full object-cover"
                    data-testid="img-admin-about-who-preview"
                  />
                ) : (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-5 text-center text-sm text-slate-500">
                    <ImagePlus className="h-6 w-6 text-[#0b3472]/40" />
                    {draft.imageRemoved
                      ? "This image will be removed when you save."
                      : "No image is currently selected."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
          <p className="eyebrow text-[#e3212b]">Vision</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
            What we aspire to
          </h2>
          <div className="mt-5 space-y-5">
            <Field
              label="Vision heading"
              value={draft.visionTitle}
              onChange={(value) => set("visionTitle", value)}
              testId="input-about-vision-title"
              maxLength={100}
            />
            <Field
              label="Vision statement"
              value={draft.visionText}
              onChange={(value) => set("visionText", value)}
              multiline
              rows={5}
              testId="textarea-about-vision-text"
              maxLength={1200}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
          <p className="eyebrow text-[#e3212b]">Mission</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
            How we put it into practice
          </h2>
          <div className="mt-5 space-y-5">
            <Field
              label="Mission heading"
              value={draft.missionTitle}
              onChange={(value) => set("missionTitle", value)}
              testId="input-about-mission-title"
              maxLength={100}
            />
            <Field
              label="Mission points"
              value={draft.missionPoints}
              onChange={(value) => set("missionPoints", value)}
              multiline
              rows={7}
              hint="Enter one point per line."
              testId="textarea-about-mission-points"
              maxLength={2400}
            />
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {error ? (
          <p className="text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#082a5c] disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="button-save-about-who-we-are"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving…" : "Save Who We Are"}
        </button>
      </div>
    </form>
  );
}