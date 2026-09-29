import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  RefreshCw,
  X,
} from "lucide-react";
import { useGetCmsPage, getGetCmsPageQueryKey } from "@workspace/api-client-react";
import type { CmsPage, ContentItem, ContentSection } from "@workspace/api-client-react";
import { Footer, Header } from "./public-home";

type RecordValue = Record<string, unknown>;
type SocialLinks = {
  linkedin: string;
  facebook: string;
  instagram: string;
  website: string;
};

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function assetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)
    ? `${basePath}${path}`
    : path;
}

function socialLinks(item: ContentItem): SocialLinks {
  const links = record(item.content.socialLinks);
  return {
    linkedin: text(links.linkedin),
    facebook: text(links.facebook),
    instagram: text(links.instagram),
    website: text(links.website),
  };
}

function profileData(item: ContentItem) {
  const content = record(item.content);
  const subjects = Array.isArray(content.subjectsTaught)
    ? content.subjectsTaught.filter((subject): subject is string => typeof subject === "string")
    : [];
  return {
    professionalTitle: text(content.professionalTitle, "Faculty member"),
    shortDescription: text(content.shortDescription, item.description || ""),
    qualifications: text(content.qualifications, "Qualifications available on request"),
    subjectsTaught: subjects,
    experience: text(content.experience),
    biography: text(content.biography, item.description || ""),
    socialLinks: socialLinks(item),
  };
}

function LoadingState() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f5ef]" data-testid="status-faculty-loading">
      <div className="mx-auto h-[76px] max-w-7xl animate-pulse border-b border-[#0b3472]/10 bg-[#f7f5ef]" />
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="h-4 w-36 animate-pulse rounded bg-[#efd2ca]" />
        <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-2xl bg-[#dce5f1]" />
        <div className="mt-5 h-5 max-w-xl animate-pulse rounded bg-[#e4e0d8]" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="overflow-hidden rounded-[1.5rem] bg-white">
              <div className="aspect-[4/4.6] animate-pulse bg-[#dce5f1]" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-[#e4e0d8]" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-[#efd2ca]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f5ef] p-6" data-testid="status-faculty-error">
      <div className="max-w-md rounded-[2rem] border border-[#0b3472]/10 bg-white p-9 text-center shadow-[0_18px_45px_rgba(11,52,114,.08)]">
        <p className="eyebrow text-[#e3212b]">Connection issue</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#0b3472]">
          Faculty details could not load.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Please try again. Published faculty profiles will appear when the connection returns.
        </p>
        <button
          type="button"
          onClick={retry}
          className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white"
          data-testid="button-retry-faculty"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    </div>
  );
}

