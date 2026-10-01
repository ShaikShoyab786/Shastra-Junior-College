import { useEffect } from "react";
import {
  BookOpen,
  CalendarDays,
  FileText,
  Library,
  RefreshCw,
} from "lucide-react";
import type { ContentSection } from "@workspace/api-client-react";
import {
  getGetCmsPageQueryKey,
  useGetCmsPage,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Footer, Header } from "./public-home";
import { themeVariables } from "../lib/theme-presets";

type CategoryKey =
  | "article-hub"
  | "video-hub"
  | "study-resources"
  | "exam-updates";
type HubCategory = {
  key: CategoryKey;
  title: string;
  description: string;
};

const categoryOrder: CategoryKey[] = [
  "article-hub",
  "video-hub",
  "study-resources",
  "exam-updates",
];
const categoryIcons = {
  "article-hub": FileText,
  "video-hub": BookOpen,
  "study-resources": Library,
  "exam-updates": CalendarDays,
};
const anchorStorageKey = "shastra-knowledge-hub-anchor";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getLandingData(section: ContentSection | undefined) {
  if (!section || !isRecord(section.content)) return null;
  const rawCategories = section.content.categories;
  if (!Array.isArray(rawCategories) || rawCategories.length !== 4) return null;
  const categories: HubCategory[] = [];
  for (const value of rawCategories) {
    if (
      !isRecord(value) ||
      typeof value.key !== "string" ||
      !categoryOrder.includes(value.key as CategoryKey) ||
      typeof value.title !== "string" ||
      typeof value.description !== "string" ||
      !value.title.trim() ||
      !value.description.trim()
    ) {
      return null;
    }
    categories.push({
      key: value.key as CategoryKey,
      title: value.title,
      description: value.description,
    });
  }
  if (
    new Set(categories.map((category) => category.key)).size !==
    categoryOrder.length
  ) {
    return null;
  }
  return {
    eyebrow:
      typeof section.content.eyebrow === "string"
        ? section.content.eyebrow
        : "",
    title: section.title,
    subtitle: section.subtitle || "",
    categories: categories.sort(
      (a, b) => categoryOrder.indexOf(a.key) - categoryOrder.indexOf(b.key),
    ),
  };
}

function PageLoading() {
  return (
    <main
      className="min-h-[75vh] bg-[#f7f5ef] px-5 py-16 sm:px-8"
      aria-busy="true"
      data-testid="status-knowledge-hub-page-loading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-40 animate-pulse rounded bg-[#efd2ca]" />
        <div className="mt-6 h-14 max-w-xl animate-pulse rounded-xl bg-[#dce5f1]" />
        <div className="mt-5 h-6 max-w-2xl animate-pulse rounded bg-[#e4e0d8]" />
      </div>
    </main>
  );
}

function PageError({ retry }: { retry: () => void }) {
  return (
    <main
      className="flex min-h-[75vh] items-center justify-center bg-[#f7f5ef] p-6"
      role="alert"
      data-testid="status-knowledge-hub-page-error"
    >
      <div className="max-w-md rounded-[2rem] border border-[#0b3472]/10 bg-white p-9 text-center shadow-[0_18px_45px_rgba(11,52,114,.08)]">
        <p className="eyebrow text-[#e3212b]">Knowledge Hub</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#0b3472]">
          The page could not load.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Please try again when the college site connection is available.
        </p>
        <button
          type="button"
          onClick={retry}
          className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white"
          data-testid="button-retry-knowledge-hub-page"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </main>
  );
}

