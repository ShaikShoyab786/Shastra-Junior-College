import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleAlert,
  ChevronDown,
  FileText,
  LoaderCircle,
  Play,
  RefreshCw,
  X,
} from "lucide-react";
import type { KnowledgeHubMenuItemKey } from "@workspace/api-client-react";
import {
  getGetKnowledgeHubMenuQueryKey,
  useGetKnowledgeHubMenu,
} from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";

const anchorStorageKey = "shastra-knowledge-hub-anchor";
const itemIcons = {
  "article-hub": FileText,
  "video-hub": Play,
  "study-resources": BookOpen,
  "exam-updates": CalendarDays,
} satisfies Record<KnowledgeHubMenuItemKey, typeof FileText>;

export default function KnowledgeHubMegaMenu({
  onMobileNavClose,
  triggerLabel,
}: {
  onMobileNavClose?: () => void;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimerRef = useRef<number | null>(null);
  const triggerHoveredRef = useRef(false);
  const panelHoveredRef = useRef(false);
  const [panelTop, setPanelTop] = useState(88);
  const query = useGetKnowledgeHubMenu({
    query: {
      enabled: open,
      queryKey: getGetKnowledgeHubMenuQueryKey(),
    },
  });

  const getPanelTop = () => {
    const trigger = triggerRef.current;
    if (!trigger) return 88;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const anchor = isMobile ? trigger : trigger.closest("header");
    return Math.ceil((anchor?.getBoundingClientRect().bottom ?? 76) + 8);
  };
  const cancelHoverClose = () => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };
  const scheduleHoverClose = () => {
    cancelHoverClose();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      hoverCloseTimerRef.current = null;
      if (!triggerHoveredRef.current && !panelHoveredRef.current) {
        setOpen(false);
      }
    }, 180);
  };
  const handleHoverEnter = (area: "trigger" | "panel") => {
    if (area === "trigger") triggerHoveredRef.current = true;
    else panelHoveredRef.current = true;
    cancelHoverClose();
    if (area === "trigger") {
      setPanelTop(getPanelTop());
      setOpen(true);
    }
  };
  const handleHoverLeave = (area: "trigger" | "panel") => {
    if (area === "trigger") triggerHoveredRef.current = false;
    else panelHoveredRef.current = false;
    if (!triggerHoveredRef.current && !panelHoveredRef.current) {
      scheduleHoverClose();
    }
  };
  const close = (restoreFocus = false) => {
    cancelHoverClose();
    setOpen(false);
    if (!restoreFocus) onMobileNavClose?.();
    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };
  const selectSection = (key: KnowledgeHubMenuItemKey) => {
    close();
    sessionStorage.setItem(anchorStorageKey, key);
    const pathname = location.split(/[?#]/, 1)[0].replace(/\/+$/, "");
    if (pathname.endsWith("/knowledge-hub")) {
      sessionStorage.removeItem(anchorStorageKey);
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}#${key}`,
      );
      window.requestAnimationFrame(() => {
        document.getElementById(key)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      return;
    }
    setLocation(`/knowledge-hub#${key}`);
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
        cancelHoverClose();
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
      cancelHoverClose();
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" || event.pointerType === "pen") {
            handleHoverEnter("trigger");
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse" || event.pointerType === "pen") {
            handleHoverLeave("trigger");
          }
        }}
        onClick={(event) => {
          if (
            event.detail > 0 &&
            triggerHoveredRef.current &&
            open
          ) {
            return;
          }
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
        data-testid="button-knowledge-hub-menu-trigger"
      >
        {triggerLabel}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed left-1/2 z-[60] w-[min(92vw,860px)] -translate-x-1/2 overflow-y-auto overscroll-contain"
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse" || event.pointerType === "pen") {
                  handleHoverEnter("panel");
                }
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse" || event.pointerType === "pen") {
                  handleHoverLeave("panel");
                }
              }}
              style={{
                top: panelTop,
                maxHeight: `calc(100dvh - ${panelTop + 16}px)`,
              }}
              role="dialog"
              aria-label="Knowledge Hub menu"
            >
              {query.isLoading ? (
                <div
                  className="flex items-center gap-3 rounded-[1.75rem] border border-[#0b3472]/15 bg-[#fbfaf6] p-6 text-sm font-semibold text-[#0b3472] shadow-[0_24px_70px_rgba(11,52,114,.18)]"
                  data-testid="status-knowledge-hub-menu-loading"
                >
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Loading Knowledge Hub…
                </div>
              ) : query.isError || !query.data ? (
                <div
                  className="rounded-[1.75rem] border border-red-200 bg-[#fff8f7] p-6 shadow-[0_24px_70px_rgba(11,52,114,.18)]"
                  role="alert"
                  data-testid="status-knowledge-hub-menu-error"
                >
                  <div className="flex gap-3">
                    <CircleAlert
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#e3212b]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-bold text-[#8f1823]">
                        Knowledge Hub is unavailable right now.
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Try loading the menu again.
                      </p>
                      <button
                        type="button"
                        onClick={() => void query.refetch()}
                        className="focus-ring mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0b3472] px-3 py-2 text-xs font-bold text-white"
                        data-testid="button-retry-knowledge-hub-menu"
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="overflow-hidden rounded-[1.75rem] border border-[#0b3472]/15 bg-[#f7f5ef] shadow-[0_24px_70px_rgba(11,52,114,.18)]"
                  data-testid="panel-knowledge-hub-mega-menu"
                >
                  <div className="flex items-start justify-between gap-5 bg-[#0b3472] px-5 py-5 text-white sm:px-7 sm:py-6">
                    <div className="max-w-2xl">
                      <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f5c1b7]">
                        {query.data.heading.eyebrow}
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                        {query.data.heading.title}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                        {query.data.heading.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => close(true)}
                      className="focus-ring rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
                      aria-label="Close Knowledge Hub menu"
                      data-testid="button-close-knowledge-hub-menu"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <Link
                      href="/knowledge-hub"
                      onClick={() => close()}
                      className="focus-ring hidden shrink-0 items-center gap-2 rounded-full bg-[#e3212b] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#b71927] sm:inline-flex"
                      data-testid="link-explore-knowledge-hub"
                    >
                      {query.data.ctaLabel}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6">
                    {query.data.items
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((item, index) => {
                        const Icon = itemIcons[item.key];
                        return (
                          <Link
                            href={
                              item.key === "article-hub"
                                ? "/knowledge-hub/article-hub"
                                : `/knowledge-hub#${item.key}`
                            }
                            key={item.key}
                            onClick={
                              item.key === "article-hub"
                                ? undefined
                                : (event) => {
                                    event.preventDefault();
                                    selectSection(item.key);
                                  }
                            }
                            className="group focus-ring relative flex min-h-28 items-start gap-4 overflow-hidden rounded-2xl border border-[#0b3472]/10 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#e3212b]/35 hover:shadow-[0_14px_28px_rgba(11,52,114,.09)] sm:p-5"
                            data-testid={`link-knowledge-hub-menu-${item.key}`}
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7eee8] text-[#b71927] transition group-hover:bg-[#e3212b] group-hover:text-white">
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#e3212b]">
                                  0{index + 1}
                                </span>
                                <span className="font-display text-lg font-extrabold text-[#0b3472]">
                                  {item.title}
                                </span>
                              </span>
                              <span className="mt-1 block text-sm leading-5 text-slate-600">
                                {item.description}
                              </span>
                            </span>
                            <ArrowRight
                              className="mt-1 h-4 w-4 shrink-0 text-[#0b3472]/35 transition group-hover:translate-x-1 group-hover:text-[#e3212b]"
                              aria-hidden="true"
                            />
                          </Link>
                        );
                      })}
                  </div>
                  <div className="border-t border-[#0b3472]/10 px-4 py-3 sm:hidden">
                    <Link
                      href="/knowledge-hub"
                      onClick={() => close()}
                      className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e3212b] px-4 py-3 text-sm font-extrabold text-white"
                      data-testid="link-explore-knowledge-hub-mobile"
                    >
                      {query.data.ctaLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}