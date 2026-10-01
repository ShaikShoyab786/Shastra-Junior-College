import { useEffect } from "react";
import {
  getGetCmsPageQueryKey,
  getGetHomePageQueryKey,
  useGetCmsPage,
  useGetHomePage,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import AboutHeroSection from "./about-hero-section";
import { AboutWhoWeAreSection } from "./about-who-we-are-section";
import { AboutChairmanSection } from "./about-chairman-section";
import { AboutBoardSection } from "./about-board-section";
import { AboutInstitutionalStrengthsSection } from "./about-institutional-strengths-section";
import { AboutCoreValuesSection } from "./about-core-values-section";
import { AboutCoursesPreviewSection } from "./about-courses-preview-section";
import { Footer, Header } from "./public-home";
import FaqSection from "../components/faq-section";
import type { ContentSection } from "@workspace/api-client-react";
import { themeVariables } from "../lib/theme-presets";

type CmsRecord = Record<string, unknown>;

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function AboutCtaSection({ section }: { section: ContentSection }) {
  const content = record(section.content);
  const primaryLabel = text(content.primaryLabel);
  const primaryPath = text(content.primaryPath);
  const secondaryLabel = text(content.secondaryLabel);
  const secondaryPath = text(content.secondaryPath);

  return (
    <section
      className="bg-[#f7f5ef] px-5 pb-16 pt-8 sm:px-8 sm:pb-24"
      data-testid="section-about-final-cta"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#0b3472] px-6 py-12 text-white shadow-[0_24px_60px_rgba(11,52,114,.16)] sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <p className="eyebrow text-[#ffc7a0]">{text(content.eyebrow)}</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            {section.title}
          </h2>
          {section.subtitle ? (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/85 sm:text-base">
              {section.subtitle}
            </p>
          ) : null}
          <div className="mt-7 flex flex-wrap gap-3">
            {primaryLabel && primaryPath ? (
              <Link
                href={primaryPath}
                className="focus-ring inline-flex items-center justify-center rounded-full bg-[#e3212b] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#c81c25]"
                data-testid="link-about-cta-primary"
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLabel && secondaryPath ? (
              <Link
                href={secondaryPath}
                className="focus-ring inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-white/10"
                data-testid="link-about-cta-secondary"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutLoading() {
  return (
    <main
      className="min-h-[70vh] bg-[#f7f5ef] px-5 py-16 sm:px-8"
      aria-busy="true"
      aria-label="Loading About page"
      data-testid="loading-about-page"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="h-4 w-32 animate-pulse rounded bg-[#0b3472]/10" />
          <div className="h-20 max-w-xl animate-pulse rounded-2xl bg-[#0b3472]/10" />
          <div className="h-10 max-w-lg animate-pulse rounded-xl bg-[#0b3472]/10" />
        </div>
        <div className="aspect-[1.18/1] animate-pulse rounded-[2rem] bg-[#0b3472]/10" />
      </div>
    </main>
  );
}

export default function AboutPage() {
  const home = useGetHomePage({
    query: { queryKey: getGetHomePageQueryKey() },
  });
  const page = useGetCmsPage("about", {
    query: { queryKey: getGetCmsPageQueryKey("about") },
  });
  const faculty = useGetCmsPage("faculty", {
    query: { queryKey: getGetCmsPageQueryKey("faculty") },
  });

  useEffect(() => {
    if (!page.data || !window.location.hash) return;
    let targetId: string;
    try {
      targetId = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    requestAnimationFrame(() =>
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [page.data]);

  if (home.isLoading || page.isLoading) {
    return <AboutLoading />;
  }

  if (!home.data) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f5ef] px-5 py-16">
        <div className="max-w-lg rounded-3xl border border-[#0b3472]/10 bg-white p-8 text-center shadow-sm">
          <p className="eyebrow text-[#e3212b]">Shastra Junior College</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-[#0b3472]">
            About page unavailable
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            The college information could not be loaded right now.
          </p>
          <Link
            href="/"
            className="focus-ring mt-6 inline-flex rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white"
            data-testid="link-about-return-home"
          >
            Return home
          </Link>
        </div>
      </main>
    );
  }

  const sections = page.data?.sections || [];
  const faqSection = sections.find((section) => section.sectionKey === "faqs");
  const ctaSection = sections.find((section) => section.sectionKey === "cta");
  const faqItems = home.data.items.filter((item) => item.itemType === "faq");
  const bodySections = sections.filter(
    (section) => section.sectionKey !== "faqs" && section.sectionKey !== "cta",
  );
  const hasAboutContent = sections.some(
    (section) =>
      section.sectionKey === "hero" ||
      section.sectionKey === "who-we-are" ||
      section.sectionKey === "chairman-message" ||
      section.sectionKey === "board-of-directors" ||
      section.sectionKey === "institutional-strengths" ||
      section.sectionKey === "core-values" ||
      section.sectionKey === "courses-preview" ||
      section.sectionKey === "faqs" ||
      section.sectionKey === "cta",
  );

  return (
    <div
      className="min-h-[100dvh] bg-[#f7f5ef]"
      data-college-theme
      style={themeVariables(home.data.settings.primaryColor, home.data.settings.accentColor, home.data.settings.surfaceColor) as React.CSSProperties}
    >
      <Header home={home.data} />
      <main>
        {page.isError ? (
          <section
            className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8"
            role="alert"
            data-testid="error-about-page"
          >
            <h1 className="font-display text-3xl font-extrabold text-[#0b3472]">
              About content could not be loaded.
            </h1>
            <button
              type="button"
              onClick={() => void page.refetch()}
              className="mt-5 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white"
              data-testid="button-retry-about-page"
            >
              Try again
            </button>
          </section>
        ) : hasAboutContent ? (
          <>
            {bodySections.map((section) => {
              if (section.sectionKey === "hero") {
                return (
                  <AboutHeroSection
                    key={section.id}
                    section={section}
                    statistics={page.data?.aboutStatistics || []}
                  />
                );
              }
              if (section.sectionKey === "who-we-are") {
                return (
                  <AboutWhoWeAreSection key={section.id} section={section} />
                );
              }
              if (section.sectionKey === "chairman-message") {
                return (
                  <AboutChairmanSection key={section.id} section={section} />
                );
              }
              if (section.sectionKey === "board-of-directors") {
                return (
                  <AboutBoardSection
                    key={section.id}
                    section={section}
                    faculty={faculty.data}
                    facultyLoading={faculty.isLoading}
                    facultyError={faculty.isError}
                    onRetryFaculty={() => void faculty.refetch()}
                  />
                );
              }
              if (section.sectionKey === "institutional-strengths") {
                return (
                  <AboutInstitutionalStrengthsSection
                    key={section.id}
                    section={section}
                    items={page.data?.items ?? []}
                  />
                );
              }
              if (section.sectionKey === "core-values") {
                return (
                  <AboutCoreValuesSection
                    key={section.id}
                    section={section}
                    items={page.data?.items ?? []}
                  />
                );
              }
              if (section.sectionKey === "courses-preview") {
                return (
                  <AboutCoursesPreviewSection
                    key={section.id}
                    section={section}
                  />
                );
              }
              return null;
            })}
            {faqSection ? (
              <FaqSection
                key={faqSection.id}
                section={faqSection}
                items={faqItems}
                pageTarget="about"
              />
            ) : null}
            {ctaSection?.isVisible ? (
              <AboutCtaSection key={ctaSection.id} section={ctaSection} />
            ) : null}
          </>
        ) : (
          <section
            className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8"
            data-testid="empty-about-page"
          >
            <p className="eyebrow text-[#e3212b]">About Shastra</p>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-[#0b3472]">
              This page is being updated.
            </h1>
          </section>
        )}
      </main>
      <Footer home={home.data} />
    </div>
  );
}