import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useGetAdminCmsPage,
  useUpdateContentSection,
} from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string };
type CmsRecord = Record<string, unknown>;

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function safeInternalPath(value: string) {
  return (
    value === "" ||
    value.startsWith("#") ||
    (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"))
  );
}

export default function AdminAboutCtaEditor({
  onFlash,
}: {
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const page = useGetAdminCmsPage("about", {
    query: { queryKey: getGetAdminCmsPageQueryKey("about") },
  });
  const update = useUpdateContentSection();
  const section = page.data?.sections.find(
    (candidate) =>
      candidate.pageSlug === "about" && candidate.sectionKey === "cta",
  );
  const content = record(section?.content);
  const [eyebrow, setEyebrow] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [primaryLabel, setPrimaryLabel] = useState("");
  const [primaryPath, setPrimaryPath] = useState("");
  const [secondaryLabel, setSecondaryLabel] = useState("");
  const [secondaryPath, setSecondaryPath] = useState("");
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setEyebrow(text(content.eyebrow));
    setTitle(section?.title || "");
    setSubtitle(section?.subtitle || "");
    setPrimaryLabel(text(content.primaryLabel));
    setPrimaryPath(text(content.primaryPath));
    setSecondaryLabel(text(content.secondaryLabel));
    setSecondaryPath(text(content.secondaryPath));
    setVisible(section?.isVisible ?? true);
    setError("");
  }, [section?.id, section?.updatedAt, section?.title, section?.subtitle, section?.isVisible]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!section) return;
    if (!title.trim() || !primaryLabel.trim()) {
      setError("Add a heading and primary button label before saving.");
      return;
    }
    if (!safeInternalPath(primaryPath) || !safeInternalPath(secondaryPath)) {
      setError("Button links must use a same-site path or an in-page anchor.");
      return;
    }
    if (secondaryPath.trim() && !secondaryLabel.trim()) {
      setError("Add a label for the secondary button or clear its link.");
      return;
    }

    setError("");
    try {
      await update.mutateAsync({
        id: section.id,
        data: {
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          isVisible: visible,
          content: {
            ...record(section.content),
            eyebrow: eyebrow.trim(),
            primaryLabel: primaryLabel.trim(),
            primaryPath: primaryPath.trim(),
            secondaryLabel: secondaryLabel.trim(),
            secondaryPath: secondaryPath.trim(),
          },
        },
      });
      await Promise.all([
        client.invalidateQueries({
          queryKey: getGetAdminCmsPageQueryKey("about"),
        }),
        client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("about") }),
      ]);
      onFlash({ tone: "success", message: "About CTA saved." });
    } catch (failure) {
      const candidate = failure as { message?: string };
      const message =
        candidate.message || "About CTA could not be saved. Please try again.";
      setError(message);
      onFlash({ tone: "error", message });
    }
  };

  if (page.isLoading) {
    return (
      <div
        className="mx-auto max-w-7xl space-y-5 px-5 py-8 sm:px-8 sm:py-10"
        aria-busy="true"
        data-testid="loading-about-cta-editor"
      >
        <div className="h-10 w-72 animate-pulse rounded bg-slate-200" />
        <div className="h-72 max-w-4xl animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (page.isError || !page.data) {
    return (
      <section
        className="mx-auto max-w-3xl px-5 py-10 sm:px-8"
        role="alert"
        data-testid="error-about-cta-editor"
      >
        <h2 className="font-display text-2xl font-extrabold text-[#0b3472]">
          About CTA content could not be loaded.
        </h2>
        <button
          type="button"
          onClick={() => void page.refetch()}
          className="focus-ring mt-5 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white"
          data-testid="button-retry-about-cta"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!section) {
    return (
      <section
        className="mx-auto max-w-3xl px-5 py-10 sm:px-8"
        role="alert"
        data-testid="missing-about-cta-section"
      >
        <h2 className="font-display text-2xl font-extrabold text-[#0b3472]">
          The About CTA section is not available.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          No settings were changed.
        </p>
      </section>
    );
  }

  return (
    <div
      className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"
      data-testid="about-cta-editor"
    >
      <header className="mb-7">
        <p className="eyebrow text-[#e3212b]">Pages / About / Final section</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0b3472] sm:text-4xl">
          Edit the About call to action.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          This separate section appears after the About FAQs.
        </p>
      </header>

      <section className="max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Eyebrow
              <input
                value={eyebrow}
                onChange={(event) => setEyebrow(event.currentTarget.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
                data-testid="input-about-cta-eyebrow"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={visible}
                onChange={(event) => setVisible(event.currentTarget.checked)}
                className="h-4 w-4 accent-[#0b3472]"
                data-testid="checkbox-about-cta-visible"
              />
              Show CTA on the About page
            </label>
          </div>
          <label className="block text-sm font-bold text-slate-700">
            Heading
            <input
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
              data-testid="input-about-cta-title"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Supporting text
            <textarea
              value={subtitle}
              onChange={(event) => setSubtitle(event.currentTarget.value)}
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
              data-testid="textarea-about-cta-subtitle"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Primary button label
              <input
                value={primaryLabel}
                onChange={(event) => setPrimaryLabel(event.currentTarget.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
                data-testid="input-about-cta-primary-label"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Primary button link
              <input
                value={primaryPath}
                onChange={(event) => setPrimaryPath(event.currentTarget.value)}
                placeholder="/courses"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
                data-testid="input-about-cta-primary-path"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Secondary button label
              <input
                value={secondaryLabel}
                onChange={(event) => setSecondaryLabel(event.currentTarget.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
                data-testid="input-about-cta-secondary-label"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Secondary button link
              <input
                value={secondaryPath}
                onChange={(event) => setSecondaryPath(event.currentTarget.value)}
                placeholder="/contact"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
                data-testid="input-about-cta-secondary-path"
              />
            </label>
          </div>
          {error ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
              role="alert"
              data-testid="error-message-about-cta"
            >
              {error}
            </p>
          ) : null}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={update.isPending}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#082859] disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="button-save-about-cta"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {update.isPending ? "Saving…" : "Save About CTA"}
            </button>
          </div>
        </form>
      </section>
      <p className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        The CTA remains a distinct final section; its wording and links are editable here.
      </p>
    </div>
  );
}