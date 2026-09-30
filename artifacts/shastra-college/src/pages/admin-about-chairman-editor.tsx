import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Save, Trash2, X } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useCreateContentSection,
  useDeleteContentSection,
  useGetAdminCmsPage,
  useRequestUploadUrl,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentSection } from "@workspace/api-client-react";

type FlashMessage = { tone: "success" | "error"; message: string };

type ChairmanDraft = {
  eyebrow: string;
  title: string;
  greeting: string;
  message: string;
  imageUrl: string;
  imageAlt: string;
  signatureClosing: string;
  signatureName: string;
  signatureTitle: string;
};

const emptyDraft: ChairmanDraft = {
  eyebrow: "LEADERSHIP MESSAGE",
  title: "",
  greeting: "",
  message: "",
  imageUrl: "",
  imageAlt: "",
  signatureClosing: "With best wishes,",
  signatureName: "",
  signatureTitle: "",
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

function draftFrom(section: ContentSection): ChairmanDraft {
  const content = record(section.content);
  return {
    eyebrow: text(content.eyebrow),
    title: section.title,
    greeting: text(content.greeting),
    message: textList(content.messageParagraphs).join("\n\n"),
    imageUrl: text(content.imageUrl),
    imageAlt: text(content.imageAlt),
    signatureClosing: text(content.signatureClosing),
    signatureName: text(content.signatureName),
    signatureTitle: text(content.signatureTitle),
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
    : "The Chairman’s Message could not be saved. Please try again.";
}

function assetUrl(path: string): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  if (path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)) {
    return `${basePath}${path}`;
  }
  return path;
}

