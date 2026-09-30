import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { useGetCmsPage, getGetCmsPageQueryKey } from "@workspace/api-client-react";
import type { CmsPage, ContentItem } from "@workspace/api-client-react";
import {
  assetUrl,
  ProfileModal,
  profileData,
} from "@/components/faculty-profile-modal";
import { Footer, Header } from "./public-home";

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function LoadingState() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f5ef]" data-testid="status-faculty-loading">
      <div className="mx-auto h-[76px] max-w-7xl animate-pulse border-b border-[#0b3472]/10 bg-[#f7f5ef]" />
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="h-4 w-36 animate-pulse rounded bg-[#efd2ca]" />
        <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-2xl bg-[#dce5f1]" />
        <div className="mt-5 h-5 max-w-xl animate-pulse rounded bg-[#e4e0d8]" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="overflow-hidden rounded-[1.5rem] bg-white">
              <div className="aspect-[4/4.6] animate-pulse bg-[#dce5f1]" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-[#e4e0d8]" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-[#efd2ca]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f5ef] p-6" data-testid="status-faculty-error">
      <div className="max-w-md rounded-[2rem] border border-[#0b3472]/10 bg-white p-9 text-center shadow-[0_18px_45px_rgba(11,52,114,.08)]">
        <p className="eyebrow text-[#e3212b]">Connection issue</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#0b3472]">
          Faculty details could not load.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Please try again. Published faculty profiles will appear when the connection returns.
        </p>
        <button
          type="button"
          onClick={retry}
          className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white"
          data-testid="button-retry-faculty"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    </div>
  );
}

function FacultyContent({ page }: { page: CmsPage }) {
  const section = page.sections.find((candidate) => candidate.sectionKey === "faculty" && candidate.isVisible);
  const items = useMemo(
    () =>
      page.items
        .filter((item) => item.sectionId === section?.id && item.itemType === "faculty-profile" && item.isVisible)
        .sort((a, b) => {
          const aIsLeadership =
            text(record(a.content).leadershipRole, "Faculty") !== "Faculty";
          const bIsLeadership =
            text(record(b.content).leadershipRole, "Faculty") !== "Faculty";
          return Number(bIsLeadership) - Number(aIsLeadership) || a.position - b.position;
        }),
    [page.items, section?.id],
  );
  const content = record(section?.content);
  const eyebrow = text(content.eyebrow, "The people behind the progress");
  const title = text(content.headline, section?.title || "Meet the faculty");
  const description = text(content.description, section?.subtitle || "Experienced teachers, mentors, and subject specialists who make every classroom count.");
  const [selected, setSelected] = useState<ContentItem | null>(null);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[40px] border-[#0b3472]/[.06]" />
        <div className="pointer-events-none absolute bottom-0 left-[8%] h-28 w-28 rounded-full bg-[#e5b08e]/25 blur-2xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(3rem,7vw,6.8rem)] font-extrabold leading-[.94] tracking-[-.065em] text-[#0b3472]" data-testid="text-faculty-title">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">{description}</p>
          <div className="mt-8 flex items-center gap-3 text-sm font-bold text-[#0b3472]">
            <span className="h-2 w-2 rounded-full bg-[#e3212b]" aria-hidden="true" />
            {items.length} {items.length === 1 ? "faculty profile" : "faculty profiles"}
          </div>
        </div>
      </section>
      <main className="site-grid bg-[#fbfaf6] px-5 py-10 sm:px-8 sm:py-14" data-testid="faculty-content">
        <div className="mx-auto max-w-7xl">
          {items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="grid-faculty">
              {items.map((item) => {
                const profile = profileData(item);
                return (
                  <article key={item.id} className="group overflow-hidden rounded-[1.5rem] border border-[#0b3472]/10 bg-white shadow-[0_12px_30px_rgba(11,52,114,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(11,52,114,.12)]" data-testid={`card-faculty-${item.id}`}>
                    <button type="button" className="focus-ring block w-full text-left" onClick={() => setSelected(item)} data-testid={`button-open-faculty-${item.id}`}>
                      <div className="relative aspect-[4/4.6] overflow-hidden bg-[#e7edf5]">
                        {item.imageUrl ? <img src={assetUrl(item.imageUrl)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-5xl font-display font-extrabold text-[#0b3472]/25">{item.title.charAt(0)}</div>}
                        <span className="absolute left-4 top-4 rounded-full bg-[#f7f5ef]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#0b3472]">{profile.professionalTitle}</span>
                      </div>
                      <div className="p-5">
                        <h2 className="font-display text-2xl font-extrabold leading-tight text-[#0b3472]">{item.title}</h2>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{profile.shortDescription}</p>
                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#e3212b]">View profile <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[#0b3472]/20 bg-white px-6 py-16 text-center" data-testid="empty-faculty">
              <h2 className="font-display text-3xl font-extrabold text-[#0b3472]">Our faculty profiles are being prepared.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Please check back soon for the teachers and mentors who guide Shastra students.</p>
            </div>
          )}
        </div>
      </main>
      {selected ? <ProfileModal item={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

export default function FacultyPage() {
  const query = useGetCmsPage("faculty", { query: { queryKey: getGetCmsPageQueryKey("faculty") } });
  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState retry={() => query.refetch()} />;
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#f7f5ef]" data-college-theme style={{ "--college-primary": query.data.settings.primaryColor, "--college-accent": query.data.settings.accentColor } as Record<string, string>}>
      <Header home={query.data} />
      <FacultyContent page={query.data} />
      <Footer home={query.data} />
    </div>
  );
}