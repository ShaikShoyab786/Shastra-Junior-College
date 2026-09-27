import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Menu, Sparkles, X } from "lucide-react";
import { Link } from "wouter";
import { useGetHomePage } from "@workspace/api-client-react";
import type {
  ContentItem,
  ContentSection,
  HomePage,
} from "@workspace/api-client-react";

const logoFallback = "/shastra-college-logo.png";

function field(
  source: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = source[key];
  return typeof value === "string" ? value : fallback;
}

function isDemo(source: Record<string, unknown>): boolean {
  return (
    source.demoCopy === true ||
    source.isDemoCopy === true ||
    source.isDemo === true ||
    source.seeded === true ||
    source.source === "demo"
  );
}

function DemoMarker({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[#E3212B]/20 bg-[#E3212B]/[.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#E3212B]"
      data-testid="badge-demo-copy"
    >
      <Sparkles className="h-3 w-3" /> Demo copy
    </span>
  );
}

function Logo({
  home,
  compact = false,
}: {
  home?: HomePage;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-3 focus-ring ${compact ? "max-w-[210px]" : "max-w-[270px]"}`}
      data-testid="link-brand"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0B3472] p-1.5">
        <img
          src={home?.settings.logoUrl || logoFallback}
          alt={home?.settings.collegeName || "Shastra Junior College"}
          className="h-full w-full object-contain"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-extrabold tracking-tight text-[#0B3472]">
          {home?.settings.collegeName || "Shastra Junior College"}
        </span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Key to success
        </span>
      </span>
    </Link>
  );
}

function SectionIntro({
  section,
  dark = false,
}: {
  section: ContentSection;
  dark?: boolean;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className={`eyebrow ${dark ? "text-blue-200" : "text-[#E3212B]"}`}>
          {section.sectionKey.replaceAll("-", " ")}
        </span>
        <DemoMarker show={isDemo(section.content)} />
      </div>
      <h2
        className={`font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${dark ? "text-white" : "text-[#0B3472]"}`}
        data-testid={`text-section-title-${section.id}`}
      >
        {section.title}
      </h2>
      {section.subtitle ? (
        <p
          className={`mt-3 text-base leading-7 ${dark ? "text-blue-100/75" : "text-slate-600"}`}
          data-testid={`text-section-subtitle-${section.id}`}
        >
          {section.subtitle}
        </p>
      ) : null}
    </div>
  );
}

function CardImage({ item, index }: { item: ContentItem; index: number }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt=""
        className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    );
  }
  return (
    <div
      className={`flex h-44 items-end bg-gradient-to-br ${index % 3 === 0 ? "from-[#0B3472] to-[#2c6ab4]" : index % 3 === 1 ? "from-[#153f7e] to-[#8eaed5]" : "from-[#E3212B] to-[#f09a9f]"}`}
      aria-hidden="true"
    >
      <div className="h-16 w-16 rounded-tr-[2rem] bg-white/10" />
    </div>
  );
}

function ItemCards({
  section,
  items,
  dark = false,
}: {
  section: ContentSection;
  items: ContentItem[];
  dark?: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <article
          className={`group overflow-hidden rounded-3xl border transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl ${dark ? "border-white/15 bg-white/[.07] text-white hover:shadow-black/10" : "border-slate-200 bg-white text-[#0B3472] hover:shadow-[#0B3472]/10"}`}
          key={item.id}
          data-testid={`card-content-${item.id}`}
        >
          <CardImage item={item} index={index} />
          <div className="p-6">
            <p className={`eyebrow ${dark ? "text-blue-200" : "text-[#E3212B]"}`}>
              {item.itemType}
            </p>
            <h3 className="mt-3 font-display text-xl font-extrabold">
              {item.title}
            </h3>
            {item.description ? (
              <p
                className={`mt-2 text-sm leading-6 ${dark ? "text-blue-100/75" : "text-slate-600"}`}
              >
                {item.description}
              </p>
            ) : null}
            {item.linkPath ? (
              <Link
                href={item.linkPath}
                className={`focus-ring mt-5 inline-flex items-center gap-2 text-sm font-bold ${dark ? "text-white" : "text-[#0B3472]"}`}
                data-testid={`link-item-${item.id}`}
              >
                {item.label || "Learn more"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function GenericSection({
  section,
  items,
  position,
}: {
  section: ContentSection;
  items: ContentItem[];
  position: number;
}) {
  const body = field(section.content, "body");
  return (
    <section
      id={section.sectionKey}
      style={{ order: position }}
      className="site-grid px-6 py-20 sm:py-28"
      data-testid={`section-custom-${section.id}`}
    >
      <div className="mx-auto max-w-7xl">
        <SectionIntro section={section} />
        {body ? (
          <p className="mb-8 max-w-3xl text-lg leading-8 text-slate-600">
            {body}
          </p>
        ) : null}
        {items.length > 0 ? (
          <ItemCards section={section} items={items} />
        ) : null}
      </div>
    </section>
  );
}

function PublicSection({
  section,
  items,
  position,
}: {
  section: ContentSection;
  items: ContentItem[];
  position: number;
}) {
  const content = section.content;
  const anchorId =
    section.sectionKey === "final-cta" ? "enquire" : section.sectionKey;
  const itemSection = (dark = false) => (
    <ItemCards section={section} items={items} dark={dark} />
  );

  if (
    (section.sectionKey === "notices" ||
      section.sectionKey === "notices-events" ||
      section.sectionKey === "testimonials" ||
      section.sectionKey === "testimonials-results") &&
    items.length === 0
  ) {
    return null;
  }

  switch (section.sectionKey) {
    case "announcement": {
      const message = field(content, "text");
      if (!message && items.length === 0) return null;
      return (
        <aside
          id={anchorId}
          style={{ order: position }}
          className="bg-[#E3212B] px-6 py-2.5 text-center text-xs font-semibold text-white"
          data-testid={`banner-announcement-${section.id}`}
        >
          {message || items[0]?.title}
        </aside>
      );
    }
    case "hero": {
      const imageUrl = field(content, "imageUrl");
      const headline = field(content, "headline", section.title);
      const introduction = field(content, "introduction", section.subtitle || "");
      return (
        <section
          id={anchorId}
          style={{ order: position }}
          className="relative isolate border-b border-[#0B3472]/10 bg-[#eaf0f8] px-6 pb-20 pt-20 sm:pb-28 sm:pt-28"
          data-testid={`section-hero-${section.id}`}
        >
          <div className="absolute -right-20 top-10 -z-10 h-80 w-80 rounded-full bg-[#E3212B]/10 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-end gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div className="reveal max-w-3xl">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="eyebrow text-[#E3212B]">
                  Shastra Junior College
                </span>
                <DemoMarker show={isDemo(content)} />
              </div>
              <h1
                className="font-display text-5xl font-extrabold leading-[.98] tracking-[-.045em] text-[#0B3472] sm:text-7xl"
                data-testid={`text-hero-title-${section.id}`}
              >
                {headline}
              </h1>
              {introduction ? (
                <p
                  className="mt-6 max-w-xl text-lg leading-8 text-slate-600"
                  data-testid={`text-hero-subtitle-${section.id}`}
                >
                  {introduction}
                </p>
              ) : null}
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={field(content, "primaryPath", "#programs")}
                  className="focus-ring group inline-flex items-center gap-3 rounded-full bg-[#0B3472] px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                  data-testid="link-hero-primary"
                >
                  {field(content, "primaryLabel", "Explore programs")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                {field(content, "secondaryLabel") ? (
                  <Link
                    href={field(content, "secondaryPath", "#introduction")}
                    className="focus-ring inline-flex items-center rounded-full border border-[#0B3472]/20 bg-white/60 px-6 py-3.5 text-sm font-bold text-[#0B3472]"
                    data-testid="link-hero-secondary"
                  >
                    {field(content, "secondaryLabel")}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="reveal reveal-delay-2 relative min-h-[280px] overflow-hidden rounded-[2rem] bg-[#0B3472] p-8 shadow-2xl shadow-[#0B3472]/20 sm:min-h-[370px]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                />
              ) : (
                <>
                  <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[30px] border-white/10" />
                  <div className="absolute bottom-7 right-8 h-28 w-28 rounded-full bg-[#E3212B] opacity-90" />
                </>
              )}
              <div className="relative flex h-full min-h-[220px] flex-col justify-end">
                <span className="eyebrow text-blue-200">A place to begin</span>
                <p className="mt-3 max-w-xs font-display text-3xl font-bold leading-tight text-white">
                  {field(content, "sideNote", "A starting point for your next chapter.")}
                </p>
              </div>
            </div>
          </div>
        </section>
      );
    }
    case "introduction":
    case "intro": {
      const body = field(content, "body");
      const ctaLabel = field(content, "ctaLabel");
      const ctaPath = field(content, "ctaPath");
      return (
        <section
          id={anchorId}
          style={{ order: position }}
          className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28"
        >
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <SectionIntro section={section} />
            <div className="text-xl leading-9 text-slate-600 sm:text-2xl">
              {body}
              {body ? <span className="ml-1 text-[#0B3472]">•</span> : null}
              {ctaLabel && ctaPath ? (
                <div className="mt-6">
                  <Link
                    href={ctaPath}
                    className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-[#0B3472]"
                  >
                    {ctaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      );
    }
    case "programs":
      return (
        <section
          id={anchorId}
          style={{ order: position }}
          className="bg-white px-6 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <SectionIntro section={section} />
            {items.length > 0 ? itemSection() : null}
          </div>
        </section>
      );
    case "features":
      return (
        <section
          id={anchorId}
          style={{ order: position }}
          className="site-grid px-6 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <SectionIntro section={section} />
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  className={`rounded-3xl p-7 ${index % 3 === 0 ? "bg-[#0B3472] text-white" : "border border-[#0B3472]/10 bg-white text-[#0B3472]"}`}
                  data-testid={`card-feature-${item.id}`}
                >
                  <div className="mb-10 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3212B] text-white">
                    <span className="font-display text-lg font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-extrabold">
                    {item.title}
                  </h3>
                  {item.description ? (
                    <p
                      className={`mt-2 max-w-sm text-sm leading-6 ${index % 3 === 0 ? "text-blue-100/80" : "text-slate-600"}`}
                    >
                      {item.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    case "campus-life":
    case "campus-preview":
      return (
        <section
          id={anchorId}
          style={{ order: position }}
          className="bg-[#0B3472] px-6 py-20 text-white sm:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <SectionIntro section={section} dark />
            {items.length > 0 ? itemSection(true) : null}
          </div>
        </section>
      );
    case "notices":
    case "notices-events":
    case "testimonials":
    case "testimonials-results":
      return (
        <section
          id={anchorId}
          style={{ order: position }}
          className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28"
        >
          <SectionIntro section={section} />
          {itemSection()}
        </section>
      );
    case "final-cta": {
      const headline = field(content, "headline", section.title);
      const body = field(content, "body", section.subtitle || "");
      const path = field(
        content,
        "buttonPath",
        field(content, "linkPath", "#programs"),
      );
      const label = field(
        content,
        "buttonLabel",
        field(content, "label", "Explore programs"),
      );
      return (
        <section
          id={anchorId}
          style={{ order: position }}
          className="px-6 py-20 sm:py-28"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-[#E3212B] px-7 py-10 sm:px-12 sm:py-14 md:flex-row md:items-center">
            <div>
              <DemoMarker show={isDemo(content)} />
              <h2 className="mt-4 max-w-xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {headline}
              </h2>
              {body ? (
                <p className="mt-3 max-w-xl text-white/80">{body}</p>
              ) : null}
            </div>
            {path ? (
              <Link
                href={path}
                className="focus-ring inline-flex shrink-0 items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#E3212B]"
                data-testid="link-final-cta"
              >
                {label} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </section>
      );
    }
    default:
      return <GenericSection section={section} items={items} position={position} />;
  }
}

function PublicSections({
  sections,
  items,
}: {
  sections: ContentSection[];
  items: ContentItem[];
}) {
  return (
    <main className="flex flex-col">
      {sections.map((section, index) => (
        <PublicSection
          key={section.id}
          section={section}
          items={items.filter((item) => item.sectionId === section.id)}
          position={section.position ?? index}
        />
      ))}
    </main>
  );
}

function EmptyPublic() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-20 text-center">
      <BookOpen className="mb-5 h-9 w-9 text-[#0B3472]" />
      <h2 className="font-display text-2xl font-extrabold text-[#0B3472]">
        The next chapter is being prepared.
      </h2>
      <p className="mt-2 text-slate-600">
        Homepage content will appear here once the college team publishes it.
      </p>
    </div>
  );
}

function Header({
  home,
  menuOpen,
  setMenuOpen,
}: {
  home?: HomePage;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  const links = home?.settings.navigation || [];
  return (
    <header className="sticky top-0 z-40 border-b border-[#0B3472]/10 bg-[#f7f9fc]/90 px-6 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between">
        <Logo home={home} />
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="focus-ring rounded-lg p-2 text-[#0B3472] md:hidden"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          data-testid="button-mobile-nav"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav
          className={`${menuOpen ? "absolute left-0 right-0 top-[76px] flex border-b border-slate-200 bg-[#f7f9fc] p-6" : "hidden"} flex-col gap-4 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <Link
              key={`${link.path}-${link.label}`}
              href={link.path}
              onClick={() => setMenuOpen(false)}
              className="focus-ring text-sm font-semibold text-slate-600 transition-colors hover:text-[#0B3472]"
              data-testid={`link-nav-${link.path.replaceAll("/", "") || "home"}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            onClick={() => setMenuOpen(false)}
            className="focus-ring rounded-full bg-[#0B3472] px-4 py-2.5 text-sm font-bold text-white"
            data-testid="link-admin"
          >
            Staff workspace
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer({ home }: { home?: HomePage }) {
  return (
    <footer className="border-t border-[#0B3472]/10 bg-white px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-end">
        <div>
          <Logo home={home} compact />
          {home?.settings.footerNote ? (
            <p
              className="mt-4 max-w-sm text-sm leading-6 text-slate-500"
              data-testid="text-footer-note"
            >
              {home.settings.footerNote}
            </p>
          ) : null}
        </div>
        <div className="text-sm text-slate-500">
          <span>
            © {new Date().getFullYear()}{" "}
            {home?.settings.collegeName || "Shastra Junior College"}
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function PublicHomePage() {
  const query = useGetHomePage();
  const [menuOpen, setMenuOpen] = useState(false);
  const home = query.data;
  const sections = useMemo(
    () =>
      [...(home?.sections || [])]
        .filter((section) => section.isVisible)
        .sort((a, b) => a.position - b.position),
    [home?.sections],
  );
  const items = useMemo(
    () =>
      [...(home?.items || [])]
        .filter((item) => item.isVisible)
        .sort((a, b) => a.position - b.position),
    [home?.items],
  );

  if (query.isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f7f9fc]">
        <div className="h-16 animate-pulse bg-white" />
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-16 max-w-2xl animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-8 max-w-xl animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f9fc] p-6">
        <div className="max-w-md rounded-3xl bg-white p-10 text-center shadow-xl shadow-[#0B3472]/5">
          <p className="eyebrow text-[#E3212B]">Connection issue</p>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-[#0B3472]">
            The homepage could not load.
          </h1>
          <button
            onClick={() => query.refetch()}
            className="focus-ring mt-6 rounded-full bg-[#0B3472] px-6 py-3 text-sm font-bold text-white"
            data-testid="button-retry-home"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!home || sections.length === 0) {
    return (
      <>
        <Header
          home={home}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />
        <main className="site-grid min-h-[70vh] bg-[#f7f9fc] px-6 py-24">
          <EmptyPublic />
        </main>
        <Footer home={home} />
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#f7f9fc]">
      <Header home={home} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <PublicSections sections={sections} items={items} />
      <Footer home={home} />
    </div>
  );
}