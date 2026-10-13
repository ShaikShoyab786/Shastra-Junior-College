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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  Award,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
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
  LayoutGrid,
  Link2,
  LogOut,
  Menu,
  MessageSquareQuote,
  Palette,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetAdminHomeQueryKey,
  getGetCmsPageQueryKey,
  getGetHomePageQueryKey,
  useGetAdminCmsPage,
  useGetAdminHome,
  useRequestUploadUrl,
  useUpdateSiteSettings,
} from "@workspace/api-client-react";
import type {
  HomePage,
  SiteSettingsUpdate,
} from "@workspace/api-client-react";
import { DEFAULT_THEME, THEME_PRESETS, themeVariables, type PresetKey } from "@/lib/theme-presets";
import { Link } from "wouter";
import AdminHomeEditor from "./admin-home-editor";
import AdminAboutEditor from "./admin-about-editor";
import AdminAboutWhoWeAreEditor from "./admin-about-who-we-are-editor";
import AdminAboutChairmanEditor from "./admin-about-chairman-editor";
import AdminAboutBoardEditor from "./admin-about-board-editor";
import AdminAboutCollectionEditor from "./admin-about-collection-editor";
import AdminAboutCoursesPreviewEditor from "./admin-about-courses-preview-editor";
import AdminGalleryEditor from "./admin-gallery-editor";
import AdminFacultyEditor from "./admin-faculty-editor";
import AdminPlacementRecordsEditor from "./admin-placement-records-editor";
import AdminCoursesEditor from "./admin-courses-editor";
import AdminKnowledgeHubMenuEditor from "./admin-knowledge-hub-menu-editor";
import AdminKnowledgeHubPageEditor from "./admin-knowledge-hub-page-editor";
import AdminArticleHubEditor from "./admin-article-hub-editor";
import AdminVideoHubEditor from "./admin-video-hub-editor";
import AdminStudyResourcesEditor from "./admin-study-resources-editor";
import AdminExamUpdatesEditor from "./admin-exam-updates-editor";
import AdminCoursesPageEditor from "./admin-courses-page-editor";
import AdminCourseDetailEditor from "./admin-course-detail-editor";
import { isValidSocialProfileUrl } from "@/lib/social-profiles";
import { Switch } from "@/components/ui/switch";
import AdminFaqEditor from "./admin-faq-editor";
import AdminFaqTextSettingsEditor from "./admin-faq-text-settings-editor";
import AdminAboutCtaEditor from "./admin-about-cta-editor";
import AdminContactEditor from "./admin-contact-editor";
import AdminEnquiriesDashboard from "./admin-enquiries-dashboard";
import AdminOverview from "./admin-overview";
import {
  COURSE_DETAILS,
  courseSectionKey,
  type CourseDetailAdminView,
} from "./course-detail-config";

type Flash = {
  tone: "success" | "error";
  message: string;
  action?: { label: string; onClick: () => void };
} | null;
type WorkspaceView =
  | "dashboard"
  | "overview"
  | "hero"
  | "programs"
  | "statistics"
  | "placement-records"
  | "gallery-preview"
  | "faculty-preview"
  | "testimonials"
  | "knowledge-hub-preview"
  | "knowledge-hub-settings"
  | "article-hub-editor"
  | "video-hub-editor"
  | "study-resources-editor"
  | "exam-updates-editor"
  | "knowledge-hub-mega-menu"
  | "identity"
  | "courses-mega-menu"
  | "about"
  | "about-hero"
  | "about-who-we-are"
  | "about-chairman"
  | "about-board"
  | "about-institutional-strengths"
  | "about-core-values"
  | "about-courses-preview"
  | "about-faqs"
  | "about-cta"
  | "home-faqs"
  | "faqs"
  | "faculty"
  | "courses"
  | "contact"
  | "courses-explore"
  | CourseDetailAdminView
  | "gallery";

const pageItems: Array<{
  key: WorkspaceView;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "about", label: "About", icon: FolderOpen },
  { key: "faculty", label: "Faculty", icon: UserRound },
  { key: "gallery", label: "Gallery", icon: ImagePlus },
  { key: "faqs", label: "FAQs", icon: CircleHelp },
  { key: "courses", label: "Courses", icon: BookOpenCheck },
  { key: "knowledge-hub-settings", label: "Knowledge Hub", icon: BookOpenCheck },
  { key: "contact", label: "Contact", icon: FileText },
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

