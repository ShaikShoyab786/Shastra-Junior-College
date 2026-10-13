import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleAlert,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import {
  getGetCmsPageQueryKey,
  getGetCoursesMenuQueryKey,
  useGetCmsPage,
  useGetCoursesMenu,
} from "@workspace/api-client-react";
import type {
  ContentItem,
  ContentSection,
  CoursesMenuCard,
} from "@workspace/api-client-react";
import {
  courseSectionKey,
  getCourseDetailForMenuCard,
} from "./course-detail-config";

type CmsRecord = Record<string, unknown>;

function record(value: unknown): CmsRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function assetUrl(value: string | null | undefined) {
  if (!value) return "";
  return value.startsWith("/objects/") ? `/api/storage${value}` : value;
}

function cardDestination(destination: string | null | undefined) {
  const value = destination?.trim() || "";
  if (!value || value.startsWith("//")) return null;

  const internalPaths = new Set([
    "/",
    "/about",
    "/contact",
    "/courses/iit",
    "/courses/nit",
    "/courses/iiit",
    "/courses/ipe",
    "/faculty",
    "/gallery",
    "/knowledge-hub",
  ]);

  try {
    const origin = "https://shastra-college.invalid";
    const url = new URL(value, origin);
    if (
      url.username ||
      url.password ||
      !["http:", "https:"].includes(url.protocol)
    ) {
      return null;
    }
    if (url.origin === origin) {
      const pathname = url.pathname.replace(/\/+$/, "") || "/";
      return internalPaths.has(pathname) ? value : null;
    }
    return /^https?:\/\//i.test(value) ? value : null;
  } catch {
    return null;
  }
}

function courseHighlights(
  card: CoursesMenuCard,
  sections: ContentSection[],
  items: ContentItem[],
) {
  const course = getCourseDetailForMenuCard(card);
  if (!course) return [];

  const section = sections.find(
    (candidate) =>
      candidate.isVisible &&
      candidate.sectionKey === courseSectionKey(course.slug, "highlights"),
  );
  if (!section) return [];

  return items
    .filter(
      (item) =>
        item.sectionId === section.id &&
        item.itemType === "course-highlight" &&
        item.isVisible,
    )
    .sort((first, second) => first.position - second.position)
    .slice(0, 3);
}

