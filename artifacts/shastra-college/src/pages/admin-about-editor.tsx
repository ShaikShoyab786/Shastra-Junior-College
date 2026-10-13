import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save, Upload } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetAdminHomeQueryKey,
  getGetCmsPageQueryKey,
  useGetAdminCmsPage,
  useRequestUploadUrl,
  useUpdateContentItem,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type {
  ContentItem,
  ContentSection,
  HomePage,
} from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string };
type HeroDraft = {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  primaryCtaLabel: string;
  primaryCtaPath: string;
  secondaryCtaLabel: string;
  secondaryCtaPath: string;
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function isSafeInternalPath(path: string): boolean {
  return (
    path.startsWith("#") ||
    (path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"))
  );
}

function assetUrl(path: string): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  if (path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)) {
    return `${basePath}${path}`;
  }
  return path;
}

function draftFrom(section: ContentSection): HeroDraft {
  const content = record(section.content);
  return {
    eyebrow: text(content.eyebrow),
    title: section.title,
    subtitle: section.subtitle || "",
    imageUrl: text(content.imageUrl),
    imageAlt: text(content.imageAlt),
    primaryCtaLabel: text(content.primaryCtaLabel),
    primaryCtaPath: text(content.primaryCtaPath),
    secondaryCtaLabel: text(content.secondaryCtaLabel),
    secondaryCtaPath: text(content.secondaryCtaPath),
  };
}

