import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TransitionEvent,
} from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Quote } from "lucide-react";
import type { ContentItem, ContentSection } from "@workspace/api-client-react";

type TestimonialsSection = Pick<
  ContentSection,
  "content" | "title" | "subtitle"
> & { sectionKey?: string };

type CmsRecord = Record<string, unknown>;

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function assetUrl(path: string | null) {
  return path?.startsWith("/objects/") ? `/api/storage${path}` : path || "";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`
    : parts[0]?.slice(0, 2) || "SC"
  ).toUpperCase();
}

export default function TestimonialsCarousel({
  section,
  items,
}: {
  section: TestimonialsSection;
  items: ContentItem[];
}) {
  const ordered = useMemo(
    () => [...items].sort((a, b) => a.position - b.position),
    [items],
  );
  const [active, setActive] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (ordered.length === 0) {
      if (active !== 0) setActive(0);
      return;
    }
    if (active === 0 || active > ordered.length + 1) setActive(1);
  }, [active, ordered.length]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (
      ordered.length < 2 ||
      reducedMotion ||
      !playing ||
      hovered ||
      focused
    ) {
      return;
    }
    const timer = window.setInterval(
      () =>
        setActive((current) =>
          current === ordered.length ? ordered.length + 1 : current + 1,
        ),
      5600,
    );
    return () => window.clearInterval(timer);
  }, [active, focused, hovered, ordered.length, playing, reducedMotion]);

  const go = (direction: -1 | 1) => {
    if (ordered.length < 2) return;
    setActive((current) => {
      const currentItem = (current - 1 + ordered.length) % ordered.length;
      if (reducedMotion) {
        return (currentItem + direction + ordered.length) % ordered.length + 1;
      }
      if (direction < 0 && current === 1) return 0;
      if (direction > 0 && current === ordered.length) {
        return ordered.length + 1;
      }
      return current + direction;
    });
  };
  const activeItemIndex = ordered.length
    ? (active - 1 + ordered.length) % ordered.length
    : 0;
  const slides =
    ordered.length > 1
      ? [
          {
            item: ordered[ordered.length - 1],
            originalIndex: ordered.length - 1,
            key: `clone-last-${ordered[ordered.length - 1].id}`,
            isClone: true,
          },
          ...ordered.map((item, index) => ({
            item,
            originalIndex: index,
            key: item.id,
            isClone: false,
          })),
          {
            item: ordered[0],
            originalIndex: 0,
            key: `clone-first-${ordered[0].id}`,
            isClone: true,
          },
        ]
      : ordered.map((item, index) => ({
          item,
          originalIndex: index,
          key: item.id,
          isClone: false,
        }));
  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      event.propertyName !== "transform" ||
      reducedMotion ||
      ordered.length < 2
    ) {
      return;
    }
    const isCloneLast = active === 0;
    const isCloneFirst = active === ordered.length + 1;
    if (!isCloneLast && !isCloneFirst) return;

    setTransitionEnabled(false);
    setActive(isCloneLast ? ordered.length : 1);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTransitionEnabled(true));
    });
  };

  const content = record(section.content);
  const eyebrow = text(content.eyebrow, "FROM OUR COMMUNITY");
  const isCourseSection =
    section.sectionKey?.startsWith("course-") === true &&
    section.sectionKey.endsWith("-testimonials");
  const sectionId = isCourseSection ? section.sectionKey : "testimonials";
  const headingId = isCourseSection
    ? `${sectionId}-heading`
    : "homepage-testimonials-title";
  const sectionTestId = isCourseSection
    ? `section-course-testimonials-${section.sectionKey
        ?.replace(/^course-/, "")
        .replace(/-testimonials$/, "")}`
    : "section-home-testimonials";

  if (ordered.length === 0) return null;

  return (
    <section
      id={sectionId}
      className="overflow-hidden border-y border-[#0b3472]/10 bg-[#f1eee6] px-5 py-14 sm:px-8 sm:py-18"
      aria-labelledby={headingId}
      aria-roledescription="carousel"
      role="region"
      data-testid={sectionTestId}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow text-[#e3212b]" data-testid="text-testimonials-eyebrow">
              {eyebrow}
            </p>
            <h2
              id={headingId}
              className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-[#0b3472] sm:text-4xl"
              data-testid="text-testimonials-title"
            >
              {section.title}
            </h2>
            {section.subtitle ? (
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7" data-testid="text-testimonials-subtitle">
                {section.subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Testimonial controls">
            <button
              type="button"
              onClick={() => go(-1)}
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#0b3472]/20 bg-white text-[#0b3472] transition hover:border-[#e3212b] hover:text-[#e3212b]"
              aria-label="Previous testimonial"
              data-testid="button-testimonial-previous"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#0b3472]/20 bg-white text-[#0b3472] transition hover:border-[#e3212b] hover:text-[#e3212b]"
              aria-label="Next testimonial"
              data-testid="button-testimonial-next"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            {reducedMotion ? (
              <span className="rounded-full border border-[#0b3472]/15 px-3 py-2 text-xs font-semibold text-slate-500" data-testid="text-testimonial-motion-off">
                Auto-motion off
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setPlaying((current) => !current)}
                className="focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-[#0b3472]/20 bg-white px-4 text-xs font-bold text-[#0b3472] transition hover:border-[#e3212b] hover:text-[#e3212b]"
                aria-label={playing ? "Stop automatic testimonials" : "Start automatic testimonials"}
                data-testid="button-testimonial-autoplay"
              >
                {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
              </button>
            )}
          </div>
        </div>

        <div
          className="mt-9 overflow-hidden rounded-[1.75rem] border border-[#0b3472]/10 bg-white shadow-[0_18px_45px_rgba(11,52,114,.08)]"
          onTouchStart={(event) => {
            touchStart.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return;
            const distance = event.changedTouches[0]?.clientX - touchStart.current;
            if (Math.abs(distance) > 45) go(distance < 0 ? 1 : -1);
            touchStart.current = null;
          }}
          data-testid="carousel-testimonials"
        >
          <div
            className="flex w-full"
            onTransitionEnd={handleTransitionEnd}
            style={{
              transform: `translateX(-${(ordered.length > 1 ? active : 0) * 100}%)`,
              transition: reducedMotion || !transitionEnabled ? "none" : "transform 420ms ease-out",
            }}
          >
            {slides.map(({ item, originalIndex, key, isClone }) => {
              const itemContent = record(item.content);
              const role = text(itemContent.role, "Student");
              const course = text(itemContent.course);
              const altText = text(itemContent.altText, `${item.title} portrait`);
              const image = assetUrl(item.imageUrl);
              return (
                <article
                  key={key}
                  className="grid min-w-full shrink-0 gap-8 p-7 sm:grid-cols-[auto_1fr] sm:items-center sm:p-10 lg:grid-cols-[180px_1fr_auto]"
                  aria-hidden={isClone || originalIndex !== activeItemIndex}
                  data-testid={
                    isClone
                      ? `card-testimonial-clone-${key}`
                      : `card-testimonial-${item.id}`
                  }
                >
                  <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-8 border-[#f1eee6] bg-[#dfe7f1] sm:mx-0 sm:h-36 sm:w-36">
                    {image ? (
                      <img src={image} alt={altText} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-display text-2xl font-extrabold text-[#0b3472]">
                        {initials(item.title)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Quote className="h-8 w-8 text-[#e3212b]/35" aria-hidden="true" />
                    <blockquote className="mt-3 max-w-2xl font-display text-xl font-bold leading-8 text-[#0b3472] sm:text-2xl sm:leading-9" data-testid={`text-testimonial-feedback-${item.id}`}>
                      “{item.description || "A meaningful learning journey at Shastra."}”
                    </blockquote>
                    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <cite className="not-italic font-extrabold text-[#0b3472]" data-testid={`text-testimonial-name-${item.id}`}>{item.title}</cite>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="font-semibold text-[#e3212b]" data-testid={`text-testimonial-role-${item.id}`}>{role}</span>
                      {course ? <><span className="text-slate-400" aria-hidden="true">·</span><span className="text-slate-500" data-testid={`text-testimonial-course-${item.id}`}>{course}</span></> : null}
                    </div>
                  </div>
                  <div className="hidden justify-self-end text-right lg:block">
                    <p className="font-display text-5xl font-extrabold text-[#0b3472]/10">0{originalIndex + 1}</p>
                    <p className="eyebrow mt-2 text-[#0b3472]/45">Community voice</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="group" aria-label="Choose a testimonial">
            {ordered.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setActive(index + 1)}
                className={`focus-ring h-2 rounded-full transition-all ${index === activeItemIndex ? "w-8 bg-[#e3212b]" : "w-2 bg-[#0b3472]/20 hover:bg-[#0b3472]/45"}`}
                aria-current={index === activeItemIndex ? "true" : undefined}
                aria-label={`Show testimonial ${index + 1}`}
                data-testid={`button-testimonial-dot-${item.id}`}
              />
            ))}
          </div>
          <p className="text-xs font-bold text-slate-500" aria-live="polite" data-testid="text-testimonial-position">
            {activeItemIndex + 1} of {ordered.length}
          </p>
        </div>
      </div>
    </section>
  );
}

export { TestimonialsCarousel };