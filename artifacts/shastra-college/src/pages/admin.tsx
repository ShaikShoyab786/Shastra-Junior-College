import { useEffect, useState, type FormEvent, type ReactNode } from "react";
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
  Plus,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  getGetAdminEnquiriesQueryKey,
  getGetAdminHomeQueryKey,
  useGetAdminEnquiries,
  useGetAdminHome,
  useGetAdminHomeSummary,
  useHealthCheck,
  useRequestUploadUrl,
  useUpdateEnquiry,
  useUpdateSiteSettings,
} from "@workspace/api-client-react";
import type {
  AdminEnquiry,
  HomePage,
  NavigationLink,
  SiteSettingsUpdate,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import AdminHomeEditor from "./admin-home-editor";

type Flash = { tone: "success" | "error"; message: string } | null;
type WorkspaceView =
  | "dashboard"
  | "overview"
  | "hero"
  | "programs"
  | "statistics"
  | "identity"
  | "menus"
  | "about"
  | "results"
  | "faculty"
  | "courses"
  | "gallery";

const pageItems: Array<{ key: WorkspaceView; label: string; note?: string }> = [
  { key: "about", label: "About", note: "Coming soon" },
  { key: "results", label: "Results", note: "Coming soon" },
  { key: "faculty", label: "Faculty", note: "Coming soon" },
  { key: "courses", label: "Courses", note: "Coming soon" },
  { key: "gallery", label: "Gallery", note: "Coming soon" },
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

function StatusPill({ status }: { status: "new" | "handled" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.13em] ${
        status === "new"
          ? "bg-[#e3212b]/10 text-[#ba1824]"
          : "bg-emerald-50 text-emerald-700"
      }`}
      data-testid={`status-enquiry-${status}`}
    >
      {status}
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
      <span>{flash.message}</span>
      <button onClick={onDismiss} className="ml-auto rounded-lg p-1" aria-label="Dismiss message" data-testid="button-dismiss-flash">
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
  const [homeOpen, setHomeOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [pagesOpen, setPagesOpen] = useState(true);
  const activePage = activeView === "dashboard" ? "Dashboard" : activeView === "identity" || activeView === "menus" ? "Site settings" : activeView === "overview" || activeView === "hero" || activeView === "programs" || activeView === "statistics" ? "Homepage" : "Pages";

  const go = (view: WorkspaceView) => {
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
            <button onClick={() => setHomeOpen((current) => !current)} className="flex w-full items-center justify-between px-3 text-left" data-testid="button-toggle-home-nav">
              <span className={`eyebrow ${activePage === "Homepage" ? "text-[#ffb3b6]" : "text-blue-300"}`}>Homepage</span>
              {homeOpen ? <ChevronDown className="h-3.5 w-3.5 text-blue-300" /> : <ChevronRight className="h-3.5 w-3.5 text-blue-300" />}
            </button>
            {homeOpen ? (
              <div className="mt-2 space-y-1">
                <NavRow icon={FileText} label="Overview" nested active={activeView === "overview"} onClick={() => go("overview")} />
                <NavRow icon={FileText} label="Hero" nested active={activeView === "hero"} onClick={() => go("hero")} />
                <NavRow icon={Link2} label="Pathways" nested active={activeView === "programs"} onClick={() => go("programs")} />
                <NavRow icon={ClipboardList} label="Statistics" nested active={activeView === "statistics"} onClick={() => go("statistics")} />
              </div>
            ) : null}
          </div>

          <div>
            <button onClick={() => setSettingsOpen((current) => !current)} className="flex w-full items-center justify-between px-3 text-left" data-testid="button-toggle-settings-nav">
              <span className={`eyebrow ${activePage === "Site settings" ? "text-[#ffb3b6]" : "text-blue-300"}`}>Site settings</span>
              {settingsOpen ? <ChevronDown className="h-3.5 w-3.5 text-blue-300" /> : <ChevronRight className="h-3.5 w-3.5 text-blue-300" />}
            </button>
            {settingsOpen ? (
              <div className="mt-2 space-y-1">
                <NavRow icon={Settings2} label="Site identity" nested active={activeView === "identity"} onClick={() => go("identity")} />
                <NavRow icon={Link2} label="Mega menus" nested active={activeView === "menus"} onClick={() => go("menus")} />
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
                {pageItems.map((item) => (
                  <NavRow key={item.key} icon={FolderOpen} label={item.label} nested active={activeView === item.key} onClick={() => go(item.key)} badge={item.note ? "Soon" : undefined} />
                ))}
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
              <p className="font-display text-lg font-extrabold text-[#0b3472]">{activeView === "dashboard" ? "Keep the public site current." : activeView === "identity" ? "Site identity" : activeView === "menus" ? "Mega menus" : activeView === "overview" ? "Homepage overview" : activeView === "hero" ? "Hero" : activeView === "programs" ? "Pathways" : activeView === "statistics" ? "Statistics" : "Page workspace"}</p>
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

function StatisticsStrip({ home, summary, enquiryCount, newCount }: { home: HomePage; summary?: { sectionCount: number; visibleSectionCount: number; itemCount: number; visibleItemCount: number }; enquiryCount: number; newCount: number }) {
  const stats = [
    { label: "Sections live", value: `${summary?.visibleSectionCount ?? 0}/${summary?.sectionCount ?? 0}`, detail: "homepage sections" },
    { label: "Items published", value: `${summary?.visibleItemCount ?? 0}/${summary?.itemCount ?? 0}`, detail: "content items" },
    { label: "Enquiries", value: String(enquiryCount), detail: `${newCount} need attention` },
    { label: "Last changed", value: dateLabel(home.settings.updatedAt).split(",")[0], detail: "site settings" },
  ];
  return (
    <div className="mb-7 overflow-hidden rounded-3xl bg-[#0a2e63] text-white shadow-[0_14px_32px_rgba(10,46,99,.18)]" data-testid="strip-admin-statistics">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
        <div>
          <p className="eyebrow text-[#ffb3b6]">Publishing pulse</p>
          <p className="mt-1 text-sm font-semibold text-blue-100">A quick read on what visitors can see right now.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-200"><ShieldCheck className="h-4 w-4 text-[#ff878c]" /> Staff-only snapshot</div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-white/10 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="px-5 py-5 sm:px-7" data-testid={`stat-${stat.label.toLowerCase().replaceAll(" ", "-")}`}>
            <p className="text-2xl font-extrabold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs font-bold text-white">{stat.label}</p>
            <p className="mt-0.5 text-[11px] text-blue-200">{stat.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnquiryCard({ enquiry, onHandled, pending }: { enquiry: AdminEnquiry; onHandled: () => void; pending: boolean }) {
  const lead = enquiry.answers[0];
  const secondary = enquiry.answers.slice(1, 3);
  return (
    <article className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4" data-testid={`card-enquiry-${enquiry.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[#0b3472]">{lead?.value || "Admissions enquiry"}</p>
          <p className="mt-1 text-xs text-slate-500">{dateLabel(enquiry.createdAt)}</p>
        </div>
        <StatusPill status={enquiry.status} />
      </div>
      {secondary.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{secondary.map((answer) => <div key={`${enquiry.id}-${answer.name}`}><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{answer.label}</p><p className="mt-0.5 truncate text-xs font-semibold text-slate-700">{answer.value || "Not provided"}</p></div>)}</div> : null}
      {enquiry.status === "new" ? <button onClick={onHandled} disabled={pending} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-[#0b3472] hover:bg-slate-50 disabled:opacity-50" data-testid={`button-mark-handled-${enquiry.id}`}><Check className="h-3.5 w-3.5" /> {pending ? "Updating" : "Mark handled"}</button> : null}
    </article>
  );
}

function DashboardView({ home, summary, enquiries, onFlash }: { home: HomePage; summary?: { sectionCount: number; visibleSectionCount: number; itemCount: number; visibleItemCount: number }; enquiries: AdminEnquiry[]; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const updateEnquiry = useUpdateEnquiry();
  const newCount = enquiries.filter((item) => item.status === "new").length;
  const recent = enquiries.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const markHandled = (id: string) => updateEnquiry.mutate({ id, data: { status: "handled" } }, { onSuccess: () => { void client.invalidateQueries({ queryKey: getGetAdminEnquiriesQueryKey() }); onFlash({ tone: "success", message: "Enquiry marked as handled." }); }, onError: (error) => onFlash({ tone: "error", message: errorMessage(error) }) });
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <PageIntro eyebrow="Dashboard" title="Good morning, team." description="Keep the essentials within reach, then open one focused editor when something needs attention." actions={<Button onClick={() => window.location.reload()} testId="button-refresh-dashboard" variant="outline"><RefreshCw className="h-4 w-4" /> Refresh</Button>} />
      <StatisticsStrip home={home} summary={summary} enquiryCount={enquiries.length} newCount={newCount} />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.8fr]">
        <SectionCard testId="panel-recent-enquiries">
          <div className="flex items-start justify-between gap-3">
            <div><p className="eyebrow text-[#e3212b]">Admissions inbox</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Recent enquiries</h2><p className="mt-1 text-sm text-slate-500">{newCount ? `${newCount} new ${newCount === 1 ? "enquiry" : "enquiries"} waiting for a reply.` : "No new enquiries waiting for a reply."}</p></div>
            <span className="rounded-xl bg-[#0b3472]/[.06] px-3 py-2 text-sm font-extrabold text-[#0b3472]" data-testid="text-enquiries-count">{enquiries.length}</span>
          </div>
          <div className="mt-6 space-y-3">
            {recent.length ? recent.map((enquiry) => <EnquiryCard key={enquiry.id} enquiry={enquiry} pending={updateEnquiry.isPending} onHandled={() => markHandled(enquiry.id)} />) : <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center"><ClipboardList className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">Your admissions inbox is clear.</p><p className="mt-1 text-xs text-slate-400">New public enquiries will appear here.</p></div>}
          </div>
        </SectionCard>
        <SectionCard>
          <div><p className="eyebrow text-[#e3212b]">Quick checks</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Content health</h2><p className="mt-1 text-sm text-slate-500">Small checks that help prevent stale public content.</p></div>
          <div className="mt-6 space-y-3">
            <HealthRow label="Homepage sections" value={`${summary?.visibleSectionCount ?? 0} visible`} tone={(summary?.visibleSectionCount ?? 0) > 0 ? "good" : "warn"} />
            <HealthRow label="Homepage content items" value={`${summary?.visibleItemCount ?? 0} published`} tone={(summary?.visibleItemCount ?? 0) > 0 ? "good" : "warn"} />
            <HealthRow label="Site identity" value={home.settings.collegeName ? "Complete" : "Needs review"} tone={home.settings.collegeName ? "good" : "warn"} />
          </div>
          <div className="mt-6 rounded-2xl bg-[#f4f7fc] p-4"><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#0b3472]">Tip for this week</p><p className="mt-2 text-sm leading-6 text-slate-600">Use the Homepage group to edit one section at a time. The public site updates after each save.</p></div>
        </SectionCard>
      </div>
    </div>
  );
}

function HealthRow({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" }) {
  return <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3" data-testid={`health-row-${label.toLowerCase().replaceAll(" ", "-")}`}><span className="text-sm font-bold text-slate-700">{label}</span><span className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${tone === "good" ? "text-emerald-700" : "text-amber-700"}`}><span className={`h-1.5 w-1.5 rounded-full ${tone === "good" ? "bg-emerald-500" : "bg-amber-500"}`} />{value}</span></div>;
}

function OverviewView({ home, summary, onNavigate }: { home: HomePage; summary?: { sectionCount: number; visibleSectionCount: number; hiddenSectionCount: number; itemCount: number; visibleItemCount: number; hiddenItemCount: number }; onNavigate: (view: WorkspaceView) => void }) {
  const orderedSections = home.sections.slice().sort((a, b) => a.position - b.position);
  const sectionMeta: Record<string, { label: string; key: WorkspaceView; detail: string }> = {
    hero: { label: "Hero", key: "hero", detail: "Introduction and admissions enquiry form" },
    programs: { label: "Pathways", key: "programs", detail: "Programme cards shown to prospective students" },
    statistics: { label: "Statistics", key: "statistics", detail: "Compact proof points on the homepage" },
  };
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><PageIntro eyebrow="Homepage / overview" title="Everything public, at a glance." description="Review visibility and open one homepage section when you are ready to edit it." /><div className="grid gap-6 lg:grid-cols-[1fr_.72fr]"><SectionCard><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[#e3212b]">Publishing map</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Homepage sections</h2></div><div className="text-right"><p className="text-2xl font-extrabold text-[#0b3472]">{summary?.visibleSectionCount ?? 0}<span className="text-sm font-bold text-slate-400">/{summary?.sectionCount ?? orderedSections.length}</span></p><p className="text-xs text-slate-500">visible</p></div></div><div className="mt-6 space-y-3">{orderedSections.map((section, index) => { const meta = sectionMeta[section.sectionKey]; return <button key={section.id} onClick={() => meta && onNavigate(meta.key)} disabled={!meta} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-[#0b3472]/30 hover:bg-[#f8faff] disabled:cursor-default" data-testid={`row-home-section-${section.sectionKey}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b3472]/[.07] text-sm font-extrabold text-[#0b3472]">0{index + 1}</span><span className="min-w-0 flex-1"><span className="block font-extrabold text-[#0b3472]">{meta?.label || section.title}</span><span className="mt-1 block text-xs text-slate-500">{meta?.detail || "Homepage content section"}</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] ${section.isVisible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{section.isVisible ? "Visible" : "Hidden"}</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>; })}</div></SectionCard><SectionCard><p className="eyebrow text-[#e3212b]">Content counts</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Publishing totals</h2><div className="mt-6 space-y-4"><CountLine label="Visible sections" value={summary?.visibleSectionCount ?? 0} total={summary?.sectionCount ?? 0} /><CountLine label="Hidden sections" value={summary?.hiddenSectionCount ?? 0} total={summary?.sectionCount ?? 0} muted /><CountLine label="Published items" value={summary?.visibleItemCount ?? 0} total={summary?.itemCount ?? 0} /><CountLine label="Hidden items" value={summary?.hiddenItemCount ?? 0} total={summary?.itemCount ?? 0} muted /></div><div className="mt-7 border-t border-slate-200 pt-5"><p className="text-xs font-bold text-slate-500">Site identity last updated</p><p className="mt-1 text-sm font-extrabold text-[#0b3472]">{dateLabel(home.settings.updatedAt)}</p></div></SectionCard></div></div>;
}

function CountLine({ label, value, total, muted = false }: { label: string; value: number; total: number; muted?: boolean }) {
  const percent = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return <div><div className="flex items-center justify-between text-sm"><span className={`font-bold ${muted ? "text-slate-500" : "text-slate-700"}`}>{label}</span><span className="font-extrabold text-[#0b3472]">{value}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${muted ? "bg-slate-300" : "bg-[#e3212b]"}`} style={{ width: `${percent}%` }} /></div></div>;
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

function MenusView({ home, onFlash }: { home: HomePage; onFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const updateSettings = useUpdateSiteSettings();
  const [links, setLinks] = useState<NavigationLink[]>([]);
  const [expanded, setExpanded] = useState(true);
  useEffect(() => setLinks(home.settings.navigation.map((link) => ({ ...link }))), [home.settings.navigation]);
  const updateLink = (index: number, key: keyof NavigationLink, value: string) => setLinks((current) => current.map((link, row) => row === index ? { ...link, [key]: value } : link));
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (links.some((link) => !link.label.trim() || !link.path.trim())) { onFlash({ tone: "error", message: "Each navigation link needs a label and path." }); return; }
    updateSettings.mutate({ data: { navigation: links.map((link) => ({ label: link.label.trim(), path: link.path.trim() })) } }, { onSuccess: () => { void client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }); onFlash({ tone: "success", message: "Navigation links saved." }); }, onError: (error) => onFlash({ tone: "error", message: errorMessage(error) }) });
  };
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><PageIntro eyebrow="Site settings / navigation" title="Shape the main menu." description="Keep the public header concise. Reorder links with the controls below and save once the structure feels right." /><form onSubmit={save} className="max-w-4xl"><SectionCard><button type="button" onClick={() => setExpanded((current) => !current)} className="flex w-full items-center justify-between text-left" data-testid="button-toggle-menu-editor"><span><span className="eyebrow text-[#e3212b]">Primary navigation</span><span className="mt-1 block font-display text-2xl font-extrabold text-[#0b3472]">Existing menu links</span></span>{expanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}</button>{expanded ? <><div className="mt-6 space-y-3">{links.length ? links.map((link, index) => <div key={`${index}-${link.path}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end" data-testid={`row-navigation-${index}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b3472]/[.07] text-xs font-extrabold text-[#0b3472]">{index + 1}</span><Field label="Label" value={link.label} onChange={(value) => updateLink(index, "label", value)} placeholder="Menu label" testId={`input-navigation-label-${index}`} /><Field label="Path" value={link.path} onChange={(value) => updateLink(index, "path", value)} placeholder="/about" testId={`input-navigation-path-${index}`} /><button type="button" onClick={() => setLinks((current) => current.filter((_, row) => row !== index))} className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700" aria-label={`Remove navigation link ${index + 1}`} data-testid={`button-remove-navigation-${index}`}><X className="h-4 w-4" /></button></div>) : <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center"><Link2 className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">No navigation links saved.</p></div>}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setLinks((current) => [...current, { label: "", path: "" }])} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#0b3472]/30 px-3.5 py-2.5 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/5" data-testid="button-add-navigation"><Plus className="h-4 w-4" /> Add link</button><Button type="submit" onClick={() => undefined} disabled={updateSettings.isPending} testId="button-save-navigation" variant="primary"><Save className="h-4 w-4" />{updateSettings.isPending ? "Saving…" : "Save menu"}</Button></div></> : null}</SectionCard></form></div>;
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
  const summary = useGetAdminHomeSummary();
  const enquiries = useGetAdminEnquiries();
  const health = useHealthCheck();
  const [activeView, setActiveView] = useState<WorkspaceView>("dashboard");
  const [flash, setFlash] = useState<Flash>(null);
  const home = admin.data;
  const enquiryItems = enquiries.data?.items || [];
  const showFlash = (message: Flash) => { setFlash(message); window.setTimeout(() => setFlash(null), 4500); };

  if (admin.isLoading || summary.isLoading || enquiries.isLoading) return <AdminLoading />;
  if (admin.isError || !home) return <AccessDenied userId={user?.id} error={admin.error} />;
  const body = activeView === "dashboard" ? <DashboardView home={home} summary={summary.data} enquiries={enquiryItems} onFlash={showFlash} /> : activeView === "overview" ? <OverviewView home={home} summary={summary.data} onNavigate={setActiveView} /> : activeView === "identity" ? <IdentityView home={home} onFlash={showFlash} /> : activeView === "menus" ? <MenusView home={home} onFlash={showFlash} /> : activeView === "hero" || activeView === "programs" || activeView === "statistics" ? <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><PageIntro eyebrow={`Homepage / ${activeView === "programs" ? "pathways" : activeView}`} title={`Edit the ${activeView === "programs" ? "pathways" : activeView} section.`} description="Changes are saved to the public homepage database. Only this focused subsection is open right now." /><AdminHomeEditor home={home} onFlash={showFlash} sectionKey={activeView} /></div> : <PlaceholderView label={pageItems.find((item) => item.key === activeView)?.label || "Page"} />;
  return <Shell home={home} activeView={activeView} onNavigate={setActiveView}><div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8"><FlashMessage flash={flash} onDismiss={() => setFlash(null)} />{health.isError ? <div className="mb-4 flex items-center gap-2 text-xs font-bold text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> API health check unavailable; saved actions may still work.</div> : null}</div>{body}</Shell>;
}

export default function AdminPage() {
  return <><Show when="signed-out"><div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] p-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-[#0b3472]/5"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b3472] text-white"><LayoutDashboard /></span><p className="eyebrow mt-8 text-[#e3212b]">Staff workspace</p><h1 className="mt-3 font-display text-3xl font-extrabold text-[#0b3472]">Sign in to manage the college site.</h1><p className="mt-3 leading-7 text-slate-600">The public college site is open to everyone. This workspace is reserved for the authorized team keeping it current.</p><Link href="/sign-in" className="focus-ring mt-7 inline-flex w-full items-center justify-center rounded-xl bg-[#0b3472] px-5 py-3.5 text-sm font-bold text-white" data-testid="link-admin-sign-in">Continue to sign in</Link></div></div></Show><Show when="signed-in"><AdminWorkspace /></Show></>;
}