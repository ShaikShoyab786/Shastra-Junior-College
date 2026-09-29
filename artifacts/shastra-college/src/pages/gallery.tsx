import { useMemo, useState } from "react";
import { ArrowRight, Image as ImageIcon, RefreshCw, X } from "lucide-react";
import { Link } from "wouter";
import {
  getGetHomePageQueryKey,
  useGetHomePage,
} from "@workspace/api-client-react";
import type { ContentItem, ContentSection, HomePage } from "@workspace/api-client-react";
import {
  getGalleryCategories,
  normalizeGalleryCategory,
} from "../lib/gallery-categories";
import { Footer, Header } from "./public-home";

type CmsRecord = Record<string, unknown>;

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as CmsRecord) : {};
}

function value(source: CmsRecord, key: string, fallback = "") {
  return typeof source[key] === "string" && source[key] ? source[key] as string : fallback;
}

function assetUrl(path: string | null) {
  if (!path) return "";
  return path.startsWith("/objects/") ? `/api/storage${path}` : path;
}

function GalleryLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f5ef]" data-testid="status-gallery-loading">
      <div className="mx-auto h-[76px] max-w-7xl animate-pulse border-b border-[#0b3472]/10 bg-[#f7f5ef]" />
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="h-4 w-28 animate-pulse rounded bg-[#efd2ca]" />
        <div className="mt-5 h-20 max-w-xl animate-pulse rounded-2xl bg-[#dce5f1]" />
        <div className="mt-4 h-5 max-w-lg animate-pulse rounded bg-[#e4e0d8]" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="aspect-[4/3] animate-pulse rounded-[1.5rem] bg-[#dce5f1]" />)}
        </div>
      </div>
    </div>
  );
}

function GalleryError({ retry }: { retry: () => void }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f5ef] p-6" data-testid="status-gallery-error">
      <div className="max-w-md rounded-[2rem] border border-[#0b3472]/10 bg-white p-9 text-center shadow-[0_18px_45px_rgba(11,52,114,.08)]">
        <p className="eyebrow text-[#e3212b]">Connection issue</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#0b3472]">The gallery could not load.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Please try again. Published campus stories will appear when the connection returns.</p>
        <button type="button" onClick={retry} className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white" data-testid="button-retry-gallery">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    </div>
  );
}

