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
import { Footer, Header } from "./public-home";

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
  const hasAboutContent = sections.some(
    (section) =>
      section.sectionKey === "hero" ||
      section.sectionKey === "who-we-are" ||
      section.sectionKey === "chairman-message" ||
      section.sectionKey === "board-of-directors",
  );

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
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
            {sections.map((section) => {
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
              return null;
            })}
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