import { ArrowRight, BookOpen, CalendarDays, CircleAlert, Clock3, GraduationCap, RefreshCw } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  getGetCmsPageQueryKey,
  getGetCoursesMenuQueryKey,
  getGetHomePageQueryKey,
  useGetCmsPage,
  useGetCoursesMenu,
  useGetHomePage,
} from "@workspace/api-client-react";
import type { ContentItem, ContentSection, CoursesMenuCard } from "@workspace/api-client-react";
import { Footer, Header } from "./public-home";
import FaqSection from "../components/faq-section";

function assetUrl(value: string | null | undefined) {
  if (!value) return "";
  return value.startsWith("/objects/") ? `/api/storage${value}` : value;
}

function textValue(content: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = content[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function itemText(item: ContentItem, key: string, fallback = "") {
  const value = recordValue(item.content)[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function sectionItems(
  items: ContentItem[],
  section: ContentSection | undefined,
  itemType: string,
) {
  if (!section) return [];
  return items
    .filter((item) => item.sectionId === section.id && item.itemType === itemType && item.isVisible)
    .sort((a, b) => a.position - b.position);
}

function displayDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function sectionByKey(sections: ContentSection[] | undefined, key: string) {
  return sections
    ?.filter((section) => section.isVisible)
    .sort((a, b) => a.position - b.position)
    .find((section) => section.sectionKey.toLowerCase() === key);
}

function LoadingCourses() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f5ef] px-5 py-10 sm:px-8" aria-busy="true" data-testid="status-courses-loading">
      <div className="mx-auto max-w-7xl">
        <div className="h-5 w-44 animate-pulse rounded-full bg-[#edcfd0]" />
        <div className="mt-8 h-24 max-w-3xl animate-pulse rounded-2xl bg-[#dce5f1]" />
        <div className="mt-5 h-6 max-w-xl animate-pulse rounded bg-[#e9e1d8]" />
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-[1.5rem] bg-white/70" />)}
        </div>
      </div>
    </div>
  );
}

function CoursesError({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f5ef] p-6" role="alert" data-testid="status-courses-error">
      <div className="max-w-md rounded-[1.75rem] border border-[#e3212b]/20 bg-[#fffaf8] p-8 text-center shadow-[0_20px_60px_rgba(11,52,114,.08)]">
        <CircleAlert className="mx-auto h-8 w-8 text-[#e3212b]" aria-hidden="true" />
        <p className="eyebrow mt-5 text-[#e3212b]">Courses unavailable</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#0b3472]">The pathways could not load.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Please try again. The college course records are kept in the shared Courses menu.</p>
        <button type="button" onClick={retry} className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white" data-testid="button-retry-courses">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    </main>
  );
}

