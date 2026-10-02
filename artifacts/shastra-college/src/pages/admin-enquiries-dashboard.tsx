import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Inbox,
  MessageSquareText,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  getGetAdminEnquiriesQueryKey,
  getGetAdminEnquiryNotesQueryKey,
  useCreateAdminEnquiryNote,
  useDeleteEnquiry,
  useGetAdminEnquiries,
  useGetAdminEnquiryNotes,
  useRestoreEnquiry,
  useUpdateEnquiry,
} from "@workspace/api-client-react";
import type { AdminEnquiry } from "@workspace/api-client-react";

type Flash = {
  tone: "success" | "error";
  message: string;
  action?: { label: string; onClick: () => void };
} | null;

type Props = { onFlash: (flash: Flash) => void };
type Status = AdminEnquiry["status"];
type ViewFilter = "active" | "all";
type StatusFilter = "all" | Status;

const statusText: Record<Status, string> = {
  new: "New",
  follow_up: "Follow-up",
  reviewed: "Reviewed",
};

const statusStyle: Record<Status, string> = {
  new: "bg-[#fff0ed] text-[#b5372e] ring-[#efc8c2]",
  follow_up: "bg-[#fff5dc] text-[#80580e] ring-[#eed9a5]",
  reviewed: "bg-[#e9f2eb] text-[#356347] ring-[#c8ddce]",
};

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function displayDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function displayTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function answerValue(enquiry: AdminEnquiry, names: string[]) {
  return enquiry.answers.find((answer) => names.includes(answer.name))?.value?.trim() || "";
}

function studentName(enquiry: AdminEnquiry) {
  return (
    answerValue(enquiry, ["fullName", "name", "studentName", "parentName"]) ||
    enquiry.answers[0]?.value?.trim() ||
    "Admissions enquiry"
  );
}

function pathwayAnswer(enquiry: AdminEnquiry) {
  return enquiry.answers.find((answer) =>
    /area.?of.?interest|pathway/i.test(`${answer.name} ${answer.label}`),
  )?.value?.trim() ?? "";
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyle[status]}`}
      data-testid={`status-enquiry-${status}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {statusText[status]}
    </span>
  );
}

function Metric({
  label,
  value,
  detail,
  tone = "blue",
  testId,
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "blue" | "red" | "amber" | "green";
  testId: string;
}) {
  const accent = {
    blue: "before:bg-[#0b3472]",
    red: "before:bg-[#c43d35]",
    amber: "before:bg-[#b47b19]",
    green: "before:bg-[#487454]",
  }[tone];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#dce3e9] bg-[#fffefa] px-4 py-4 shadow-[0_4px_16px_rgba(21,48,77,.035)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] ${accent}`}
      data-testid={testId}
    >
      <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#647386]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="font-display text-[30px] font-extrabold leading-none text-[#183455]">{value}</span>
        <span className="pb-0.5 text-[11px] font-medium text-[#7b8794]">{detail}</span>
      </div>
    </div>
  );
}

function EnquirySkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading enquiries" data-testid="skeleton-enquiries">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse rounded-2xl border border-[#e0e5e8] bg-[#fffefa] p-5">
          <div className="h-4 w-44 rounded bg-[#e8ecee]" />
          <div className="mt-4 h-3 w-64 max-w-full rounded bg-[#edf0f1]" />
          <div className="mt-3 h-3 w-36 rounded bg-[#edf0f1]" />
        </div>
      ))}
    </div>
  );
}

