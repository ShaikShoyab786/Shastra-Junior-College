import { ArrowDownRight, ArrowRight, BookOpen, CircleAlert, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  getGetCmsPageQueryKey,
  getGetHomePageQueryKey,
  useGetCmsPage,
  useGetHomePage,
} from "@workspace/api-client-react";
import type { ContentItem, ContentSection } from "@workspace/api-client-react";
import { Footer, Header } from "./public-home";
import { courseSectionKey, type CourseDetail } from "./course-detail-config";

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function textValue(content: Record<string, unknown>, key: string, fallback = "") {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function assetUrl(value: string) {
  return value.startsWith("/objects/") ? `/api/storage${value}` : value;
}

function CourseLoading() {
  return (
    <main className="min-h-[100dvh] bg-[#f7f5ef] px-5 py-12 sm:px-8" aria-busy="true" data-testid="status-course-detail-loading">
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-40 animate-pulse rounded bg-[#e9d6d0]" />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div><div className="h-20 max-w-xl animate-pulse rounded-2xl bg-[#dce5f1]" /><div className="mt-5 h-6 max-w-lg animate-pulse rounded bg-white" /></div>
          <div className="h-72 animate-pulse rounded-[2rem] bg-[#dce5f1]" />
        </div>
      </div>
    </main>
  );
}

function CourseError({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f5ef] p-6" role="alert" data-testid="status-course-detail-error">
      <div className="max-w-md rounded-[1.75rem] border border-[#e3212b]/20 bg-white p-8 text-center shadow-[0_20px_60px_rgba(11,52,114,.08)]">
        <CircleAlert className="mx-auto h-8 w-8 text-[#e3212b]" aria-hidden="true" />
        <p className="eyebrow mt-5 text-[#e3212b]">Course details unavailable</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#0b3472]">This page could not load.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Please try again when the college site connection is available.</p>
        <button type="button" onClick={retry} className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white" data-testid="button-retry-course-detail">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    </main>
  );
}

function CourseNotPublished({ course }: { course: CourseDetail }) {
  return (
    <main className="min-h-[55vh] bg-[#f7f5ef] px-5 py-16 sm:px-8 sm:py-24" data-testid={`page-course-not-published-${course.slug}`}>
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#0b3472]/10 bg-white px-6 py-10 text-center shadow-[0_18px_45px_rgba(11,52,114,.07)] sm:px-10">
        <p className="eyebrow text-[#e3212b]">COURSE INFORMATION</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-.055em] text-[#0b3472] sm:text-5xl">{course.name}</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#53657d]">
          This course page is not published yet. Contact the college for current information.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="focus-ring inline-flex items-center gap-2 rounded-full bg-[#e3212b] px-5 py-3 text-sm font-extrabold text-white">
            Contact the college <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/courses" className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#0b3472]/20 px-5 py-3 text-sm font-bold text-[#0b3472]">
            View all courses
          </Link>
        </div>
      </div>
    </main>
  );
}

function HeroVisual({
  course,
  imageUrl,
  imageAlt,
}: {
  course: CourseDetail;
  imageUrl: string;
  imageAlt: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = imageUrl ? assetUrl(imageUrl) : "";
  useEffect(() => setImageFailed(false), [image]);

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] border border-white/20 bg-[#17478f] p-5 shadow-[0_24px_60px_rgba(4,25,61,.2)] sm:min-h-[360px] sm:p-7">
      {image && !imageFailed ? <img src={image} alt={imageAlt || `${course.name} course`} onError={() => setImageFailed(true)} className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div className={`absolute inset-0 ${image && !imageFailed ? "bg-gradient-to-tr from-[#092c60]/90 via-[#092c60]/45 to-transparent" : "bg-[radial-gradient(circle_at_78%_16%,rgba(227,33,43,.38),transparent_27%),linear-gradient(140deg,#092c60,#17478f)]"}`} aria-hidden="true" />
      <div className="relative flex min-h-[240px] flex-col justify-between text-white sm:min-h-[306px]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><BookOpen className="h-5 w-5" aria-hidden="true" /></span>
          <span className="eyebrow text-[#f6c1bb]">SHASTRA JUNIOR COLLEGE</span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-100/75">Course pathway</p>
            <p className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{course.name}</p>
          </div>
          <ArrowDownRight className="mb-1 h-9 w-9 shrink-0 text-[#f6c1bb]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function CourseHero({
  course,
  section,
}: {
  course: CourseDetail;
  section: ContentSection;
}) {
  const content = recordValue(section.content);
  const statusLabel = textValue(content, "statusLabel");
  const duration = textValue(content, "duration");
  const studyMode = textValue(content, "studyMode");
  const imageUrl = textValue(content, "imageUrl");

  return (
    <section className="relative overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 py-12 sm:px-8 sm:py-16 lg:py-20" data-testid={`section-course-hero-${course.slug}`}>
      <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full border-[26px] border-[#0b3472]/[.06]" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div className="relative z-10">
          <p className="eyebrow text-[#e3212b]">{textValue(content, "eyebrow", `${course.name.toUpperCase()} · COURSE DETAILS`)}</p>
          {statusLabel ? <p className="mt-5 inline-flex rounded-full border border-[#0b3472]/15 bg-white/75 px-3.5 py-2 text-xs font-bold text-[#0b3472]">{statusLabel}</p> : null}
          <h1 className="mt-5 max-w-[12ch] font-display text-[clamp(3.5rem,7.5vw,6.8rem)] font-extrabold leading-[.91] tracking-[-.075em] text-[#0b3472]">{section.title || course.name}</h1>
          {section.subtitle ? <p className="mt-6 max-w-2xl text-base leading-7 text-[#53657d] sm:text-lg sm:leading-8">{section.subtitle}</p> : null}
          {duration || studyMode ? (
            <dl className="mt-6 flex flex-wrap gap-2.5">
              {duration ? <div className="rounded-full border border-[#0b3472]/15 bg-white/70 px-4 py-2"><dt className="sr-only">Duration</dt><dd className="text-xs font-bold text-[#0b3472]">{duration}</dd></div> : null}
              {studyMode ? <div className="rounded-full border border-[#0b3472]/15 bg-white/70 px-4 py-2"><dt className="sr-only">Study mode</dt><dd className="text-xs font-bold text-[#0b3472]">{studyMode}</dd></div> : null}
            </dl>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="focus-ring group inline-flex items-center gap-3 rounded-full bg-[#e3212b] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(227,33,43,.18)] transition-transform hover:-translate-y-0.5" data-testid={`link-course-enquiry-${course.slug}`}>
              {textValue(content, "primaryCtaLabel", `Ask about ${course.name}`)}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link href="/courses" className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#0b3472]/20 bg-white/60 px-5 py-3.5 text-sm font-bold text-[#0b3472]" data-testid={`link-course-overview-${course.slug}`}>
              {textValue(content, "secondaryCtaLabel", "View all courses")}
            </Link>
          </div>
        </div>
        <HeroVisual course={course} imageUrl={imageUrl} imageAlt={textValue(content, "imageAlt")} />
      </div>
    </section>
  );
}

function CourseHighlights({
  course,
  section,
  items,
}: {
  course: CourseDetail;
  section: ContentSection;
  items: ContentItem[];
}) {
  const highlights = items
    .filter((item) => item.sectionId === section.id && item.itemType === "course-highlight" && item.isVisible)
    .sort((a, b) => a.position - b.position)
    .map((item) => ({ item, content: recordValue(item.content) }))
    .filter(({ item, content }) =>
      item.title.trim() &&
      item.description?.trim() &&
      typeof content.category === "string" &&
      content.category.trim(),
    );

  if (!highlights.length) return null;
  const content = recordValue(section.content);

  return (
    <section className="bg-[#fbfaf6] px-5 py-14 sm:px-8 sm:py-20" data-testid={`section-course-highlights-${course.slug}`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 border-b border-[#0b3472]/15 pb-7 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-[#e3212b]">{textValue(content, "eyebrow", "QUICK COURSE HIGHLIGHTS")}</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.055em] text-[#0b3472] sm:text-5xl">{section.title || "Quick Course Highlights"}</h2>
          </div>
          {section.subtitle ? <p className="max-w-lg text-sm leading-6 text-[#53657d] sm:text-base">{section.subtitle}</p> : null}
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map(({ item, content: itemContent }, index) => (
            <article key={item.id} className="relative flex min-h-[210px] flex-col overflow-hidden rounded-[1.5rem] border border-[#0b3472]/15 bg-white p-6 shadow-[0_14px_38px_rgba(11,52,114,.055)] sm:p-7" data-testid={`card-course-highlight-${item.id}`}>
              <span className="absolute -right-2 -top-5 font-display text-7xl font-extrabold leading-none text-[#0b3472]/[.045]" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p className="relative text-[10px] font-extrabold uppercase tracking-[.16em] text-[#b71927]">{String(itemContent.category)}</p>
              <h3 className="relative mt-5 max-w-[18ch] font-display text-2xl font-extrabold leading-tight text-[#0b3472]">{item.title}</h3>
              <p className="relative mt-3 text-sm leading-6 text-[#53657d]">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PublicCourseDetailPage({ course }: { course: CourseDetail }) {
  const home = useGetHomePage({ query: { queryKey: getGetHomePageQueryKey() } });
  const cms = useGetCmsPage("courses", { query: { queryKey: getGetCmsPageQueryKey("courses") } });
  const sections = useMemo(() => cms.data?.sections ?? [], [cms.data?.sections]);
  const hero = sections.find((section) => section.sectionKey === courseSectionKey(course.slug, "hero"));
  const highlights = sections.find((section) => section.sectionKey === courseSectionKey(course.slug, "highlights"));

  if (home.isLoading || cms.isLoading) return <CourseLoading />;
  if (home.isError || cms.isError || !home.data || !cms.data) {
    return <CourseError retry={() => { void home.refetch(); void cms.refetch(); }} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f5ef]" data-college-theme style={{ "--college-primary": home.data.settings.primaryColor, "--college-accent": home.data.settings.accentColor } as React.CSSProperties}>
      <Header home={home.data} />
      {hero?.isVisible ? (
        <main>
          <CourseHero course={course} section={hero} />
          {highlights?.isVisible ? <CourseHighlights course={course} section={highlights} items={cms.data.items} /> : null}
        </main>
      ) : <CourseNotPublished course={course} />}
      <Footer home={home.data} />
    </div>
  );
}