import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleAlert,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "wouter";
import {
  getGetCoursesMenuQueryKey,
  useGetCoursesMenu,
} from "@workspace/api-client-react";
import type {
  CoursesMenuBenefit,
  CoursesMenuCard,
  CoursesMenuSettings,
} from "@workspace/api-client-react";

function assetUrl(path: string | null | undefined) {
  if (!path) return "";
  return path.startsWith("/objects/") ? `/api/storage${path}` : path;
}

function isInternalDestination(destination: string) {
  return destination.startsWith("/") && !destination.startsWith("//");
}

function Destination({
  destination,
  children,
  onSelect,
  className,
  testId,
}: {
  destination: string;
  children: ReactNode;
  onSelect: () => void;
  className?: string;
  testId: string;
}) {
  if (isInternalDestination(destination)) {
    return (
      <Link
        href={destination}
        onClick={onSelect}
        className={className}
        data-testid={testId}
      >
        {children}
      </Link>
    );
  }
  if (/^https?:\/\//i.test(destination)) {
    return (
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSelect}
        className={className}
        data-testid={testId}
      >
        {children}
      </a>
    );
  }
  return (
    <span className={`${className || ""} cursor-not-allowed opacity-60`} data-testid={testId}>
      {children}
    </span>
  );
}

function CourseCard({
  card,
  onSelect,
}: {
  card: CoursesMenuCard;
  onSelect: () => void;
}) {
  const image = assetUrl(card.imageUrl);
  return (
    <Destination
      destination={card.destination}
      onSelect={onSelect}
      className="group flex min-h-[138px] flex-col justify-between rounded-2xl border border-[#0b3472]/10 bg-[#fffdfa] p-4 transition hover:-translate-y-0.5 hover:border-[#0b3472]/30 hover:shadow-[0_16px_30px_rgba(11,52,114,.1)] focus-ring"
      testId={`link-course-menu-card-${card.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#e8eef8] text-[#0b3472]"
          style={card.tint ? { backgroundColor: `${card.tint}18`, color: card.tint } : undefined}
        >
          {image ? (
            <img src={image} alt={card.imageAlt} className="h-full w-full object-cover" />
          ) : card.icon ? (
            <span className="text-xs font-extrabold">{card.icon.slice(0, 2).toUpperCase()}</span>
          ) : (
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <ArrowRight className="h-4 w-4 text-[#0b3472]/35 transition-transform group-hover:translate-x-1 group-hover:text-[#e3212b]" aria-hidden="true" />
      </div>
      <span>
        <span className="mt-4 block text-[10px] font-extrabold uppercase tracking-[.14em] text-[#e3212b]">{card.category}</span>
        <span className="mt-1 block font-display text-lg font-extrabold leading-tight text-[#0b3472]">{card.title}</span>
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">{card.description}</span>
      </span>
    </Destination>
  );
}

function Benefit({ benefit }: { benefit: CoursesMenuBenefit }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0b3472]/[.07] text-[#0b3472]">
        {benefit.icon ? <span className="text-[10px] font-extrabold">{benefit.icon.slice(0, 2).toUpperCase()}</span> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
      </span>
      <span>
        <span className="block text-xs font-extrabold text-[#0b3472]">{benefit.title}</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{benefit.description}</span>
      </span>
    </li>
  );
}

function MenuPanel({
  data,
  onClose,
  onDismiss,
  fallbackLogoUrl,
}: {
  data: CoursesMenuSettings;
  onClose: () => void;
  onDismiss: () => void;
  fallbackLogoUrl: string;
}) {
  const brandImage = assetUrl(data.brandPanel.backgroundImageUrl);
  const logo = assetUrl(data.brandPanel.logoImageUrl || fallbackLogoUrl);
  const logoAlt = data.brandPanel.logoImageUrl
    ? data.brandPanel.logoImageAlt
    : `${data.brandPanel.collegeName} logo`;
  const cards = data.courseCards.slice().sort((a, b) => a.order - b.order).filter((card) => card.isVisible);
  const benefits = data.benefits.slice().sort((a, b) => a.order - b.order).filter((benefit) => benefit.isVisible);
  const utilities = data.utilityLinks.slice().sort((a, b) => a.order - b.order).filter((link) => link.isVisible);
  const ctas = data.ctaButtons.slice().sort((a, b) => a.order - b.order).filter((button) => button.isVisible);

  return (
    <div className="overflow-hidden rounded-[1.65rem] border border-[#0b3472]/12 bg-[#fbfaf6] shadow-[0_24px_70px_rgba(11,52,114,.18)]" data-testid="panel-courses-mega-menu">
      <div className="flex items-center justify-between border-b border-[#0b3472]/10 px-5 py-3 md:hidden">
        <span className="eyebrow text-[#e3212b]">Explore Courses</span>
        <button type="button" onClick={onDismiss} className="focus-ring rounded-lg p-2 text-[#0b3472]" aria-label="Close Courses menu" data-testid="button-close-courses-menu">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid md:grid-cols-[minmax(210px,.7fr)_minmax(0,1.8fr)]">
        <aside
          className="relative overflow-hidden bg-[#0b3472] p-5 text-white md:p-6"
        >
          {brandImage ? (
            <>
              <img
                src={brandImage}
                alt={data.brandPanel.backgroundImageAlt}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-[#0b3472]/95 to-[#0b3472]/80"
              />
            </>
          ) : null}
          <div className="relative">
            {logo ? <img src={logo} alt={logoAlt} className="h-11 max-w-[150px] object-contain object-left" /> : null}
            <p className="mt-5 text-xs font-extrabold text-white/90" data-testid="text-courses-menu-college-name">{data.brandPanel.collegeName}</p>
            <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f5c1b7]">{data.brandPanel.tagline}</p>
            <h2 className="mt-3 max-w-[13ch] font-display text-2xl font-extrabold leading-[1.03] sm:text-3xl">{data.brandPanel.headline}</h2>
            <p className="mt-3 text-xs leading-5 text-blue-100/75">{data.brandPanel.supportingText}</p>
            {benefits.length ? <ul className="mt-6 space-y-3">{benefits.slice(0, 3).map((benefit) => <Benefit key={benefit.id} benefit={benefit} />)}</ul> : null}
          </div>
        </aside>
        <div className="min-w-0 p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-[#e3212b]">{data.heading.eyebrow}</p>
              <h3 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#0b3472]">{data.heading.title}</h3>
            </div>
            {data.heading.pathwayBadge ? <span className="rounded-full bg-[#e3212b]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#b71927]">{data.heading.pathwayBadge}</span> : null}
          </div>
          {cards.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {cards.map((card) => <CourseCard key={card.id} card={card} onSelect={onClose} />)}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[#0b3472]/20 bg-white/70 px-5 py-7 text-center" data-testid="status-courses-menu-empty">
              <BookOpen className="mx-auto h-7 w-7 text-[#0b3472]/30" aria-hidden="true" />
              <p className="mt-3 font-bold text-[#0b3472]">No confirmed course pathways yet.</p>
              <p className="mt-1 text-sm text-slate-500">Please check back for updated course information.</p>
            </div>
          )}
          {data.comingSoonCard?.isVisible ? (
            <div className="mt-3 rounded-2xl border border-dashed border-[#0b3472]/20 bg-[#f2f5fa] p-4" data-testid="card-courses-menu-coming-soon">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-[#0b3472]">{data.comingSoonCard.title}</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-500">{data.comingSoonCard.statusLabel}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{data.comingSoonCard.description}</p>
            </div>
          ) : null}
          {utilities.length || ctas.length ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#0b3472]/10 pt-4">
              {utilities.map((link) => (
                <Destination key={link.id} destination={link.destination} onSelect={onClose} className="focus-ring rounded-lg px-2 py-1.5 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/[.06]" testId={`link-courses-menu-utility-${link.id}`}>
                  {link.label}
                </Destination>
              ))}
              {ctas.map((button) => (
                <Destination key={button.id} destination={button.destination} onSelect={onClose} className={`focus-ring ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold ${button.variant === "primary" ? "bg-[#e3212b] text-white hover:bg-[#b71927]" : "border border-[#0b3472]/20 text-[#0b3472] hover:bg-[#0b3472]/[.06]"}`} testId={`link-courses-menu-cta-${button.id}`}>
                  {button.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Destination>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function CoursesMegaMenu({
  onMobileNavClose,
  fallbackLogoUrl,
}: {
  onMobileNavClose?: () => void;
  fallbackLogoUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelTop, setPanelTop] = useState(88);
  const query = useGetCoursesMenu({
    query: { enabled: open, queryKey: getGetCoursesMenuQueryKey() },
  });
  const getPanelTop = () => {
    const trigger = triggerRef.current;
    if (!trigger) return 88;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const anchor = isMobile ? trigger : trigger.closest("header");
    return Math.ceil((anchor?.getBoundingClientRect().bottom ?? 76) + 8);
  };
  const close = (restoreFocus = false) => {
    setOpen(false);
    if (!restoreFocus) onMobileNavClose?.();
    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => setPanelTop(getPanelTop());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            close(true);
            return;
          }
          setPanelTop(getPanelTop());
          setOpen(true);
        }}
        className="focus-ring inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-[#0b3472] transition-colors hover:text-[#e3212b] md:px-0 md:py-0"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="button-courses-menu-trigger"
      >
        Courses
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
        <div
          ref={panelRef}
          className="fixed left-1/2 z-[60] w-[min(92vw,860px)] -translate-x-1/2 overflow-y-auto overscroll-contain"
          style={{
            top: panelTop,
            maxHeight: `calc(100dvh - ${panelTop + 16}px)`,
          }}
          role="dialog"
          aria-label="Courses menu"
        >
          {query.isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#0b3472]/12 bg-[#fbfaf6] p-6 text-sm font-semibold text-[#0b3472] shadow-[0_24px_70px_rgba(11,52,114,.18)]" data-testid="status-courses-menu-loading">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading confirmed courses…
            </div>
          ) : query.isError || !query.data ? (
            <div className="rounded-2xl border border-red-200 bg-[#fff8f7] p-6 shadow-[0_24px_70px_rgba(11,52,114,.18)]" role="alert" data-testid="status-courses-menu-error">
              <div className="flex gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#e3212b]" /><div><p className="font-bold text-[#8f1823]">Courses are unavailable right now.</p><p className="mt-1 text-sm text-slate-600">Please try again before choosing a pathway.</p><button type="button" onClick={() => void query.refetch()} className="focus-ring mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0b3472] px-3 py-2 text-xs font-bold text-white" data-testid="button-retry-courses-menu"><RefreshCw className="h-3.5 w-3.5" /> Try again</button></div></div>
            </div>
          ) : (
            <MenuPanel
              data={query.data}
              onClose={close}
              onDismiss={() => close(true)}
              fallbackLogoUrl={fallbackLogoUrl}
            />
          )}
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}