export default function AdminEnquiriesDashboard({ onFlash }: Props) {
  const queryClient = useQueryClient();
  const enquiriesQuery = useGetAdminEnquiries();
  const updateEnquiry = useUpdateEnquiry();
  const deleteEnquiry = useDeleteEnquiry();
  const restoreEnquiry = useRestoreEnquiry();
  const createNote = useCreateAdminEnquiryNote();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [draftStatus, setDraftStatus] = useState<Status>("new");
  const [draftFollowUp, setDraftFollowUp] = useState("");

  const enquiries = enquiriesQuery.data?.items ?? [];
  const selected = enquiries.find((enquiry) => enquiry.id === selectedId) ?? null;
  const notesQuery = useGetAdminEnquiryNotes(selectedId ?? "", {
    query: {
      enabled: Boolean(selectedId),
      queryKey: getGetAdminEnquiryNotesQueryKey(selectedId ?? ""),
    },
  });
  const today = getTodayInIndia();

  const metrics = useMemo(() => {
    const followUps = enquiries.filter((item) => item.status === "follow_up");
    return {
      total: enquiries.length,
      reviewed: enquiries.filter((item) => item.status === "reviewed").length,
      followUp: followUps.length,
      dueToday: followUps.filter((item) => item.followUpDate === today).length,
      overdue: followUps.filter((item) => Boolean(item.followUpDate && item.followUpDate < today)).length,
    };
  }, [enquiries, today]);

  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const enquiry of enquiries) {
      const value = pathwayAnswer(enquiry);
      if (value) found.add(value);
    }
    return [...found].sort((a, b) => a.localeCompare(b));
  }, [enquiries]);

  const visibleEnquiries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...enquiries]
      .filter((enquiry) => viewFilter === "all" || enquiry.status !== "reviewed")
      .filter(
        (enquiry) =>
          statusFilter === "all" || enquiry.status === statusFilter,
      )
      .filter((enquiry) => category === "all" || pathwayAnswer(enquiry) === category)
      .filter((enquiry) => {
        if (!query) return true;
        return enquiry.answers.some((answer) =>
          `${answer.name} ${answer.label} ${answer.value}`
            .toLocaleLowerCase()
            .includes(query),
        );
      })
      .sort((a, b) => {
        const urgency = (item: AdminEnquiry) =>
          item.status === "follow_up" && item.followUpDate && item.followUpDate <= today ? 0 : 1;
        return urgency(a) - urgency(b) || b.createdAt.localeCompare(a.createdAt);
      });
  }, [category, enquiries, search, statusFilter, today, viewFilter]);

  const openEnquiry = (enquiry: AdminEnquiry) => {
    setSelectedId(enquiry.id);
    setDraftStatus(enquiry.status);
    setDraftFollowUp(enquiry.followUpDate ?? "");
    setNoteBody("");
  };

  const refreshEnquiries = () =>
    queryClient.invalidateQueries({ queryKey: getGetAdminEnquiriesQueryKey() });

  const saveEnquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    updateEnquiry.mutate(
      {
        id: selected.id,
        data: { status: draftStatus, followUpDate: draftFollowUp || null },
      },
      {
        onSuccess: () => {
          void refreshEnquiries();
          onFlash({ tone: "success", message: "Enquiry updated." });
        },
        onError: () => onFlash({ tone: "error", message: "Could not update this enquiry. Please try again." }),
      },
    );
  };

  const removeEnquiry = (enquiry: AdminEnquiry) => {
    const confirmed = window.confirm(`Move ${studentName(enquiry)} out of the active inbox? You can undo this action.`);
    if (!confirmed) return;
    deleteEnquiry.mutate(
      { id: enquiry.id },
      {
        onSuccess: () => {
          void refreshEnquiries();
          setSelectedId((current) => (current === enquiry.id ? null : current));
          onFlash({
            tone: "success",
            message: "Enquiry moved out of the active inbox.",
            action: {
              label: "Undo",
              onClick: () => {
                restoreEnquiry.mutate(
                  { id: enquiry.id },
                  {
                    onSuccess: () => {
                      void refreshEnquiries();
                      onFlash({ tone: "success", message: "Enquiry restored to the active inbox." });
                    },
                    onError: () => onFlash({ tone: "error", message: "Could not restore the enquiry." }),
                  },
                );
              },
            },
          });
        },
        onError: () => onFlash({ tone: "error", message: "Could not remove this enquiry. Please try again." }),
      },
    );
  };

  const submitNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = noteBody.trim();
    if (!selected || !body) return;
    createNote.mutate(
      { id: selected.id, data: { body } },
      {
        onSuccess: () => {
          setNoteBody("");
          void queryClient.invalidateQueries({
            queryKey: getGetAdminEnquiryNotesQueryKey(selected.id),
          });
          onFlash({ tone: "success", message: "Private staff note added." });
        },
        onError: () => onFlash({ tone: "error", message: "Could not add the note. Please try again." }),
      },
    );
  };

  return (
    <section className="min-h-[100dvh] bg-[#f4f5f1] px-4 py-6 text-[#20334a] sm:px-6 lg:px-9 lg:py-9" data-testid="panel-admissions-enquiries">
      <div className="mx-auto max-w-[1440px]">
        <header className="reveal flex flex-col justify-between gap-5 border-b border-[#d9e0e2] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-[#ad4338]">Admissions · Staff workspace</p>
            <h1 className="mt-2 font-display text-[34px] font-extrabold leading-tight tracking-[-.035em] text-[#12345a] sm:text-[42px]">
              Enquiry inbox
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#637184]">
              Keep every family moving toward a clear response.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-xl border border-[#d9e1e2] bg-[#fffefa] px-3 py-2 text-xs font-semibold text-[#607183] sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-[#658d6c]" aria-hidden="true" />
            Active admissions records
          </div>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <Metric label="Total enquiries" value={metrics.total} detail="active records" tone="blue" testId="metric-total-enquiries" />
          <Metric label="Reviewed" value={metrics.reviewed} detail="in history" tone="green" testId="metric-reviewed-enquiries" />
          <Metric label="Follow-up needed" value={metrics.followUp} detail="assigned" tone="amber" testId="metric-follow-up-needed" />
          <Metric label="Due today" value={metrics.dueToday} detail="Asia/Kolkata" tone="red" testId="metric-follow-up-due-today" />
          <Metric label="Overdue" value={metrics.overdue} detail="needs attention" tone="red" testId="metric-follow-up-overdue" />
        </div>

        <div className="mt-7 overflow-hidden rounded-[22px] border border-[#d9e0e2] bg-[#fffefa] shadow-[0_12px_36px_rgba(25,49,69,.045)]">
          <div className="flex flex-col gap-4 border-b border-[#e3e7e5] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-[#0b3472]" aria-hidden="true" />
                <h2 className="font-display text-lg font-extrabold text-[#173858]">Incoming families</h2>
                <span className="rounded-md bg-[#edf1f2] px-2 py-1 text-[11px] font-bold text-[#607183]" data-testid="text-enquiries-count">
                  {visibleEnquiries.length} shown
                </span>
              </div>
              <p className="mt-1 text-xs text-[#758292]">Open a record to review answers, schedule follow-up, and leave private staff notes.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <label className="relative min-w-0 sm:min-w-[245px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8994a0]" aria-hidden="true" />
                <span className="sr-only">Search enquiry answers</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search submitted answers"
                  className="h-10 w-full rounded-xl border border-[#dce3e5] bg-[#fbfcfa] pl-9 pr-3 text-sm text-[#26394d] outline-none transition focus:border-[#7892a8] focus:ring-4 focus:ring-[#0b3472]/[.08]"
                  data-testid="input-search-enquiries"
                />
              </label>
              <label>
                 <span className="sr-only">Filter by area of interest</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#dce3e5] bg-[#fbfcfa] px-3 text-sm font-semibold text-[#45596d] outline-none focus:border-[#7892a8] focus:ring-4 focus:ring-[#0b3472]/[.08] sm:w-[190px]"
                  data-testid="select-enquiry-category"
                >
                   <option value="all">All areas of interest</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
               <label>
                 <span className="sr-only">Filter by enquiry status</span>
                 <select
                   value={statusFilter}
                   onChange={(event) => {
                     const next = event.target.value as StatusFilter;
                     setStatusFilter(next);
                   if (next === "all") setViewFilter("all");
                     if (next === "reviewed") setViewFilter("all");
                     if (next === "new" || next === "follow_up") {
                       setViewFilter("active");
                     }
                   }}
                   className="h-10 w-full rounded-xl border border-[#dce3e5] bg-[#fbfcfa] px-3 text-sm font-semibold text-[#45596d] outline-none focus:border-[#7892a8] focus:ring-4 focus:ring-[#0b3472]/[.08] sm:w-[170px]"
                   data-testid="select-enquiry-status-filter"
                 >
                   <option value="all">
                     {viewFilter === "active" ? "Any active status" : "All statuses"}
                   </option>
                   <option value="new">New</option>
                   <option value="follow_up">Follow-up needed</option>
                   <option value="reviewed">Reviewed</option>
                 </select>
               </label>
              <div className="flex rounded-xl border border-[#dce3e5] bg-[#f5f7f5] p-1" role="group" aria-label="Enquiry history view">
                <button
                  type="button"
                  onClick={() => setViewFilter("active")}
                  aria-pressed={viewFilter === "active"}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewFilter === "active" ? "bg-white text-[#173858] shadow-sm" : "text-[#778493] hover:text-[#173858]"}`}
                  data-testid="button-view-active-enquiries"
                >
                  Needs action
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter("all")}
                  aria-pressed={viewFilter === "all"}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewFilter === "all" ? "bg-white text-[#173858] shadow-sm" : "text-[#778493] hover:text-[#173858]"}`}
                  data-testid="button-view-full-history"
                >
                  Full history
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            {enquiriesQuery.isLoading ? <EnquirySkeleton /> : null}
            {enquiriesQuery.isError ? (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#ebc9c4] bg-[#fff6f3] p-5 sm:flex-row sm:items-center" role="alert" data-testid="state-enquiries-error">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#b43f35]" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-bold text-[#733a35]">Enquiries could not be loaded</p>
                  <p className="mt-1 text-sm text-[#85605b]">Check your connection and try again.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void enquiriesQuery.refetch()}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#dfb9b4] bg-white px-3 py-2 text-sm font-bold text-[#913e36] hover:bg-[#fffaf8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b43f35]"
                  data-testid="button-retry-enquiries"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Retry
                </button>
              </div>
            ) : null}
            {!enquiriesQuery.isLoading && !enquiriesQuery.isError && enquiries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#ccd6d8] bg-[#fafbf8] px-5 py-12 text-center" data-testid="state-enquiries-empty">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9eff0] text-[#43637a]">
                  <Inbox className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-extrabold text-[#23405b]">Your inbox is clear</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#788593]">New admissions enquiries will appear here as soon as a family submits the form.</p>
              </div>
            ) : null}
            {!enquiriesQuery.isLoading && !enquiriesQuery.isError && enquiries.length > 0 && visibleEnquiries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#ccd6d8] bg-[#fafbf8] px-5 py-10 text-center" data-testid="state-no-enquiry-matches">
                <p className="font-bold text-[#38516a]">No enquiries match these filters</p>
                <p className="mt-1 text-sm text-[#788593]">Try a different search, pathway, or history view.</p>
                <button type="button" onClick={() => { setSearch(""); setCategory("all"); setStatusFilter("all"); setViewFilter("all"); }} className="mt-4 rounded-lg px-3 py-2 text-sm font-bold text-[#0b3472] hover:bg-[#edf2f4]" data-testid="button-clear-enquiry-filters">
                  Clear filters
                </button>
              </div>
            ) : null}
            {!enquiriesQuery.isLoading && !enquiriesQuery.isError && visibleEnquiries.length > 0 ? (
              <div className="space-y-2.5" data-testid="list-enquiries">
                {visibleEnquiries.map((enquiry) => {
                  const pathway = pathwayAnswer(enquiry);
                  const date = enquiry.status === "follow_up" && enquiry.followUpDate;
                  const isOverdue = Boolean(date && enquiry.followUpDate! < today);
                  const isDue = Boolean(date && enquiry.followUpDate === today);
                  return (
                    <article
                      key={enquiry.id}
                      className="group grid gap-3 rounded-2xl border border-[#e0e6e6] bg-[#fffefa] p-4 transition hover:border-[#b9c9d0] hover:bg-[#fdfefb] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
                      data-testid={`card-enquiry-${enquiry.id}`}
                    >
                      <button type="button" onClick={() => openEnquiry(enquiry)} className="min-w-0 text-left focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0b3472]" data-testid={`button-open-enquiry-${enquiry.id}`}>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-bold text-[#203a55]">{studentName(enquiry)}</span>
                          <StatusBadge status={enquiry.status} />
                          {isOverdue ? <span className="rounded-full bg-[#fff0ed] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#b5372e]">Overdue</span> : null}
                          {isDue ? <span className="rounded-full bg-[#fff5dc] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#80580e]">Due today</span> : null}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#758292]">
                          {pathway ? <span className="font-semibold text-[#50677b]">{pathway}</span> : null}
                          <span>Received {displayTimestamp(enquiry.createdAt)}</span>
                          {date ? <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />Follow-up {displayDate(enquiry.followUpDate)}</span> : null}
                        </span>
                        {answerValue(enquiry, ["email", "emailAddress", "phone", "phoneNumber", "mobile"]) ? (
                          <span className="mt-2 block truncate text-xs text-[#536c80]">
                            {answerValue(enquiry, ["email", "emailAddress", "phone", "phoneNumber", "mobile"])}
                          </span>
                        ) : null}
                      </button>
                      <div className="flex items-center justify-between gap-3 border-t border-[#eef0ee] pt-3 sm:justify-end sm:border-0 sm:pt-0">
                        <span className="text-[11px] font-medium text-[#84909b] sm:hidden">Open record</span>
                        <button type="button" onClick={() => openEnquiry(enquiry)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#edf2f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0b3472]" aria-label={`Open ${studentName(enquiry)}`} data-testid={`button-view-enquiry-${enquiry.id}`}>
                          Review <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => removeEnquiry(enquiry)} disabled={deleteEnquiry.isPending} className="rounded-lg p-2 text-[#8a7774] hover:bg-[#fff0ed] hover:text-[#aa382f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b43f35] disabled:opacity-50" aria-label={`Remove ${studentName(enquiry)} from active inbox`} data-testid={`button-delete-enquiry-${enquiry.id}`}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#10253a]/45 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }} data-testid="dialog-enquiry-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-detail-heading"
            className="flex max-h-[96dvh] w-full max-w-[920px] flex-col overflow-hidden rounded-t-[24px] border border-[#d9e0e2] bg-[#f7f8f4] shadow-[0_24px_90px_rgba(9,29,49,.27)] sm:max-h-[90dvh] sm:rounded-[24px]"
            data-testid={`dialog-enquiry-detail-${selected.id}`}
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#dce2e1] bg-[#fffefa] px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <p className="eyebrow text-[#ad4338]">Enquiry record</p>
                <h2 id="enquiry-detail-heading" className="mt-1 truncate font-display text-2xl font-extrabold tracking-[-.025em] text-[#173858]">
                  {studentName(selected)}
                </h2>
                <p className="mt-1 text-xs text-[#788593]">Received {displayTimestamp(selected.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-xl p-2 text-[#637184] hover:bg-[#edf1ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0b3472]" aria-label="Close enquiry details" data-testid="button-close-enquiry-detail">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.08fr_.92fr]">
              <div className="space-y-5 p-5 sm:p-7">
                <section aria-labelledby="answers-heading">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="eyebrow text-[#7a8791]">Submitted by the family</p>
                      <h3 id="answers-heading" className="mt-1 font-display text-lg font-extrabold text-[#23405b]">Enquiry details</h3>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>
                  {selected.answers.length > 0 ? (
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {selected.answers.map((answer, index) => (
                        <div key={`${answer.name}-${index}`} className="min-w-0 rounded-xl border border-[#e0e6e4] bg-[#fffefa] p-3" data-testid={`answer-enquiry-${selected.id}-${answer.name || index}`}>
                          <dt className="text-[10px] font-bold uppercase tracking-[.1em] text-[#81909b]">{answer.label || answer.name || "Answer"}</dt>
                          <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-5 text-[#344b60]">{answer.value || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="rounded-xl border border-dashed border-[#ccd6d8] p-4 text-sm text-[#788593]">No answers were included in this enquiry.</p>
                  )}
                </section>

                <form onSubmit={saveEnquiry} className="rounded-2xl border border-[#dce4e3] bg-[#fffefa] p-4 sm:p-5" data-testid="form-update-enquiry">
                  <div className="mb-4">
                    <p className="eyebrow text-[#7a8791]">Next step</p>
                    <h3 className="mt-1 font-display text-lg font-extrabold text-[#23405b]">Follow-through</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-[#53687a]">
                      Enquiry status
                      <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as Status)} className="mt-1.5 h-10 w-full rounded-xl border border-[#dce3e5] bg-[#fbfcfa] px-3 text-sm font-semibold text-[#33495d] outline-none focus:border-[#7892a8] focus:ring-4 focus:ring-[#0b3472]/[.08]" data-testid="select-enquiry-status">
                        <option value="new">New</option>
                        <option value="follow_up">Follow-up needed</option>
                        <option value="reviewed">Reviewed</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-[#53687a]">
                      Follow-up date
                      <input type="date" value={draftFollowUp} onChange={(event) => setDraftFollowUp(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#dce3e5] bg-[#fbfcfa] px-3 text-sm font-semibold text-[#33495d] outline-none focus:border-[#7892a8] focus:ring-4 focus:ring-[#0b3472]/[.08]" data-testid="input-enquiry-follow-up-date" />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-[#82909b]">Leave the date blank to clear a scheduled follow-up.</p>
                    <button type="submit" disabled={updateEnquiry.isPending || (draftStatus === selected.status && (draftFollowUp || "") === (selected.followUpDate || ""))} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_14px_rgba(11,52,114,.15)] transition hover:bg-[#082b5e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3472] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-save-enquiry">
                      <Check className="h-4 w-4" aria-hidden="true" />{updateEnquiry.isPending ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
                <button type="button" onClick={() => removeEnquiry(selected)} disabled={deleteEnquiry.isPending} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#9a5149] hover:bg-[#fff0ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b43f35] disabled:opacity-50" data-testid={`button-delete-detail-${selected.id}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Move from active inbox
                </button>
              </div>

              <aside className="border-t border-[#dce2e1] bg-[#f0f3f0] p-5 lg:border-l lg:border-t-0 sm:p-7" aria-labelledby="staff-notes-heading">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-[#ad4338]">Staff only</p>
                    <h3 id="staff-notes-heading" className="mt-1 flex items-center gap-2 font-display text-lg font-extrabold text-[#23405b]">
                      <MessageSquareText className="h-4 w-4 text-[#0b3472]" aria-hidden="true" /> Private notes
                    </h3>
                  </div>
                  <span className="rounded-full border border-[#d2dcda] bg-[#fffefa] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#718078]">Admin only</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#77858c]">Notes are visible only in this staff workspace and are never shown on the public site.</p>
                <form onSubmit={submitNote} className="mt-4" data-testid="form-add-enquiry-note">
                  <label htmlFor="staff-note-body" className="sr-only">Add a private staff note</label>
                  <textarea
                    id="staff-note-body"
                    value={noteBody}
                    onChange={(event) => setNoteBody(event.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Add context for the admissions team…"
                    className="w-full resize-y rounded-xl border border-[#d7dfdd] bg-[#fffefa] px-3.5 py-3 text-sm leading-5 text-[#344b60] outline-none placeholder:text-[#a0aaa9] focus:border-[#7892a8] focus:ring-4 focus:ring-[#0b3472]/[.08]"
                    data-testid="textarea-enquiry-note"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#84918f]">{noteBody.length}/2000</span>
                    <button type="submit" disabled={!noteBody.trim() || createNote.isPending} className="inline-flex items-center gap-2 rounded-lg bg-[#234c6c] px-3 py-2 text-xs font-bold text-white hover:bg-[#173c5a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3472] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-add-enquiry-note">
                      <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />{createNote.isPending ? "Adding…" : "Add note"}
                    </button>
                  </div>
                </form>
                <div className="mt-5 border-t border-[#d9e1df] pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-[.1em] text-[#5a6e7a]">Note history</h4>
                    <span className="text-[11px] text-[#899593]" data-testid="text-enquiry-notes-count">{notesQuery.data?.items.length ?? 0}</span>
                  </div>
                  {notesQuery.isLoading ? (
                    <div className="space-y-2" aria-label="Loading private notes" data-testid="skeleton-enquiry-notes">
                      <div className="h-16 animate-pulse rounded-xl bg-[#e4eae7]" />
                      <div className="h-16 animate-pulse rounded-xl bg-[#e4eae7]" />
                    </div>
                  ) : null}
                  {notesQuery.isError ? (
                    <div className="rounded-xl border border-[#ebc9c4] bg-[#fff6f3] p-3 text-xs text-[#854640]" role="alert" data-testid="state-enquiry-notes-error">
                      <p className="font-bold">Notes could not be loaded.</p>
                      <button type="button" onClick={() => void notesQuery.refetch()} className="mt-1 inline-flex items-center gap-1 font-bold underline underline-offset-2" data-testid="button-retry-enquiry-notes">
                        <RotateCcw className="h-3 w-3" aria-hidden="true" /> Try again
                      </button>
                    </div>
                  ) : null}
                  {!notesQuery.isLoading && !notesQuery.isError && (notesQuery.data?.items.length ?? 0) === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#cdd8d4] bg-[#f8faf7] px-3 py-5 text-center" data-testid="state-enquiry-notes-empty">
                      <Clock3 className="mx-auto h-4 w-4 text-[#8a9a94]" aria-hidden="true" />
                      <p className="mt-2 text-xs font-semibold text-[#73827e]">No staff notes yet</p>
                      <p className="mt-1 text-[11px] text-[#8b9792]">Add a note to keep the team in sync.</p>
                    </div>
                  ) : null}
                  {!notesQuery.isLoading && !notesQuery.isError && (notesQuery.data?.items.length ?? 0) > 0 ? (
                    <ol className="space-y-2.5" data-testid="list-enquiry-notes">
                      {[...(notesQuery.data?.items ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((note) => (
                        <li key={note.id} className="rounded-xl border border-[#dfe5e1] bg-[#fffefa] p-3" data-testid={`note-enquiry-${note.id}`}>
                          <p className="whitespace-pre-wrap break-words text-sm leading-5 text-[#435a68]">{note.body}</p>
                          <p className="mt-2 text-[10px] font-medium text-[#899593]" data-testid={`text-note-date-${note.id}`}>
                            {displayTimestamp(note.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              </aside>
            </div>
          </section>
        </div>
      ) : null}
      {restoreEnquiry.isPending ? (
        <div className="sr-only" role="status" aria-live="polite" data-testid="status-restore-pending">Restoring enquiry</div>
      ) : null}
    </section>
  );
}