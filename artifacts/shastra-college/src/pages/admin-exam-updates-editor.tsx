import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminExamUpdatesQueryKey,
  getGetExamUpdatesQueryKey,
  useCreateExamCalendarEntry,
  useCreateExamUpdateNotice,
  useDeleteExamCalendarEntry,
  useDeleteExamUpdateNotice,
  useGetAdminExamUpdates,
  useUpdateExamCalendarEntry,
  useUpdateExamUpdateNotice,
  useUpdateExamUpdateSettings,
} from "@workspace/api-client-react";
import type {
  ExamCalendarEntry,
  ExamCalendarEntryInput,
  ExamCalendarEntryUpdate,
  ExamCode,
  ExamUpdateNotice,
  ExamUpdateNoticeInput,
  ExamUpdateNoticeUpdate,
  ExamUpdateSettings,
} from "@workspace/api-client-react";
import {
  CalendarDays,
  ExternalLink,
  FileCheck2,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";

type Flash = { tone: "success" | "error"; message: string };
type Props = { onFlash: (flash: Flash) => void };
type Section = "notices" | "calendar" | "settings";
type NoticeDraft = Omit<ExamUpdateNoticeInput, "publishedOn"> & {
  id?: string;
  publishedOn: string;
};
type CalendarDraft = Omit<ExamCalendarEntryInput, "startDate" | "endDate"> & {
  id?: string;
  startDate: string;
  endDate: string;
};

const examOptions: Array<{ value: ExamCode; label: string }> = [
  { value: "jee-main", label: "JEE Main" },
  { value: "neet-ug", label: "NEET UG" },
  { value: "intermediate", label: "Intermediate" },
  { value: "ap-eapcet", label: "AP EAPCET" },
  { value: "other", label: "Other examinations" },
];
const statusOptions = [
  { value: "confirmed", label: "Confirmed" },
  { value: "tentative", label: "Tentative" },
  { value: "to-be-announced", label: "To be announced" },
  { value: "completed", label: "Completed" },
] as const;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-[#173958]/15 bg-white px-3.5 py-2.5 text-sm text-[#173958] outline-none transition placeholder:text-[#8b989e] focus:border-[#a3473c]/55 focus:ring-4 focus:ring-[#a3473c]/10";
const buttonClass =
  "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#173958]/15 bg-white px-3.5 py-2 text-sm font-bold text-[#173958] transition hover:border-[#a3473c]/40 hover:text-[#a3473c] disabled:cursor-not-allowed disabled:opacity-50";

const blankNotice = (): NoticeDraft => ({
  examCode: "jee-main",
  title: "",
  summary: "",
  sourceUrl: "",
  publishedOn: "",
  isSample: false,
  isPublished: false,
  position: 0,
});
const blankCalendar = (): CalendarDraft => ({
  examCode: "jee-main",
  examCycle: "",
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  dateStatus: "to-be-announced",
  sourceUrl: "",
  isSample: false,
  isPublished: false,
  position: 0,
});

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: { status?: number; data?: { error?: string } };
    status?: number;
    message?: string;
  };
  if (candidate?.response?.status === 403 || candidate?.status === 403) {
    return "Your account is signed in, but it is not on the admin allowlist.";
  }
  return candidate?.response?.data?.error || candidate?.message || "Something went wrong. Please try again.";
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password;
  } catch {
    return false;
  }
}

function validDate(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function invalidateExamUpdates(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: getGetExamUpdatesQueryKey() });
  void client.invalidateQueries({ queryKey: getGetAdminExamUpdatesQueryKey() });
}

