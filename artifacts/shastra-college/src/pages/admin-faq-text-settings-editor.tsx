import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, CircleHelp, Save } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetAdminHomeQueryKey,
  getGetCmsPageQueryKey,
  getGetHomePageQueryKey,
  useGetAdminCmsPage,
  useGetAdminHome,
  useUpdateContentSection,
} from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string };
type CmsRecord = Record<string, unknown>;

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function errorMessage(error: unknown) {
  const candidate = error as { message?: string };
  return candidate?.message || "FAQ settings could not be saved. Please try again.";
}

export default function AdminFaqTextSettingsEditor({
  pageSlug,
  onFlash,
  onOpenManager,
}: {
  pageSlug: "home" | "about";
  onFlash: (flash: Flash) => void;
  onOpenManager: () => void;
}) {
  const client = useQueryClient();
  const homeQuery = useGetAdminHome({
    query: {
      queryKey: getGetAdminHomeQueryKey(),
      enabled: pageSlug === "home",
    },
  });
  const aboutQuery = useGetAdminCmsPage("about", {
    query: {
      queryKey: getGetAdminCmsPageQueryKey("about"),
      enabled: pageSlug === "about",
    },
  });
  const update = useUpdateContentSection();
  const data = pageSlug === "home" ? homeQuery.data : aboutQuery.data;
  const loading =
    pageSlug === "home" ? homeQuery.isLoading : aboutQuery.isLoading;
  const failed = pageSlug === "home" ? homeQuery.isError : aboutQuery.isError;
  const section = data?.sections.find(
    (candidate) =>
      candidate.pageSlug === pageSlug && candidate.sectionKey === "faqs",
  );
  const content = record(section?.content);
  const [eyebrow, setEyebrow] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setEyebrow(typeof content.eyebrow === "string" ? content.eyebrow : "");
    setTitle(section?.title || "");
    setSubtitle(section?.subtitle || "");
    setError("");
  }, [section?.id, section?.updatedAt, section?.title, section?.subtitle]);

  if (loading) {
    return (
      <div
        className="mx-auto max-w-7xl space-y-5 px-5 py-8 sm:px-8 sm:py-10"
        aria-busy="true"
        data-testid={`loading-${pageSlug}-faq-settings`}
      >
        <div className="h-10 w-72 animate-pulse rounded bg-slate-200" />
        <div className="h-64 max-w-4xl animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (failed || !data) {
    return (
      <section
        className="mx-auto max-w-3xl px-5 py-10 sm:px-8"
        role="alert"
        data-testid={`error-${pageSlug}-faq-settings`}
      >
        <h2 className="font-display text-2xl font-extrabold text-[#0b3472]">
          FAQ settings could not be loaded.
        </h2>
        <button
          type="button"
          onClick={() =>
            void (pageSlug === "home"
              ? homeQuery.refetch()
              : aboutQuery.refetch())
          }
          className="focus-ring mt-5 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white"
          data-testid={`button-retry-${pageSlug}-faq-settings`}
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
        data-testid={`missing-${pageSlug}-faq-section`}
      >
        <h2 className="font-display text-2xl font-extrabold text-[#0b3472]">
          The {pageSlug === "home" ? "Home" : "About"} FAQ section is not
          available.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          No settings were changed.
        </p>
      </section>
    );
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a title before saving.");
      return;
    }
    setError("");
    try {
      await update.mutateAsync({
        id: section.id,
        data: {
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: { ...record(section.content), eyebrow: eyebrow.trim() },
        },
      });
      if (pageSlug === "home") {
        await Promise.all([
          client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }),
          client.invalidateQueries({ queryKey: getGetHomePageQueryKey() }),
        ]);
      } else {
        await Promise.all([
          client.invalidateQueries({
            queryKey: getGetAdminCmsPageQueryKey("about"),
          }),
          client.invalidateQueries({
            queryKey: getGetCmsPageQueryKey("about"),
          }),
        ]);
      }
      onFlash({ tone: "success", message: "FAQ section text saved." });
    } catch (failure) {
      const message = errorMessage(failure);
      setError(message);
      onFlash({ tone: "error", message });
    }
  };

  const pageName = pageSlug === "home" ? "Home" : "About";

  return (
    <div
      className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"
      data-testid={`${pageSlug}-faq-text-settings`}
    >
      <header className="mb-7">
        <p className="eyebrow text-[#e3212b]">Pages / {pageName} / FAQs</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0b3472] sm:text-4xl">
          Edit the {pageName} FAQ introduction.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          This page controls the FAQ heading and supporting text only. Questions
          and answers are managed separately.
        </p>
      </header>

      <section className="max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0b3472]/[.07] text-[#0b3472]">
            <CircleHelp className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow text-[#c07823]">{pageName} FAQ section</p>
            <h2 className="mt-1 font-display text-xl font-extrabold text-[#0b3472]">
              Section text
            </h2>
          </div>
        </div>

        <form onSubmit={(event) => void save(event)} className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-slate-700">
            Eyebrow
            <input
              value={eyebrow}
              onChange={(event) => setEyebrow(event.currentTarget.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
              data-testid={`input-${pageSlug}-faq-eyebrow`}
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
              data-testid={`input-${pageSlug}-faq-title`}
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Supporting text
            <textarea
              value={subtitle}
              onChange={(event) => setSubtitle(event.currentTarget.value)}
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-[#fffefa] px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
              data-testid={`textarea-${pageSlug}-faq-subtitle`}
            />
          </label>
          {error ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
              role="alert"
              data-testid={`error-message-${pageSlug}-faq-settings`}
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenManager}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/20 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:bg-[#0b3472]/[.04]"
              data-testid={`button-${pageSlug}-open-faq-manager`}
            >
              Manage questions and answers
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="submit"
              disabled={update.isPending}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#082859] disabled:cursor-not-allowed disabled:opacity-50"
              data-testid={`button-save-${pageSlug}-faq-settings`}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {update.isPending ? "Saving…" : "Save FAQ text"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}