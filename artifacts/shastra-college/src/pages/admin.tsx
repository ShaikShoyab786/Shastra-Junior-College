import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useClerk, useUser, Show } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  ImagePlus,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Palette,
  Save,
  Settings2,
  Trash2,
  Undo2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetAdminEnquiriesQueryKey,
  getGetAdminHomeQueryKey,
  useDeleteEnquiry,
  useGetAdminEnquiries,
  useGetAdminCmsPage,
  useGetAdminHome,
  useRequestUploadUrl,
  useRestoreEnquiry,
  useUpdateEnquiry,
  useUpdateSiteSettings,
} from "@workspace/api-client-react";
import type {
  AdminEnquiry,
  HomePage,
  SiteSettingsUpdate,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import AdminHomeEditor from "./admin-home-editor";
import AdminAboutEditor from "./admin-about-editor";
import AdminAboutWhoWeAreEditor from "./admin-about-who-we-are-editor";
import AdminAboutChairmanEditor from "./admin-about-chairman-editor";
import AdminAboutBoardEditor from "./admin-about-board-editor";
import AdminAboutCollectionEditor from "./admin-about-collection-editor";
import AdminGalleryEditor from "./admin-gallery-editor";
import AdminFacultyEditor from "./admin-faculty-editor";
import AdminPlacementRecordsEditor from "./admin-placement-records-editor";
import AdminCoursesEditor from "./admin-courses-editor";

type Flash = {
  tone: "success" | "error";
  message: string;
  action?: { label: string; onClick: () => void };
} | null;
type WorkspaceView =
  | "dashboard"
  | "hero"
  | "programs"
  | "statistics"
  | "placement-records"
  | "gallery-preview"
  | "faculty-preview"
  | "testimonials"
  | "identity"
  | "about"
  | "about-hero"
  | "about-who-we-are"
  | "about-chairman"
  | "about-board"
  | "about-institutional-strengths"
  | "about-core-values"
  | "results"
  | "faculty"
  | "courses"
  | "gallery";

const pageItems: Array<{ key: WorkspaceView; label: string; note?: string }> = [
  { key: "about", label: "About" },
  { key: "faculty", label: "Faculty" },
  { key: "gallery", label: "Gallery" },
  { key: "results", label: "Results", note: "Coming soon" },
  { key: "courses", label: "Courses" },
];

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: { status?: number };
    status?: number;
    message?: string;
  };
  if (candidate?.response?.status === 403 || candidate?.status === 403) {
    return "Your account is signed in, but it is not on the admin allowlist.";
  }
  return candidate?.message || "Something went wrong. Please try again.";
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Button({
  children,
  onClick,
  testId,
  variant = "ghost",
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  testId: string;
  variant?: "ghost" | "primary" | "outline";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const style =
    variant === "primary"
      ? "bg-[#0b3472] text-white shadow-[0_8px_18px_rgba(11,52,114,.17)] hover:bg-[#092b5d]"
      : variant === "outline"
        ? "border border-slate-200 bg-white text-[#0b3472] hover:border-[#0b3472]/30 hover:bg-slate-50"
        : "text-slate-600 hover:bg-slate-100 hover:text-[#0b3472]";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
  testId,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  testId: string;
  hint?: string;
}) {
  const classes =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {hint ? <span className="ml-2 text-xs font-medium text-slate-400">{hint}</span> : null}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className={classes}
          data-testid={testId}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          className={classes}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function StatusPill({ status }: { status: AdminEnquiry["status"] }) {
  const reviewed = status === "reviewed";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.13em] ${
        reviewed
          ? "bg-emerald-50 text-emerald-700"
          : "bg-[#e3212b]/10 text-[#ba1824]"
      }`}
      data-testid={`status-enquiry-${status}`}
    >
      {reviewed ? "Reviewed" : "Needs review"}
    </span>
  );
}

function FlashMessage({ flash, onDismiss }: { flash: Flash; onDismiss: () => void }) {
  if (!flash) return null;
  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
        flash.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      role={flash.tone === "error" ? "alert" : "status"}
      data-testid="status-flash"
    >
      {flash.tone === "success" ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span className="min-w-0 flex-1">{flash.message}</span>
      {flash.action ? (
        <button
          type="button"
          onClick={() => {
            flash.action?.onClick();
            onDismiss();
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-extrabold underline underline-offset-2"
          data-testid="button-undo-enquiry-delete"
        >
          <Undo2 className="h-3.5 w-3.5" />
          {flash.action.label}
        </button>
      ) : null}
      <button onClick={onDismiss} className="rounded-lg p-1" aria-label="Dismiss message" data-testid="button-dismiss-flash">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function NavRow({
  icon: Icon,
  label,
  active,
  onClick,
  nested = false,
  badge,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  onClick: () => void;
  nested?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
        nested ? "pl-10" : ""
      } ${
        active
          ? "bg-white text-[#0b3472] shadow-[0_4px_12px_rgba(0,0,0,.08)]"
          : "text-blue-100 hover:bg-white/10 hover:text-white"
      }`}
      data-testid={`nav-${label.toLowerCase().replaceAll(" ", "-")}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? <span className="text-[10px] font-bold opacity-70">{badge}</span> : null}
    </button>
  );
}

function Shell({
  children,
  home,
  activeView,
  onNavigate,
}: {
  children: ReactNode;
  home?: HomePage;
  activeView: WorkspaceView;
  onNavigate: (view: WorkspaceView) => void;
}) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileNav, setMobileNav] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(
    activeView === "about" ||
      activeView === "about-hero" ||
      activeView === "about-who-we-are" ||
      activeView === "about-chairman" ||
      activeView === "about-board" ||
      activeView === "about-institutional-strengths" ||
      activeView === "about-core-values",
  );
  const homeSectionActive =
    activeView === "hero" ||
    activeView === "programs" ||
    activeView === "statistics" ||
    activeView === "gallery-preview" ||
    activeView === "faculty-preview" ||
    activeView === "testimonials" ||
    activeView === "placement-records";
  const aboutSectionActive =
    activeView === "about" ||
    activeView === "about-hero" ||
    activeView === "about-who-we-are" ||
    activeView === "about-chairman" ||
    activeView === "about-board" ||
    activeView === "about-institutional-strengths" ||
    activeView === "about-core-values";
  const activePage =
    activeView === "dashboard"
      ? "Dashboard"
      : activeView === "identity"
        ? "Site settings"
        : aboutSectionActive
          ? "Pages / About"
          : homeSectionActive
            ? "Pages / Home"
            : "Pages";
  const activeTitle =
    activeView === "dashboard"
      ? "Dashboard"
      : activeView === "identity"
        ? "Site identity"
        : activeView === "about"
          ? "About · Sub sections"
          : activeView === "about-hero"
            ? "About · Hero"
            : activeView === "about-who-we-are"
              ? "About · Who We Are"
              : activeView === "about-chairman"
                ? "About · Chairman’s Message"
                : activeView === "about-board"
                  ? "About · Board of Directors"
                  : activeView === "about-institutional-strengths"
                    ? "About · Institutional Strengths"
                    : activeView === "about-core-values"
                      ? "About · Core Values"
        : activeView === "hero"
          ? "Home · Hero"
          : activeView === "programs"
            ? "Home · Pathways"
            : activeView === "statistics"
              ? "Home · Statistics"
              : activeView === "placement-records"
                ? "Home · Placement Record"
                  : activeView === "gallery-preview"
                    ? "Home · Gallery Preview"
                    : activeView === "faculty-preview"
                      ? "Home · Faculty Preview"
                      : activeView === "testimonials"
                        ? "Home · Testimonials"
                      : pageItems.find((item) => item.key === activeView)?.label ||
                        "Home";

  const go = (view: WorkspaceView) => {
    if (
      view === "about" ||
      view === "about-hero" ||
      view === "about-who-we-are" ||
      view === "about-chairman" ||
      view === "about-board" ||
      view === "about-institutional-strengths" ||
      view === "about-core-values"
    ) {
      setAboutOpen(true);
    }
    onNavigate(view);
    setMobileNav(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[#f5f7fb] text-slate-900">
      <aside className={`${mobileNav ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col bg-[#092c60] px-4 py-5 text-white transition-transform md:translate-x-0`}>
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="focus-ring flex min-w-0 items-center gap-3" data-testid="link-admin-brand">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
              <img src={home?.settings.logoUrl?.startsWith("/objects/") ? `/api/storage${home.settings.logoUrl}` : home?.settings.logoUrl || "/shastra-college-logo.png"} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-extrabold">{home?.settings.collegeName || "Shastra Junior College"}</span>
              <span className="eyebrow block text-blue-200">Staff workspace</span>
            </span>
          </Link>
          <button className="rounded-lg p-2 text-white md:hidden" onClick={() => setMobileNav(false)} aria-label="Close sidebar" data-testid="button-close-sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-9 space-y-5 overflow-y-auto pb-4">
          <div>
            <p className="eyebrow mb-2 px-3 text-blue-300">Workspace</p>
            <NavRow icon={LayoutDashboard} label="Dashboard" active={activeView === "dashboard"} onClick={() => go("dashboard")} />
          </div>

          <div>
            <button onClick={() => setSettingsOpen((current) => !current)} className="flex w-full items-center justify-between px-3 text-left" data-testid="button-toggle-settings-nav">
              <span className={`eyebrow ${activePage === "Site settings" ? "text-[#ffb3b6]" : "text-blue-300"}`}>Site settings</span>
              {settingsOpen ? <ChevronDown className="h-3.5 w-3.5 text-blue-300" /> : <ChevronRight className="h-3.5 w-3.5 text-blue-300" />}
            </button>
            {settingsOpen ? (
              <div className="mt-2 space-y-1">
                <NavRow icon={Settings2} label="Site identity" nested active={activeView === "identity"} onClick={() => go("identity")} />
              </div>
            ) : null}
          </div>

          <div>
            <button onClick={() => setPagesOpen((current) => !current)} className="flex w-full items-center justify-between px-3 text-left" data-testid="button-toggle-pages-nav">
              <span className={`eyebrow ${activePage === "Pages" ? "text-[#ffb3b6]" : "text-blue-300"}`}>Pages</span>
              {pagesOpen ? <ChevronDown className="h-3.5 w-3.5 text-blue-300" /> : <ChevronRight className="h-3.5 w-3.5 text-blue-300" />}
            </button>
            {pagesOpen ? (
              <div className="mt-2 space-y-1">
                <div>
                  <button
                    type="button"
                    onClick={() => setHomeOpen((current) => !current)}
                    aria-expanded={homeOpen}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      homeSectionActive
                        ? "bg-white/10 text-white"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                    data-testid="button-toggle-home-page-nav"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">Home</span>
                    {homeOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-blue-300" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-blue-300" />
                    )}
                  </button>
                  {homeOpen ? (
                    <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2">
                      <NavRow icon={FileText} label="Hero" nested active={activeView === "hero"} onClick={() => go("hero")} />
                      <NavRow icon={Link2} label="Pathways" nested active={activeView === "programs"} onClick={() => go("programs")} />
                      <NavRow icon={ClipboardList} label="Statistics" nested active={activeView === "statistics"} onClick={() => go("statistics")} />
                       <NavRow icon={ImagePlus} label="Gallery Preview" nested active={activeView === "gallery-preview"} onClick={() => go("gallery-preview")} />
                      <NavRow icon={ClipboardList} label="Placement Record" nested active={activeView === "placement-records"} onClick={() => go("placement-records")} />
                       <NavRow icon={UserRound} label="Faculty Preview" nested active={activeView === "faculty-preview"} onClick={() => go("faculty-preview")} />
                       <NavRow icon={ClipboardList} label="Testimonials" nested active={activeView === "testimonials"} onClick={() => go("testimonials")} />
                    </div>
                  ) : null}
                </div>
                {pageItems.map((item) => {
                  if (item.key === "about") {
                    return (
                      <div key={item.key}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => go("about")}
                            className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                              aboutSectionActive
                                ? "bg-white/10 text-white"
                                : "text-blue-100 hover:bg-white/10 hover:text-white"
                            }`}
                            data-testid="nav-about"
                          >
                            <FolderOpen className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">
                              About
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setAboutOpen((current) => !current)
                            }
                            aria-label="Toggle About subsections"
                            aria-expanded={aboutOpen}
                            className="rounded-lg p-2 text-blue-300 transition hover:bg-white/10 hover:text-white"
                            data-testid="button-toggle-about-subsections"
                          >
                            {aboutOpen ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        {aboutOpen ? (
                          <div
                            id="nav-about-subsections"
                            className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2"
                          >
                            <NavRow
                              icon={FileText}
                              label="Sub sections"
                              nested
                              active={activeView === "about"}
                              onClick={() => go("about")}
                            />
                            <NavRow
                              icon={FileText}
                              label="Hero"
                              nested
                              active={activeView === "about-hero"}
                              onClick={() => go("about-hero")}
                            />
                            <NavRow
                              icon={FileText}
                              label="Who We Are"
                              nested
                              active={activeView === "about-who-we-are"}
                              onClick={() => go("about-who-we-are")}
                            />
                            <NavRow
                              icon={FileText}
                              label="Chairman"
                              nested
                              active={activeView === "about-chairman"}
                              onClick={() => go("about-chairman")}
                            />
                            <NavRow
                              icon={FileText}
                              label="Board of Directors"
                              nested
                              active={activeView === "about-board"}
                              onClick={() => go("about-board")}
                            />
                            <NavRow
                              icon={FileText}
                              label="Institutional Strengths"
                              nested
                              active={activeView === "about-institutional-strengths"}
                              onClick={() => go("about-institutional-strengths")}
                            />
                            <NavRow
                              icon={FileText}
                              label="Core Values"
                              nested
                              active={activeView === "about-core-values"}
                              onClick={() => go("about-core-values")}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <NavRow
                      key={item.key}
                      icon={FolderOpen}
                      label={item.label}
                      nested
                      active={activeView === item.key}
                      onClick={() => go(item.key)}
                      badge={item.note ? "Soon" : undefined}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto border-t border-white/15 pt-4">
          <div className="mb-2 flex items-center gap-2 px-3 text-xs text-blue-100">
            <UserRound className="h-3.5 w-3.5" />
            <span className="min-w-0 truncate" data-testid="text-admin-user">{user?.primaryEmailAddress?.emailAddress || user?.id}</span>
          </div>
          <button onClick={() => signOut({ redirectUrl: "/" })} className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-100 transition hover:bg-white/10 hover:text-white" data-testid="button-sign-out">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {mobileNav ? <button className="fixed inset-0 z-40 bg-[#092c60]/40 md:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation overlay" data-testid="button-nav-overlay" /> : null}

      <div className="md:pl-[286px]">
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-[#f5f7fb]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNav(true)} className="focus-ring rounded-lg p-2 text-[#0b3472] md:hidden" aria-label="Open sidebar" data-testid="button-open-sidebar"><Menu className="h-5 w-5" /></button>
            <div>
              <p className="eyebrow text-[#e3212b]">{activePage}</p>
              <p className="font-display text-lg font-extrabold text-[#0b3472]">{activeTitle}</p>
            </div>
          </div>
          <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0b3472] shadow-sm" data-testid="link-view-site">
            <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">View site</span>
          </Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

function SectionCard({ children, className = "", testId }: { children: ReactNode; className?: string; testId?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7 ${className}`} data-testid={testId}>{children}</section>;
}

function PageIntro({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0b3472] sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function EnquiryCard({
  enquiry,
  onToggleReview,
  onDelete,
  pending,
}: {
  enquiry: AdminEnquiry;
  onToggleReview: () => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const lead =
    enquiry.answers.find((answer) => answer.name === "fullName") ??
    enquiry.answers[0];
  const details = enquiry.answers.filter(
    (answer) => answer.name !== lead?.name,
  );
  const reviewed = enquiry.status === "reviewed";

  return (
    <article
      className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4 sm:p-5"
      data-testid={`card-enquiry-${enquiry.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-[#0b3472]">
            {lead?.value || "Admissions enquiry"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {dateLabel(enquiry.createdAt)}
          </p>
        </div>
        <StatusPill status={enquiry.status} />
      </div>
      {details.length ? (
        <dl className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((answer) => (
            <div key={`${enquiry.id}-${answer.name}`} className="min-w-0">
              <dt className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
                {answer.label}
              </dt>
              <dd className="mt-0.5 break-words text-xs font-semibold text-slate-700">
                {answer.value || "Not provided"}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleReview}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-[#0b3472] hover:bg-slate-50 disabled:opacity-50"
          data-testid={`button-toggle-review-${enquiry.id}`}
        >
          <Check className="h-3.5 w-3.5" />
          {pending
            ? "Saving…"
            : reviewed
              ? "Mark not reviewed"
              : "Mark reviewed"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold text-red-700 hover:bg-red-50 disabled:opacity-50"
          data-testid={`button-delete-enquiry-${enquiry.id}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </article>
  );
}

function DashboardView({
  enquiries,
  enquiriesError,
  onRefresh,
  onFlash,
}: {
  enquiries: AdminEnquiry[];
  enquiriesError: boolean;
  onRefresh: () => void;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const updateEnquiry = useUpdateEnquiry();
  const deleteEnquiry = useDeleteEnquiry();
  const restoreEnquiry = useRestoreEnquiry();
  const pending =
    updateEnquiry.isPending ||
    deleteEnquiry.isPending ||
    restoreEnquiry.isPending;
  const ordered = enquiries
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const invalidateEnquiries = () =>
    client.invalidateQueries({ queryKey: getGetAdminEnquiriesQueryKey() });
  const restore = (id: string) =>
    restoreEnquiry.mutate(
      { id },
      {
        onSuccess: () => {
          void invalidateEnquiries();
          onFlash({ tone: "success", message: "Enquiry restored." });
        },
        onError: (error) =>
          onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );
  const toggleReview = (enquiry: AdminEnquiry) =>
    updateEnquiry.mutate(
      {
        id: enquiry.id,
        data: {
          status: enquiry.status === "reviewed" ? "new" : "reviewed",
        },
      },
      {
        onSuccess: () => {
          void invalidateEnquiries();
          onFlash({
            tone: "success",
            message:
              enquiry.status === "reviewed"
                ? "Enquiry marked as not reviewed."
                : "Enquiry marked as reviewed.",
          });
        },
        onError: (error) =>
          onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );
  const remove = (id: string) =>
    deleteEnquiry.mutate(
      { id },
      {
        onSuccess: () => {
          void invalidateEnquiries();
          onFlash({
            tone: "success",
            message: "Enquiry deleted.",
            action: { label: "Undo", onClick: () => restore(id) },
          });
        },
        onError: (error) =>
          onFlash({ tone: "error", message: errorMessage(error) }),
      },
    );

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="eyebrow text-[#e3212b]">Dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0b3472] sm:text-4xl">
          Good morning, team.
        </h1>
      </div>
      <SectionCard testId="panel-enquiries">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-[#e3212b]">Admissions inbox</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
              Enquiries
            </h2>
          </div>
          <span
            className="rounded-xl bg-[#0b3472]/[.06] px-3 py-2 text-sm font-extrabold text-[#0b3472]"
            data-testid="text-enquiries-count"
          >
            {enquiries.length}
          </span>
        </div>
        <div className="mt-6 space-y-3">
          {enquiriesError ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
              role="alert"
            >
              <p>Enquiries could not be loaded.</p>
              <button
                type="button"
                onClick={onRefresh}
                className="mt-2 font-extrabold underline underline-offset-2"
                data-testid="button-retry-enquiries"
              >
                Try again
              </button>
            </div>
          ) : ordered.length ? (
            ordered.map((enquiry) => (
              <EnquiryCard
                key={enquiry.id}
                enquiry={enquiry}
                pending={pending}
                onToggleReview={() => toggleReview(enquiry)}
                onDelete={() => remove(enquiry.id)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-600">
                Your admissions inbox is clear.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                New public enquiries will appear here.
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function IdentityView({ home, onFlash }: { home: HomePage; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const updateSettings = useUpdateSiteSettings();
  const requestUpload = useRequestUploadUrl();
  const [form, setForm] = useState<SiteSettingsUpdate>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({
      collegeName: home.settings.collegeName,
      headerTagline: home.settings.headerTagline,
      logoUrl: home.settings.logoUrl,
      footerNote: home.settings.footerNote,
      primaryColor: home.settings.primaryColor,
      accentColor: home.settings.accentColor,
    });
  }, [home.settings]);

  const set = <K extends keyof SiteSettingsUpdate>(key: K, value: SiteSettingsUpdate[K]) => setForm((current) => ({ ...current, [key]: value }));
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!form.collegeName?.trim()) {
      onFlash({ tone: "error", message: "College name is required." });
      return;
    }
    updateSettings.mutate({ data: { ...form, collegeName: form.collegeName.trim(), headerTagline: form.headerTagline?.trim(), footerNote: form.footerNote?.trim() } }, {
      onSuccess: () => { void client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }); onFlash({ tone: "success", message: "Site identity saved." }); },
      onError: (error) => onFlash({ tone: "error", message: errorMessage(error) }),
    });
  };
  const upload = async () => {
    if (!selectedFile) return;
    const supported = ["image/png", "image/jpeg", "image/webp"];
    if (!supported.includes(selectedFile.type)) { onFlash({ tone: "error", message: "Logo must be a PNG, JPEG, or WebP file." }); return; }
    if (selectedFile.size > 2 * 1024 * 1024) { onFlash({ tone: "error", message: "Logo files must be 2 MB or smaller." }); return; }
    setUploading(true);
    try {
      const uploadInfo = await requestUpload.mutateAsync({ data: { name: selectedFile.name, size: selectedFile.size, contentType: selectedFile.type } });
      const response = await fetch(uploadInfo.uploadURL, { method: "PUT", headers: { "Content-Type": selectedFile.type }, body: selectedFile });
      if (!response.ok) throw new Error("The logo upload could not be completed.");
      set("logoUrl", uploadInfo.objectPath);
      setSelectedFile(null);
      onFlash({ tone: "success", message: "Logo uploaded. Save site identity to publish it." });
    } catch (error) {
      onFlash({ tone: "error", message: errorMessage(error) });
    } finally {
      setUploading(false);
    }
  };
  const logoPreview = form.logoUrl ? (form.logoUrl.startsWith("/objects/") ? `/api/storage${form.logoUrl}` : form.logoUrl) : "/shastra-college-logo.png";
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><PageIntro eyebrow="Site settings / identity" title="Make the college unmistakable." description="These details appear in the header, footer, and browser-facing palette across the public site." /><form onSubmit={save} className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="space-y-6"><SectionCard><div><p className="eyebrow text-[#e3212b]">Public details</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">College identity</h2></div><div className="mt-6 space-y-5"><Field label="College name" value={form.collegeName || ""} onChange={(value) => set("collegeName", value)} placeholder="Displayed in the public header" testId="input-college-name" /><Field label="Header tagline" value={form.headerTagline || ""} onChange={(value) => set("headerTagline", value)} placeholder="A short line beneath the college name" testId="input-header-tagline" /><Field label="Footer note" value={form.footerNote || ""} onChange={(value) => set("footerNote", value)} placeholder="Displayed in the public footer" multiline testId="input-footer-note" /></div></SectionCard><SectionCard><div><p className="eyebrow text-[#e3212b]">Brand palette</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Primary and accent colors</h2></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><ColorField label="Primary color" value={form.primaryColor || "#0B3472"} onChange={(value) => set("primaryColor", value)} testId="input-primary-color" /><ColorField label="Accent color" value={form.accentColor || "#E3212B"} onChange={(value) => set("accentColor", value)} testId="input-accent-color" /></div><p className="mt-4 text-xs leading-5 text-slate-500">Use six-digit hex colors. These colors are used by the public navigation and calls to action.</p></SectionCard></div><div className="space-y-6"><SectionCard><div><p className="eyebrow text-[#e3212b]">Header mark</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">College logo</h2></div><div className="mt-6 flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#f7f9fc] p-6"><img src={logoPreview} alt="College logo preview" className="max-h-32 max-w-full object-contain" data-testid="img-logo-preview" /></div><div className="mt-4 rounded-2xl border border-slate-200 p-4"><label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#0b3472]"><ImagePlus className="h-5 w-5" /><span>{selectedFile ? selectedFile.name : "Choose a new logo"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} data-testid="input-logo-file" /></label><p className="mt-2 text-xs leading-5 text-slate-500">PNG, JPEG, or WebP. Maximum 2 MB.</p>{selectedFile ? <Button onClick={() => void upload()} disabled={uploading} testId="button-upload-logo" variant="outline"><Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload logo"}</Button> : null}</div></SectionCard><SectionCard className="sticky top-[100px]"><div className="flex items-start gap-3"><Palette className="mt-0.5 h-5 w-5 text-[#e3212b]" /><div><p className="eyebrow text-[#e3212b]">Save changes</p><h2 className="mt-1 font-display text-xl font-extrabold text-[#0b3472]">Ready to publish?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Saving updates the shared settings used by the public homepage.</p></div></div><Button type="submit" onClick={() => undefined} disabled={updateSettings.isPending || uploading} testId="button-save-identity" variant="primary"><Save className="h-4 w-4" />{updateSettings.isPending ? "Saving…" : "Save identity"}</Button></SectionCard></div></form></div>;
}

function ColorField({ label, value, onChange, testId }: { label: string; value: string; onChange: (value: string) => void; testId: string }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2"><input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#0B3472"} onChange={(event) => onChange(event.target.value.toUpperCase())} className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent" data-testid={testId} /><input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent px-1 text-sm font-bold text-slate-700 outline-none" aria-label={`${label} hex value`} data-testid={`${testId}-hex`} /></div></label>;
}

function PlaceholderView({ label }: { label: string }) {
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><PageIntro eyebrow={`Pages / ${label}`} title={`${label} is ready for content.`} description="This page is reserved in the workspace so the staff team has a clear place to manage it when its API-backed content becomes available." /><SectionCard className="max-w-3xl"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0b3472]/[.07] text-[#0b3472]"><CircleHelp className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-extrabold text-[#0b3472]">Page editor coming soon</h2><p className="mt-2 text-sm leading-6 text-slate-500">The navigation is in place, but there are no existing API entities for {label.toLowerCase()} content yet. Nothing has been invented or saved here.</p></div></div></SectionCard></div>;
}

function AdminLoading() {
  return <div className="min-h-[100dvh] bg-[#f5f7fb] p-8 md:pl-[330px]" aria-label="Loading admin workspace" data-testid="loading-admin"><div className="h-4 w-32 animate-pulse rounded bg-slate-200" /><div className="mt-5 h-10 w-72 animate-pulse rounded bg-slate-200" /><div className="mt-8 h-40 max-w-6xl animate-pulse rounded-3xl bg-white" /><div className="mt-6 h-72 max-w-6xl animate-pulse rounded-3xl bg-white" /></div>;
}

function AccessDenied({ userId, error }: { userId?: string; error: unknown }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { if (userId) { await navigator.clipboard?.writeText(userId); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } };
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] p-6"><div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-[#0b3472]/5 sm:p-10"><Link href="/" className="focus-ring text-sm font-bold text-[#0b3472]" data-testid="link-denied-home">Return to public site</Link><p className="eyebrow mt-12 text-[#e3212b]">Admin access</p><h1 className="mt-3 font-display text-3xl font-extrabold text-[#0b3472]">This workspace is restricted.</h1><p className="mt-4 leading-7 text-slate-600">{errorMessage(error)} Ask the site owner to add the signed-in user ID below to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">ADMIN_USER_IDS</code> in Replit Secrets.</p>{userId ? <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"><code className="min-w-0 flex-1 truncate text-sm text-slate-700" data-testid="text-user-id">{userId}</code><button onClick={copy} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#0b3472] hover:bg-slate-100" data-testid="button-copy-user-id"><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy ID"}</button></div> : <Link href="/sign-in" className="focus-ring mt-6 inline-flex rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white" data-testid="link-sign-in">Sign in to continue</Link>}</div></div>;
}

function AdminWorkspace() {
  const { user } = useUser();
  const admin = useGetAdminHome();
  const galleryPage = useGetAdminCmsPage("gallery", {
    query: { queryKey: getGetAdminCmsPageQueryKey("gallery") },
  });
  const enquiries = useGetAdminEnquiries();
  const [activeView, setActiveView] = useState<WorkspaceView>("dashboard");
  const [flash, setFlash] = useState<Flash>(null);
  const flashTimeout = useRef<number | undefined>(undefined);
  const home = admin.data;
  const enquiryItems = enquiries.data?.items || [];
  const showFlash = (message: Flash) => {
    window.clearTimeout(flashTimeout.current);
    setFlash(message);
    if (message) {
      flashTimeout.current = window.setTimeout(
        () => setFlash(null),
        message.action ? 10_000 : 4_500,
      );
    }
  };
  const dismissFlash = () => {
    window.clearTimeout(flashTimeout.current);
    setFlash(null);
  };

  useEffect(
    () => () => window.clearTimeout(flashTimeout.current),
    [],
  );

  if (admin.isLoading || enquiries.isLoading) return <AdminLoading />;
  if (admin.isError || !home) return <AccessDenied userId={user?.id} error={admin.error} />;
  let body: ReactNode;
  if (activeView === "dashboard") {
    body = (
      <DashboardView
        enquiries={enquiryItems}
        enquiriesError={enquiries.isError}
        onRefresh={() => void enquiries.refetch()}
        onFlash={showFlash}
      />
    );
  } else if (activeView === "identity") {
    body = <IdentityView home={home} onFlash={showFlash} />;
  } else if (activeView === "about") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / About / Sub sections"
          title="Manage the About page."
          description="Choose a subsection to edit. Your changes appear on the public About page."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              key: "about-hero" as const,
              number: "01",
              title: "Hero",
              description:
                "Edit the introduction, image, buttons, and Home Statistics shown in the About hero.",
              action: "Edit hero subsection",
            },
            {
              key: "about-who-we-are" as const,
              number: "02",
              title: "Who We Are",
              description:
                "Edit the introduction, classroom image and alt text, vision statement, and mission points.",
              action: "Edit Who We Are subsection",
            },
            {
              key: "about-chairman" as const,
              number: "03",
              title: "Chairman’s Message",
              description:
                "Write the independent leadership message, manage its portrait, and edit the chairman’s signature.",
              action: "Edit Chairman’s Message",
            },
            {
              key: "about-board" as const,
              number: "04",
              title: "Board of Directors",
              description:
                "Edit the About board heading and publication. Board members stay linked to Faculty profiles.",
              action: "Edit Board of Directors",
            },
            {
              key: "about-institutional-strengths" as const,
              number: "05",
              title: "Institutional Strengths",
              description:
                "Edit the section introduction and the ordered learning strengths shown to visitors.",
              action: "Edit Institutional Strengths",
            },
            {
              key: "about-core-values" as const,
              number: "06",
              title: "Core Values",
              description:
                "Edit the section introduction and the values displayed on the About page.",
              action: "Edit Core Values",
            },
          ].map((subsection) => (
            <button
              key={subsection.key}
              type="button"
              onClick={() => setActiveView(subsection.key)}
              className="focus-ring group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-[0_10px_30px_rgba(11,52,114,.045)] transition hover:-translate-y-0.5 hover:border-[#0b3472]/25 hover:shadow-[0_16px_38px_rgba(11,52,114,.09)] sm:p-8"
              data-testid={`button-open-${subsection.key}`}
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[#e3212b]">
                  Subsection {subsection.number}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f5ef] text-[#0b3472] transition group-hover:bg-[#0b3472] group-hover:text-white">
                  <ChevronRight className="h-5 w-5" />
                </span>
              </div>
              <h2 className="mt-6 font-display text-2xl font-extrabold text-[#0b3472] sm:text-3xl">
                {subsection.title}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
                {subsection.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0b3472]">
                {subsection.action}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  } else if (activeView === "about-hero") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / About / Sub sections / Hero"
          title="Edit the About hero."
          description="Update the public introduction, image, buttons, and choose which existing Home Statistics records appear here."
          actions={
            <button
              type="button"
              onClick={() => setActiveView("about")}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:border-[#0b3472]/30"
              data-testid="button-back-about-subsections-hero"
            >
              All About subsections
            </button>
          }
        />
        <AdminAboutEditor
          home={home}
          onFlash={showFlash}
          onNavigate={() => setActiveView("statistics")}
        />
      </div>
    );
  } else if (activeView === "about-who-we-are") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / About / Sub sections / Who We Are"
          title="Edit Who We Are."
          description="Shape the college introduction, vision, and mission shown after the About hero."
          actions={
            <button
              type="button"
              onClick={() => setActiveView("about")}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:border-[#0b3472]/30"
              data-testid="button-back-about-subsections-who-we-are"
            >
              All About subsections
            </button>
          }
        />
        <AdminAboutWhoWeAreEditor onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "about-chairman") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / About / Chairman"
          title="Edit the Chairman’s Message."
          description="Manage this message independently from the matching Faculty profile."
          actions={
            <button
              type="button"
              onClick={() => setActiveView("about")}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:border-[#0b3472]/30"
              data-testid="button-back-about-chairman"
            >
              All About subsections
            </button>
          }
        />
        <AdminAboutChairmanEditor onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "about-board") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / About / Board of Directors"
          title="Manage the About board."
          description="Board cards use published Faculty records selected for About. No duplicate board profiles are stored."
          actions={
            <button
              type="button"
              onClick={() => setActiveView("about")}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:border-[#0b3472]/30"
              data-testid="button-back-about-board"
            >
              All About subsections
            </button>
          }
        />
        <AdminAboutBoardEditor
          onFlash={showFlash}
          onNavigate={() => setActiveView("faculty")}
        />
      </div>
    );
  } else if (
    activeView === "about-institutional-strengths" ||
    activeView === "about-core-values"
  ) {
    const isStrengths = activeView === "about-institutional-strengths";
    const config = isStrengths
      ? {
          sectionKey: "institutional-strengths" as const,
          itemType: "institutional-strength" as const,
          label: "Institutional Strengths",
          position: 4,
          defaultEyebrow: "WHAT GUIDES OUR LEARNING",
          defaultTitle: "Institutional Strengths",
          defaultSubtitle:
            "A focused learning experience built around clear teaching, purposeful practice, and student guidance.",
          supportsIcons: true,
        }
      : {
          sectionKey: "core-values" as const,
          itemType: "core-value" as const,
          label: "Core Values",
          position: 5,
          defaultEyebrow: "OUR PRINCIPLES",
          defaultTitle: "Our Core Values",
          defaultSubtitle:
            "Principles that can guide learning, choices, and our shared community.",
          supportsIcons: false,
        };

    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow={`Pages / About / ${config.label}`}
          title={`Manage ${config.label}.`}
          description="Edit the section copy and manage the ordered entries shown on the public About page."
          actions={
            <button
              type="button"
              onClick={() => setActiveView("about")}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:border-[#0b3472]/30"
              data-testid={`button-back-${config.sectionKey}`}
            >
              All About subsections
            </button>
          }
        />
        <AdminAboutCollectionEditor config={config} onFlash={showFlash} />
      </div>
    );
  } else if (
    activeView === "hero" ||
    activeView === "programs" ||
    activeView === "statistics" ||
    activeView === "faculty-preview" ||
    activeView === "gallery-preview" ||
    activeView === "testimonials"
  ) {
    const sectionName =
      activeView === "programs"
        ? "Pathways"
        : activeView === "statistics"
          ? "Statistics"
          : activeView === "faculty-preview"
            ? "Faculty Preview"
            : activeView === "gallery-preview"
              ? "Gallery Preview"
              : activeView === "testimonials"
                ? "Testimonials"
              : "Hero";
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow={`Pages / Home / ${sectionName}`}
          title={`Edit the ${sectionName.toLowerCase()} section.`}
          description="Changes are saved to the public homepage database. Only this focused subsection is open right now."
        />
        <AdminHomeEditor
          home={home}
          onFlash={showFlash}
          sectionKey={activeView}
          onNavigate={setActiveView}
        />
      </div>
    );
  } else if (activeView === "gallery") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Gallery"
          title="Manage the campus gallery."
          description="Add and organize published campus photos, captions, and categories."
        />
        {galleryPage.isLoading ? (
          <div className="mt-6 h-72 animate-pulse rounded-3xl bg-white" />
        ) : galleryPage.isError || !galleryPage.data ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-bold text-red-800">Gallery editor could not load.</p>
            <button
              type="button"
              onClick={() => void galleryPage.refetch()}
              className="mt-3 rounded-lg bg-[#0B3472] px-3 py-2 text-sm font-bold text-white"
              data-testid="button-retry-admin-gallery"
            >
              Try again
            </button>
          </div>
        ) : (
          <AdminGalleryEditor page={galleryPage.data} onFlash={showFlash} />
        )}
      </div>
    );
  } else if (activeView === "faculty") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <AdminFacultyEditor />
      </div>
    );
  } else if (activeView === "placement-records") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Home / Placement Record"
          title="Manage placement records."
          description="Add and maintain placement details approved for public sharing. Unpublished records remain available in this workspace."
        />
        <AdminPlacementRecordsEditor home={home} onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "courses") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Courses"
          title="Manage the Courses mega-menu."
          description="Keep public pathway destinations confirmed, accessible, and ready for prospective students and families."
        />
        <AdminCoursesEditor onFlash={showFlash} />
      </div>
    );
  } else {
    body = (
      <PlaceholderView
        label={
          pageItems.find((item) => item.key === activeView)?.label || "Page"
        }
      />
    );
  }

  return (
    <Shell home={home} activeView={activeView} onNavigate={setActiveView}>
      {flash ? (
        <div className="mx-auto max-w-7xl px-5 pt-4 sm:px-8">
          <FlashMessage flash={flash} onDismiss={dismissFlash} />
        </div>
      ) : null}
      {body}
    </Shell>
  );
}

export default function AdminPage() {
  return <><Show when="signed-out"><div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] p-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-[#0b3472]/5"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b3472] text-white"><LayoutDashboard /></span><p className="eyebrow mt-8 text-[#e3212b]">Staff workspace</p><h1 className="mt-3 font-display text-3xl font-extrabold text-[#0b3472]">Sign in to manage the college site.</h1><p className="mt-3 leading-7 text-slate-600">The public college site is open to everyone. This workspace is reserved for the authorized team keeping it current.</p><Link href="/sign-in" className="focus-ring mt-7 inline-flex w-full items-center justify-center rounded-xl bg-[#0b3472] px-5 py-3.5 text-sm font-bold text-white" data-testid="link-admin-sign-in">Continue to sign in</Link></div></div></Show><Show when="signed-in"><AdminWorkspace /></Show></>;
}