function Field({
  label,
  value,
  onChange,
  testId,
  type = "text",
  required = false,
  min,
  maxLength,
  multiline = false,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  testId: string;
  type?: string;
  required?: boolean;
  min?: number;
  maxLength?: number;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-bold text-[#29445b]">
      {label}
      {hint ? <span className="ml-2 text-xs font-medium text-[#7b898f]">{hint}</span> : null}
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          maxLength={maxLength}
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
          maxLength={maxLength}
          className={fieldClass}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  testId: string;
}) {
  return (
    <label className="block text-sm font-bold text-[#29445b]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
        data-testid={testId}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#173958]/10 bg-[#fafaf7] px-3.5 text-sm font-bold text-[#29445b]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#12335a]"
        data-testid={testId}
      />
      {label}
    </label>
  );
}

function StatusBadge({ published, sample }: { published: boolean; sample: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] ${published ? "bg-emerald-50 text-emerald-800" : "bg-[#12335a]/[.07] text-[#52616a]"}`}>
        {published ? "Published" : "Draft"}
      </span>
      {sample ? <span className="rounded-full bg-[#f6eddb] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#815d21]">Sample</span> : null}
    </div>
  );
}

export default function AdminExamUpdatesEditor({ onFlash }: Props) {
  const client = useQueryClient();
  const hub = useGetAdminExamUpdates();
  const updateSettings = useUpdateExamUpdateSettings();
  const createNotice = useCreateExamUpdateNotice();
  const updateNotice = useUpdateExamUpdateNotice();
  const deleteNotice = useDeleteExamUpdateNotice();
  const createCalendar = useCreateExamCalendarEntry();
  const updateCalendar = useUpdateExamCalendarEntry();
  const deleteCalendar = useDeleteExamCalendarEntry();
  const [section, setSection] = useState<Section>("notices");
  const [settings, setSettings] = useState<ExamUpdateSettings>({
    eyebrow: "",
    title: "",
    introduction: "",
  });
  const [notice, setNotice] = useState<NoticeDraft>(blankNotice());
  const [calendar, setCalendar] = useState<CalendarDraft>(blankCalendar());
  const [error, setError] = useState("");

  useEffect(() => {
    if (hub.data) setSettings(hub.data.settings);
  }, [hub.data?.settings]);

  const resetNotice = () => { setNotice(blankNotice()); setError(""); };
  const resetCalendar = () => { setCalendar(blankCalendar()); setError(""); };

  const editNotice = (item: ExamUpdateNotice) => {
    setNotice({
      id: item.id,
      examCode: item.examCode,
      title: item.title,
      summary: item.summary,
      sourceUrl: item.sourceUrl,
      publishedOn: item.publishedOn ?? "",
      isSample: item.isSample,
      isPublished: item.isPublished,
      position: item.position,
    });
    setSection("notices");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editCalendar = (item: ExamCalendarEntry) => {
    setCalendar({
      id: item.id,
      examCode: item.examCode,
      examCycle: item.examCycle,
      title: item.title,
      description: item.description,
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",
      dateStatus: item.dateStatus,
      sourceUrl: item.sourceUrl,
      isSample: item.isSample,
      isPublished: item.isPublished,
      position: item.position,
    });
    setSection("calendar");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      await updateSettings.mutateAsync({ data: settings });
      invalidateExamUpdates(client);
      onFlash({ tone: "success", message: "Exam Updates page settings saved." });
    } catch (failure) {
      const message = errorMessage(failure);
      setError(message);
      onFlash({ tone: "error", message });
    }
  };

  const saveNotice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!isHttpsUrl(notice.sourceUrl.trim())) {
      const message = "Enter a valid HTTPS official source URL.";
      setError(message);
      onFlash({ tone: "error", message });
      return;
    }
    if (!validDate(notice.publishedOn)) {
      const message = "Publication date must be a valid calendar date.";
      setError(message);
      onFlash({ tone: "error", message });
      return;
    }
    const payload = {
      examCode: notice.examCode,
      title: notice.title.trim(),
      summary: notice.summary.trim(),
      sourceUrl: notice.sourceUrl.trim(),
      publishedOn: notice.publishedOn || null,
      isSample: notice.isSample,
      isPublished: notice.isPublished,
      position: Number(notice.position),
    };
    try {
      if (notice.id) {
        const data: ExamUpdateNoticeUpdate = payload;
        await updateNotice.mutateAsync({ id: notice.id, data });
        onFlash({ tone: "success", message: "Exam notice updated." });
      } else {
        const data: ExamUpdateNoticeInput = payload;
        await createNotice.mutateAsync({ data });
        onFlash({ tone: "success", message: "Exam notice created." });
      }
      resetNotice();
      invalidateExamUpdates(client);
    } catch (failure) {
      const message = errorMessage(failure);
      setError(message);
      onFlash({ tone: "error", message });
    }
  };

  const removeNotice = async (item: ExamUpdateNotice) => {
    if (!window.confirm(`Delete the notice "${item.title}"?`)) return;
    setError("");
    try {
      await deleteNotice.mutateAsync({ id: item.id });
      if (notice.id === item.id) resetNotice();
      invalidateExamUpdates(client);
      onFlash({ tone: "success", message: "Exam notice deleted." });
    } catch (failure) {
      const message = errorMessage(failure);
      setError(message);
      onFlash({ tone: "error", message });
    }
  };

  const saveCalendar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!isHttpsUrl(calendar.sourceUrl.trim())) {
      const message = "Enter a valid HTTPS official source URL.";
      setError(message);
      onFlash({ tone: "error", message });
      return;
    }
    if (!validDate(calendar.startDate) || !validDate(calendar.endDate)) {
      const message = "Start and end dates must be valid calendar dates.";
      setError(message);
      onFlash({ tone: "error", message });
      return;
    }
    if (
      (calendar.dateStatus === "to-be-announced" &&
        (calendar.startDate || calendar.endDate)) ||
      (calendar.dateStatus !== "to-be-announced" && !calendar.startDate)
    ) {
      const message =
        "Clear dates for To be announced, or provide a start date for the selected status.";
      setError(message);
      onFlash({ tone: "error", message });
      return;
    }
    if (calendar.startDate && calendar.endDate && calendar.endDate < calendar.startDate) {
      const message = "End date cannot be earlier than start date.";
      setError(message);
      onFlash({ tone: "error", message });
      return;
    }
    const payload = {
      examCode: calendar.examCode,
      examCycle: calendar.examCycle.trim(),
      title: calendar.title.trim(),
      description: calendar.description.trim(),
      startDate: calendar.startDate || null,
      endDate: calendar.endDate || null,
      dateStatus: calendar.dateStatus,
      sourceUrl: calendar.sourceUrl.trim(),
      isSample: calendar.isSample,
      isPublished: calendar.isPublished,
      position: Number(calendar.position),
    };
    try {
      if (calendar.id) {
        const data: ExamCalendarEntryUpdate = payload;
        await updateCalendar.mutateAsync({ id: calendar.id, data });
        onFlash({ tone: "success", message: "Calendar entry updated." });
      } else {
        const data: ExamCalendarEntryInput = payload;
        await createCalendar.mutateAsync({ data });
        onFlash({ tone: "success", message: "Calendar entry created." });
      }
      resetCalendar();
      invalidateExamUpdates(client);
    } catch (failure) {
      const message = errorMessage(failure);
      setError(message);
      onFlash({ tone: "error", message });
    }
  };

  const removeCalendar = async (item: ExamCalendarEntry) => {
    if (!window.confirm(`Delete the calendar entry "${item.title}"?`)) return;
    setError("");
    try {
      await deleteCalendar.mutateAsync({ id: item.id });
      if (calendar.id === item.id) resetCalendar();
      invalidateExamUpdates(client);
      onFlash({ tone: "success", message: "Calendar entry deleted." });
    } catch (failure) {
      const message = errorMessage(failure);
      setError(message);
      onFlash({ tone: "error", message });
    }
  };

  if (hub.isLoading) {
    return (
      <div className="mt-8 animate-pulse rounded-2xl border border-[#173958]/10 bg-white p-8" data-testid="status-admin-exam-updates-loading">
        <div className="h-5 w-48 rounded bg-[#12335a]/10" />
        <div className="mt-5 h-24 rounded-xl bg-[#12335a]/[.06]" />
      </div>
    );
  }

  if (hub.isError || !hub.data) {
    return (
      <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8" data-testid="status-admin-exam-updates-error">
        <p className="text-sm font-semibold text-red-700">{errorMessage(hub.error)}</p>
        <button type="button" onClick={() => void hub.refetch()} className={`${buttonClass} mt-4`} data-testid="button-retry-admin-exam-updates">
          Retry
        </button>
      </div>
    );
  }

  const tabs: Array<{ id: Section; label: string; count?: number; Icon: typeof FileCheck2 }> = [
    { id: "notices", label: "Notices", count: hub.data.notices.length, Icon: FileCheck2 },
    { id: "calendar", label: "Calendar", count: hub.data.calendarEntries.length, Icon: CalendarDays },
    { id: "settings", label: "Page settings", Icon: Settings2 },
  ];
  const saving = updateSettings.isPending || createNotice.isPending || updateNotice.isPending ||
    createCalendar.isPending || updateCalendar.isPending;

  return (
    <section className="mt-8 overflow-hidden rounded-[1.6rem] border border-[#173958]/10 bg-white shadow-[0_16px_45px_rgba(23,57,88,.06)]" data-testid="admin-exam-updates-editor">
      <div className="flex flex-wrap gap-2 border-b border-[#173958]/10 bg-[#f8f8f4] p-3 sm:p-4">
        {tabs.map(({ id, label, count, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setSection(id); setError(""); }}
            aria-pressed={section === id}
            className={`focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${section === id ? "bg-[#12335a] text-white" : "text-[#52616a] hover:bg-white hover:text-[#12335a]"}`}
            data-testid={`button-exam-updates-tab-${id}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
            {count !== undefined ? <span className="opacity-70">{count}</span> : null}
          </button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 sm:mx-7" data-testid="status-exam-updates-error">
          {error}
        </div>
      ) : null}

      {section === "settings" ? (
        <form onSubmit={saveSettings} className="space-y-5 p-5 sm:p-7" data-testid="form-exam-update-settings">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow" value={settings.eyebrow} onChange={(eyebrow) => setSettings((current) => ({ ...current, eyebrow }))} maxLength={100} testId="input-exam-updates-eyebrow" />
            <Field label="Page title" value={settings.title} onChange={(title) => setSettings((current) => ({ ...current, title }))} required maxLength={160} testId="input-exam-updates-title" />
            <div className="md:col-span-2">
              <Field label="Introduction" value={settings.introduction} onChange={(introduction) => setSettings((current) => ({ ...current, introduction }))} multiline maxLength={800} testId="textarea-exam-updates-introduction" />
            </div>
          </div>
          <div className="flex justify-end border-t border-[#173958]/10 pt-5">
            <button type="submit" disabled={updateSettings.isPending} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#12335a] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0b2748] disabled:opacity-50" data-testid="button-save-exam-update-settings">
              {updateSettings.isPending ? "Saving…" : "Save page settings"}
            </button>
          </div>
        </form>
      ) : null}

      {section === "notices" ? (
        <div className="grid gap-8 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold text-[#173958]">Official notices</h2>
                <p className="mt-1 text-sm text-[#6b7a82]">Create, publish, and order examination notices.</p>
              </div>
              <button type="button" onClick={resetNotice} className={buttonClass} data-testid="button-new-exam-notice">
                <Plus className="h-4 w-4" aria-hidden="true" /> New notice
              </button>
            </div>
            {hub.data.notices.length ? (
              <div className="space-y-3">
                {hub.data.notices.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-[#173958]/10 p-4" data-testid={`card-admin-exam-notice-${item.id}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <StatusBadge published={item.isPublished} sample={item.isSample} />
                        <h3 className="mt-2 font-bold text-[#173958]">{item.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6b7a82]">{item.summary || "No summary provided."}</p>
                        <p className="mt-2 text-xs font-semibold text-[#a3473c]">{examOptions.find((option) => option.value === item.examCode)?.label ?? item.examCode} · Order {item.position}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => editNotice(item)} className={buttonClass} data-testid={`button-edit-exam-notice-${item.id}`}><Pencil className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Edit {item.title}</span></button>
                        <button type="button" onClick={() => void removeNotice(item)} disabled={deleteNotice.isPending} className="focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 px-3 text-red-700 hover:bg-red-50 disabled:opacity-50" data-testid={`button-delete-exam-notice-${item.id}`}><Trash2 className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Delete {item.title}</span></button>
                      </div>
                    </div>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="focus-ring mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#52616a] hover:text-[#a3473c]" data-testid={`link-preview-exam-notice-${item.id}`}>Open source <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#173958]/20 bg-[#fafaf7] px-5 py-10 text-center" data-testid="empty-admin-exam-notices">
                <FileCheck2 className="mx-auto h-8 w-8 text-[#a3473c]" aria-hidden="true" />
                <p className="mt-3 font-display text-lg font-extrabold text-[#173958]">No notices yet</p>
                <p className="mt-1 text-sm text-[#6b7a82]">Add the first official notice using the form.</p>
              </div>
            )}
          </div>

          <form onSubmit={saveNotice} className="h-fit space-y-4 rounded-2xl border border-[#173958]/10 bg-[#fafaf7] p-4 sm:p-5" data-testid="form-exam-notice">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a3473c]">{notice.id ? "Edit notice" : "New notice"}</p>
              <h3 className="mt-1 font-display text-xl font-extrabold text-[#173958]">{notice.id ? "Update notice details" : "Add an official notice"}</h3>
            </div>
            <SelectField label="Examination" value={notice.examCode} onChange={(value) => setNotice((current) => ({ ...current, examCode: value as ExamCode }))} options={examOptions} testId="select-notice-exam-code" />
            <Field label="Notice title" value={notice.title} onChange={(title) => setNotice((current) => ({ ...current, title }))} required maxLength={160} testId="input-notice-title" />
            <Field label="Summary" value={notice.summary} onChange={(summary) => setNotice((current) => ({ ...current, summary }))} multiline maxLength={600} testId="textarea-notice-summary" />
            <Field label="Official source URL" value={notice.sourceUrl} onChange={(sourceUrl) => setNotice((current) => ({ ...current, sourceUrl }))} required type="url" hint="HTTPS required" maxLength={2048} testId="input-notice-source-url" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Published on" value={notice.publishedOn} onChange={(publishedOn) => setNotice((current) => ({ ...current, publishedOn }))} type="date" testId="input-notice-published-on" />
              <Field label="Display order" value={notice.position} onChange={(value) => setNotice((current) => ({ ...current, position: value === "" ? 0 : Number(value) }))} type="number" min={0} testId="input-notice-position" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleField label="Publish notice" checked={notice.isPublished} onChange={(isPublished) => setNotice((current) => ({ ...current, isPublished }))} testId="checkbox-notice-published" />
              <ToggleField label="Mark as Sample" checked={notice.isSample} onChange={(isSample) => setNotice((current) => ({ ...current, isSample }))} testId="checkbox-notice-sample" />
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#173958]/10 pt-4">
              {notice.id ? <button type="button" onClick={resetNotice} className={buttonClass} data-testid="button-cancel-edit-notice">Cancel</button> : null}
              <button type="submit" disabled={saving} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#12335a] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50" data-testid="button-save-exam-notice">
                {createNotice.isPending || updateNotice.isPending ? "Saving…" : notice.id ? "Save changes" : "Create notice"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {section === "calendar" ? (
        <div className="grid gap-8 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold text-[#173958]">Examination calendar</h2>
                <p className="mt-1 text-sm text-[#6b7a82]">Dates and milestones with explicit status.</p>
              </div>
              <button type="button" onClick={resetCalendar} className={buttonClass} data-testid="button-new-exam-calendar-entry"><Plus className="h-4 w-4" aria-hidden="true" /> New entry</button>
            </div>
            {hub.data.calendarEntries.length ? (
              <div className="space-y-3">
                {hub.data.calendarEntries.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-[#173958]/10 p-4" data-testid={`card-admin-calendar-entry-${item.id}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <StatusBadge published={item.isPublished} sample={item.isSample} />
                        <h3 className="mt-2 font-bold text-[#173958]">{item.title}</h3>
                        <p className="mt-1 text-sm text-[#6b7a82]">{item.examCycle} · {examOptions.find((option) => option.value === item.examCode)?.label ?? item.examCode}</p>
                        <p className="mt-2 text-xs font-semibold text-[#a3473c]">
                          {item.dateStatus === "to-be-announced" || (!item.startDate && !item.endDate) ? "To be announced" : `${item.startDate || item.endDate}${item.endDate && item.endDate !== item.startDate ? ` – ${item.endDate}` : ""}`}
                          {" · "}{statusOptions.find((option) => option.value === item.dateStatus)?.label}
                          {" · Order "}{item.position}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => editCalendar(item)} className={buttonClass} data-testid={`button-edit-calendar-entry-${item.id}`}><Pencil className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Edit {item.title}</span></button>
                        <button type="button" onClick={() => void removeCalendar(item)} disabled={deleteCalendar.isPending} className="focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 px-3 text-red-700 hover:bg-red-50 disabled:opacity-50" data-testid={`button-delete-calendar-entry-${item.id}`}><Trash2 className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Delete {item.title}</span></button>
                      </div>
                    </div>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="focus-ring mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#52616a] hover:text-[#a3473c]" data-testid={`link-preview-calendar-entry-${item.id}`}>Open source <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#173958]/20 bg-[#fafaf7] px-5 py-10 text-center" data-testid="empty-admin-exam-calendar">
                <CalendarDays className="mx-auto h-8 w-8 text-[#a3473c]" aria-hidden="true" />
                <p className="mt-3 font-display text-lg font-extrabold text-[#173958]">No calendar entries yet</p>
                <p className="mt-1 text-sm text-[#6b7a82]">Add an examination milestone or mark its date to be announced.</p>
              </div>
            )}
          </div>

          <form onSubmit={saveCalendar} className="h-fit space-y-4 rounded-2xl border border-[#173958]/10 bg-[#fafaf7] p-4 sm:p-5" data-testid="form-exam-calendar-entry">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a3473c]">{calendar.id ? "Edit calendar entry" : "New calendar entry"}</p>
              <h3 className="mt-1 font-display text-xl font-extrabold text-[#173958]">{calendar.id ? "Update milestone" : "Add a milestone"}</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Examination" value={calendar.examCode} onChange={(value) => setCalendar((current) => ({ ...current, examCode: value as ExamCode }))} options={examOptions} testId="select-calendar-exam-code" />
              <Field label="Exam cycle" value={calendar.examCycle} onChange={(examCycle) => setCalendar((current) => ({ ...current, examCycle }))} required maxLength={80} testId="input-calendar-exam-cycle" />
            </div>
            <Field label="Entry title" value={calendar.title} onChange={(title) => setCalendar((current) => ({ ...current, title }))} required maxLength={160} testId="input-calendar-title" />
            <Field label="Description" value={calendar.description} onChange={(description) => setCalendar((current) => ({ ...current, description }))} multiline maxLength={800} testId="textarea-calendar-description" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date" value={calendar.startDate} onChange={(startDate) => setCalendar((current) => ({ ...current, startDate }))} type="date" testId="input-calendar-start-date" />
              <Field label="End date" value={calendar.endDate} onChange={(endDate) => setCalendar((current) => ({ ...current, endDate }))} type="date" testId="input-calendar-end-date" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Date status" value={calendar.dateStatus} onChange={(value) => setCalendar((current) => ({ ...current, dateStatus: value as CalendarDraft["dateStatus"] }))} options={statusOptions.map((item) => ({ value: item.value, label: item.label }))} testId="select-calendar-date-status" />
              <Field label="Display order" value={calendar.position} onChange={(value) => setCalendar((current) => ({ ...current, position: value === "" ? 0 : Number(value) }))} type="number" min={0} testId="input-calendar-position" />
            </div>
            <Field label="Official source URL" value={calendar.sourceUrl} onChange={(sourceUrl) => setCalendar((current) => ({ ...current, sourceUrl }))} required type="url" hint="HTTPS required" maxLength={2048} testId="input-calendar-source-url" />
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleField label="Publish entry" checked={calendar.isPublished} onChange={(isPublished) => setCalendar((current) => ({ ...current, isPublished }))} testId="checkbox-calendar-published" />
              <ToggleField label="Mark as Sample" checked={calendar.isSample} onChange={(isSample) => setCalendar((current) => ({ ...current, isSample }))} testId="checkbox-calendar-sample" />
            </div>
            <p className="text-xs leading-5 text-[#74838a]">Leave dates blank when they have not been announced. A published entry with no date will display “To be announced”.</p>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#173958]/10 pt-4">
              {calendar.id ? <button type="button" onClick={resetCalendar} className={buttonClass} data-testid="button-cancel-edit-calendar">Cancel</button> : null}
              <button type="submit" disabled={saving} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#12335a] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50" data-testid="button-save-calendar-entry">
                {createCalendar.isPending || updateCalendar.isPending ? "Saving…" : calendar.id ? "Save changes" : "Create entry"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}