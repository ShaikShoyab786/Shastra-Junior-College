import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Eye, EyeOff, ExternalLink, Save } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useCreateContentSection,
  useGetAdminCmsPage,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentSection } from "@workspace/api-client-react";

type Flash = { tone: "success" | "error"; message: string };
type CmsRecord = Record<string, unknown>;

function record(value: unknown): CmsRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown): string {
  const candidate = error as {
    message?: string;
    response?: { status?: number };
    status?: number;
  };
  if (candidate?.response?.status === 403 || candidate?.status === 403) {
    return "Your account is signed in, but it is not on the staff allowlist.";
  }
  return candidate?.message || "The About section could not be saved. Please try again.";
}

function invalidateAbout(client: ReturnType<typeof useQueryClient>) {
  void Promise.all([
    client.invalidateQueries({ queryKey: getGetAdminCmsPageQueryKey("about") }),
    client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("about") }),
  ]);
}

function sectionContent(section: ContentSection, eyebrow: string) {
  return { ...record(section.content), eyebrow: eyebrow.trim() };
}

export default function AdminAboutCoursesPreviewEditor({
  onFlash,
  onNavigate,
}: {
  onFlash: (flash: Flash) => void;
  onNavigate: () => void;
}) {
  const client = useQueryClient();
  const about = useGetAdminCmsPage("about", {
    query: { queryKey: getGetAdminCmsPageQueryKey("about") },
  });
  const createSection = useCreateContentSection();
  const updateSection = useUpdateContentSection();
  const [eyebrow, setEyebrow] = useState("PATHWAYS AT SHASTRA");
  const [title, setTitle] = useState("Explore our courses");
  const [subtitle, setSubtitle] = useState(
    "Explore the courses offered at Shastra Junior College.",
  );
  const [error, setError] = useState("");
  const section = about.data?.sections.find(
    (candidate) => candidate.sectionKey === "courses-preview",
  );
  const pending = createSection.isPending || updateSection.isPending;

  useEffect(() => {
    if (!section) return;
    setEyebrow(text(record(section.content).eyebrow));
    setTitle(section.title);
    setSubtitle(section.subtitle || "");
    setError("");
  }, [section?.id, section?.updatedAt]);

  const saveDraft = async (showSuccess: boolean) => {
    if (!section) return false;
    if (!title.trim()) {
      setError("Add a section title before saving.");
      return false;
    }
    setError("");
    await updateSection.mutateAsync({
      id: section.id,
      data: {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        content: sectionContent(section, eyebrow),
      },
    });
    invalidateAbout(client);
    if (showSuccess) onFlash({ tone: "success", message: "Courses Preview text saved." });
    return true;
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await saveDraft(true);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const toggleSection = async () => {
    if (!section) return;
    setError("");
    try {
      await updateSection.mutateAsync({
        id: section.id,
        data: { isVisible: !section.isVisible },
      });
      invalidateAbout(client);
      onFlash({
        tone: "success",
        message: section.isVisible
          ? "Courses Preview hidden from the public About page."
          : "Courses Preview is now visible on the public About page.",
      });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const openCourseSettings = async () => {
    if (!section) {
      onNavigate();
      return;
    }
    const currentEyebrow = text(record(section.content).eyebrow);
    const hasDraftChanges =
      title.trim() !== section.title ||
      subtitle.trim() !== (section.subtitle || "") ||
      eyebrow.trim() !== currentEyebrow;
    if (!hasDraftChanges) {
      onNavigate();
      return;
    }
    try {
      const saved = await saveDraft(false);
      if (saved) onNavigate();
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const addSection = async () => {
    setError("");
    try {
      await createSection.mutateAsync({
        data: {
          pageSlug: "about",
          sectionKey: "courses-preview",
          title: title.trim() || "Explore our courses",
          subtitle: subtitle.trim() || null,
          content: { eyebrow: eyebrow.trim() },
          isVisible: false,
          position: 6,
        },
      });
      invalidateAbout(client);
      onFlash({
        tone: "success",
        message: "Courses Preview added as a hidden draft.",
      });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  if (about.isLoading) {
    return (
      <div
        className="mt-6 h-96 animate-pulse rounded-3xl bg-white"
        aria-busy="true"
        data-testid="loading-admin-about-courses-preview"
      />
    );
  }

  if (about.isError || !about.data) {
    return (
      <section
        className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6"
        role="alert"
        data-testid="error-admin-about-courses-preview"
      >
        <p className="font-bold text-red-800">About sections could not be loaded.</p>
        <button
          type="button"
          onClick={() => void about.refetch()}
          className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-red-800"
          data-testid="button-retry-admin-about-courses-preview"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!section) {
    return (
      <section
        className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-8"
        data-testid="missing-admin-about-courses-preview"
      >
        <p className="eyebrow text-[#e3212b]">About section</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]">
          Courses Preview is not in the current page
        </h2>
        <button
          type="button"
          onClick={() => void addSection()}
          disabled={pending}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          data-testid="button-add-about-courses-preview"
        >
          Add Courses Preview draft
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
    <div
      className="mt-6 space-y-6"
      data-testid="admin-about-courses-preview"
    >
      <form
        onSubmit={(event) => void save(event)}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[#e3212b]">About section text</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
              Courses Preview
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Edit the heading and introduction shown above the shared course cards.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleSection()}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b3472] hover:bg-slate-50 disabled:opacity-50"
            data-testid="button-toggle-about-courses-preview"
          >
            {section.isVisible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            {section.isVisible ? "Hide section" : "Publish section"}
          </button>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700">
            Eyebrow
            <input
              value={eyebrow}
              onChange={(event) => setEyebrow(event.currentTarget.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
              data-testid="input-about-courses-preview-eyebrow"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
              data-testid="input-about-courses-preview-title"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700 md:col-span-2">
            Supporting text
            <textarea
              value={subtitle}
              onChange={(event) => setSubtitle(event.currentTarget.value)}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-800 outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
              data-testid="textarea-about-courses-preview-subtitle"
            />
          </label>
        </div>
        {error ? (
          <p className="mt-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => void openCourseSettings()}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/20 bg-white px-4 py-3 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/5 disabled:opacity-50"
            data-testid="button-about-courses-preview-manage-courses"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Manage course content
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white hover:bg-[#082859] disabled:opacity-50"
            data-testid="button-save-about-courses-preview"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {pending ? "Saving…" : "Save text"}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
        <p className="eyebrow text-[#e3212b]">Shared course content</p>
        <h2 className="mt-1 font-display text-xl font-extrabold text-[#0b3472]">
          Course cards stay connected to Courses settings
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Course names, categories, descriptions, images, order, and visibility are managed in Explore Courses. Published Quick Course Highlights come from each course’s settings.
        </p>
        <button
          type="button"
          onClick={() => void openCourseSettings()}
          disabled={pending}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#e3212b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#c71e28] disabled:opacity-50"
          data-testid="button-about-courses-preview-open-course-settings"
        >
          Open Explore Courses settings
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}