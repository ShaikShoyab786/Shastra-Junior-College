import { ArrowDownRight, ArrowRight, BookOpen, CircleAlert, RefreshCw, Download, FileText, ChevronDown, BookOpenCheck, Target, Layers3, RefreshCw as UpdatesIcon, Image as ImageIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  getGetCmsPageQueryKey,
  getGetHomePageQueryKey,
  useGetCmsPage,
  useGetHomePage,
} from "@workspace/api-client-react";
import type { ContentItem, ContentSection } from "@workspace/api-client-react";
import { Footer, Header } from "./public-home";
import FaqSection from "@/components/faq-section";
import {
  ProfileModal,
  profileData,
} from "@/components/faculty-profile-modal";
import TestimonialsCarousel from "@/components/testimonials-carousel";
import {
  courseFaqPageTarget,
} from "@/lib/faq-page-targets";
import {
  courseSectionKey,
  getCourseMentorSubjectsForCourse,
  type CourseDetail,
} from "./course-detail-config";
import {
  readCourseEnrollmentProcess,
  type CourseEnrollmentProcessContent,
} from "./course-enrollment-process";
import {
  DEFAULT_COURSE_FAQ_SETTINGS,
  DEFAULT_COURSE_TESTIMONIALS_SETTINGS,
  readCoursePageSectionSettings,
} from "./course-page-section-settings";
import { themeVariables } from "../lib/theme-presets";

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
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return value.startsWith("/") && basePath && !value.startsWith(`${basePath}/`)
    ? `${basePath}${value}`
    : value;
}

function curriculumPdfUrl(value: string) {
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  if (value.startsWith("/curriculum-guides/")) {
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    return `${basePath}${value}`;
  }
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.toString()
      : "";
  } catch {
    return "";
  }
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

