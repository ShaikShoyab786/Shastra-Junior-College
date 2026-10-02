import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  CircleHelp,
  FileText,
  GraduationCap,
  ImagePlus,
  LayoutGrid,
  MessageSquareQuote,
  Phone,
  Settings2,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";

type OverviewDestination =
  | "identity"
  | "article-hub-editor"
  | "video-hub-editor"
  | "study-resources-editor"
  | "exam-updates-editor"
  | "courses"
  | "gallery"
  | "faculty"
  | "faqs"
  | "contact"
  | "testimonials";

type AdminOverviewProps = {
  collegeName?: string | null;
  logoUrl?: string | null;
  onNavigate: (view: OverviewDestination) => void;
};

type Shortcut = {
  title: string;
  description: string;
  icon: LucideIcon;
  destination: OverviewDestination;
  testId: string;
};

const knowledgeHubShortcuts: Shortcut[] = [
  {
    title: "Articles",
    description: "Manage Article Hub posts",
    icon: FileText,
    destination: "article-hub-editor",
    testId: "button-overview-articles",
  },
  {
    title: "Video Hub",
    description: "Add and update videos",
    icon: Video,
    destination: "video-hub-editor",
    testId: "button-overview-video-hub",
  },
  {
    title: "Study Resources",
    description: "Manage learning materials",
    icon: BookOpenCheck,
    destination: "study-resources-editor",
    testId: "button-overview-study-resources",
  },
  {
    title: "Exam Updates",
    description: "Manage notices and dates",
    icon: CalendarDays,
    destination: "exam-updates-editor",
    testId: "button-overview-exam-updates",
  },
];

const websiteContentShortcuts: Shortcut[] = [
  {
    title: "Gallery",
    description: "Manage campus photos",
    icon: ImagePlus,
    destination: "gallery",
    testId: "button-overview-gallery",
  },
  {
    title: "Faculty",
    description: "Manage faculty profiles",
    icon: UserRound,
    destination: "faculty",
    testId: "button-overview-faculty",
  },
  {
    title: "FAQs",
    description: "Manage shared questions",
    icon: CircleHelp,
    destination: "faqs",
    testId: "button-overview-faqs",
  },
  {
    title: "Contact",
    description: "Manage contact page content",
    icon: Phone,
    destination: "contact",
    testId: "button-overview-contact",
  },
  {
    title: "Testimonials",
    description: "Manage homepage testimonials",
    icon: MessageSquareQuote,
    destination: "testimonials",
    testId: "button-overview-testimonials",
  },
];

function ShortcutButton({
  shortcut,
  onNavigate,
}: {
  shortcut: Shortcut;
  onNavigate: (view: OverviewDestination) => void;
}) {
  const Icon = shortcut.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate(shortcut.destination)}
      className="focus-ring group flex min-h-[76px] w-full items-center gap-3 rounded-2xl border border-[#0b3472]/20 bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#0b3472]/45 hover:shadow-[0_10px_24px_rgba(11,52,114,.08)] sm:p-4"
      data-testid={shortcut.testId}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b3472]/[.07] text-[#0b3472] transition group-hover:bg-[#0b3472] group-hover:text-white">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-slate-800">
          {shortcut.title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {shortcut.description}
        </span>
      </span>
      <ArrowUpRight
        className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-[#0b3472]"
        aria-hidden="true"
      />
    </button>
  );
}

function ShortcutGroup({
  title,
  description,
  shortcuts,
  onNavigate,
  testId,
  className = "",
}: {
  title: string;
  description: string;
  shortcuts: Shortcut[];
  onNavigate: (view: OverviewDestination) => void;
  testId: string;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-[#0b3472]/20 bg-white p-4 shadow-[0_10px_30px_rgba(11,52,114,.04)] sm:p-5 ${className}`}
      data-testid={testId}
    >
      <div className="mb-4">
        <h3 className="font-display text-lg font-extrabold text-[#0b3472]">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {shortcuts.map((shortcut) => (
          <ShortcutButton
            key={shortcut.destination}
            shortcut={shortcut}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}

export default function AdminOverview({
  collegeName,
  logoUrl,
  onNavigate,
}: AdminOverviewProps) {
  const resolvedLogoUrl = logoUrl?.startsWith("/objects/")
    ? `/api/storage${logoUrl}`
    : logoUrl;

  return (
    <main
      className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"
      data-testid="admin-overview"
    >
      <header className="mb-7">
        <p className="eyebrow text-[#e3212b]">Staff workspace</p>
        <h1
          className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0b3472] sm:text-4xl"
          data-testid="text-overview-title"
        >
          Website Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Open the editor for the college content you want to update.
        </p>
      </header>

      <button
        type="button"
        onClick={() => onNavigate("identity")}
        className="focus-ring group mb-8 flex w-full flex-col items-start justify-between gap-5 rounded-3xl border border-[#0b3472]/30 bg-white p-5 text-left shadow-[0_10px_30px_rgba(11,52,114,.05)] transition hover:border-[#0b3472]/55 hover:shadow-[0_16px_38px_rgba(11,52,114,.09)] sm:flex-row sm:items-center sm:p-6"
        data-testid="button-overview-site-identity"
      >
        <span className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0b3472]/[.07] p-2 text-[#0b3472]">
            {resolvedLogoUrl ? (
              <img
                src={resolvedLogoUrl}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <Settings2 className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0">
            <span className="eyebrow block text-[#e3212b]">Site identity</span>
            <span className="mt-1 block truncate font-display text-xl font-extrabold text-[#0b3472]">
              {collegeName || "Shastra Junior College"}
            </span>
            <span className="mt-1 block text-sm leading-5 text-slate-500">
              Update the college name, logo, and website appearance.
            </span>
          </span>
        </span>
        <span className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0b3472] px-4 py-3 text-sm font-bold text-white transition group-hover:bg-[#092c60] sm:w-auto">
          Edit Site Identity
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      <section aria-labelledby="overview-quick-actions-title">
        <div className="mb-4">
          <h2
            id="overview-quick-actions-title"
            className="font-display text-2xl font-extrabold text-[#0b3472]"
          >
            Quick Actions
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Go straight to a content editor.
          </p>
        </div>
        <div className="grid items-stretch gap-4 xl:grid-cols-[1.35fr_.8fr]">
          <ShortcutGroup
            title="Knowledge Hub"
            description="Manage articles, videos, study materials, and exam information."
            shortcuts={knowledgeHubShortcuts}
            onNavigate={onNavigate}
            testId="overview-knowledge-hub-shortcuts"
          />
          <ShortcutGroup
            title="Courses"
            description="Keep course information current."
            shortcuts={[
              {
                title: "Courses",
                description: "Manage courses",
                icon: GraduationCap,
                destination: "courses",
                testId: "button-overview-courses",
              },
            ]}
            onNavigate={onNavigate}
            testId="overview-course-shortcuts"
          />
        </div>
      </section>

      <ShortcutGroup
        title="Website Content"
        description="Manage the stories, people, and imagery visitors see."
        shortcuts={websiteContentShortcuts}
        onNavigate={onNavigate}
        testId="overview-website-content-shortcuts"
        className="mt-6"
      />
    </main>
  );
}