import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
      <dd className="mt-1 break-words text-sm font-bold leading-5 text-[#0b3472]" title={value}>{value}</dd>
    </div>
  );
}

function PlacementCard({ item }: { item: ContentItem }) {
  const content = record(item.content);
  const name = item.title.trim() || "Student";
  const image = assetUrl(item.imageUrl);
  const altText = text(content.altText).trim() || `${name} top ranker photo`;
  const achievement = text(content.achievement).trim() || "Top Ranker";
  const examOrStream = text(content.examOrStream).trim();
  const subject = text(content.subject).trim();
  const marks = text(content.marks).trim();
  const year = text(content.year, text(content.cohort)).trim();
  return (
    <article
      className="group rounded-[1.5rem] border border-[#0b3472]/10 bg-white p-6 shadow-[0_12px_34px_rgba(11,52,114,.06)] transition-transform duration-200 hover:-translate-y-1"
      data-testid={`card-placement-record-${item.id}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 border-[#f7f5ef] bg-[#e9eef7] shadow-md">
          {image ? (
            <img src={image} alt={altText} loading="eager" decoding="async" className="h-full w-full object-cover" data-testid={`img-placement-record-${item.id}`} />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-[#0b3472] font-display text-lg font-extrabold text-white" aria-hidden="true" data-testid={`fallback-placement-record-${item.id}`}>
              {initials(name)}
            </span>
          )}
        </div>
        <p className="mt-4 rounded-full bg-[#e3212b]/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.1em] text-[#e3212b]" data-testid={`text-placement-achievement-${item.id}`}>
          {achievement}
        </p>
        <div className="min-w-0">
          <h3 className="mt-3 font-display text-xl font-extrabold tracking-tight text-[#0b3472]" data-testid={`text-placement-student-${item.id}`}>
            {name}
          </h3>
          {examOrStream ? <p className="mt-1 text-sm font-semibold text-slate-500">{examOrStream}</p> : null}
        </div>
      </div>
      {subject || marks || year ? (
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-100 pt-5">
          {subject ? <Detail label="Subject" value={subject} /> : null}
          {marks ? <Detail label="Marks / Score" value={marks} /> : null}
          {year ? <Detail label="Academic year" value={year} /> : null}
        </dl>
      ) : null}
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
  const sectionContent = record(section.content);
  const savedEyebrow = text(sectionContent.eyebrow).trim();
  const eyebrow =
    !savedEyebrow || savedEyebrow.toLowerCase() === "placement records"
      ? "Top Rankers"
      : savedEyebrow;
  const savedTitle = section.title.trim();
  const title =
    !savedTitle || savedTitle.toLowerCase() === "global placement record"
      ? "Top Rankers of Shastra"
      : savedTitle;
  const savedDescription = section.subtitle?.trim() || "";
  const legacyPlacementDescriptions = new Set([
    "student placements by employer, role, batch, and year.",
    "explore placement details by employer, role, and graduating batch.",
  ]);
  const description =
    !savedDescription || legacyPlacementDescriptions.has(savedDescription.toLowerCase())
      ? "Celebrating the academic achievements of our students."
      : savedDescription;
  const records = useMemo(
    () =>
      items
        .filter((item) => item.itemType === "placement-record" && item.isVisible)
        .sort((a, b) => a.position - b.position),
    [items],
  );
  const displayed = records.slice(0, visibleCount);
  const expanded = visibleCount > 6;

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
          <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
          <h2 ref={headingRef} className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-[#0b3472] sm:text-5xl" data-testid="heading-global-placement-record">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>

        {displayed.length ? (
          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-placement-records">
            {displayed.map((item) => <PlacementCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="mt-9 rounded-[1.5rem] border border-dashed border-[#0b3472]/20 bg-white/60 px-6 py-12 text-center text-sm font-semibold text-slate-500" data-testid="empty-placement-records">
            Ranker details will be shared here when records are available.
          </div>
        )}

        {records.length > 6 && (displayed.length < records.length || expanded) ? (
          <div className="mt-9 flex justify-center">
            <div className="flex flex-wrap justify-center gap-3">
              {displayed.length < records.length ? (
                <button type="button" onClick={() => setVisibleCount((current) => Math.min(current + 6, records.length))} className="focus-ring inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5" data-testid="button-placement-load-more">
                  Load More <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
              {expanded ? (
                <button type="button" onClick={resetToInitial} className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#0b3472]/20 bg-white px-5 py-3 text-sm font-bold text-[#0b3472] transition-colors hover:border-[#e3212b] hover:text-[#e3212b]" data-testid="button-placement-view-less">
                  View Less <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export { PlacementRecordsSection };