function Hero({ section }: { section?: ContentSection }) {
  const content = (section?.content || {}) as Record<string, unknown>;
  const eyebrow = textValue(content, ["eyebrow"], "COURSES AT SHASTRA");
  const title = section?.title || textValue(content, ["headline", "heroTitle", "title"], "Explore course pathways");
  const description = section?.subtitle || textValue(content, ["description", "introduction", "body"], "Review the current course names, categories, and descriptions below.");
  const primaryLabel = textValue(content, ["ctaLabel", "primaryLabel"], "Explore courses");
  const image = assetUrl(typeof content.imageUrl === "string" ? content.imageUrl : null);
  const imageAlt = textValue(content, ["imageAlt", "alt"], "");
  return (
    <section id="courses-hero" className="relative overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 py-12 sm:px-8 sm:py-16 lg:py-20" data-testid={`section-courses-hero-${section?.id || "default"}`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-[#e3212b]/10" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.06fr_.94fr] lg:gap-16">
        <div className="relative z-10">
          <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
          <h1 className="mt-5 max-w-[11ch] font-display text-[clamp(3.5rem,7.5vw,7.2rem)] font-extrabold leading-[.9] tracking-[-.075em] text-[#0b3472]">{title}</h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-[#53657d] sm:text-lg sm:leading-8">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#regular-pathways" className="focus-ring group inline-flex items-center gap-3 rounded-full bg-[#e3212b] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(227,33,43,.18)] transition-transform hover:-translate-y-0.5" data-testid="link-courses-hero-explore">
              {primaryLabel}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
        <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] border border-[#0b3472]/15 bg-[#e8eef7] p-5 shadow-[0_24px_60px_rgba(11,52,114,.12)] sm:min-h-[360px] sm:p-7">
          {image ? <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className={`absolute inset-0 ${image ? "bg-gradient-to-tr from-[#0b3472]/90 via-[#0b3472]/35 to-transparent" : "bg-[radial-gradient(circle_at_85%_15%,rgba(227,33,43,.22),transparent_28%),linear-gradient(135deg,#0b3472,#17478f)]"}`} aria-hidden="true" />
          <div className="relative flex h-full min-h-[240px] flex-col justify-between text-white sm:min-h-[306px]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><BookOpen className="h-5 w-5" /></span>
              <span className="eyebrow text-[#f6c1bb]">SHASTRA JUNIOR COLLEGE</span>
            </div>
            <div>
              <p className="max-w-[12ch] font-display text-3xl font-extrabold leading-tight sm:text-4xl">Course pathways</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100/80">Explore the current subject and exam options listed below.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function validDestination(destination: string | null | undefined) {
  const value = destination?.trim() || "";
  if (!value || value.startsWith("//")) return false;

  const internalPaths = new Set([
    "/",
    "/about",
    "/contact",
    "/courses/bipc",
    "/courses/integrated",
    "/courses/iit-jee",
    "/courses/mpc",
    "/courses/mpc-eamcet",
    "/courses/neet",
    "/faculty",
    "/gallery",
    "/knowledge-hub",
  ]);

  try {
    const origin = "https://shastra-college.invalid";
    const url = new URL(value, origin);
    if (url.username || url.password || !["http:", "https:"].includes(url.protocol)) return false;
    if (url.origin === origin) {
      const pathname = url.pathname.replace(/\/+$/, "") || "/";
      return internalPaths.has(pathname);
    }
    return /^https?:\/\//i.test(value);
  } catch {
    return false;
  }
}

function PathwayCard({ card, featured }: { card: CoursesMenuCard; featured?: boolean }) {
  const image = assetUrl(card.imageUrl);
  const action = validDestination(card.destination);
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full border border-[#e3212b]/20 bg-[#e3212b]/[.07] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#b71927]">{card.category}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2f8] text-[#0b3472]">{image ? <img src={image} alt={card.imageAlt} className="h-full w-full rounded-full object-cover" /> : <BookOpen className="h-4 w-4" />}</span>
      </div>
      <h3 className={`mt-6 font-display font-extrabold leading-[1.03] text-[#0b3472] ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{card.title}</h3>
      <p className="mt-4 text-sm leading-6 text-[#53657d]">{card.description}</p>
      {action ? <span className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#0b3472]">Explore pathway <ArrowRight className="h-4 w-4" /></span> : null}
    </>
  );
  const className = `group flex min-h-[270px] flex-col rounded-[1.5rem] border p-6 sm:p-7 ${action ? "transition-transform hover:-translate-y-1" : ""} ${featured ? "border-[#e3212b]/25 bg-[#fff6f3] shadow-[0_18px_40px_rgba(227,33,43,.07)]" : `border-[#0b3472]/15 bg-white/55 ${action ? "hover:border-[#0b3472]/35 hover:shadow-[0_18px_40px_rgba(11,52,114,.09)]" : ""}`}`;
  if (!action) return <article className={className} data-testid={`card-course-${card.id}`}>{body}</article>;
  if (card.destination.startsWith("/")) return <Link href={card.destination} className={className} data-testid={`link-course-${card.id}`}>{body}</Link>;
  return <a href={card.destination} target="_blank" rel="noopener noreferrer" className={className} data-testid={`link-course-${card.id}`}>{body}</a>;
}

function Pathways({ section, cards }: { section?: ContentSection; cards: CoursesMenuCard[] }) {
  const content = (section?.content || {}) as Record<string, unknown>;
  const eyebrow = textValue(content, ["eyebrow"], "REGULAR PATHWAYS");
  const title = section?.title || textValue(content, ["headline", "title"], "Explore regular pathways");
  const subtitle = section?.subtitle || textValue(content, ["description", "introduction"], "Compare the course names, categories, and descriptions currently available.");
  return (
    <section id="regular-pathways" className="bg-[#fbfaf6] px-5 py-14 sm:px-8 sm:py-20" data-testid={`section-regular-pathways-${section?.id || "default"}`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 border-b border-[#0b3472]/20 pb-7 md:flex-row md:items-end">
          <div><p className="eyebrow text-[#e3212b]">{eyebrow}</p><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.055em] text-[#0b3472] sm:text-5xl">{title}</h2></div>
          <p className="max-w-sm text-sm leading-6 text-[#53657d]">{subtitle}</p>
        </div>
        {cards.length ? (
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {cards.map((card, index) => <PathwayCard key={card.id} card={card} featured={index === 0} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#0b3472]/20 bg-white/60 px-6 py-14 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[#0b3472]/35" />
            <p className="mt-4 font-display text-xl font-extrabold text-[#0b3472]">No pathways are published yet.</p>
            <p className="mt-2 text-sm text-slate-500">Please check back for current course information.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function BatchSchedule({ section, items }: { section: ContentSection; items: ContentItem[] }) {
  const content = recordValue(section.content);
  const batches = sectionItems(items, section, "course-batch");
  const schedule = sectionItems(items, section, "course-schedule");

  return (
    <section
      id="batch-details-schedule"
      className="scroll-mt-24 bg-[#f7f5ef] px-5 py-14 sm:px-8 sm:py-20"
      data-testid={`section-courses-batch-schedule-${section.id}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-[#e3212b]">{textValue(content, ["eyebrow"], "BATCH DETAILS & SCHEDULE")}</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-.055em] text-[#0b3472] sm:text-5xl">
            {section.title}
          </h2>
          {section.subtitle ? <p className="mt-4 text-base leading-7 text-[#53657d]">{section.subtitle}</p> : null}
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-[#0b3472]/20 bg-white/75 p-5 shadow-[0_18px_50px_rgba(11,52,114,.05)] sm:p-7" aria-labelledby="courses-upcoming-batches-heading">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e3212b]/10 text-[#e3212b]"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h3 id="courses-upcoming-batches-heading" className="font-display text-2xl font-extrabold text-[#0b3472]">{textValue(content, ["batchHeading"], "Upcoming Batches")}</h3>
                <p className="mt-1 text-sm leading-6 text-[#53657d]">{textValue(content, ["batchDescription"], "Find the next preparation batch for your examination goal.")}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {batches.length ? batches.map((batch) => (
                <article key={batch.id} className="rounded-2xl border border-[#0b3472]/15 bg-[#fbfcff] p-4 sm:p-5" data-testid={`card-course-batch-${batch.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h4 className="font-display text-lg font-extrabold text-[#0b3472]">{batch.title}</h4>
                    <span className="rounded-full bg-[#e3212b]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b71927]">{itemText(batch, "status", "Upcoming")}</span>
                  </div>
                  {batch.description ? <p className="mt-2 text-sm leading-6 text-[#53657d]">{batch.description}</p> : null}
                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-[#53657d]"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0b3472]" aria-hidden="true" /><span><span className="block font-semibold text-[#0b3472]">Starts</span>{displayDate(itemText(batch, "startDate"))}</span></div>
                    <div className="flex items-start gap-2 text-[#53657d]"><GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[#0b3472]" aria-hidden="true" /><span><span className="block font-semibold text-[#0b3472]">Target exam</span>{itemText(batch, "targetExam")}</span></div>
                  </div>
                </article>
              )) : <p className="rounded-xl bg-[#f7f5ef] px-4 py-5 text-sm text-[#53657d]">No upcoming batches are listed right now.</p>}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-[#0b3472]/20 bg-white/75 p-5 shadow-[0_18px_50px_rgba(11,52,114,.05)] sm:p-7" aria-labelledby="courses-daily-schedule-heading">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e3212b]/10 text-[#e3212b]"><Clock3 className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h3 id="courses-daily-schedule-heading" className="font-display text-2xl font-extrabold text-[#0b3472]">{textValue(content, ["scheduleHeading"], "Daily Schedule")}</h3>
                <p className="mt-1 text-sm leading-6 text-[#53657d]">{textValue(content, ["scheduleDescription"], "A considered rhythm for core subjects, breaks, and problem-solving.")}</p>
              </div>
            </div>
            <ol className="mt-5 divide-y divide-[#0b3472]/10">
              {schedule.length ? schedule.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 py-4" data-testid={`row-course-schedule-${entry.id}`}>
                  <span className="flex min-w-0 items-center gap-3 font-semibold text-[#0b3472]"><span className="h-2 w-2 shrink-0 rounded-full bg-[#e3212b]" aria-hidden="true" /><span>{entry.title}</span></span>
                  <span className="shrink-0 rounded-full bg-[#eef2f8] px-3 py-2 text-[11px] font-bold text-[#53657d]">{itemText(entry, "startTime")} – {itemText(entry, "endTime")}</span>
                </li>
              )) : <li className="rounded-xl bg-[#f7f5ef] px-4 py-5 text-sm text-[#53657d]">The daily schedule is being updated.</li>}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}

function AdmissionsCta({ section }: { section: ContentSection }) {
  const content = recordValue(section.content);
  const benefits = Array.isArray(content.benefits)
    ? content.benefits
        .map((benefit) => recordValue(benefit))
        .filter((benefit) => benefit.isVisible !== false && typeof benefit.title === "string" && typeof benefit.description === "string")
    : [];

  return (
    <section id="admissions-cta" className="scroll-mt-24 bg-[#fbfaf6] px-5 pb-14 sm:px-8 sm:pb-20" data-testid={`section-courses-admissions-${section.id}`}>
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-[#0b3472]/20 bg-white px-6 py-8 shadow-[0_18px_55px_rgba(11,52,114,.07)] sm:px-9 sm:py-10 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow text-[#e3212b]">{textValue(content, ["eyebrow"], "NEED GUIDANCE?")}</p>
              <h2 className="mt-3 max-w-3xl font-display text-3xl font-extrabold tracking-[-.055em] text-[#0b3472] sm:text-4xl">{section.title}</h2>
              {section.subtitle ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[#53657d] sm:text-base">{section.subtitle}</p> : null}
              {benefits.length ? (
                <ul className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {benefits.map((benefit) => (
                    <li key={String(benefit.id || benefit.title)} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e3212b]/10 text-[#e3212b]"><BookOpen className="h-4 w-4" aria-hidden="true" /></span>
                      <span><span className="block text-xs font-extrabold text-[#0b3472]">{String(benefit.title)}</span><span className="mt-1 block text-xs leading-5 text-[#53657d]">{String(benefit.description)}</span></span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-3 border-t border-[#0b3472]/10 pt-6 lg:items-center lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <Link href="/contact" className="focus-ring inline-flex items-center justify-center gap-3 rounded-full bg-[#e3212b] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(227,33,43,.18)] transition-transform hover:-translate-y-0.5" data-testid="link-courses-admissions-contact">
                Talk with Admissions<ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span className="text-xs text-[#53657d]">Connect with the Shastra admissions team.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PublicCoursesPage() {
  const home = useGetHomePage({ query: { queryKey: getGetHomePageQueryKey() } });
  const cms = useGetCmsPage("courses", { query: { queryKey: getGetCmsPageQueryKey("courses") } });
  const menu = useGetCoursesMenu({ query: { queryKey: getGetCoursesMenuQueryKey() } });
  const cards = useMemo(() => (menu.data?.courseCards || []).filter((card) => card.isVisible).sort((a, b) => a.order - b.order), [menu.data?.courseCards]);
  useEffect(() => {
    if (!cms.data || !window.location.hash) return;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [cms.data]);
  if (home.isLoading || cms.isLoading || menu.isLoading) return <LoadingCourses />;
  if (home.isError || cms.isError || menu.isError || !home.data || !cms.data || !menu.data) return <CoursesError retry={() => { void home.refetch(); void cms.refetch(); void menu.refetch(); }} />;
  const hero = sectionByKey(cms.data.sections, "hero");
  const pathways = sectionByKey(cms.data.sections, "regular-pathways") || sectionByKey(cms.data.sections, "pathways");
  const batchSchedule = sectionByKey(cms.data.sections, "batch-details-schedule");
  const admissions = sectionByKey(cms.data.sections, "admissions-cta");
  const faqSection = home.data.sections.find(
    (section) =>
      section.pageSlug === "home" &&
      section.sectionKey.toLowerCase() === "faqs",
  );
  const faqItems = faqSection
    ? home.data.items.filter(
        (item) =>
          item.sectionId === faqSection.id && item.itemType === "faq",
      )
    : [];
  return (
    <div className="min-h-[100dvh] bg-[#f7f5ef]" data-college-theme style={{ "--college-primary": home.data.settings.primaryColor, "--college-accent": home.data.settings.accentColor } as React.CSSProperties}>
      <Header home={home.data} />
       <main>
         {hero ? <Hero section={hero} /> : null}
         {pathways ? <Pathways section={pathways} cards={cards} /> : null}
         {batchSchedule ? <BatchSchedule section={batchSchedule} items={cms.data.items} /> : null}
         {admissions ? <AdmissionsCta section={admissions} /> : null}
          <FaqSection section={faqSection} items={faqItems} pageTarget="courses" />
       </main>
      <Footer home={home.data} />
    </div>
  );
}