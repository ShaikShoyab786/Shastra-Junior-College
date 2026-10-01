import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  FileCheck2,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  useGetExamUpdates,
  useGetHomePage,
} from "@workspace/api-client-react";
import type {
  ExamCalendarEntry,
  ExamUpdateNotice,
} from "@workspace/api-client-react";
import { Footer, Header } from "./public-home";

const examLabels: Record<string, string> = {
  "jee-main": "JEE Main",
  "neet-ug": "NEET UG",
  intermediate: "Intermediate",
  "ap-eapcet": "AP EAPCET",
  other: "Other examinations",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  tentative: "Tentative",
  "to-be-announced": "To be announced",
  completed: "Completed",
};

function formatDate(value: string | null) {
  if (!value) return "To be announced";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "To be announced";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function matches(
  query: string,
  selectedExam: string,
  itemExamCode: string,
  text: string[],
) {
  const normalized = query.trim().toLocaleLowerCase();
  const searchableText = [
    examLabels[itemExamCode] ?? itemExamCode,
    itemExamCode,
    ...text,
  ].join(" ").toLocaleLowerCase();
  return (!normalized || searchableText.includes(normalized)) &&
    (selectedExam === "all" || selectedExam === itemExamCode);
}

function NoticeCard({ notice }: { notice: ExamUpdateNotice }) {
  return (
    <article
      className="group flex h-full flex-col rounded-[1.4rem] border border-[#12335a]/10 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(20,48,83,.10)] sm:p-6"
      data-testid={`card-exam-notice-${notice.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#12335a]/[.07] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#12335a]">
          {examLabels[notice.examCode] ?? notice.examCode}
        </span>
        {notice.isSample ? (
          <span
            className="rounded-full border border-[#b88736]/25 bg-[#f6eddb] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#815d21]"
            data-testid={`badge-sample-notice-${notice.id}`}
          >
            Sample
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 font-display text-xl font-extrabold leading-tight text-[#12335a] sm:text-[1.35rem]">
        {notice.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-[#52616a]">{notice.summary}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#12335a]/10 pt-4">
        <p className="text-xs font-semibold text-[#6b7a82]">
          {notice.publishedOn ? `Published ${formatDate(notice.publishedOn)}` : "Publication date not listed"}
        </p>
        <a
          href={notice.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-extrabold text-[#a3473c] transition hover:text-[#12335a]"
          data-testid={`link-official-notice-${notice.id}`}
        >
          Official source <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function CalendarRow({ entry }: { entry: ExamCalendarEntry }) {
  const dateText =
    entry.dateStatus === "to-be-announced" || (!entry.startDate && !entry.endDate)
      ? "To be announced"
      : entry.startDate && entry.endDate && entry.startDate !== entry.endDate
        ? `${formatDate(entry.startDate)} – ${formatDate(entry.endDate)}`
        : formatDate(entry.startDate ?? entry.endDate);
  return (
    <article
      className="grid gap-4 border-b border-[#12335a]/10 py-5 last:border-0 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-start sm:gap-6"
      data-testid={`row-exam-calendar-${entry.id}`}
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#a3473c]">
          {entry.examCycle}
        </p>
        <p className="mt-1 text-sm font-bold text-[#12335a]">
          {examLabels[entry.examCode] ?? entry.examCode}
        </p>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-extrabold leading-tight text-[#12335a]">
            {entry.title}
          </h3>
          {entry.isSample ? (
            <span
              className="rounded-full bg-[#f6eddb] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#815d21]"
              data-testid={`badge-sample-calendar-${entry.id}`}
            >
              Sample
            </span>
          ) : null}
        </div>
        {entry.description ? (
          <p className="mt-2 text-sm leading-6 text-[#52616a]">{entry.description}</p>
        ) : null}
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-[#12335a]">
          <CalendarDays className="h-4 w-4 text-[#a3473c]" aria-hidden="true" />
          {dateText}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] ${
            entry.dateStatus === "confirmed"
              ? "bg-emerald-50 text-emerald-800"
              : entry.dateStatus === "completed"
                ? "bg-[#12335a]/[.07] text-[#52616a]"
                : "bg-[#f6eddb] text-[#815d21]"
          }`}
          data-testid={`status-calendar-date-${entry.id}`}
        >
          {statusLabels[entry.dateStatus] ?? "Date status"}
        </span>
        <a
          href={entry.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex min-h-9 items-center gap-1.5 text-xs font-extrabold text-[#a3473c] hover:text-[#12335a]"
          data-testid={`link-official-calendar-${entry.id}`}
        >
          Official source <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-[1.4rem] border border-[#12335a]/10 bg-white p-6">
      <div className="h-4 w-28 rounded bg-[#12335a]/10" />
      <div className="mt-5 h-6 w-3/4 rounded bg-[#12335a]/10" />
      <div className="mt-4 h-4 w-full rounded bg-[#12335a]/[.07]" />
      <div className="mt-2 h-4 w-5/6 rounded bg-[#12335a]/[.07]" />
    </div>
  );
}

export default function PublicExamUpdatesPage() {
  const home = useGetHomePage();
  const updates = useGetExamUpdates();
  const [search, setSearch] = useState("");
  const [examCode, setExamCode] = useState("all");

  const notices = useMemo(
    () =>
      (updates.data?.notices ?? []).filter((notice) =>
        matches(search, examCode, notice.examCode, [
          notice.title,
          notice.summary,
        ]),
      ),
    [updates.data?.notices, search, examCode],
  );
  const calendarEntries = useMemo(
    () =>
      (updates.data?.calendarEntries ?? []).filter((entry) =>
        matches(search, examCode, entry.examCode, [
          entry.examCycle,
          entry.title,
          entry.description,
          statusLabels[entry.dateStatus] ?? entry.dateStatus,
        ]),
      ),
    [updates.data?.calendarEntries, search, examCode],
  );

  if (updates.isLoading || home.isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f3eb]" data-testid="page-exam-updates-loading">
        <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="h-64 animate-pulse rounded-[2rem] bg-[#12335a]/10" />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => <Skeleton key={item} />)}
          </div>
        </main>
      </div>
    );
  }

  if (updates.isError || home.isError || !updates.data || !home.data) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f3eb]" data-testid="page-exam-updates-error">
        {home.data ? <Header home={home.data} /> : null}
        <main className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
          <p className="eyebrow text-[#a3473c]">Knowledge Hub</p>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-[#12335a]">
            Exam updates are unavailable right now.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#52616a]">
            Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => {
              void updates.refetch();
              void home.refetch();
            }}
            className="focus-ring mt-6 rounded-xl bg-[#12335a] px-5 py-3 text-sm font-bold text-white"
            data-testid="button-retry-exam-updates"
          >
            Try again
          </button>
        </main>
        {home.data ? <Footer home={home.data} /> : null}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f5f3eb]" data-testid="page-public-exam-updates">
      <Header home={home.data} />
      <main className="pb-20">
        <section className="relative overflow-hidden bg-[#12335a] text-[#fbf7ed]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full border border-white/10" aria-hidden="true" />
          <div className="pointer-events-none absolute right-16 top-10 h-48 w-48 rounded-full border border-[#e7bd69]/25" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_.62fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-[#e7bd69]">
                {updates.data.settings.eyebrow}
              </p>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[4.4rem]">
                {updates.data.settings.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100/80 sm:text-lg sm:leading-8">
                {updates.data.settings.introduction}
              </p>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[.06] p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7bd69] text-[#12335a]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold">Follow the source</p>
                <p className="mt-1 text-sm leading-6 text-blue-100/75">
                  Every update links directly to its official notice or examination authority.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14">
          <div className="flex flex-col gap-5 border-b border-[#12335a]/12 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a3473c]">Find your exam</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#12335a] sm:text-4xl">
                Notices &amp; calendar
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#52616a]">
                Search official notices and key examination milestones in one place.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_220px] md:max-w-xl">
              <label className="relative block">
                <span className="sr-only">Search exam updates</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74838a]" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notices or milestones"
                  className="focus-ring h-12 w-full rounded-xl border border-[#12335a]/15 bg-white pl-11 pr-4 text-sm text-[#12335a] placeholder:text-[#849198]"
                  data-testid="input-search-exam-updates"
                />
              </label>
              <label>
                <span className="sr-only">Filter by examination</span>
                <select
                  value={examCode}
                  onChange={(event) => setExamCode(event.target.value)}
                  className="focus-ring h-12 w-full rounded-xl border border-[#12335a]/15 bg-white px-3.5 text-sm font-semibold text-[#12335a]"
                  data-testid="select-filter-exam-code"
                >
                  <option value="all">All examinations</option>
                  {Object.entries(examLabels).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          {(search || examCode !== "all") ? (
            <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-[#6b7a82]">
              <span data-testid="text-filtered-exam-update-count">
                {notices.length} {notices.length === 1 ? "notice" : "notices"} · {calendarEntries.length} calendar entries
              </span>
              <button
                type="button"
                onClick={() => { setSearch(""); setExamCode("all"); }}
                className="focus-ring rounded px-2 py-1 font-extrabold text-[#a3473c] hover:underline"
                data-testid="button-clear-exam-update-filters"
              >
                Clear filters
              </button>
            </div>
          ) : null}

          <section className="mt-9" aria-labelledby="exam-notices-heading">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a3473c]/10 text-[#a3473c]">
                <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="exam-notices-heading" className="font-display text-2xl font-extrabold text-[#12335a]">Latest notices</h2>
                <p className="text-xs font-semibold text-[#74838a]">{notices.length} available</p>
              </div>
            </div>
            {notices.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {notices.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[#12335a]/20 bg-white px-6 py-10 text-center" data-testid="empty-exam-notices">
                <p className="font-display text-xl font-extrabold text-[#12335a]">No notices match this search</p>
                <p className="mt-2 text-sm text-[#52616a]">Try another phrase or examination.</p>
              </div>
            )}
          </section>

          <section className="mt-12" aria-labelledby="exam-calendar-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a3473c]">Plan ahead</p>
                <h2 id="exam-calendar-heading" className="mt-2 font-display text-2xl font-extrabold text-[#12335a] sm:text-3xl">Examination calendar</h2>
              </div>
              <p className="text-xs font-semibold text-[#74838a]">{calendarEntries.length} milestones</p>
            </div>
            {calendarEntries.length ? (
              <div className="rounded-[1.4rem] border border-[#12335a]/10 bg-white px-5 sm:px-7">
                {calendarEntries.map((entry) => <CalendarRow key={entry.id} entry={entry} />)}
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[#12335a]/20 bg-white px-6 py-10 text-center" data-testid="empty-exam-calendar">
                <p className="font-display text-xl font-extrabold text-[#12335a]">No calendar entries match</p>
                <p className="mt-2 text-sm text-[#52616a]">Try another phrase or examination.</p>
              </div>
            )}
          </section>
        </section>
      </main>
      <Footer home={home.data} />
    </div>
  );
}