function CourseCard({
  card,
  sections,
  items,
  duplicate = false,
}: {
  card: CoursesMenuCard;
  sections: ContentSection[];
  items: ContentItem[];
  duplicate?: boolean;
}) {
  const image = assetUrl(card.imageUrl);
  const destination = cardDestination(card.destination);
  const highlights = courseHighlights(card, sections, items);
  const content = (
    <>
      <div className="about-course-preview-image">
        {image ? (
          <img src={image} alt={duplicate ? "" : card.imageAlt} />
        ) : (
          <span className="about-course-preview-placeholder" aria-hidden="true">
            <BookOpen className="h-9 w-9" />
          </span>
        )}
        <span className="about-course-preview-category">{card.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-2xl font-extrabold leading-tight text-[#0b3472]">
          {card.title}
        </h3>
        {highlights.length ? (
          <ul className="mt-4 space-y-3">
            {highlights.map((item) => {
              const details = record(item.content);
              return (
                <li key={item.id} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#e3212b]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-5 text-[#0b3472]">
                      {item.title}
                    </span>
                    {item.description ? (
                      <span className="mt-1 block text-xs leading-5 text-[#53657d]">
                        {item.description}
                      </span>
                    ) : null}
                    {text(details.category) ? (
                      <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b71927]">
                        {text(details.category)}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[#53657d]">
            {card.description}
          </p>
        )}
        {destination ? (
          <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-extrabold text-[#0b3472]">
            Explore course
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        ) : null}
      </div>
    </>
  );

  const className =
    "group flex w-[min(82vw,23rem)] shrink-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#0b3472]/15 bg-white shadow-[0_14px_36px_rgba(11,52,114,.08)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 hover:border-[#e3212b]/35 hover:shadow-[0_22px_45px_rgba(11,52,114,.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e3212b] sm:w-[22rem]";

  if (duplicate || !destination) {
    return (
      <article className={className} data-testid={`card-about-course-${card.id}`}>
        {content}
      </article>
    );
  }

  if (destination.startsWith("/")) {
    return (
      <Link
        href={destination}
        className={className}
        data-testid={`link-about-course-${card.id}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={destination}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      data-testid={`link-about-course-${card.id}`}
    >
      {content}
    </a>
  );
}

export function AboutCoursesPreviewSection({
  section,
}: {
  section: ContentSection;
}) {
  const [paused, setPaused] = useState(false);
  const [pointerActive, setPointerActive] = useState(false);
  const [inView, setInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const menu = useGetCoursesMenu({
    query: {
      queryKey: getGetCoursesMenuQueryKey(),
      enabled: section.isVisible,
    },
  });
  const coursesPage = useGetCmsPage("courses", {
    query: {
      queryKey: getGetCmsPageQueryKey("courses"),
      enabled: section.isVisible,
    },
  });
  const cards = useMemo(
    () =>
      (menu.data?.courseCards || [])
        .filter((card) => card.isVisible)
        .sort((first, second) => first.order - second.order),
    [menu.data?.courseCards],
  );
  const sections = coursesPage.data?.sections || [];
  const items = coursesPage.data?.items || [];
  const eyebrow = text(record(section.content).eyebrow);
  const titleId = `about-courses-preview-title-${section.id}`;
  const animationDuration = `${Math.max(24, cards.length * 6)}s`;

  useEffect(() => {
    if (!section.isVisible) return;
    const element = sectionRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [section.id, section.isVisible]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  if (!section.isVisible) return null;
  const shouldPause = paused || pointerActive || !inView;

  return (
    <section
      ref={sectionRef}
      id="about-courses-preview"
      className="scroll-mt-24 overflow-hidden border-b border-[#0b3472]/10 bg-[#fbfaf6] px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
      aria-labelledby={titleId}
      data-testid={`section-about-courses-preview-${section.id}`}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          {eyebrow ? <p className="eyebrow text-[#e3212b]">{eyebrow}</p> : null}
          <h2
            id={titleId}
            className="mt-3 font-display text-[clamp(2.7rem,5.5vw,5rem)] font-extrabold leading-[.95] tracking-[-.065em] text-[#0b3472]"
            data-testid={`text-about-courses-preview-title-${section.id}`}
          >
            {section.title}
          </h2>
          {section.subtitle ? (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#53657d] sm:text-lg">
              {section.subtitle}
            </p>
          ) : null}
        </header>

        {menu.isError ? (
          <div
            className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#e3212b]/20 bg-white p-6 text-center"
            role="alert"
            data-testid="error-about-courses-preview"
          >
            <CircleAlert className="mx-auto h-6 w-6 text-[#e3212b]" aria-hidden="true" />
            <p className="mt-3 font-bold text-[#0b3472]">
              Course previews could not be loaded.
            </p>
            <button
              type="button"
              onClick={() => {
                void menu.refetch();
                void coursesPage.refetch();
              }}
              className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-4 py-2.5 text-sm font-bold text-white"
              data-testid="button-retry-about-courses-preview"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : menu.isLoading ? (
          <div
            className="mt-10 flex gap-5 overflow-hidden"
            aria-busy="true"
            aria-label="Loading course previews"
            data-testid="loading-about-courses-preview"
          >
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-[26rem] w-[min(82vw,23rem)] shrink-0 animate-pulse rounded-[1.5rem] bg-[#0b3472]/[.07]"
              />
            ))}
          </div>
        ) : cards.length ? (
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-end gap-3">
              {prefersReducedMotion ? (
                <span className="text-xs font-semibold text-[#53657d]">
                  Scroll to explore
                </span>
              ) : (
                <>
                  <span className="text-xs font-semibold text-[#53657d]">
                    {paused ? "Scrolling paused" : "Auto-scrolling"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaused((current) => !current)}
                    className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0b3472]/15 bg-white text-[#0b3472] transition hover:border-[#e3212b]/40 hover:text-[#b71927]"
                    aria-label={
                      paused ? "Resume course scrolling" : "Pause course scrolling"
                    }
                    aria-pressed={paused}
                    data-testid="button-toggle-about-courses-scroll"
                  >
                    {paused ? (
                      <Play className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Pause className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </>
              )}
            </div>
            <div
              className={`about-course-preview-viewport ${pointerActive ? "is-pointer-active" : ""}`}
              onPointerDown={() => setPointerActive(true)}
              onPointerUp={() => setPointerActive(false)}
              onPointerCancel={() => setPointerActive(false)}
              onPointerLeave={() => setPointerActive(false)}
              data-testid="track-about-courses-preview"
            >
              <div
                className={`about-course-preview-track ${shouldPause ? "is-paused" : ""}`}
                style={
                  {
                    "--about-course-preview-duration": animationDuration,
                  } as CSSProperties
                }
              >
                <div className="about-course-preview-group">
                  {cards.map((card) => (
                    <CourseCard
                      key={card.id}
                      card={card}
                      sections={sections}
                      items={items}
                    />
                  ))}
                </div>
                <div
                  className="about-course-preview-group"
                  aria-hidden="true"
                >
                  {cards.map((card) => (
                    <CourseCard
                      key={`duplicate-${card.id}`}
                      card={card}
                      sections={sections}
                      items={items}
                      duplicate
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-[#0b3472]/20 bg-white/70 px-6 py-12 text-center"
            data-testid="empty-about-courses-preview"
          >
            <BookOpen className="mx-auto h-8 w-8 text-[#0b3472]/35" aria-hidden="true" />
            <p className="mt-4 font-display text-xl font-extrabold text-[#0b3472]">
              No pathways are published yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}