function SocialLinks({ links, compact = false }: { links: SocialLinks; compact?: boolean }) {
  const entries = [
    { key: "linkedin", label: "LinkedIn", icon: Linkedin },
    { key: "facebook", label: "Facebook", icon: Facebook },
    { key: "instagram", label: "Instagram", icon: Instagram },
    { key: "website", label: "Website", icon: Globe },
  ] as const;
  const visible = entries.filter((entry) => links[entry.key].trim());
  if (!visible.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-3" : "mt-6"}`} aria-label="Professional links">
      {visible.map(({ key, label, icon: Icon }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472] transition hover:border-[#e3212b] hover:text-[#e3212b]"
          data-testid={`link-faculty-social-${key}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
        </a>
      ))}
    </div>
  );
}

function ProfileModal({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const profile = profileData(item);

  useEffect(() => {
    lastFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[role="dialog"] button, [role="dialog"] a, [role="dialog"] input, [role="dialog"] textarea, [role="dialog"] select, [role="dialog"] [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => !element.hasAttribute("disabled"));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      lastFocused.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1b35]/65 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="modal-faculty-profile"
    >
      <div
        className="relative grid max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] bg-[#fbfaf6] shadow-[0_24px_80px_rgba(11,52,114,.25)] sm:grid-cols-[.8fr_1.2fr] sm:rounded-[2rem]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`faculty-profile-title-${item.id}`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="focus-ring absolute right-4 top-4 z-10 rounded-full bg-[#f7f5ef] p-3 text-[#0b3472] shadow-sm transition hover:bg-[#e8eef7]"
          aria-label="Close faculty profile"
          data-testid="button-close-faculty-profile"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="relative flex min-h-[270px] items-end overflow-hidden bg-[#e7edf5] sm:min-h-[560px]">
          {item.imageUrl ? (
            <img src={assetUrl(item.imageUrl)} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b3472]/75 via-transparent to-transparent" />
          <div className="relative p-6 text-white sm:p-9">
            <p className="eyebrow text-[#f3b9a7]">Faculty profile</p>
            <p className="mt-2 text-sm font-semibold text-white/80">{profile.professionalTitle}</p>
          </div>
        </div>
        <div className="overflow-y-auto p-6 sm:p-10">
          <h2 id={`faculty-profile-title-${item.id}`} className="max-w-lg font-display text-4xl font-extrabold leading-[.98] tracking-[-.04em] text-[#0b3472] sm:text-5xl">
            {item.title}
          </h2>
          <div className="mt-7 grid gap-4 rounded-2xl border border-[#0b3472]/10 bg-white p-5 sm:grid-cols-2">
            <div>
              <p className="eyebrow text-slate-400">Qualifications</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#15243d]">{profile.qualifications}</p>
            </div>
            <div>
              <p className="eyebrow text-slate-400">Experience</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#15243d]">{profile.experience || "Details available from the college office"}</p>
            </div>
            {profile.subjectsTaught.length ? (
              <div className="sm:col-span-2">
                <p className="eyebrow text-slate-400">Subjects taught</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.subjectsTaught.map((subject) => (
                    <span key={subject} className="rounded-full bg-[#eaf1fb] px-3 py-1.5 text-xs font-bold text-[#0b3472]">{subject}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-8">
            <p className="eyebrow text-[#e3212b]">Biography</p>
            <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-600">{profile.biography || profile.shortDescription}</p>
          </div>
          <SocialLinks links={profile.socialLinks} />
        </div>
      </div>
    </div>
  );
}

function FacultyContent({ page }: { page: CmsPage }) {
  const section = page.sections.find((candidate) => candidate.sectionKey === "faculty" && candidate.isVisible);
  const items = useMemo(
    () =>
      page.items
        .filter((item) => item.sectionId === section?.id && item.itemType === "faculty-profile" && item.isVisible)
        .sort((a, b) => a.position - b.position),
    [page.items, section?.id],
  );
  const content = record(section?.content);
  const eyebrow = text(content.eyebrow, "The people behind the progress");
  const title = text(content.headline, section?.title || "Meet the faculty");
  const description = text(content.description, section?.subtitle || "Experienced teachers, mentors, and subject specialists who make every classroom count.");
  const [selected, setSelected] = useState<ContentItem | null>(null);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[40px] border-[#0b3472]/[.06]" />
        <div className="pointer-events-none absolute bottom-0 left-[8%] h-28 w-28 rounded-full bg-[#e5b08e]/25 blur-2xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(3rem,7vw,6.8rem)] font-extrabold leading-[.94] tracking-[-.065em] text-[#0b3472]" data-testid="text-faculty-title">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">{description}</p>
          <div className="mt-8 flex items-center gap-3 text-sm font-bold text-[#0b3472]">
            <span className="h-2 w-2 rounded-full bg-[#e3212b]" aria-hidden="true" />
            {items.length} {items.length === 1 ? "faculty profile" : "faculty profiles"}
          </div>
        </div>
      </section>
      <main className="site-grid bg-[#fbfaf6] px-5 py-10 sm:px-8 sm:py-14" data-testid="faculty-content">
        <div className="mx-auto max-w-7xl">
          {items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="grid-faculty">
              {items.map((item) => {
                const profile = profileData(item);
                return (
                  <article key={item.id} className="group overflow-hidden rounded-[1.5rem] border border-[#0b3472]/10 bg-white shadow-[0_12px_30px_rgba(11,52,114,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(11,52,114,.12)]" data-testid={`card-faculty-${item.id}`}>
                    <button type="button" className="focus-ring block w-full text-left" onClick={() => setSelected(item)} data-testid={`button-open-faculty-${item.id}`}>
                      <div className="relative aspect-[4/4.6] overflow-hidden bg-[#e7edf5]">
                        {item.imageUrl ? <img src={assetUrl(item.imageUrl)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-5xl font-display font-extrabold text-[#0b3472]/25">{item.title.charAt(0)}</div>}
                        <span className="absolute left-4 top-4 rounded-full bg-[#f7f5ef]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#0b3472]">{profile.professionalTitle}</span>
                      </div>
                      <div className="p-5">
                        <h2 className="font-display text-2xl font-extrabold leading-tight text-[#0b3472]">{item.title}</h2>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{profile.shortDescription}</p>
                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#e3212b]">View profile <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[#0b3472]/20 bg-white px-6 py-16 text-center" data-testid="empty-faculty">
              <h2 className="font-display text-3xl font-extrabold text-[#0b3472]">Our faculty profiles are being prepared.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Please check back soon for the teachers and mentors who guide Shastra students.</p>
            </div>
          )}
        </div>
      </main>
      {selected ? <ProfileModal item={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

export default function FacultyPage() {
  const query = useGetCmsPage("faculty", { query: { queryKey: getGetCmsPageQueryKey("faculty") } });
  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState retry={() => query.refetch()} />;
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#f7f5ef]" data-college-theme style={{ "--college-primary": query.data.settings.primaryColor, "--college-accent": query.data.settings.accentColor } as Record<string, string>}>
      <Header home={query.data} />
      <FacultyContent page={query.data} />
      <Footer home={query.data} />
    </div>
  );
}