export default function KnowledgeHubPage() {
  const [location] = useLocation();
  const page = useGetCmsPage("knowledge-hub", {
    query: { queryKey: getGetCmsPageQueryKey("knowledge-hub") },
  });
  const landingSection = page.data?.sections.find(
    (section) => section.sectionKey === "hub-landing",
  );
  const landing = getLandingData(landingSection);

  useEffect(() => {
    if (!landingSection) return;
    const storedTarget = sessionStorage.getItem(anchorStorageKey);
    const hashTarget = window.location.hash.slice(1);
    const target = storedTarget || hashTarget;
    if (!target || !categoryOrder.includes(target as CategoryKey)) return;
    const timeout = window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      sessionStorage.removeItem(anchorStorageKey);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [landingSection, location]);

  if (page.isLoading) return <PageLoading />;
  if (page.isError || !page.data || !landingSection || !landing) {
    return <PageError retry={() => void page.refetch()} />;
  }

  return (
    <div
      className="min-h-[100dvh] bg-[#f7f5ef]"
      data-college-theme
      style={
        {
          ...themeVariables(
            page.data.settings.primaryColor,
            page.data.settings.accentColor,
            page.data.settings.surfaceColor,
          ),
        } as React.CSSProperties
      }
    >
      <Header home={page.data} />
      <main
        className="min-h-[70vh] bg-[#f7f5ef] px-5 py-12 sm:px-8 sm:py-16"
        data-testid="page-public-knowledge-hub"
      >
        <div className="mx-auto max-w-7xl">
          <section className="relative overflow-hidden rounded-[2rem] bg-[#0b3472] px-6 py-10 text-white shadow-[0_22px_55px_rgba(11,52,114,.16)] sm:px-10 sm:py-14 lg:px-14">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -right-2 -top-7 h-44 w-44 rounded-full border border-white/10"
            />
            <div className="relative max-w-3xl">
              <p
                className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f5c1b7]"
                data-testid="text-knowledge-hub-eyebrow"
              >
                {landing.eyebrow}
              </p>
              <h1
                className="mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
                data-testid="text-knowledge-hub-title"
              >
                {landing.title}
              </h1>
              <p
                className="mt-5 max-w-2xl text-base leading-7 text-blue-100/85 sm:text-lg"
                data-testid="text-knowledge-hub-introduction"
              >
                {landing.subtitle}
              </p>
              <div className="mt-7 flex flex-wrap gap-2" aria-label="Hub sections">
                {landing.categories.map((category, index) => (
                  <a
                    key={category.key}
                    href={`#${category.key}`}
                    className="focus-ring rounded-full border border-white/20 px-3.5 py-2 text-xs font-bold text-white/90 transition hover:border-white/45 hover:bg-white/10"
                    data-testid={`link-knowledge-hub-section-${category.key}`}
                  >
                    0{index + 1} · {category.title}
                  </a>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 sm:mt-14" aria-label="Knowledge Hub sections">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-[#e3212b]">Explore by topic</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472] sm:text-3xl">
                  Learning, organized for you.
                </h2>
              </div>
              <span className="hidden text-xs font-bold uppercase tracking-[.16em] text-[#0b3472]/45 sm:block">
                04 sections
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {landing.categories.map((category, index) => {
                const Icon = categoryIcons[category.key];
                return (
                  <section
                    id={category.key}
                    key={category.key}
                    className="scroll-mt-32 group relative min-h-56 overflow-hidden rounded-[1.6rem] border border-[#0b3472]/10 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[#e3212b]/25 hover:shadow-[0_18px_38px_rgba(11,52,114,.08)] sm:p-8"
                    aria-labelledby={`heading-${category.key}`}
                    data-testid={`section-knowledge-hub-${category.key}`}
                  >
                    <span className="absolute right-6 top-5 font-display text-5xl font-black text-[#0b3472]/[.05] sm:right-8 sm:top-4 sm:text-6xl">
                      0{index + 1}
                    </span>
                    <div className="relative flex h-full flex-col">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7eee8] text-[#b71927] transition group-hover:bg-[#e3212b] group-hover:text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h2
                        id={`heading-${category.key}`}
                        className="mt-6 font-display text-2xl font-extrabold text-[#0b3472]"
                      >
                        {category.title}
                      </h2>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
                        {category.description}
                      </p>
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <Footer home={page.data} />
    </div>
  );
}