function FlashMessage({ flash, onDismiss }: { flash: Flash; onDismiss: () => void }) {
  if (!flash) return null;
  return (
    <div
      className={`pointer-events-auto flex w-fit max-w-full items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg shadow-[#0b3472]/10 ${
        flash.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      role={flash.tone === "error" ? "alert" : "status"}
      aria-live={flash.tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
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
        nested ? "pl-3" : ""
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
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(
    activeView === "identity" ||
      activeView === "courses-mega-menu" ||
      activeView === "knowledge-hub-mega-menu",
  );
  const [megaMenusOpen, setMegaMenusOpen] = useState(
    activeView === "courses-mega-menu" ||
      activeView === "knowledge-hub-mega-menu",
  );
  const [pagesOpen, setPagesOpen] = useState(
    activeView === "knowledge-hub-settings" ||
      activeView === "article-hub-editor" ||
      activeView === "video-hub-editor" ||
      activeView === "study-resources-editor" ||
      activeView === "exam-updates-editor",
  );
  const [knowledgeHubOpen, setKnowledgeHubOpen] = useState(
    activeView === "knowledge-hub-settings" ||
      activeView === "article-hub-editor" ||
      activeView === "video-hub-editor" ||
      activeView === "study-resources-editor" ||
      activeView === "exam-updates-editor",
  );
  const [coursesOpen, setCoursesOpen] = useState(
    activeView === "courses" ||
      activeView === "courses-explore" ||
      COURSE_DETAILS.some((course) => course.adminView === activeView),
  );
  const [aboutOpen, setAboutOpen] = useState(
    activeView === "about" ||
      activeView === "about-hero" ||
      activeView === "about-who-we-are" ||
      activeView === "about-chairman" ||
      activeView === "about-board" ||
      activeView === "about-institutional-strengths" ||
      activeView === "about-core-values" ||
      activeView === "about-courses-preview" ||
      activeView === "about-faqs" ||
      activeView === "about-cta",
  );
  useEffect(() => {
    if (
      activeView === "courses" ||
      activeView === "courses-explore" ||
      COURSE_DETAILS.some((course) => course.adminView === activeView)
    ) {
      setCoursesOpen(true);
    }
  }, [activeView]);
  const homeSectionActive =
    activeView === "hero" ||
    activeView === "programs" ||
    activeView === "statistics" ||
    activeView === "gallery-preview" ||
    activeView === "faculty-preview" ||
    activeView === "testimonials" ||
    activeView === "knowledge-hub-preview" ||
    activeView === "placement-records" ||
    activeView === "home-faqs";
  const aboutSectionActive =
    activeView === "about" ||
    activeView === "about-hero" ||
    activeView === "about-who-we-are" ||
    activeView === "about-chairman" ||
    activeView === "about-board" ||
    activeView === "about-institutional-strengths" ||
    activeView === "about-core-values" ||
    activeView === "about-courses-preview" ||
    activeView === "about-faqs" ||
    activeView === "about-cta";
  const activePage =
    activeView === "dashboard"
      ? "Dashboard"
      : activeView === "overview"
        ? "Overview"
      : activeView === "identity" ||
          activeView === "courses-mega-menu" ||
          activeView === "knowledge-hub-mega-menu"
        ? "Site settings"
        : activeView === "knowledge-hub-settings" ||
            activeView === "article-hub-editor" ||
            activeView === "video-hub-editor" ||
            activeView === "study-resources-editor" ||
            activeView === "exam-updates-editor"
          ? "Pages / Knowledge Hub"
          : activeView === "faqs"
            ? "Pages / FAQs"
        : activeView === "contact"
          ? "Pages / Contact"
        : aboutSectionActive
          ? "Pages / About"
          : homeSectionActive
            ? "Pages / Home"
              : activeView === "courses" || activeView === "courses-explore" || COURSE_DETAILS.some((course) => course.adminView === activeView)
                ? "Pages / Courses"
            : "Pages";
  useEffect(() => {
    if (activePage.startsWith("Pages")) {
      setPagesOpen(true);
    }
    if (activePage === "Site settings") {
      setSettingsOpen(true);
    }
    if (
      activeView === "knowledge-hub-settings" ||
      activeView === "article-hub-editor" ||
      activeView === "video-hub-editor" ||
      activeView === "study-resources-editor" ||
      activeView === "exam-updates-editor"
    ) {
      setKnowledgeHubOpen(true);
    }
    if (
      activeView === "courses-mega-menu" ||
      activeView === "knowledge-hub-mega-menu"
    ) {
      setMegaMenusOpen(true);
    }
  }, [activePage, activeView]);
  const selectedCourse = COURSE_DETAILS.find((course) => course.adminView === activeView);
  const [activeCourseSection, setActiveCourseSection] = useState<"hero" | "highlights" | "faculty-preview" | "curriculum" | "gallery-preview" | "enrollment-process" | "testimonials" | "faqs">("hero");
  useEffect(() => {
    setActiveCourseSection("hero");
  }, [selectedCourse?.slug]);
  const activeTitle =
    selectedCourse
      ? `${selectedCourse.name} course page`
      : activeView === "dashboard"
      ? "Dashboard"
      : activeView === "overview"
        ? "Website Overview"
      : activeView === "identity"
        ? "Site identity"
          : activeView === "courses-mega-menu"
            ? "Courses Mega Menu"
            : activeView === "knowledge-hub-mega-menu"
              ? "Knowledge Hub Mega Menu"
            : activeView === "courses-explore"
              ? "Explore Courses"
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
                      : activeView === "about-courses-preview"
                        ? "About · Courses Preview"
                        : activeView === "about-faqs"
                          ? "About · FAQs"
                          : activeView === "about-cta"
                            ? "About · CTA"
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
                        : activeView === "knowledge-hub-preview"
                          ? "Home · Knowledge Hub Preview"
                          : activeView === "home-faqs"
                            ? "Home · FAQs"
                          : activeView === "knowledge-hub-settings"
                            ? "Main Page"
                            : activeView === "article-hub-editor"
                              ? "Article Hub"
                              : activeView === "video-hub-editor"
                                ? "Video Hub"
                                : activeView === "study-resources-editor"
                                  ? "Study Resources"
                                  : activeView === "exam-updates-editor"
                                    ? "Exam Updates"
                      : pageItems.find((item) => item.key === activeView)?.label ||
                        "Home";

  const go = (view: WorkspaceView) => {
    if (
      view === "identity" ||
      view === "courses-mega-menu" ||
      view === "knowledge-hub-mega-menu"
    ) {
      setSettingsOpen(true);
    }
    if (
      view === "courses-mega-menu" ||
      view === "knowledge-hub-mega-menu"
    ) {
      setMegaMenusOpen(true);
    }
    if (
      view === "knowledge-hub-settings" ||
      view === "article-hub-editor" ||
      view === "video-hub-editor" ||
      view === "study-resources-editor" ||
      view === "exam-updates-editor"
    ) {
      setPagesOpen(true);
      setKnowledgeHubOpen(true);
    }
    if (
      view === "about" ||
      view === "about-hero" ||
      view === "about-who-we-are" ||
      view === "about-chairman" ||
      view === "about-board" ||
      view === "about-institutional-strengths" ||
      view === "about-core-values" ||
      view === "about-courses-preview"
    ) {
      setAboutOpen(true);
    }
    if (view === "courses" || view === "courses-explore" || COURSE_DETAILS.some((course) => course.adminView === view)) {
      setCoursesOpen(true);
    }
    onNavigate(view);
    setMobileNav(false);
  };

  const jumpToCourseSelector = () => {
    if (!selectedCourse) {
      const firstPathway = COURSE_DETAILS.find(
        (course) => !("isDraft" in course && course.isDraft),
      );
      if (firstPathway) go(firstPathway.adminView);
      return;
    }
    document.getElementById("course-pathway-selector")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setMobileNav(false);
  };

  const jumpToCourseSection = (section: "hero" | "highlights" | "faculty-preview" | "curriculum" | "gallery-preview" | "enrollment-process" | "testimonials" | "faqs") => {
    if (!selectedCourse) return;
    setActiveCourseSection(section);
    document
      .getElementById(courseSectionKey(selectedCourse.slug, section))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNav(false);
  };

  return (
    <div
      className="min-h-[100dvh] bg-[#f5f7fb] text-slate-900"
      data-college-theme
      style={themeVariables(
        home?.settings.primaryColor || THEME_PRESETS[DEFAULT_THEME].primary,
        home?.settings.accentColor || THEME_PRESETS[DEFAULT_THEME].accent,
        home?.settings.surfaceColor || THEME_PRESETS[DEFAULT_THEME].surface,
      ) as React.CSSProperties}
    >
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
            <NavRow icon={LayoutGrid} label="Overview" active={activeView === "overview"} onClick={() => go("overview")} />
          </div>

          <div>
            <button onClick={() => setSettingsOpen((current) => !current)} className="flex w-full items-center justify-between px-3 text-left" data-testid="button-toggle-settings-nav">
              <span className={`eyebrow ${activePage === "Site settings" ? "text-[#ffb3b6]" : "text-blue-300"}`}>Site settings</span>
              {settingsOpen ? <ChevronDown className="h-3.5 w-3.5 text-blue-300" /> : <ChevronRight className="h-3.5 w-3.5 text-blue-300" />}
            </button>
            {settingsOpen ? (
              <div className="mt-2 space-y-1">
                <NavRow icon={Settings2} label="Site identity" nested active={activeView === "identity"} onClick={() => go("identity")} />
                <div>
                  <button
                    type="button"
                    onClick={() => setMegaMenusOpen((current) => !current)}
                    aria-expanded={megaMenusOpen}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      activeView === "courses-mega-menu" ||
                      activeView === "knowledge-hub-mega-menu"
                        ? "bg-white/10 text-white"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                    data-testid="button-toggle-mega-menus-nav"
                  >
                    <Menu className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">Mega Menus</span>
                    {megaMenusOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-blue-300" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-blue-300" />
                    )}
                  </button>
                  {megaMenusOpen ? (
                    <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2">
                      <NavRow
                        icon={FolderOpen}
                        label="Courses Mega Menu"
                        nested
                        active={activeView === "courses-mega-menu"}
                        onClick={() => go("courses-mega-menu")}
                      />
                      <NavRow
                        icon={BookOpenCheck}
                        label="Knowledge Hub Mega Menu"
                        nested
                        active={activeView === "knowledge-hub-mega-menu"}
                        onClick={() => go("knowledge-hub-mega-menu")}
                      />
                    </div>
                  ) : null}
                </div>
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
                      <NavRow icon={Award} label="Placement Record" nested active={activeView === "placement-records"} onClick={() => go("placement-records")} />
                       <NavRow icon={UserRound} label="Faculty Preview" nested active={activeView === "faculty-preview"} onClick={() => go("faculty-preview")} />
                        <NavRow icon={MessageSquareQuote} label="Testimonials" nested active={activeView === "testimonials"} onClick={() => go("testimonials")} />
                        <NavRow icon={BookOpenCheck} label="Knowledge Hub Preview" nested active={activeView === "knowledge-hub-preview"} onClick={() => go("knowledge-hub-preview")} />
                      <NavRow icon={CircleHelp} label="FAQs" nested active={activeView === "home-faqs"} onClick={() => go("home-faqs")} />
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
                            <item.icon className="h-4 w-4 shrink-0" />
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
                              icon={FolderOpen}
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
                              icon={UserRound}
                              label="Who We Are"
                              nested
                              active={activeView === "about-who-we-are"}
                              onClick={() => go("about-who-we-are")}
                            />
                            <NavRow
                              icon={UserRound}
                              label="Chairman"
                              nested
                              active={activeView === "about-chairman"}
                              onClick={() => go("about-chairman")}
                            />
                            <NavRow
                              icon={BookOpen}
                              label="Board of Directors"
                              nested
                              active={activeView === "about-board"}
                              onClick={() => go("about-board")}
                            />
                            <NavRow
                              icon={Award}
                              label="Institutional Strengths"
                              nested
                              active={activeView === "about-institutional-strengths"}
                              onClick={() => go("about-institutional-strengths")}
                            />
                            <NavRow
                              icon={Check}
                              label="Core Values"
                              nested
                              active={activeView === "about-core-values"}
                              onClick={() => go("about-core-values")}
                            />
                            <NavRow
                              icon={BookOpen}
                              label="Courses Preview"
                              nested
                              active={activeView === "about-courses-preview"}
                              onClick={() => go("about-courses-preview")}
                            />
                            <NavRow
                              icon={CircleHelp}
                              label="FAQs"
                              nested
                              active={activeView === "about-faqs"}
                              onClick={() => go("about-faqs")}
                            />
                            <NavRow
                              icon={Link2}
                              label="CTA"
                              nested
                              active={activeView === "about-cta"}
                              onClick={() => go("about-cta")}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  if (item.key === "courses") {
                    return (
                      <div key={item.key}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={jumpToCourseSelector}
                            className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                              activeView === "courses" || activeView === "courses-explore" || COURSE_DETAILS.some((course) => course.adminView === activeView)
                                ? "bg-white/10 text-white"
                                : "text-blue-100 hover:bg-white/10 hover:text-white"
                            }`}
                            data-testid="nav-courses-page"
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">Courses</span>
                          </button>
                          <button type="button" onClick={() => setCoursesOpen((current) => !current)} aria-label="Toggle Courses subsections" aria-expanded={coursesOpen} className="rounded-lg p-2 text-blue-300 hover:bg-white/10 hover:text-white" data-testid="button-toggle-courses-subsections">
                            {coursesOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        {coursesOpen ? (
                          <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2">
                            <NavRow icon={FileText} label="All Courses" nested active={activeView === "courses"} onClick={jumpToCourseSelector} />
                            {selectedCourse ? (
                              <>
                                <NavRow icon={FileText} label="Hero" nested active={activeCourseSection === "hero"} onClick={() => jumpToCourseSection("hero")} />
                                <NavRow icon={Check} label="Quick Course Highlights" nested active={activeCourseSection === "highlights"} onClick={() => jumpToCourseSection("highlights")} />
                                <NavRow icon={FileText} label="Faculty Preview" nested active={activeCourseSection === "faculty-preview"} onClick={() => jumpToCourseSection("faculty-preview")} />
                            <NavRow icon={BookOpenCheck} label="Curriculum" nested active={activeCourseSection === "curriculum"} onClick={() => jumpToCourseSection("curriculum")} />
                                <NavRow icon={ImagePlus} label="Gallery Preview" nested active={activeCourseSection === "gallery-preview"} onClick={() => jumpToCourseSection("gallery-preview")} />
                                <NavRow icon={ClipboardList} label="Enrollment Process" nested active={activeCourseSection === "enrollment-process"} onClick={() => jumpToCourseSection("enrollment-process")} />
                                <NavRow icon={MessageSquareQuote} label="Testimonials" nested active={activeCourseSection === "testimonials"} onClick={() => jumpToCourseSection("testimonials")} />
                                <NavRow icon={CircleHelp} label="FAQs" nested active={activeCourseSection === "faqs"} onClick={() => jumpToCourseSection("faqs")} />
                              </>
                            ) : null}
                            <div className="my-2 border-t border-white/10" />
                            <NavRow icon={BookOpen} label="Explore Courses" nested active={activeView === "courses-explore"} onClick={() => go("courses-explore")} />
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  if (item.key === "knowledge-hub-settings") {
                    const knowledgeHubActive =
                      activeView === "knowledge-hub-settings" ||
                      activeView === "article-hub-editor" ||
                      activeView === "video-hub-editor" ||
                      activeView === "study-resources-editor" ||
                      activeView === "exam-updates-editor";
                    return (
                      <div key={item.key}>
                        <button
                          type="button"
                          onClick={() =>
                            setKnowledgeHubOpen((current) => !current)
                          }
                          aria-expanded={knowledgeHubOpen}
                          aria-controls="nav-knowledge-hub-subsections"
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                            knowledgeHubActive
                              ? "bg-white/10 text-white"
                              : "text-blue-100 hover:bg-white/10 hover:text-white"
                          }`}
                          data-testid="button-toggle-knowledge-hub-subsections"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 flex-1">Knowledge Hub</span>
                          {knowledgeHubOpen ? (
                            <ChevronDown className="h-3.5 w-3.5 text-blue-300" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-blue-300" />
                          )}
                        </button>
                        {knowledgeHubOpen ? (
                          <div
                            id="nav-knowledge-hub-subsections"
                            className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2"
                          >
                            <NavRow
                              icon={BookOpenCheck}
                              label="Main Page"
                              nested
                              active={activeView === "knowledge-hub-settings"}
                              onClick={() => go("knowledge-hub-settings")}
                            />
                            <NavRow
                              icon={FileText}
                              label="Article Hub"
                              nested
                              active={activeView === "article-hub-editor"}
                              onClick={() => go("article-hub-editor")}
                            />
                            <NavRow
                              icon={FileText}
                              label="Video Hub"
                              nested
                              active={activeView === "video-hub-editor"}
                              onClick={() => go("video-hub-editor")}
                            />
                            <NavRow
                              icon={FileText}
                              label="Study Resources"
                              nested
                              active={activeView === "study-resources-editor"}
                              onClick={() => go("study-resources-editor")}
                            />
                            <NavRow
                              icon={CalendarDays}
                              label="Exam Updates"
                              nested
                              active={activeView === "exam-updates-editor"}
                              onClick={() => go("exam-updates-editor")}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <NavRow
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      active={activeView === item.key}
                      onClick={() => go(item.key)}
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
          <button
            type="button"
            onClick={() => setSignOutOpen(true)}
            className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-100 transition hover:bg-white/10 hover:text-white"
            data-testid="button-sign-out"
          >
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
      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent className="border-slate-200 bg-white text-slate-900 sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[#0b3472]">
              Sign out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of the admin workspace?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-sign-out">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-sign-out"
              className="bg-[#e3212b] text-white hover:bg-[#c01d26]"
              onClick={() => {
                void signOut({ redirectUrl: "/" });
              }}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionCard({ children, className = "", testId, "data-testid": dataTestId }: { children: ReactNode; className?: string; testId?: string; "data-testid"?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7 ${className}`} data-testid={testId || dataTestId}>{children}</section>;
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
      socialLinks: {
        instagram: home.settings.socialLinks?.instagram || "",
        facebook: home.settings.socialLinks?.facebook || "",
        youtube: home.settings.socialLinks?.youtube || "",
        linkedin: home.settings.socialLinks?.linkedin || "",
        tiktok: home.settings.socialLinks?.tiktok || "",
        x: home.settings.socialLinks?.x || "",
      },
      themePreset: home.settings.themePreset || DEFAULT_THEME,
      primaryColor: home.settings.primaryColor,
      accentColor: home.settings.accentColor,
      surfaceColor: home.settings.surfaceColor,
      introEnabled: home.settings.introEnabled,
      introQuote: home.settings.introQuote,
      scrollCtaEnabled: home.settings.scrollCtaEnabled,
      floatingWhatsAppEnabled: home.settings.floatingWhatsAppEnabled,
      cursorSparkleEnabled: home.settings.cursorSparkleEnabled,
    });
  }, [home.settings]);

  const set = <K extends keyof SiteSettingsUpdate>(key: K, value: SiteSettingsUpdate[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setCustomColor = (key: "primaryColor" | "accentColor" | "surfaceColor", value: string) => {
    setForm((current) => ({ ...current, [key]: value, themePreset: "custom" }));
  };
  const choosePreset = (preset: PresetKey) => {
    const palette = THEME_PRESETS[preset];
    setForm((current) => ({
      ...current,
      themePreset: preset,
      primaryColor: palette.primary,
      accentColor: palette.accent,
      surfaceColor: palette.surface,
    }));
  };
  const setSocial = (key: keyof NonNullable<SiteSettingsUpdate["socialLinks"]>, value: string) => {
    setForm((current) => ({
      ...current,
      socialLinks: { ...current.socialLinks, [key]: value },
    }));
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!form.collegeName?.trim()) {
      onFlash({ tone: "error", message: "College name is required." });
      return;
    }
    if (![form.primaryColor, form.accentColor, form.surfaceColor].every((color) => typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color))) {
      onFlash({ tone: "error", message: "Use a valid six-digit hex value for every palette color." });
      return;
    }
    if (form.introEnabled && !form.introQuote?.trim()) {
      onFlash({ tone: "error", message: "Add a quotation or turn off the welcome intro." });
      return;
    }
    for (const [platform, rawUrl] of Object.entries(form.socialLinks || {})) {
      const value = typeof rawUrl === "string" ? rawUrl.trim() : "";
      if (!isValidSocialProfileUrl(platform, value)) {
        onFlash({
          tone: "error",
          message: `Enter a valid HTTPS ${platform} profile URL, or leave it blank.`,
        });
        return;
      }
    }
    updateSettings.mutate({ data: { ...form, collegeName: form.collegeName.trim(), headerTagline: form.headerTagline?.trim(), footerNote: form.footerNote?.trim(), introQuote: form.introQuote?.trim(), socialLinks: Object.fromEntries(Object.entries(form.socialLinks || {}).map(([key, value]) => [key, typeof value === "string" ? value.trim() : ""])) as NonNullable<SiteSettingsUpdate["socialLinks"]> } }, {
      onSuccess: () => {
        void Promise.all([
          client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }),
          client.invalidateQueries({ queryKey: getGetHomePageQueryKey() }),
          ...(["about", "faculty", "gallery", "courses", "contact"] as const).map((slug) =>
            client.invalidateQueries({ queryKey: getGetCmsPageQueryKey(slug) }),
          ),
        ]);
        onFlash({ tone: "success", message: "Site identity saved." });
      },
      onError: (error) => onFlash({ tone: "error", message: errorMessage(error) }),
    });
  };
  const upload = async () => {
    if (!selectedFile) return;
    const supported = ["image/png", "image/jpeg", "image/webp"];
    if (!supported.includes(selectedFile.type)) { onFlash({ tone: "error", message: "Logo must be a PNG, JPEG, or WebP file." }); return; }
    if (selectedFile.size > 10 * 1024 * 1024) { onFlash({ tone: "error", message: "Logo files must be 10 MB or smaller." }); return; }
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
  const socialFields: Array<{ key: keyof NonNullable<SiteSettingsUpdate["socialLinks"]>; label: string }> = [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "youtube", label: "YouTube" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "tiktok", label: "TikTok" },
    { key: "x", label: "X" },
  ];
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <PageIntro eyebrow="Site settings / identity" title="Make the college unmistakable." description="These details appear in the header, footer, and browser-facing palette across the public site." />
      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <SectionCard>
            <div><p className="eyebrow text-[#e3212b]">Public details</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">College identity</h2></div>
            <div className="mt-6 space-y-5">
              <Field label="College name" value={form.collegeName || ""} onChange={(value) => set("collegeName", value)} placeholder="Displayed in the public header" testId="input-college-name" />
              <Field label="Header tagline" value={form.headerTagline || ""} onChange={(value) => set("headerTagline", value)} placeholder="A short line beneath the college name" testId="input-header-tagline" />
              <Field label="Footer note" value={form.footerNote || ""} onChange={(value) => set("footerNote", value)} placeholder="Displayed in the public footer" multiline testId="input-footer-note" />
            </div>
          </SectionCard>
          <SectionCard data-testid="section-footer-settings">
            <div><p className="eyebrow text-[#e3212b]">Footer settings</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Social profiles</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Add official HTTPS profile links to display their logos in the public footer. Leave a field blank to hide that profile.</p></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">{socialFields.map(({ key, label }) => (<Field key={key} label={`${label} profile URL`} value={form.socialLinks?.[key] || ""} onChange={(value) => setSocial(key, value)} placeholder={`Paste official ${label} profile URL`} type="url" testId={`input-social-${key}`} />))}</div>
          </SectionCard>
          <SectionCard data-testid="section-brand-palette">
            <div>
              <p className="eyebrow text-[#e3212b]">Brand palette</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Choose a site palette</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Choose a starting point, then adjust individual colors below. Changes stay in this form until you save.</p>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label="Theme presets" data-testid="theme-preset-picker">
              {(Object.entries(THEME_PRESETS) as Array<[PresetKey, (typeof THEME_PRESETS)[PresetKey]]>).map(([key, palette]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => choosePreset(key)}
                  aria-pressed={form.themePreset === key}
                  aria-label={`Use ${palette.label} theme`}
                  className={`focus-ring min-h-[86px] rounded-xl border p-3 text-left transition ${
                    form.themePreset === key
                      ? "border-[#0b3472] bg-[#0b3472]/[.04] shadow-sm"
                      : "border-slate-200 bg-white hover:border-[#0b3472]/35"
                  }`}
                  data-testid={`button-theme-preset-${key}`}
                >
                  <span className="flex items-center gap-1.5" aria-hidden="true">
                    {[palette.primary, palette.accent, palette.surface].map((color) => (
                      <span key={color} className="h-5 flex-1 rounded-md border border-black/10" style={{ backgroundColor: color }} />
                    ))}
                  </span>
                  <span className="mt-2 flex items-center gap-2 text-xs font-extrabold text-slate-800">
                    {palette.label}
                    {key === DEFAULT_THEME ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                        Primary
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">{palette.note}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => set("themePreset", "custom")}
                aria-pressed={form.themePreset === "custom"}
                aria-label="Use custom theme colors"
                className={`focus-ring min-h-[86px] rounded-xl border p-3 text-left transition ${
                  form.themePreset === "custom"
                    ? "border-[#0b3472] bg-[#0b3472]/[.04] shadow-sm"
                    : "border-slate-200 bg-white hover:border-[#0b3472]/35"
                }`}
                data-testid="button-theme-preset-custom"
              >
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  {[form.primaryColor || "#0B3472", form.accentColor || "#E3212B", form.surfaceColor || "#F7F5EF"].map((color) => (
                    <span key={color} className="h-5 flex-1 rounded-md border border-black/10" style={{ backgroundColor: color }} />
                  ))}
                </span>
                <span className="mt-2 block text-xs font-extrabold text-slate-800">Custom colors</span>
                <span className="mt-0.5 block text-[10px] text-slate-500">Use your own three-color palette</span>
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ColorField label="Primary color" value={form.primaryColor || THEME_PRESETS[DEFAULT_THEME].primary} onChange={(value) => setCustomColor("primaryColor", value)} testId="input-primary-color" />
              <ColorField label="Accent color" value={form.accentColor || THEME_PRESETS[DEFAULT_THEME].accent} onChange={(value) => setCustomColor("accentColor", value)} testId="input-accent-color" />
              <ColorField label="Surface color" value={form.surfaceColor || THEME_PRESETS[DEFAULT_THEME].surface} onChange={(value) => setCustomColor("surfaceColor", value)} testId="input-surface-color" />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Primary sets brand emphasis, accent sets calls to action, and surface colors page backgrounds. Use six-digit hex values.</p>
          </SectionCard>
          <SectionCard data-testid="section-public-experience">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-[#e3212b]" aria-hidden="true" />
              <div>
                <p className="eyebrow text-[#e3212b]">Visitor experience</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Welcome & quick actions</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage the first-visit intro and the contact actions visitors see as they browse.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.95fr]">
              <div className="space-y-3">
                <IdentityToggle
                  label="Show intro on first public visit"
                  description="Uses the college logo and selected theme. It stays visible for at least six seconds and appears once per browser tab."
                  checked={form.introEnabled === true}
                  onChange={(checked) => set("introEnabled", checked)}
                  testId="switch-intro-enabled"
                />
                <label className="block text-sm font-bold text-slate-700">
                  Intro quotation
                  <span className="ml-2 text-xs font-normal text-slate-500">One line · up to 80 characters</span>
                  <input
                    value={form.introQuote || ""}
                    onChange={(event) => set("introQuote", event.target.value)}
                    maxLength={80}
                    placeholder="Education is Key to Success"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0b3472] focus:ring-2 focus:ring-[#0b3472]/10"
                    data-testid="input-intro-quote"
                  />
                </label>
                <IdentityToggle
                  label="Show the scroll action bar"
                  description="Appears after visitors scroll down. Call and WhatsApp use the numbers saved in Contact; Apply Now opens the admissions enquiry form."
                  checked={form.scrollCtaEnabled === true}
                  onChange={(checked) => set("scrollCtaEnabled", checked)}
                  testId="switch-scroll-cta-enabled"
                />
                <IdentityToggle
                  label="Show the floating WhatsApp button"
                  description="Keeps a WhatsApp shortcut in the lower-right corner of public pages."
                  checked={form.floatingWhatsAppEnabled === true}
                  onChange={(checked) => set("floatingWhatsAppEnabled", checked)}
                  testId="switch-floating-whatsapp-enabled"
                />
                <IdentityToggle
                  label="Enable cursor sparkle trail"
                  description="A restrained, theme-colored sparkle trail follows mouse and pen movement. It stays off when reduced motion is preferred."
                  checked={form.cursorSparkleEnabled === true}
                  onChange={(checked) => set("cursorSparkleEnabled", checked)}
                  testId="switch-cursor-sparkle-enabled"
                  checkbox
                />
              </div>
              <div>
                <p className="eyebrow text-slate-500">Live intro preview</p>
                <div
                  className="mt-2 flex min-h-[290px] flex-col items-center justify-center rounded-2xl border border-slate-200 p-6 text-center"
                  style={
                    {
                      ...themeVariables(
                        form.primaryColor || THEME_PRESETS[DEFAULT_THEME].primary,
                        form.accentColor || THEME_PRESETS[DEFAULT_THEME].accent,
                        form.surfaceColor || THEME_PRESETS[DEFAULT_THEME].surface,
                      ),
                      backgroundColor: form.surfaceColor || THEME_PRESETS[DEFAULT_THEME].surface,
                    } as React.CSSProperties
                  }
                  data-testid="preview-intro-screen"
                >
                  <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white p-3 shadow-lg">
                    <img src={logoPreview} alt="" className="max-h-full max-w-full object-contain" />
                  </span>
                  <span className="mt-5 max-w-full font-display text-xl font-extrabold leading-tight tracking-tight text-[var(--college-primary)] sm:text-2xl">
                    {form.introQuote?.trim() || "Education is Key to Success"}
                  </span>
                  <span className="mt-4 h-[3px] w-32 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--college-accent)_24%,transparent)]">
                    <span className="block h-full w-1/3 rounded-full bg-[var(--college-accent)]" />
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">Preview updates with your unsaved logo, quote, and palette.</p>
              </div>
            </div>
          </SectionCard>
        </div>
        <div className="space-y-6">
          <SectionCard>
            <div><p className="eyebrow text-[#e3212b]">Header mark</p><h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">College logo</h2></div>
            <div className="mt-6 flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#f7f9fc] p-6"><img src={logoPreview} alt="College logo preview" className="max-h-32 max-w-full object-contain" data-testid="img-logo-preview" /></div>
            <div className="mt-4 rounded-2xl border border-slate-200 p-4"><label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#0b3472]"><ImagePlus className="h-5 w-5" /><span>{selectedFile ? selectedFile.name : "Choose a new logo"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} data-testid="input-logo-file" /></label><p className="mt-2 text-xs leading-5 text-slate-500">PNG, JPEG, or WebP. Maximum 10 MB.</p>{selectedFile ? <Button onClick={() => void upload()} disabled={uploading} testId="button-upload-logo" variant="outline"><Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload logo"}</Button> : null}</div>
          </SectionCard>
          <SectionCard className="sticky top-[100px]">
            <div className="flex items-start gap-3"><Palette className="mt-0.5 h-5 w-5 text-[#e3212b]" /><div><p className="eyebrow text-[#e3212b]">Save changes</p><h2 className="mt-1 font-display text-xl font-extrabold text-[#0b3472]">Ready to publish?</h2><p className="mt-2 text-sm leading-6 text-slate-500">The selected palette is only a draft until you save. Saving updates the shared settings used across public pages and the staff workspace.</p></div></div>
            <Button type="submit" onClick={() => undefined} disabled={updateSettings.isPending || uploading} testId="button-save-identity" variant="primary"><Save className="h-4 w-4" />{updateSettings.isPending ? "Saving…" : "Save identity"}</Button>
          </SectionCard>
        </div>
      </form>
    </div>
  );
}

function ColorField({ label, value, onChange, testId }: { label: string; value: string; onChange: (value: string) => void; testId: string }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2"><input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#0B3472"} onChange={(event) => onChange(event.target.value.toUpperCase())} className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent" data-testid={testId} /><input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent px-1 text-sm font-bold text-slate-700 outline-none" aria-label={`${label} hex value`} data-testid={`${testId}-hex`} /></div></label>;
}

