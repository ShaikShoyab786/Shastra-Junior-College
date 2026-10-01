import { useMemo, useState } from "react";
import { CirclePlay, Play, Search, SlidersHorizontal } from "lucide-react";
import {
  getGetVideoHubQueryKey,
  useGetHomePage,
  useGetVideoHub,
} from "@workspace/api-client-react";
import type { Video } from "@workspace/api-client-react";
import { Footer, Header } from "./public-home";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const imageUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)
    ? `${basePath}${path}`
    : path;
};

function VideoCard({
  video,
  featured = false,
}: {
  video: Video;
  featured?: boolean;
}) {
  return (
    <a
      href={video.youtubeUrl}
      className={`group focus-ring block overflow-hidden rounded-[1.6rem] border border-[#102d58]/10 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(20,48,83,.11)] ${
        featured ? "grid md:grid-cols-[1.08fr_.92fr]" : ""
      }`}
      data-testid={`link-video-${video.id}`}
    >
      <div
        className={`relative overflow-hidden bg-[#dfe8e4] ${
          featured ? "min-h-64 md:min-h-[360px]" : "aspect-[1.45]"
        }`}
      >
        {video.thumbnailUrl ? (
          <img
            src={imageUrl(video.thumbnailUrl)}
            alt={video.thumbnailAlt}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#173958] to-[#315c78] text-[#f0c972]">
            <CirclePlay className="h-14 w-14" aria-hidden="true" />
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-[#102d58]/10 transition group-hover:bg-[#102d58]/20">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-[#102d58]/80 text-white shadow-lg transition group-hover:scale-105">
            <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
          </span>
        </span>
        {featured ? (
          <span className="absolute left-5 top-5 rounded-full bg-[#f1c76c] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#173450]">
            Featured video
          </span>
        ) : null}
      </div>
      <div
        className={`flex flex-col ${
          featured ? "justify-center p-6 sm:p-9 lg:p-12" : "p-5 sm:p-6"
        }`}
      >
        <div className="text-[11px] font-bold uppercase tracking-[.13em] text-[#a3473c]">
          {video.categoryName}
        </div>
        <h3
          className={`mt-3 font-display font-extrabold leading-tight text-[#12335a] group-hover:text-[#a33d34] ${
            featured
              ? "text-2xl sm:text-3xl lg:text-[2.55rem]"
              : "text-xl"
          }`}
        >
          {video.title}
        </h3>
        {video.description ? (
          <p
            className={`mt-3 text-sm leading-6 text-[#536575] ${
              featured ? "max-w-xl sm:text-base sm:leading-7" : "line-clamp-3"
            }`}
          >
            {video.description}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-between border-t border-[#12335a]/10 pt-4 text-xs font-extrabold text-[#12335a]">
          <span>Watch on YouTube</span>
          <span className="inline-flex items-center gap-2">
            Play video
            <Play
              className="h-3.5 w-3.5 fill-current transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </a>
  );
}

export default function PublicVideoHub() {
  const hub = useGetVideoHub({
    query: { queryKey: getGetVideoHubQueryKey() },
  });
  const home = useGetHomePage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);
  const allVideos = hub.data?.videos || [];
  const orderedVideos = useMemo(
    () => [...allVideos].sort((a, b) => a.position - b.position),
    [allVideos],
  );
  const categories = hub.data?.categories || [];
  const matching = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return orderedVideos.filter((video) => {
      const categoryMatches =
        category === "all" || video.categoryId === category;
      const searchMatches =
        !query ||
        [
          video.title,
          video.description,
          video.categoryName,
          video.categorySlug,
        ].some((value) => value.toLocaleLowerCase().includes(query));
      return categoryMatches && searchMatches;
    });
  }, [category, orderedVideos, search]);
  const featured = matching.find((video) => video.isFeatured);
  const visibleVideos = matching
    .filter((video) => video.id !== featured?.id)
    .slice(0, Math.max(0, visibleCount - (featured ? 1 : 0)));

  if (hub.isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f3eb]">
        <Header home={home.data} />
        <main className="min-h-[70dvh] px-5 py-16 sm:px-8" aria-busy="true">
          <div className="mx-auto max-w-7xl">
            <div className="h-4 w-36 animate-pulse rounded bg-[#ead9bd]" />
            <div className="mt-6 h-14 max-w-xl animate-pulse rounded-xl bg-[#dbe4df]" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-3xl bg-white"
                />
              ))}
            </div>
          </div>
        </main>
        {home.data ? <Footer home={home.data} /> : null}
      </div>
    );
  }
  if (hub.isError || !hub.data) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f3eb]">
        <Header home={home.data} />
        <main className="flex min-h-[70dvh] items-center justify-center p-6">
          <div className="max-w-md rounded-3xl border border-[#12335a]/10 bg-white p-8 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#a3473c]">
              Video Hub
            </p>
            <h1 className="mt-3 font-display text-2xl font-extrabold text-[#12335a]">
              The video library could not load.
            </h1>
            <button
              type="button"
              onClick={() => void hub.refetch()}
              className="mt-6 rounded-full bg-[#12335a] px-5 py-3 text-sm font-bold text-white"
              data-testid="button-retry-video-hub"
            >
              Try again
            </button>
          </div>
        </main>
        {home.data ? <Footer home={home.data} /> : null}
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] bg-[#f5f3eb]"
      data-testid="page-public-video-hub"
    >
      <Header home={home.data} />
      <main className="pb-20">
        <section className="relative overflow-hidden bg-[#12335a] text-[#fbf7ed]">
          <div className="pointer-events-none absolute -right-24 -top-20 h-[28rem] w-[28rem] rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-8 top-10 h-56 w-56 rounded-full border border-[#e7bd69]/25" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_.8fr] lg:items-center lg:gap-14 lg:py-20">
            <div className="max-w-2xl">
              <p
                className="text-[11px] font-extrabold uppercase tracking-[.22em] text-[#e7bd69]"
                data-testid="text-video-hub-eyebrow"
              >
                {hub.data.settings.eyebrow}
              </p>
              <h1
                className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[4.25rem]"
                data-testid="text-video-hub-title"
              >
                {hub.data.settings.title}
              </h1>
              <p
                className="mt-5 max-w-xl text-base leading-7 text-[#e5e9e5]/80 sm:text-lg sm:leading-8"
                data-testid="text-video-hub-introduction"
              >
                {hub.data.settings.introduction}
              </p>
              <div className="mt-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[.14em] text-[#e7bd69]">
                <span className="h-px w-9 bg-[#e7bd69]" />
                Watch. Understand. Apply.
              </div>
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
                    <CirclePlay className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <span className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                    See the idea.
                    <br />
                    Follow it through.
                  </span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e2b4b]/30 to-transparent" />
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-5 pt-11 sm:px-8 sm:pt-16"
          aria-labelledby="video-hub-heading"
        >
          <div className="flex flex-col gap-6 border-b border-[#12335a]/12 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a3473c]">
                Browse the video library
              </p>
              <h2
                id="video-hub-heading"
                className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#12335a] sm:text-4xl"
              >
                Concepts in motion.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#65727b]">
                Search subject lessons and revision videos from the Video Hub.
              </p>
            </div>
            <p
              className="text-sm font-semibold text-[#536575]"
              aria-live="polite"
              data-testid="text-video-results-count"
            >
              {matching.length} {matching.length === 1 ? "video" : "videos"}
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block">
              <span className="sr-only">Search videos</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667887]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleCount(6);
                }}
                placeholder="Search by subject or topic"
                className="w-full rounded-xl border border-[#12335a]/15 bg-white py-3.5 pl-11 pr-4 text-sm text-[#12335a] outline-none placeholder:text-[#82909a] focus:border-[#a3473c]/60 focus:ring-4 focus:ring-[#a3473c]/10"
                data-testid="input-search-videos"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[#12335a]/15 bg-white px-3.5">
              <SlidersHorizontal
                className="h-4 w-4 shrink-0 text-[#a3473c]"
                aria-hidden="true"
              />
              <span className="sr-only">Filter by category</span>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setVisibleCount(6);
                }}
                className="min-w-[170px] bg-transparent py-3 text-sm font-semibold text-[#12335a] outline-none"
                data-testid="select-video-category-filter"
              >
                <option value="all">All subjects</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {featured ? (
            <div className="mt-8">
              <VideoCard video={featured} featured />
            </div>
          ) : null}
          {matching.length ? (
            <div className="mt-6">
              {featured ? <h3 className="sr-only">All videos</h3> : null}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
              <div className="mt-9 flex justify-center gap-3">
                {visibleCount < matching.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((count) =>
                        Math.min(count + 6, matching.length),
                      )
                    }
                    className="rounded-full bg-[#12335a] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#1c456a]"
                    data-testid="button-load-more-videos"
                  >
                    Load more
                  </button>
                ) : null}
                {visibleCount > 6 ? (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(6)}
                    className="rounded-full border border-[#12335a]/20 bg-white px-6 py-3 text-sm font-extrabold text-[#12335a] hover:bg-[#12335a]/5"
                    data-testid="button-view-less-videos"
                  >
                    View less
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div
              className="mt-8 rounded-[1.6rem] border border-dashed border-[#12335a]/20 bg-[#eeeee7] px-6 py-14 text-center"
              data-testid="empty-video-results"
            >
              <CirclePlay
                className="mx-auto h-8 w-8 text-[#a3473c]"
                aria-hidden="true"
              />
              <h3 className="mt-4 font-display text-xl font-extrabold text-[#12335a]">
                No matching videos
              </h3>
              <p className="mt-2 text-sm text-[#65727b]">
                Try another search or choose a different subject.
              </p>
            </div>
          )}
        </section>
      </main>
      {home.data ? <Footer home={home.data} /> : null}
    </div>
  );
}