function statisticValue(item: ContentItem): string {
  return `${text(item.content.prefix)}${text(item.content.value, "0")}${text(item.content.suffix)}`;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  required = false,
  maxLength,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
  testId: string;
}) {
  const controlClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0b3472] focus:ring-2 focus:ring-[#0b3472]/10";
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          rows={4}
          className={`${controlClass} resize-y leading-6`}
          data-testid={testId}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={controlClass}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function HeroEditor({
  section,
  onFlash,
}: {
  section: ContentSection;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  const upload = useRequestUploadUrl();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => draftFrom(section));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(draftFrom(section));
  }, [section.id, section.updatedAt]);

  const set = (key: keyof HeroDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (
      !draft.title.trim() ||
      !draft.subtitle.trim() ||
      !draft.imageAlt.trim() ||
      !draft.primaryCtaLabel.trim() ||
      !draft.secondaryCtaLabel.trim()
    ) {
      setError("Complete the heading, description, image alt text, and CTA labels.");
      return;
    }
    if (
      !isSafeInternalPath(draft.primaryCtaPath.trim()) ||
      !isSafeInternalPath(draft.secondaryCtaPath.trim())
    ) {
      setError("CTA destinations must be same-site paths or in-page anchors.");
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = draft.imageUrl.trim();
      if (selectedFile) {
        if (!["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type)) {
          throw new Error("Use a PNG, JPEG, or WebP image.");
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
          throw new Error("The About image must be 10 MB or smaller.");
        }
        const uploadInfo = await upload.mutateAsync({
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
      if (!imageUrl) {
        throw new Error("Choose an image or enter an image URL.");
      }

      const content = {
        ...record(section.content),
        eyebrow: draft.eyebrow.trim(),
        imageUrl,
        imageAlt: draft.imageAlt.trim(),
        primaryCtaLabel: draft.primaryCtaLabel.trim(),
        primaryCtaPath: draft.primaryCtaPath.trim(),
        secondaryCtaLabel: draft.secondaryCtaLabel.trim(),
        secondaryCtaPath: draft.secondaryCtaPath.trim(),
      };
      await update.mutateAsync({
        id: section.id,
        data: {
          title: draft.title.trim(),
          subtitle: draft.subtitle.trim(),
          content,
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
      set("imageUrl", imageUrl);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onFlash({ tone: "success", message: "About hero saved." });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      data-testid="form-about-hero"
    >
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.82fr)]">
        <div className="space-y-4">
          <Field
            label="Eyebrow"
            value={draft.eyebrow}
            onChange={(value) => set("eyebrow", value)}
            placeholder="ABOUT SHASTRA"
            maxLength={100}
            testId="input-about-eyebrow"
          />
          <Field
            label="Heading"
            value={draft.title}
            onChange={(value) => set("title", value)}
            required
            maxLength={160}
            testId="input-about-heading"
          />
          <Field
            label="Description"
            value={draft.subtitle}
            onChange={(value) => set("subtitle", value)}
            multiline
            required
            maxLength={300}
            testId="textarea-about-description"
          />
          <Field
            label="Image URL"
            value={draft.imageUrl}
            onChange={(value) => set("imageUrl", value)}
            placeholder="https://… or an uploaded image"
            maxLength={2048}
            testId="input-about-image-url"
          />
          <Field
            label="Image alt text"
            value={draft.imageAlt}
            onChange={(value) => set("imageAlt", value)}
            required
            maxLength={500}
            testId="input-about-image-alt"
          />
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="about-hero-image-upload">
              Replace image with a file
            </label>
            <input
              ref={inputRef}
              id="about-hero-image-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                setSelectedFile(event.currentTarget.files?.[0] || null)
              }
              className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0b3472]/5 file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#0b3472] hover:file:bg-[#0b3472]/10"
              data-testid="input-about-image-upload"
            />
            <p className="mt-1 text-xs leading-5 text-slate-500">
              PNG, JPEG, or WebP; maximum 10 MB. The file uploads when you save.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {draft.imageUrl ? (
              <img
                src={assetUrl(draft.imageUrl)}
                alt={draft.imageAlt}
                className="aspect-[1.18/1] w-full object-cover"
                data-testid="img-admin-about-preview"
              />
            ) : (
              <div className="flex aspect-[1.18/1] items-center justify-center px-6 text-center text-sm text-slate-500">
                Add a campus image URL or upload a file to preview it here.
              </div>
            )}
          </div>
          <Field
            label="Primary button label"
            value={draft.primaryCtaLabel}
            onChange={(value) => set("primaryCtaLabel", value)}
            required
            maxLength={100}
            testId="input-about-primary-cta-label"
          />
          <Field
            label="Primary button destination"
            value={draft.primaryCtaPath}
            onChange={(value) => set("primaryCtaPath", value)}
            placeholder="/#programs"
            required
            maxLength={500}
            testId="input-about-primary-cta-path"
          />
          <Field
            label="Secondary button label"
            value={draft.secondaryCtaLabel}
            onChange={(value) => set("secondaryCtaLabel", value)}
            required
            maxLength={100}
            testId="input-about-secondary-cta-label"
          />
          <Field
            label="Secondary button destination"
            value={draft.secondaryCtaPath}
            onChange={(value) => set("secondaryCtaPath", value)}
            placeholder="/#enquire"
            required
            maxLength={500}
            testId="input-about-secondary-cta-path"
          />
        </div>
      </div>

      {error ? (
        <p
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          role="alert"
          data-testid="text-about-hero-error"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#082859] disabled:cursor-wait disabled:opacity-60"
          data-testid="button-save-about-hero"
        >
          {selectedFile ? <Upload className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving…" : "Save About Hero"}
        </button>
      </div>
    </form>
  );
}

export default function AdminAboutEditor({
  home,
  onFlash,
  onNavigate,
}: {
  home: HomePage;
  onFlash: (flash: Flash) => void;
  onNavigate: (view: "statistics") => void;
}) {
  const client = useQueryClient();
  const page = useGetAdminCmsPage("about", {
    query: { queryKey: getGetAdminCmsPageQueryKey("about") },
  });
  const updateItem = useUpdateContentItem();
  const statisticsSection = home.sections.find(
    (section) => section.sectionKey === "statistics",
  );
  const statistics = home.items
    .filter(
      (item) =>
        item.itemType === "statistic" &&
        item.sectionId === statisticsSection?.id,
    )
    .sort((first, second) => first.position - second.position);
  const heroSection = page.data?.sections.find(
    (section) => section.sectionKey === "hero",
  );

  const toggleStatistic = async (item: ContentItem, showOnAbout: boolean) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        data: {
          content: {
            ...record(item.content),
            showOnAbout,
          },
        },
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }),
        client.invalidateQueries({
          queryKey: getGetAdminCmsPageQueryKey("about"),
        }),
        client.invalidateQueries({
          queryKey: getGetCmsPageQueryKey("about"),
        }),
      ]);
      onFlash({
        tone: "success",
        message: showOnAbout
          ? `${item.title} will appear on About.`
          : `${item.title} was removed from About.`,
      });
    } catch (error) {
      onFlash({ tone: "error", message: errorMessage(error) });
    }
  };

  if (page.isLoading) {
    return (
      <div
        className="mt-6 h-80 animate-pulse rounded-3xl bg-white"
        data-testid="loading-admin-about"
      />
    );
  }
  if (page.isError || !page.data) {
    return (
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="font-bold text-red-800">About editor could not load.</p>
        <button
          type="button"
          onClick={() => void page.refetch()}
          className="mt-3 rounded-lg bg-[#0b3472] px-3 py-2 text-sm font-bold text-white"
          data-testid="button-retry-admin-about"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {heroSection ? (
        <HeroEditor
          key={heroSection.id}
          section={heroSection}
          onFlash={onFlash}
        />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          The About hero section is missing. Restart the API server to restore
          the seeded section.
        </div>
      )}

      <section
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        aria-labelledby="about-statistics-title"
        data-testid="panel-about-statistics"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[#e3212b]">Shared Home records</p>
            <h2
              id="about-statistics-title"
              className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]"
            >
              Statistics shown on About
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Select existing Home Statistics records. Labels and values stay
              shared; this checkbox affects About only and does not change Home
              visibility.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("statistics")}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#0b3472]/20 px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:bg-[#0b3472]/5"
            data-testid="button-open-home-statistics"
          >
            Edit Home Statistics
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {!statisticsSection || statistics.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            No Home Statistics records are available yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {statistics.map((item) => {
              const selected = record(item.content).showOnAbout === true;
              return (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-[#0b3472]/30 hover:bg-slate-50"
                  data-testid={`row-about-statistic-${item.id}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={updateItem.isPending}
                    onChange={(event) =>
                      void toggleStatistic(item, event.currentTarget.checked)
                    }
                    className="mt-1 h-4 w-4 accent-[#0b3472]"
                    data-testid={`checkbox-about-statistic-${item.id}`}
                    aria-label={`Show ${item.title} on About`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-2xl font-extrabold tracking-tight text-[#0b3472]">
                      {statisticValue(item)}
                    </span>
                    <span className="mt-1 block font-bold text-slate-800">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Home item visibility: {item.isVisible ? "Shown" : "Hidden"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}