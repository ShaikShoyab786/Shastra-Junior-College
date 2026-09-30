import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Save } from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useCreateContentSection,
  useGetAdminCmsPage,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentSection } from "@workspace/api-client-react";

type FlashMessage = { tone: "success" | "error"; message: string };
type BoardDraft = {
  eyebrow: string;
  title: string;
  subtitle: string;
  isVisible: boolean;
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function draftFrom(section: ContentSection): BoardDraft {
  const content = record(section.content);
  return {
    eyebrow: text(content.eyebrow),
    title: section.title,
    subtitle: section.subtitle || "",
    isVisible: section.isVisible,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The Board of Directors section could not be saved.";
}

export default function AdminAboutBoardEditor({
  onFlash,
  onNavigate,
}: {
  onFlash: (flash: FlashMessage) => void;
  onNavigate: (view: "faculty") => void;
}) {
  const client = useQueryClient();
  const about = useGetAdminCmsPage("about", {
    query: { queryKey: getGetAdminCmsPageQueryKey("about") },
  });
  const faculty = useGetAdminCmsPage("faculty", {
    query: { queryKey: getGetAdminCmsPageQueryKey("faculty") },
  });
  const create = useCreateContentSection();
  const update = useUpdateContentSection();
  const section = about.data?.sections.find(
    (candidate) => candidate.sectionKey === "board-of-directors",
  );
  const [draft, setDraft] = useState<BoardDraft>({
    eyebrow: "GOVERNANCE & LEADERSHIP",
    title: "",
    subtitle: "",
    isVisible: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (section) setDraft(draftFrom(section));
  }, [section?.id, section?.updatedAt]);

  const boardSection = faculty.data?.sections.find(
    (candidate) => candidate.sectionKey === "faculty",
  );
  const boardProfiles =
    faculty.data?.items
      .filter((item) => {
        const content = record(item.content);
        return (
          item.sectionId === boardSection?.id &&
          item.itemType === "faculty-profile" &&
          content.showOnAboutBoard === true
        );
      })
      .sort((a, b) => a.position - b.position) || [];
  const publishedBoardProfiles = boardProfiles.filter((item) => item.isVisible);
  const pending = create.isPending || update.isPending;

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
          sectionKey: "board-of-directors",
          title: "Board of Directors",
          subtitle: "Guided by thoughtful leadership, dedicated to every learner.",
          content: { eyebrow: "GOVERNANCE & LEADERSHIP" },
          isVisible: false,
          position: 3,
        },
      });
      await invalidate();
      onFlash({
        tone: "success",
        message: "Board of Directors section added as a draft.",
      });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!section) return;
    if (!draft.eyebrow.trim() || !draft.title.trim() || !draft.subtitle.trim()) {
      setError("Add an eyebrow, heading, and short introduction.");
      return;
    }
    try {
      await update.mutateAsync({
        id: section.id,
        data: {
          title: draft.title.trim(),
          subtitle: draft.subtitle.trim(),
          content: {
            ...record(section.content),
            eyebrow: draft.eyebrow.trim(),
          },
          isVisible: draft.isVisible,
        },
      });
      await invalidate();
      onFlash({
        tone: "success",
        message: "Board of Directors section saved.",
      });
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  if (about.isLoading) {
    return <div className="mt-6 h-96 animate-pulse rounded-3xl bg-white" />;
  }

  if (about.isError || !about.data) {
    return (
      <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="font-bold text-red-800">
          About sections could not be loaded.
        </p>
        <button
          type="button"
          onClick={() => void about.refetch()}
          className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-red-800"
          data-testid="button-retry-about-board"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!section) {
    return (
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-8">
        <p className="eyebrow text-[#e3212b]">Pages / About / Board</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]">
          The Board of Directors section has been removed.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Add it again to restore the public section. Board members are always
          sourced from Faculty profiles, not copied into About.
        </p>
        <button
          type="button"
          onClick={() => void addSection()}
          disabled={pending}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#082859] disabled:opacity-50"
          data-testid="button-add-about-board"
        >
          Add Board of Directors section
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
    <div className="mt-6 space-y-6" data-testid="admin-about-board">
      <form
        onSubmit={save}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7"
      >
        <div className="mb-6">
          <p className="eyebrow text-[#e3212b]">Governance and leadership</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
            Board section details
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Board cards use Faculty profiles. Changes to a profile’s role,
            publication state, or board checkbox are managed in Faculty.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Eyebrow
            <input
              value={draft.eyebrow}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  eyebrow: event.currentTarget.value,
                }))
              }
              maxLength={100}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0b3472] focus:ring-2 focus:ring-[#0b3472]/10"
              data-testid="input-about-board-eyebrow"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Heading
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.currentTarget.value,
                }))
              }
              maxLength={160}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0b3472] focus:ring-2 focus:ring-[#0b3472]/10"
              data-testid="input-about-board-title"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Introduction
            <textarea
              value={draft.subtitle}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  subtitle: event.currentTarget.value,
                }))
              }
              rows={3}
              maxLength={300}
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#0b3472] focus:ring-2 focus:ring-[#0b3472]/10"
              data-testid="textarea-about-board-introduction"
            />
          </label>
        </div>
        <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={draft.isVisible}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                isVisible: event.currentTarget.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 accent-[#0b3472]"
            data-testid="checkbox-about-board-published"
          />
          <span>
            Publish Board of Directors on About
            <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
              Unchecking this hides the section without changing any Faculty
              records.
            </span>
          </span>
        </label>
        {error ? (
          <p
            className="mt-4 text-sm font-semibold text-red-700"
            role="alert"
            data-testid="error-about-board"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#082859] disabled:opacity-50"
            data-testid="button-save-about-board"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {pending ? "Saving…" : "Save Board section"}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[#e3212b]">Faculty-linked profiles</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
              Board membership
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              A profile appears here only when it is published and “Show on
              About Board” is checked in Faculty settings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("faculty")}
            className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/20 px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:bg-[#0b3472]/5"
            data-testid="button-manage-about-board-members"
          >
            Manage Faculty profiles
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {faculty.isLoading ? (
          <div className="mt-5 h-20 animate-pulse rounded-2xl bg-slate-100" />
        ) : faculty.isError ? (
          <p
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            Faculty membership could not be loaded. Retry from the Faculty
            editor before changing board visibility.
          </p>
        ) : boardProfiles.length ? (
          <ul className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {boardProfiles.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                data-testid={`row-about-board-member-${item.id}`}
              >
                <div>
                  <p className="font-bold text-[#0b3472]">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {text(record(item.content).leadershipRole) || "Faculty"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    item.isVisible
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.isVisible ? "Published on board" : "Unpublished"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
            No Faculty profiles are selected for the About board yet.
          </p>
        )}
        {faculty.data && boardProfiles.length ? (
          <p className="mt-3 text-xs font-semibold text-slate-500">
            {publishedBoardProfiles.length} of {boardProfiles.length} selected
            profiles are published.
          </p>
        ) : null}
      </section>
    </div>
  );
}