function CourseNotPublished({ course }: { course: { slug: string; name: string } }) {
  return (
    <main className="min-h-[55vh] bg-[#f7f5ef] px-5 py-16 sm:px-8 sm:py-24" data-testid={`page-course-not-published-${course.slug}`}>
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#0b3472]/10 bg-white px-6 py-10 text-center shadow-[0_18px_45px_rgba(11,52,114,.07)] sm:px-10">
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-.055em] text-[#0b3472] sm:text-5xl">{course.name}</h1>
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

export function PublicCourseLinkOnlyPage({ course }: { course: { slug: string; name: string } }) {
  const home = useGetHomePage({ query: { queryKey: getGetHomePageQueryKey() } });
  if (home.isLoading) return <CourseLoading />;
  if (home.isError || !home.data) return <CourseError retry={() => { void home.refetch(); }} />;
  return (
    <div className="min-h-[100dvh] bg-[#f7f5ef]" data-college-theme style={themeVariables(home.data.settings.primaryColor, home.data.settings.accentColor, home.data.settings.surfaceColor) as React.CSSProperties}>
      <Header home={home.data} />
      <CourseNotPublished course={course} />
      <Footer home={home.data} />
    </div>
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

function CourseFacultyPreview({
  course,
  items,
  copy,
}: {
  course: CourseDetail;
  items: ContentItem[];
  copy: Record<string, unknown>;
}) {
  const [selected, setSelected] = useState<ContentItem | null>(null);
  useEffect(() => setSelected(null), [course.slug]);
  const profiles = useMemo(() => {
    const matchingSubjects = new Set<string>(
      getCourseMentorSubjectsForCourse(course.slug),
    );
    if (!matchingSubjects.size) return [];
    return items
      .filter((item) => {
        if (item.itemType !== "faculty-profile") return false;
        const content = recordValue(item.content);
        const selectedSubjects = Array.isArray(content.courseMentorSubjects)
          ? content.courseMentorSubjects.filter(
              (subject): subject is string => typeof subject === "string",
            )
          : [];
        return (
          content.courseMentorEligible === true &&
          selectedSubjects.some((subject) => matchingSubjects.has(subject))
        );
      })
      .sort((a, b) => {
        const aRole = textValue(recordValue(a.content), "leadershipRole", "Faculty");
        const bRole = textValue(recordValue(b.content), "leadershipRole", "Faculty");
        return Number(bRole !== "Faculty") - Number(aRole !== "Faculty") || a.position - b.position;
      });
  }, [course.slug, items]);

  if (!profiles.length && copy.isVisible !== true) return null;
  const eyebrow = textValue(copy, "eyebrow", "FACULTY PREVIEW");
  const title = textValue(copy, "title", "Meet your course mentors");
  const description = textValue(
    copy,
    "description",
    `Faculty selected for the subjects and exam pathway in ${course.name}.`,
  );

  return (
    <>
      <section
        id={courseSectionKey(course.slug, "faculty-preview")}
        className="bg-[#f7f5ef] px-5 py-14 sm:px-8 sm:py-20"
        data-testid={`section-course-faculty-preview-${course.slug}`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 border-b border-[#0b3472]/15 pb-7 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.055em] text-[#0b3472] sm:text-5xl">
                {title}
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-[#53657d] sm:text-base">
              {description}
            </p>
          </div>
          {profiles.length ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {profiles.map((item) => {
              const profile = profileData(item);
              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[1.5rem] border border-[#0b3472]/10 bg-white shadow-[0_12px_30px_rgba(11,52,114,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(11,52,114,.12)]"
                  data-testid={`card-course-faculty-${item.id}`}
                >
                  <button
                    type="button"
                    className="focus-ring block w-full text-left"
                    onClick={() => setSelected(item)}
                    data-testid={`button-open-course-faculty-${item.id}`}
                  >
                    <div className="relative aspect-[4/4.6] overflow-hidden bg-[#e7edf5]">
                      {item.imageUrl ? (
                        <img
                          src={assetUrl(item.imageUrl)}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl font-display font-extrabold text-[#0b3472]/25">
                          {item.title.charAt(0)}
                        </div>
                      )}
                      <span className="absolute left-4 top-4 rounded-full bg-[#f7f5ef]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#0b3472]">
                        {profile.professionalTitle}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-2xl font-extrabold leading-tight text-[#0b3472]">
                        {item.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {profile.shortDescription}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#e3212b]">
                        View profile
                      </span>
                    </div>
                  </button>
                </article>
              );
            })}
          </div> : <div className="mt-7 rounded-2xl border border-[#0b3472]/10 bg-white p-6 text-sm leading-6 text-[#53657d]">
            <p>{description}</p>
            <Link href="/contact" className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#0b3472] px-4 py-2 text-sm font-bold text-white">Contact admissions <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>}
        </div>
      </section>
      {selected ? (
        <ProfileModal item={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

const curriculumBenefits = [
  { title: "Course overview", description: "Review the published course introduction.", Icon: BookOpenCheck },
  { title: "Current details", description: "Ask admissions about current subjects and course structure.", Icon: Target },
  { title: "College information", description: "Get confirmed details directly from the college.", Icon: Layers3 },
  { title: "Enquiry support", description: "Send your questions to the admissions team.", Icon: UpdatesIcon },
];

function CourseCurriculum({ course, section, items }: { course: CourseDetail; section: ContentSection; items: ContentItem[] }) {
  const content = recordValue(section.content);
  const storedEyebrow = textValue(content, "eyebrow", "COURSE CURRICULUM").trim();
  const eyebrow =
    storedEyebrow.toLocaleUpperCase() === "CURRICULUM"
      ? "COURSE CURRICULUM"
      : storedEyebrow;
  const subjects = items
    .filter((item) => item.sectionId === section.id && item.itemType === "course-curriculum-subject" && item.isVisible)
    .sort((a, b) => a.position - b.position);
  const benefits = course.slug === "iit"
    ? [
        { title: "IIT-JEE pathway", description: "Explore course information connected with IIT-JEE preparation.", Icon: BookOpenCheck },
        { title: "Mathematics", description: "Build understanding and problem-solving practice.", Icon: Target },
        { title: "Physics and Chemistry", description: "Review core science subject information.", Icon: Layers3 },
        { title: "Current course details", description: "Ask admissions for confirmed curriculum information.", Icon: UpdatesIcon },
      ]
    : curriculumBenefits;
  const pdfPath = textValue(content, "pdfPath");
  const pdfFileName = textValue(content, "pdfFileName");
  const pdfHref = pdfPath ? curriculumPdfUrl(pdfPath) : "";
  const externalPdf = /^https?:\/\//i.test(pdfPath);
  return (
    <section id={courseSectionKey(course.slug, "curriculum")} className="bg-[#f2f3f8] px-5 py-14 sm:px-8 sm:py-20" data-testid={`section-course-curriculum-${course.slug}`}>
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.55fr_.95fr] lg:gap-10">
        <div>
          <div className="mb-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e3212b]/20 bg-[#e3212b]/[.07] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#b71927]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e3212b]" aria-hidden="true" /> {eyebrow || "COURSE CURRICULUM"}
            </span>
            <h2 className="mt-4 max-w-[18ch] font-display text-4xl font-extrabold leading-[1.04] tracking-[-.055em] text-[#0b3472] sm:text-5xl">{section.title}</h2>
            {section.subtitle ? <p className="mt-4 max-w-2xl text-sm leading-7 text-[#53657d] sm:text-base">{section.subtitle}</p> : null}
          </div>
          {subjects.length ? (
            <div className="space-y-3">
              {subjects.map((subject, index) => {
                const itemContent = recordValue(subject.content);
                const topics = Array.isArray(itemContent.topics) ? itemContent.topics.filter((topic): topic is string => typeof topic === "string" && topic.trim().length > 0) : [];
                return (
                  <details key={subject.id} open={index === 0} className="group overflow-hidden rounded-2xl border border-[#17478f]/35 bg-white/65 open:border-[#e3212b]/35 open:bg-white" data-testid={`accordion-curriculum-subject-${subject.id}`}>
                    <summary className="focus-ring flex cursor-pointer list-none items-center gap-3 px-4 py-4 marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
                      <span className="font-display text-3xl font-extrabold leading-none tracking-[-.06em] text-[#0b3472]/30 sm:text-4xl">{String(index + 1).padStart(2, "0")}</span>
                      <span className="h-9 w-px bg-[#17478f]/20" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg font-extrabold text-[#0b3472] sm:text-xl">{subject.title}</span>
                        {subject.description ? <span className="mt-1 block text-xs leading-5 text-[#53657d] sm:text-sm">{subject.description}</span> : null}
                      </span>
                      <ChevronDown className="h-5 w-5 shrink-0 rounded-full bg-[#eaf0f8] p-1 text-[#0b3472] transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    {topics.length ? (
                      <div className="border-t border-[#17478f]/20 px-5 py-4 sm:px-6">
                        <ul className="grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                          {topics.map((topic, topicIndex) => <li key={`${topic}-${topicIndex}`} className="flex items-start gap-2 text-xs leading-5 text-[#31445f] sm:text-sm"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#bd3036]" aria-hidden="true" />{topic}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </details>
                );
              })}
            </div>
          ) : null}
        </div>
        <aside className="space-y-3 lg:pt-1">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[#092f70] p-6 text-white shadow-[0_18px_40px_rgba(11,52,114,.16)] sm:p-7">
            <div className="pointer-events-none absolute -bottom-16 -right-12 h-48 w-48 rounded-full border border-white/10" aria-hidden="true" />
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#f3a0a0]"><FileText className="h-4 w-4" aria-hidden="true" /></span>
            <p className="eyebrow mt-4 text-blue-100/65">Curriculum guide</p>
            {textValue(content, "downloadHeading") ? <h3 className="mt-2 max-w-[15ch] font-display text-2xl font-extrabold leading-tight">{textValue(content, "downloadHeading")}</h3> : null}
            {textValue(content, "downloadDescription") ? <p className="mt-3 text-sm leading-6 text-blue-100/75">{textValue(content, "downloadDescription")}</p> : null}
            {pdfHref ? (
              <a href={pdfHref} download={pdfFileName || undefined} target={externalPdf ? "_blank" : undefined} rel={externalPdf ? "noreferrer" : undefined} className="focus-ring mt-5 flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#c73b36] px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#ad2d2a]" data-testid={`link-download-curriculum-${course.slug}`}>
                <Download className="h-4 w-4" aria-hidden="true" />{textValue(content, "downloadButtonLabel", pdfFileName || "Download PDF")}<ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <p className="mt-5 rounded-full border border-white/15 bg-white/[.06] px-4 py-3 text-center text-xs font-semibold text-blue-100/70" role="status" data-testid={`status-curriculum-pdf-unavailable-${course.slug}`}>{course.slug === "iit" ? "Contact the college for the current IIT-JEE curriculum guide." : "Curriculum guide not available yet"}</p>
            )}
            {pdfHref && pdfFileName ? <p className="mt-3 truncate text-[10px] text-blue-100/55">{pdfFileName}</p> : null}
          </div>
          <div className="rounded-[1.5rem] border border-[#17478f]/35 bg-white/55 p-5 sm:p-6">
            <p className="eyebrow text-[#0b3472]">{course.slug === "iit" ? "IIT-JEE preparation" : "Course information"}</p>
            <div className="mt-4 grid grid-cols-1 divide-y divide-[#17478f]/20 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {benefits.map(({ title, description, Icon }, index) => (
                <div key={title} className={`flex gap-3 py-4 ${index > 1 ? "sm:border-t sm:border-[#17478f]/20" : ""} ${index % 2 ? "sm:pl-4" : "sm:pr-4"} ${index < 2 ? "sm:pt-1" : ""}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e3212b]/[.08] text-[#b71927]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <span><span className="block text-xs font-extrabold text-[#0b3472]">{title}</span><span className="mt-1 block text-[10px] leading-4 text-[#53657d]">{description}</span></span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function CourseGalleryPreview({
  course,
  section,
  items,
  copy,
}: {
  course: CourseDetail;
  section: ContentSection;
  items: ContentItem[];
  copy: Record<string, unknown>;
}) {
  const images = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.sectionId === section.id &&
            item.itemType === "gallery-image" &&
            item.isVisible &&
            recordValue(item.content).showOnCoursePreview === true,
        )
        .sort((a, b) => a.position - b.position),
    [items, section.id],
  );

  if (!images.length && copy.isVisible !== true) return null;

  const content = recordValue(section.content);
  const title = textValue(
    copy,
    "title",
    textValue(
    content,
    "headline",
    section.title || "Gallery Preview",
    ),
  );
  const description = textValue(
    copy,
    "description",
    textValue(
    content,
    "description",
    section.subtitle || "",
    ),
  );
  const eyebrow = textValue(copy, "eyebrow", "GALLERY PREVIEW");
  const buttonLabel = textValue(copy, "ctaLabel", "View Gallery");

  return (
    <section
      id={courseSectionKey(course.slug, "gallery-preview")}
      className="site-grid bg-[#f7f5ef] px-5 py-14 sm:px-8 sm:py-20"
      data-testid={`section-course-gallery-preview-${course.slug}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 border-b border-[#0b3472]/15 pb-7 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.055em] text-[#0b3472] sm:text-5xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#53657d] sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          <Link
            href="/gallery"
            className="focus-ring inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-[#0b3472] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#e3212b]"
            data-testid={`link-course-gallery-all-${course.slug}`}
          >
            {buttonLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {images.length ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((item) => {
            const imageContent = recordValue(item.content);
            const category = textValue(imageContent, "category", "Campus");
            const altText = textValue(imageContent, "altText", item.title);

            return (
              <figure
                key={item.id}
                className="group overflow-hidden rounded-[1.5rem] border border-[#0b3472]/10 bg-white shadow-[0_10px_26px_rgba(11,52,114,.06)]"
                data-testid={`card-course-gallery-image-${item.id}`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#e8edf4]">
                  {item.imageUrl ? (
                    <img
                      src={assetUrl(item.imageUrl)}
                      alt={altText}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#0b3472]/35">
                      <ImageIcon className="h-10 w-10" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <figcaption className="p-5">
                  <p className="eyebrow text-[#e3212b]">{category}</p>
                  <h3 className="mt-2 font-display text-xl font-extrabold text-[#0b3472]">
                    {item.title}
                  </h3>
                  {item.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  ) : null}
                </figcaption>
              </figure>
            );
          })}
        </div> : <div className="mt-7 rounded-2xl border border-[#0b3472]/10 bg-white p-6 text-sm leading-6 text-[#53657d]">
          <p>{description || "Explore college photographs and campus moments."}</p>
          <Link href="/gallery" className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#0b3472] px-4 py-2 text-sm font-bold text-white">{buttonLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>}
      </div>
    </section>
  );
}

function CourseEnrollmentProcessSection({
  course,
  content,
  logoUrl,
}: {
  course: CourseDetail;
  content: CourseEnrollmentProcessContent;
  logoUrl?: string | null;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (!content.isVisible || !content.steps.length) return;
    const section = sectionRef.current;
    if (!section) return;
    if (typeof IntersectionObserver === "undefined") {
      setHasEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [content.isVisible, content.steps.length]);

  if (!content.isVisible || !content.steps.length) return null;

  return (
    <section
      ref={sectionRef}
      id={courseSectionKey(course.slug, "enrollment-process")}
      className="enrollment-process site-grid bg-[#f2f3f8] px-5 py-14 sm:px-8 sm:py-20"
      data-enrollment-entered={hasEntered}
      aria-labelledby={`course-${course.slug}-enrollment-process-heading`}
      data-testid={`section-course-enrollment-process-${course.slug}`}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="enrollment-process-header mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0b3472]/10 bg-white p-2 shadow-sm">
            <img
              src={assetUrl(logoUrl || "/shastra-college-logo.png")}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <p className="eyebrow text-[#e3212b]">{content.eyebrow}</p>
          <h2
            id={`course-${course.slug}-enrollment-process-heading`}
            className="mt-3 font-display text-3xl font-extrabold tracking-[-.045em] text-[#0b3472] sm:text-4xl"
          >
            {content.title}
          </h2>
          {content.description ? (
            <p className="mt-3 text-sm leading-7 text-[#53657d] sm:text-base">
              {content.description}
            </p>
          ) : null}
        </div>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {content.steps.map((step, index) => (
            <li
              key={step.id}
              className="enrollment-step-card group relative flex min-h-48 flex-col items-center rounded-2xl border border-[#0b3472]/10 bg-white px-4 py-5 text-center shadow-[0_10px_26px_rgba(11,52,114,.05)]"
              data-testid={`card-course-enrollment-step-${step.id}`}
            >
              <div
                className="enrollment-step-content flex h-full flex-col items-center"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <span className="enrollment-step-number flex h-9 w-9 items-center justify-center rounded-full bg-[#e3212b] text-sm font-extrabold text-white">
                  <span className="sr-only">Step </span>{index + 1}
                </span>
                <h3 className="mt-3 font-display text-base font-extrabold text-[#0b3472]">
                  {step.title}
                </h3>
                {step.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                ) : null}
              </div>
              {index < content.steps.length - 1 ? (
                <ArrowRight
                  className="enrollment-process-arrow absolute -right-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 rounded-full bg-[#f2f3f8] p-0.5 text-[#e3212b] lg:block"
                  style={{ animationDelay: `${index * 380}ms` }}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function PublicCourseDetailPage({ course }: { course: CourseDetail }) {
  const home = useGetHomePage({ query: { queryKey: getGetHomePageQueryKey() } });
  const cms = useGetCmsPage("courses", { query: { queryKey: getGetCmsPageQueryKey("courses") } });
  const faculty = useGetCmsPage("faculty", { query: { queryKey: getGetCmsPageQueryKey("faculty") } });
  const gallery = useGetCmsPage("gallery", { query: { queryKey: getGetCmsPageQueryKey("gallery") } });
  const sections = useMemo(() => cms.data?.sections ?? [], [cms.data?.sections]);
  const hero = sections.find((section) => section.sectionKey === courseSectionKey(course.slug, "hero"));
  const highlights = sections.find((section) => section.sectionKey === courseSectionKey(course.slug, "highlights"));
  const curriculum = sections.find((section) => section.sectionKey === `course-${course.slug}-curriculum`);
  const curriculumContent = recordValue(curriculum?.content);
  const facultyPreviewCopy = recordValue(curriculumContent.courseFacultyPreview);
  const galleryPreviewCopy = recordValue(curriculumContent.courseGalleryPreview);
  const enrollmentProcess = readCourseEnrollmentProcess(
    curriculumContent.courseEnrollmentProcess,
  );
  const testimonialsSettings = readCoursePageSectionSettings(
    curriculumContent.courseTestimonials,
    DEFAULT_COURSE_TESTIMONIALS_SETTINGS,
  );
  const faqSettings = readCoursePageSectionSettings(
    curriculumContent.courseFaqs,
    DEFAULT_COURSE_FAQ_SETTINGS,
  );
  const courseTestimonials = (home.data?.items ?? []).filter((item) => {
    const itemContent = recordValue(item.content);
    return (
      item.itemType === "testimonial" &&
      item.isVisible &&
      itemContent.showOnCoursePages === true
    );
  });
  const testimonialsSection = {
    sectionKey: courseSectionKey(course.slug, "testimonials"),
    title: testimonialsSettings.title,
    subtitle: testimonialsSettings.description,
    content: { eyebrow: testimonialsSettings.eyebrow },
  };
  const faqSection = {
    id: courseSectionKey(course.slug, "faqs"),
    title: faqSettings.title,
    subtitle: faqSettings.description,
    content: { eyebrow: faqSettings.eyebrow },
    isVisible: faqSettings.isVisible,
  };
  const gallerySection = gallery.data?.sections.find(
    (section) => section.sectionKey.toLocaleLowerCase() === "gallery",
  );

  if (home.isLoading || cms.isLoading) return <CourseLoading />;
  if (home.isError || cms.isError || !home.data || !cms.data) {
    return <CourseError retry={() => { void home.refetch(); void cms.refetch(); }} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f5ef]" data-college-theme style={themeVariables(home.data.settings.primaryColor, home.data.settings.accentColor, home.data.settings.surfaceColor) as React.CSSProperties}>
      <Header home={home.data} />
      {hero?.isVisible ? (
        <main>
          <CourseHero course={course} section={hero} />
          {highlights?.isVisible ? <CourseHighlights course={course} section={highlights} items={cms.data.items} /> : null}
          {faculty.data ? (
            <CourseFacultyPreview
              course={course}
              items={faculty.data.items}
              copy={facultyPreviewCopy}
            />
          ) : faculty.isError ? (
            <div className="bg-[#f7f5ef] px-5 py-5 text-center text-sm text-slate-500" role="status" data-testid={`status-course-faculty-preview-${course.slug}`}>
              Faculty previews are temporarily unavailable.
            </div>
          ) : null}
          {curriculum?.isVisible ? <CourseCurriculum course={course} section={curriculum} items={cms.data.items} /> : null}
          {gallerySection && gallery.data ? (
            <CourseGalleryPreview
              course={course}
              section={gallerySection}
              items={gallery.data.items}
              copy={galleryPreviewCopy}
            />
          ) : null}
          {!gallery.isLoading ? (
            <CourseEnrollmentProcessSection
              course={course}
              content={enrollmentProcess}
              logoUrl={home.data.settings.logoUrl}
            />
          ) : null}
          {testimonialsSettings.isVisible && courseTestimonials.length ? (
            <TestimonialsCarousel
              section={testimonialsSection}
              items={courseTestimonials}
            />
          ) : testimonialsSettings.isVisible ? (
            <section className="bg-[#fbfaf6] px-5 py-14 sm:px-8 sm:py-20" data-testid={`section-course-testimonials-${course.slug}`}>
              <div className="mx-auto max-w-4xl text-center">
                <p className="eyebrow text-[#e3212b]">{testimonialsSettings.eyebrow}</p>
                <h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.055em] text-[#0b3472]">{testimonialsSettings.title}</h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#53657d] sm:text-base">{testimonialsSettings.description}</p>
                <Link href="/contact" className="focus-ring mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white">Ask the college <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </section>
          ) : null}
          <FaqSection
            section={faqSection}
            items={home.data.items}
            pageTarget={courseFaqPageTarget(course.slug)}
          />
        </main>
      ) : <CourseNotPublished course={course} />}
      <Footer home={home.data} />
    </div>
  );
}