function IdentityToggle({
  label,
  description,
  checked,
  onChange,
  testId,
  checkbox = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId: string;
  checkbox?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-slate-800">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {checkbox ? (
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#0b3472]"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={label}
          data-testid={testId}
        />
      ) : (
        <Switch
          className="mt-0.5 shrink-0"
          checked={checked}
          onCheckedChange={onChange}
          aria-label={label}
          data-testid={testId}
        />
      )}
    </div>
  );
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
  const [activeView, setActiveView] = useState<WorkspaceView>("dashboard");
  const [flash, setFlash] = useState<Flash>(null);
  const flashTimeout = useRef<number | undefined>(undefined);
  const home = admin.data;
  const showFlash = (message: Flash) => {
    window.clearTimeout(flashTimeout.current);
    setFlash(message);
    if (message) {
      flashTimeout.current = window.setTimeout(
        () => setFlash(null),
        message.action
          ? 10_000
          : message.tone === "success"
            ? 3_000
            : 4_500,
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

  if (admin.isLoading) return <AdminLoading />;
  if (admin.isError || !home) return <AccessDenied userId={user?.id} error={admin.error} />;
  let body: ReactNode;
  if (activeView === "dashboard") {
    body = (
      <AdminEnquiriesDashboard onFlash={showFlash} />
    );
  } else if (activeView === "overview") {
    body = (
      <AdminOverview
        collegeName={home.settings.collegeName}
        logoUrl={home.settings.logoUrl}
        onNavigate={(view) => setActiveView(view)}
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
            {
              key: "about-courses-preview" as const,
              number: "07",
              title: "Courses Preview",
              description:
                "Edit the About introduction and visibility. Course records stay connected to Courses settings.",
              action: "Edit Courses Preview",
            },
            {
              key: "about-faqs" as const,
              number: "08",
              title: "FAQs",
              description:
                "Edit the About FAQ section text and open the shared FAQ manager to choose About questions.",
              action: "Edit About FAQ settings",
            },
            {
              key: "about-cta" as const,
              number: "09",
              title: "Final CTA",
              description:
                "Edit the distinct call to action that appears after the About FAQs.",
              action: "Edit final CTA",
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
  } else if (activeView === "about-faqs") {
    body = (
      <AdminFaqTextSettingsEditor
        pageSlug="about"
        onFlash={showFlash}
        onOpenManager={() => setActiveView("faqs")}
      />
    );
  } else if (activeView === "about-cta") {
    body = <AdminAboutCtaEditor onFlash={showFlash} />;
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
  } else if (activeView === "about-courses-preview") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / About / Courses Preview"
          title="Manage the Courses Preview."
          description="Edit the About section text and visibility. Course cards and course details remain managed in Courses settings."
          actions={
            <button
              type="button"
              onClick={() => setActiveView("about")}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:border-[#0b3472]/30"
              data-testid="button-back-about-courses-preview"
            >
              All About subsections
            </button>
          }
        />
        <AdminAboutCoursesPreviewEditor
          onFlash={showFlash}
          onNavigate={() => setActiveView("courses-explore")}
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
    activeView === "home-faqs"
  ) {
    body = (
      <AdminFaqTextSettingsEditor
        pageSlug="home"
        onFlash={showFlash}
        onOpenManager={() => setActiveView("faqs")}
      />
    );
  } else if (
    activeView === "hero" ||
    activeView === "programs" ||
    activeView === "statistics" ||
    activeView === "faculty-preview" ||
    activeView === "gallery-preview" ||
    activeView === "testimonials" ||
    activeView === "knowledge-hub-preview"
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
                : activeView === "knowledge-hub-preview"
                  ? "Knowledge Hub Preview"
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
  } else if (activeView === "faqs") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / FAQs"
          title="Manage shared questions and answers."
          description="Write clear answers once, then choose where each one appears, including Home, About, Contact, Courses, or an individual course page."
        />
        <AdminFaqEditor home={home} onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "contact") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Contact"
          title="Manage Contact page content."
          description="Edit the introduction, enquiry form, and Contact FAQ heading. FAQ answers stay in the shared FAQ manager."
        />
        <AdminContactEditor
          onFlash={showFlash}
          onNavigate={() => setActiveView("faqs")}
        />
      </div>
    );
  } else if (activeView === "knowledge-hub-settings") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Knowledge Hub"
          title="Manage the Knowledge Hub page."
          description="Edit the public page introduction and the summaries for its four fixed sections."
          actions={
            <button
              type="button"
              onClick={() => setActiveView("knowledge-hub-preview")}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:border-[#0b3472]/30"
              data-testid="button-back-knowledge-hub-preview"
            >
              Back to Knowledge Hub Preview
            </button>
          }
        />
        <AdminKnowledgeHubPageEditor onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "article-hub-editor") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Knowledge Hub / Article Hub"
          title="Manage Article Hub content."
          description="Edit the page introduction and hero, organize categories, and publish or update articles."
        />
        <AdminArticleHubEditor onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "video-hub-editor") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Knowledge Hub / Video Hub"
          title="Manage Video Hub content."
          description="Edit the page introduction and hero, organize categories, and add or update YouTube videos."
        />
        <AdminVideoHubEditor onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "study-resources-editor") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Knowledge Hub / Study Resources"
          title="Manage Study Resources content."
          description="Edit the page introduction, organize resource categories, and upload or publish PDF study documents."
        />
        <AdminStudyResourcesEditor onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "exam-updates-editor") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Knowledge Hub / Exam Updates"
          title="Manage exam notices and key dates."
          description="Edit the page introduction, link official sources, and publish examination notices and calendar entries."
        />
        <AdminExamUpdatesEditor onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "knowledge-hub-mega-menu") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Site settings / Mega Menus"
          title="Manage the Knowledge Hub Mega Menu."
          description="Edit the menu introduction and the four fixed resource destinations."
        />
        <AdminKnowledgeHubMenuEditor onFlash={showFlash} />
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
  } else if (activeView === "courses-mega-menu") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Site settings / Mega Menus"
          title="Manage the Courses Mega Menu."
          description="Edit the public header menu, pathway cards, links, benefits, and brand panel."
        />
        <AdminCoursesEditor onFlash={showFlash} />
      </div>
    );
  } else if (activeView === "courses") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Courses"
          title="Courses page"
          description="The public Courses page remains separate from the header mega menu."
        />
        <SectionCard className="max-w-3xl">
          <h2 className="font-display text-xl font-extrabold text-[#0b3472]">Courses page tools</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage the public page hero, Regular Pathways settings, and the shared course records from the Explore Courses editor.
          </p>
            <button
              type="button"
              onClick={() => setActiveView("courses-explore")}
              className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white"
              data-testid="button-admin-open-explore-courses"
            >
              Open Explore Courses
              <ChevronRight className="h-4 w-4" />
            </button>
          <Link
            href="/courses"
            target="_blank"
            rel="noreferrer"
              className="focus-ring ml-2 mt-5 inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/20 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472]"
            data-testid="link-admin-preview-courses-page"
          >
            Preview public Courses page
            <ExternalLink className="h-4 w-4" />
          </Link>
        </SectionCard>
      </div>
    );
  } else if (activeView === "courses-explore") {
    body = (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Courses / Explore Courses"
          title="Edit Explore Courses."
          description="Shape the public Courses page and maintain the shared course records used by the header mega menu."
        />
        <AdminCoursesPageEditor onFlash={showFlash} />
      </div>
    );
  } else if (COURSE_DETAILS.some((course) => course.adminView === activeView)) {
    const course = COURSE_DETAILS.find((item) => item.adminView === activeView);
    body = course ? (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <PageIntro
          eyebrow="Pages / Courses / Course pathways"
          title="Keep every pathway accurate."
          description="Choose a course at the top of the editor, then use the sidebar to jump between that course’s sections."
        />
        <AdminCourseDetailEditor
          course={course}
          onCourseChange={(nextCourse) => setActiveView(nextCourse.adminView)}
          onNavigate={(view) => setActiveView(view)}
          onFlash={showFlash}
        />
      </div>
    ) : null;
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
        <div
          className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] flex justify-end sm:inset-x-8"
          data-testid="container-admin-toast"
        >
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