import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  FileText,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  useGetHomePage,
  useGetStudyResources,
} from "@workspace/api-client-react";
import type { StudyResource } from "@workspace/api-client-react";
import { Footer, Header } from "./public-home";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const imageUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)
    ? `${basePath}${path}`
    : path;
};
const documentUrl = (path: string) => {
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)
    ? `${basePath}${path}`
    : path;
};

const resourceTypeLabels: Record<string, string> = {
  "study-notes": "Study notes",
  "practice-paper": "Practice paper",
  syllabus: "Syllabus",
  "revision-guide": "Revision guide",
  "study-planner": "Study planner",
};

function ResourceCard({ resource }: { resource: StudyResource }) {
  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-[#12335a]/10 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(20,48,83,.11)]"
      data-testid={`card-study-resource-${resource.id}`}
    >
      <div className="relative aspect-[1.58] overflow-hidden bg-[#e7ece8]">
        {resource.thumbnailUrl ? (
          <img
            src={imageUrl(resource.thumbnailUrl)}
            alt={resource.thumbnailAlt}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#12335a]/55">
            <FileText className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#12335a] shadow-sm">
            {resource.categoryName}
          </span>
          {resource.isDemo ? (
            <span className="rounded-full bg-[#e7bd69] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#12335a] shadow-sm">
              Sample
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#a3473c]">
          {resourceTypeLabels[resource.resourceType] ?? "PDF resource"}
        </p>
        <h3 className="mt-2 font-display text-xl font-extrabold leading-tight text-[#12335a] sm:text-[1.35rem]">
          {resource.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-[#52616a]">
          {resource.description}
        </p>
        <a
          href={documentUrl(resource.fileUrl)}
          download={resource.fileName}
          className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#12335a] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0b2748]"
          data-testid={`link-download-study-resource-${resource.id}`}
        >
          Download PDF
          <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function ResourceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.45rem] border border-[#12335a]/10 bg-white">
      <div className="aspect-[1.58] animate-pulse bg-[#e6e9e4]" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-[#e6e9e4]" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-[#e6e9e4]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#e6e9e4]" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-[#e6e9e4]" />
      </div>
    </div>
  );
}

export default function PublicStudyResourcesPage() {
  const home = useGetHomePage();
  const hub = useGetStudyResources();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  const filteredResources = useMemo(() => {
    const resources = hub.data?.resources ?? [];
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return resources.filter((resource) => {
      const matchesCategory =
        category === "all" || resource.categoryId === category;
      const matchesSearch =
        !normalizedSearch ||
        [
          resource.title,
          resource.description,
          resource.categoryName,
          resource.fileName,
          resourceTypeLabels[resource.resourceType] ?? resource.resourceType,
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [hub.data?.resources, category, search]);

  const visibleResources = filteredResources.slice(0, visibleCount);

  if (hub.isLoading || home.isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f3eb]" data-testid="page-public-study-resources-loading">
        <main className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="h-72 animate-pulse rounded-[2rem] bg-[#12335a]/10" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <ResourceCardSkeleton key={index} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (hub.isError || home.isError || !hub.data || !home.data) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f3eb]" data-testid="page-public-study-resources-error">
        {home.data ? <Header home={home.data} /> : null}
        <main className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#a3473c]">
            Study Resources
          </p>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-[#12335a]">
            Resources are unavailable right now.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#52616a]">
            Please try loading the study library again.
          </p>
          <button
            type="button"
            onClick={() => {
              void hub.refetch();
              void home.refetch();
            }}
            className="focus-ring mt-6 rounded-xl bg-[#12335a] px-5 py-3 text-sm font-bold text-white"
            data-testid="button-retry-study-resources"
          >
            Try again
          </button>
        </main>
        {home.data ? <Footer home={home.data} /> : null}
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] bg-[#f5f3eb]"
      data-testid="page-public-study-resources"
    >
      <Header home={home.data} />
      <main className="pb-20">
        <section className="relative overflow-hidden bg-[#12335a] text-[#fbf7ed]">
          <div className="pointer-events-none absolute -right-24 -top-20 h-[28rem] w-[28rem] rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-8 top-10 h-56 w-56 rounded-full border border-[#e7bd69]/25" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_.8fr] lg:items-center lg:gap-14 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-[#e7bd69]">
                {hub.data.settings.eyebrow}
              </p>
              <h1 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[4.25rem]">
                {hub.data.settings.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#e5e9e5]/80 sm:text-lg sm:leading-8">
                {hub.data.settings.introduction}
              </p>
              <a
                href="#resource-library"
                className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-[#e7bd69] px-5 py-3 text-sm font-extrabold text-[#12335a] transition hover:bg-[#f0cd84]"
              >
                Browse the library
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="relative min-h-56 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#1d4566] sm:min-h-72 lg:min-h-[330px]">
              {hub.data.settings.heroImageUrl ? (
                <img
                  src={imageUrl(hub.data.settings.heroImageUrl)}
                  alt={hub.data.settings.heroImageAlt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col justify-end p-7 sm:p-10">
                  <div className="mb-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e7bd69]/35 text-[#e7bd69]">
                    <FileText className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <span className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                    Read. Practise.
                    <br />
                    Keep progressing.
                  </span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e2b4b]/30 to-transparent" />
            </div>
          </div>
        </section>

        <section
          id="resource-library"
          className="mx-auto max-w-7xl px-5 pt-11 sm:px-8 sm:pt-16"
          aria-labelledby="study-resources-heading"
        >
          <div className="flex flex-col gap-6 border-b border-[#12335a]/12 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a3473c]">
                Browse the library
              </p>
              <h2
                id="study-resources-heading"
                className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#12335a] sm:text-4xl"
              >
                Study resources
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#52616a] sm:text-base">
                Search subject notes, revision guides, and practice PDFs.
              </p>
            </div>
            <label className="relative block w-full md:max-w-sm">
              <span className="sr-only">Search study resources</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a82]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleCount(6);
                }}
                placeholder="Search by topic or subject"
                className="focus-ring h-12 w-full rounded-xl border border-[#12335a]/15 bg-white pl-11 pr-4 text-sm text-[#12335a] placeholder:text-[#849198]"
                data-testid="input-search-study-resources"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2" aria-label="Filter resources by category">
            <SlidersHorizontal className="mr-1 h-4 w-4 shrink-0 text-[#74838a]" aria-hidden="true" />
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                setVisibleCount(6);
              }}
              aria-pressed={category === "all"}
              className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold transition ${
                category === "all"
                  ? "border-[#12335a] bg-[#12335a] text-white"
                  : "border-[#12335a]/15 bg-white text-[#12335a] hover:border-[#12335a]/40"
              }`}
              data-testid="button-filter-study-resources-all"
            >
              All resources
            </button>
            {hub.data.categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCategory(item.id);
                  setVisibleCount(6);
                }}
                aria-pressed={category === item.id}
                className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold transition ${
                  category === item.id
                    ? "border-[#12335a] bg-[#12335a] text-white"
                    : "border-[#12335a]/15 bg-white text-[#12335a] hover:border-[#12335a]/40"
                }`}
                data-testid={`button-filter-study-resources-${item.slug}`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-[#6b7a82]">
            <span>
              {filteredResources.length}{" "}
              {filteredResources.length === 1 ? "resource" : "resources"}
            </span>
            {search || category !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setVisibleCount(6);
                }}
                className="focus-ring rounded px-2 py-1 text-[#a3473c] hover:underline"
                data-testid="button-clear-study-resource-filters"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          {filteredResources.length > 0 ? (
            <>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
              {filteredResources.length > 6 ? (
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  {visibleCount < filteredResources.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((current) =>
                          Math.min(current + 6, filteredResources.length),
                        )
                      }
                      className="focus-ring rounded-full border border-[#12335a]/20 bg-white px-6 py-3 text-sm font-extrabold text-[#12335a] transition hover:bg-[#12335a] hover:text-white"
                      data-testid="button-load-more-study-resources"
                    >
                      Load more
                    </button>
                  ) : null}
                  {visibleCount > 6 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setVisibleCount(6);
                        document
                          .getElementById("resource-library")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="focus-ring rounded-full border border-[#12335a]/20 px-6 py-3 text-sm font-extrabold text-[#12335a] transition hover:bg-[#12335a]/5"
                      data-testid="button-view-less-study-resources"
                    >
                      View less
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div
              className="mt-5 rounded-[1.5rem] border border-dashed border-[#12335a]/20 bg-white px-6 py-14 text-center"
              data-testid="empty-study-resources"
            >
              <FileText className="mx-auto h-9 w-9 text-[#8b999d]" aria-hidden="true" />
              <h3 className="mt-4 font-display text-xl font-extrabold text-[#12335a]">
                No matching resources
              </h3>
              <p className="mt-2 text-sm text-[#52616a]">
                Try another search or category.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer home={home.data} />
    </div>
  );
}