export default function AdminAboutChairmanEditor({
  onFlash,
}: {
  onFlash: (flash: FlashMessage) => void;
}) {
  const client = useQueryClient();
  const page = useGetAdminCmsPage("about", {
    query: { queryKey: getGetAdminCmsPageQueryKey("about") },
  });
  const create = useCreateContentSection();
  const update = useUpdateContentSection();
  const remove = useDeleteContentSection();
  const requestUpload = useRequestUploadUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const section = page.data?.sections.find(
    (candidate) => candidate.sectionKey === "chairman-message",
  );
  const [draft, setDraft] = useState(emptyDraft);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (section) {
      setDraft(draftFrom(section));
      setSelectedFile(null);
      setError("");
    }
  }, [section?.id, section?.updatedAt]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const set = (key: keyof ChairmanDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const pending =
    create.isPending ||
    update.isPending ||
    remove.isPending ||
    requestUpload.isPending;

  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({
        queryKey: getGetAdminCmsPageQueryKey("about"),
      }),
      client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("about") }),
    ]);
  };

  const addSection = async () => {
    setError("");
    try {
      await create.mutateAsync({
        data: {
          pageSlug: "about",
          sectionKey: "chairman-message",
          title: "Chairman’s Message",
          subtitle: null,
          content: {
            eyebrow: "LEADERSHIP MESSAGE",
            greeting: "",
            messageParagraphs: [],
            imageUrl: "",
            imageAlt: "",
            signatureClosing: "With best wishes,",
            signatureName: "",
            signatureTitle: "",
          },
          isVisible: false,
          position: 2,
        },
      });
      await invalidate();
      onFlash({ tone: "success", message: "Chairman’s Message section added." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!section) return;

    const messageParagraphs = draft.message
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    if (
      !draft.eyebrow.trim() ||
      !draft.title.trim() ||
      !draft.greeting.trim() ||
      messageParagraphs.length === 0 ||
      !draft.signatureClosing.trim() ||
      !draft.signatureName.trim() ||
      !draft.signatureTitle.trim() ||
      ((selectedFile || draft.imageUrl.trim()) && !draft.imageAlt.trim())
    ) {
      setError(
        "Complete the heading, greeting, message, signature, and alt text for any photo.",
      );
      return;
    }

    try {
      let imageUrl = draft.imageUrl.trim();
      if (selectedFile) {
        if (!["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type)) {
          throw new Error("Use a PNG, JPEG, or WebP portrait.");
        }
        if (selectedFile.size > 2 * 1024 * 1024) {
          throw new Error("The portrait must be 2 MB or smaller.");
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
          throw new Error("The portrait upload could not be completed.");
        }
        imageUrl = uploadInfo.objectPath;
      }

      await update.mutateAsync({
        id: section.id,
        data: {
          title: draft.title.trim(),
          subtitle: section.subtitle,
          content: {
            ...record(section.content),
            eyebrow: draft.eyebrow.trim(),
            greeting: draft.greeting.trim(),
            messageParagraphs,
            imageUrl,
            imageAlt: imageUrl ? draft.imageAlt.trim() : "",
            signatureClosing: draft.signatureClosing.trim(),
            signatureName: draft.signatureName.trim(),
            signatureTitle: draft.signatureTitle.trim(),
          },
          isVisible: true,
        },
      });
      await invalidate();
      setDraft((current) => ({ ...current, imageUrl }));
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onFlash({ tone: "success", message: "Chairman’s Message saved." });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const deleteSection = async () => {
    if (!section) return;
    setError("");
    try {
      await remove.mutateAsync({ id: section.id });
      await invalidate();
      setConfirmDelete(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onFlash({
        tone: "success",
        message: "Chairman’s Message was removed from the About page.",
      });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  if (page.isLoading) {
    return <div className="mt-6 h-96 animate-pulse rounded-3xl bg-white" />;
  }

  if (page.isError || !page.data) {
    return (
      <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="font-bold text-red-800">
          About sections could not be loaded.
        </p>
        <button
          type="button"
          onClick={() => void page.refetch()}
          className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-red-800"
          data-testid="button-retry-about-chairman"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!section) {
    return (
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-8">
        <p className="eyebrow text-[#e3212b]">Pages / About / Chairman</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]">
          No Chairman’s Message is currently saved.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Add a new message section, then enter its text and portrait. It will
          remain unpublished until you save the completed message.
        </p>
        <button
          type="button"
          onClick={() => void addSection()}
          disabled={pending}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#082859] disabled:opacity-50"
          data-testid="button-add-about-chairman"
        >
          Add Chairman’s Message
        </button>
        {error ? (
          <p className="mt-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <>
      <form
        onSubmit={save}
        className="mt-6 space-y-6"
        data-testid="form-about-chairman"
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
          <div className="mb-6">
            <p className="eyebrow text-[#e3212b]">Leadership message</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
              Chairman’s Message
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This content is managed independently from Faculty profiles.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Eyebrow"
              value={draft.eyebrow}
              onChange={(value) => set("eyebrow", value)}
              testId="input-about-chairman-eyebrow"
              maxLength={100}
            />
            <Field
              label="Heading"
              value={draft.title}
              onChange={(value) => set("title", value)}
              testId="input-about-chairman-title"
              maxLength={160}
            />
            <div className="md:col-span-2">
              <Field
                label="Greeting"
                value={draft.greeting}
                onChange={(value) => set("greeting", value)}
                testId="input-about-chairman-greeting"
                maxLength={250}
              />
            </div>
            <div className="md:col-span-2">
              <Field
                label="Message"
                value={draft.message}
                onChange={(value) => set("message", value)}
                multiline
                rows={8}
                hint="Separate paragraphs with a blank line."
                testId="textarea-about-chairman-message"
                maxLength={6000}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-extrabold text-[#0b3472]">
              Portrait and signature
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This portrait and signature are part of the independent Chairman’s
              Message and do not change the matching Faculty profile.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
            <div className="space-y-4">
              <Field
                label="Image alt text"
                value={draft.imageAlt}
                onChange={(value) => set("imageAlt", value)}
                hint="Describe the chairman’s portrait for screen readers."
                testId="input-about-chairman-image-alt"
                maxLength={500}
              />
              <div>
                <label
                  className="block text-sm font-semibold text-slate-700"
                  htmlFor="about-chairman-image-upload"
                >
                  Upload or replace portrait
                </label>
                <input
                  ref={fileInputRef}
                  id="about-chairman-image-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setSelectedFile(event.currentTarget.files?.[0] || null)
                  }
                  disabled={pending}
                  className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0b3472]/5 file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#0b3472] hover:file:bg-[#0b3472]/10 disabled:opacity-60"
                  data-testid="input-about-chairman-image"
                />
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  PNG, JPEG, or WebP; maximum 2 MB. The photo uploads when you
                  save.
                </p>
                {selectedFile ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    data-testid="button-clear-about-chairman-image"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Clear selected photo
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Sign-off"
                  value={draft.signatureClosing}
                  onChange={(value) => set("signatureClosing", value)}
                  testId="input-about-chairman-signoff"
                  maxLength={200}
                />
                <Field
                  label="Chairman’s name"
                  value={draft.signatureName}
                  onChange={(value) => set("signatureName", value)}
                  testId="input-about-chairman-name"
                  maxLength={120}
                />
              </div>
              <Field
                label="Signature title"
                value={draft.signatureTitle}
                onChange={(value) => set("signatureTitle", value)}
                testId="input-about-chairman-signature-title"
                maxLength={160}
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#e8edf4]">
              {previewUrl || draft.imageUrl ? (
                <img
                  src={previewUrl || assetUrl(draft.imageUrl)}
                  alt={draft.imageAlt}
                  className="aspect-[4/5] w-full object-cover"
                  data-testid="img-admin-about-chairman-preview"
                />
              ) : (
                <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 px-5 text-center text-sm text-slate-500">
                  <ImagePlus className="h-7 w-7 text-[#0b3472]/40" />
                  No portrait is currently selected.
                </div>
              )}
            </div>
          </div>
        </section>

        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            role="alert"
            data-testid="error-about-chairman"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            data-testid="button-delete-about-chairman"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete Chairman’s Message
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#082859] disabled:opacity-50"
            data-testid="button-save-about-chairman"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {pending ? "Saving…" : "Save Chairman’s Message"}
          </button>
        </div>
      </form>

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1b35]/55 p-5"
          role="presentation"
          data-testid="dialog-delete-about-chairman"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-about-chairman-title"
            aria-describedby="delete-about-chairman-description"
          >
            <p className="eyebrow text-[#e3212b]">Remove section</p>
            <h2
              id="delete-about-chairman-title"
              className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]"
            >
              Delete the Chairman’s Message?
            </h2>
            <p
              id="delete-about-chairman-description"
              className="mt-3 text-sm leading-6 text-slate-600"
            >
              This permanently removes its text and image reference from the
              About page. You can add a new message section later.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
                data-testid="button-cancel-delete-about-chairman"
              >
                Keep message
              </button>
              <button
                type="button"
                onClick={() => void deleteSection()}
                disabled={remove.isPending}
                className="rounded-xl bg-[#b71927] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                data-testid="button-confirm-delete-about-chairman"
              >
                {remove.isPending ? "Deleting…" : "Delete message"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}