function GalleryHero({ section }: { section?: ContentSection }) {
  const content = record(section?.content);
  const eyebrow = value(content, "eyebrow", "Campus gallery");
  const title = value(content, "headline", section?.title || "A closer look at campus life");
  const description = value(content, "description", section?.subtitle || "Explore the spaces, people, and moments that shape the Shastra Junior College experience.");
  return (
    <section className="relative overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[36px] border-[#e3212b]/10" />
      <div className="pointer-events-none absolute bottom-0 left-[12%] h-20 w-20 rounded-full bg-[#e5b08e]/25 blur-2xl" />
      <div className="relative mx-auto grid max-w-7xl items-end gap-8 lg:grid-cols-[1fr_360px]">
        <div className="reveal">
          <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(3rem,7vw,6.8rem)] font-extrabold leading-[.94] tracking-[-.065em] text-[#0b3472]" data-testid="text-gallery-title">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">{description}</p>
        </div>
        <div className="reveal reveal-delay-2 border-l-2 border-[#e3212b] pl-5">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-[#0b3472]">The everyday, documented</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">Move through the places where lessons continue after the bell.</p>
          <Link href="#gallery-grid" className="focus-ring mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0b3472] hover:text-[#e3212b]" data-testid="link-gallery-explore">
            Explore the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function GalleryCard({ item, onOpen }: { item: ContentItem; onOpen: (item: ContentItem) => void }) {
  const content = record(item.content);
  const category = value(content, "category", "Campus");
  const altText = value(content, "altText", item.title);
  return (
    <button type="button" onClick={() => onOpen(item)} className="group relative block min-w-0 overflow-hidden rounded-[1.5rem] border border-[#0b3472]/10 bg-white text-left shadow-[0_10px_26px_rgba(11,52,114,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(11,52,114,.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e3212b]" data-testid={`card-gallery-${item.id}`}>
      <div className="aspect-[4/3] overflow-hidden bg-[#e8edf4]">
        {item.imageUrl ? <img src={assetUrl(item.imageUrl)} alt={altText} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="flex h-full items-center justify-center text-[#0b3472]/35"><ImageIcon className="h-10 w-10" /></div>}
      </div>
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="eyebrow text-[#e3212b]">{category}</p>
          <h2 className="mt-2 truncate font-display text-xl font-extrabold text-[#0b3472]">{item.title}</h2>
          {item.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p> : null}
        </div>
        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#e3212b] transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

function GalleryLightbox({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const content = record(item.content);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082859]/90 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={item.title} onClick={onClose} data-testid={`dialog-gallery-${item.id}`}>
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[1.5rem] bg-[#f7f5ef] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="focus-ring absolute right-4 top-4 z-10 rounded-full bg-[#082859]/80 p-2 text-white hover:bg-[#e3212b]" aria-label="Close image" data-testid="button-close-gallery-lightbox"><X className="h-5 w-5" /></button>
        <div className="grid max-h-[92vh] overflow-auto lg:grid-cols-[1.4fr_.6fr]">
          <div className="flex min-h-[280px] items-center justify-center bg-[#0b3472]"><img src={assetUrl(item.imageUrl)} alt={value(content, "altText", item.title)} className="max-h-[70vh] w-full object-contain" /></div>
          <div className="p-7 sm:p-9">
            <p className="eyebrow text-[#e3212b]">{value(content, "category", "Campus")}</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-[#0b3472]">{item.title}</h2>
            {item.description ? <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryContent({ home }: { home: HomePage }) {
  const section = home.sections.find((candidate) => candidate.sectionKey.toLowerCase() === "gallery" && candidate.isVisible);
  const items = useMemo(() => home.items.filter((item) => item.sectionId === section?.id && item.itemType === "gallery-image" && item.isVisible).sort((a, b) => a.position - b.position), [home.items, section?.id]);
  const categories = useMemo(
    () => ["All", ...getGalleryCategories(section?.content, items)],
    [items, section?.content],
  );
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const filtered = activeCategory === "All" ? items : items.filter(
    (item) => normalizeGalleryCategory(record(item.content).category)?.toLocaleLowerCase() === activeCategory.toLocaleLowerCase(),
  );
  return (
    <>
      <GalleryHero section={section} />
      <main id="gallery-grid" className="site-grid bg-[#fbfaf6] px-5 py-10 sm:px-8 sm:py-14" data-testid="gallery-content">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 border-b border-[#0b3472]/10 pb-6 sm:flex-row sm:items-end">
            <div><p className="eyebrow text-[#e3212b]">The collection</p><h2 className="mt-2 font-display text-3xl font-extrabold text-[#0b3472]">Find your corner of Shastra</h2></div>
            <p className="text-sm font-semibold text-slate-500">{filtered.length} {filtered.length === 1 ? "story" : "stories"}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter gallery by category" data-testid="gallery-filters">
            {categories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`focus-ring rounded-full border px-4 py-2.5 text-sm font-bold transition ${activeCategory === category ? "border-[#0b3472] bg-[#0b3472] text-white" : "border-[#0b3472]/15 bg-white text-[#0b3472] hover:border-[#e3212b] hover:text-[#e3212b]"}`} aria-pressed={activeCategory === category} data-testid={`button-gallery-filter-${category.toLowerCase().replace(/\s+/g, "-")}`}>{category}</button>)}
          </div>
          {filtered.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="grid-gallery">{filtered.map((item) => <GalleryCard key={item.id} item={item} onOpen={setSelected} />)}</div> : <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#0b3472]/20 bg-white px-6 py-16 text-center" data-testid="empty-gallery-filter"><ImageIcon className="mx-auto h-10 w-10 text-[#0b3472]/25" /><h3 className="mt-4 font-display text-2xl font-extrabold text-[#0b3472]">{items.length ? "No images in this category yet." : "The collection is being assembled."}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{items.length ? "Choose another category to keep exploring campus." : "The college team is preparing a closer look at campus life."}</p></div>}
        </div>
      </main>
      {selected ? <GalleryLightbox item={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

export default function GalleryPage() {
  const query = useGetHomePage({ query: { queryKey: getGetHomePageQueryKey() } });
  if (query.isLoading) return <GalleryLoading />;
  if (query.isError || !query.data) return <GalleryError retry={() => query.refetch()} />;
  return <div className="min-h-[100dvh] overflow-hidden bg-[#f7f5ef]" data-college-theme style={{ "--college-primary": query.data.settings.primaryColor, "--college-accent": query.data.settings.accentColor } as React.CSSProperties}><Header home={query.data} /><GalleryContent home={query.data} /><Footer home={query.data} /></div>;
}