import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, CircleAlert } from "lucide-react";
import type { ContentItem, ContentSection } from "@workspace/api-client-react";

type CmsRecord = Record<string, unknown>;

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function assetUrl(path: string | null) {
  return path?.startsWith("/objects/") ? `/api/storage${path}` : path || "";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const value =
    parts.length > 1
      ? `${Array.from(parts[0])[0]}${Array.from(parts[1])[0]}`
      : parts[0]?.slice(0, 2) || "SC";
  return value.toUpperCase();
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd className="mt-1 truncate text-sm font-bold text-[#0b3472]" title={value}>{value}</dd>
    </div>
  );
}

function PlacementCard({ item }: { item: ContentItem }) {
  const content = record(item.content);
  const name = item.title.trim() || "Student";
  const image = assetUrl(item.imageUrl);
  const altText =
    text(content.altText).trim() || `${name} placement record photo`;
  const details = [
    { label: "Employer", value: text(content.employer) },
    { label: "Role", value: text(content.role) },
    { label: "Cohort", value: text(content.cohort) },
    { label: "Package", value: text(content.package) },
  ].filter((detail) => detail.value.trim());
  return (
    <article
      className="group rounded-[1.5rem] border border-[#0b3472]/10 bg-white p-5 shadow-[0_12px_34px_rgba(11,52,114,.06)] transition-transform duration-200 hover:-translate-y-1"
      data-testid={`card-placement-record-${item.id}`}
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-[#f7f5ef] bg-[#e9eef7] shadow-sm">
          {image ? (
            <img src={image} alt={altText} className="h-full w-full object-cover" data-testid={`img-placement-record-${item.id}`} />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-[#0b3472] font-display text-lg font-extrabold text-white" aria-hidden="true" data-testid={`fallback-placement-record-${item.id}`}>
              {initials(name)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-extrabold tracking-tight text-[#0b3472]" data-testid={`text-placement-student-${item.id}`}>
            {name}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#e3212b]">Placement record</p>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-100 pt-5">
        {details.map((detail) => (
          <Detail key={detail.label} label={detail.label} value={detail.value} />
        ))}
      </dl>
    </article>
  );
}

export type PlacementRecordsSectionProps = {
  section: ContentSection;
  items: ContentItem[];
};

export default function PlacementRecordsSection({ section, items }: PlacementRecordsSectionProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const records = useMemo(
    () =>
      items
        .filter((item) => item.itemType === "placement-record" && item.isVisible)
        .sort((a, b) => a.position - b.position),
    [items],
  );
  const displayed = records.slice(0, visibleCount);
  const expanded = visibleCount > 6;
  const hasSamples = displayed.some((item) => record(item.content).isDemo === true);

  if (!section.isVisible) return null;

  const resetToInitial = () => {
    setVisibleCount(6);
    headingRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <section id="placement-records" className="border-t border-[#0b3472]/10 bg-[#fbfaf6] px-5 py-16 sm:px-8 sm:py-20" data-testid={`section-placement-records-${section.id}`}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow text-[#e3212b]">Placement records</p>
          <h2 ref={headingRef} className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-[#0b3472] sm:text-5xl" data-testid="heading-global-placement-record">
            Global Placement Record
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Explore placement details by employer, role, and cohort.
          </p>
        </div>

        {hasSamples ? (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#0b3472]/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-500" role="note" data-testid="note-placement-record-samples">
            <CircleAlert className="h-3.5 w-3.5 text-[#e3212b]" aria-hidden="true" />
            Some records are illustrative samples, not verified outcomes.
          </p>
        ) : null}

        {displayed.length ? (
          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-placement-records">
            {displayed.map((item) => <PlacementCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="mt-9 rounded-[1.5rem] border border-dashed border-[#0b3472]/20 bg-white/60 px-6 py-12 text-center text-sm font-semibold text-slate-500" data-testid="empty-placement-records">
            Placement details will be shared here when records are available.
          </div>
        )}

        {records.length > 6 && displayed.length < records.length ? (
          <div className="mt-9 flex justify-center">
            <button type="button" onClick={() => setVisibleCount((current) => Math.min(current + 6, records.length))} className="focus-ring inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5" data-testid="button-placement-load-more">
              Load More <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : records.length > 6 && expanded ? (
          <div className="mt-9 flex justify-center">
            <button type="button" onClick={resetToInitial} className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#0b3472]/20 bg-white px-5 py-3 text-sm font-bold text-[#0b3472] transition-colors hover:border-[#e3212b] hover:text-[#e3212b]" data-testid="button-placement-view-less">
              View Less <ChevronUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export { PlacementRecordsSection };