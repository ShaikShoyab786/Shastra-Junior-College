import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BriefcaseBusiness,
  Clock,
  Compass,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { ContentItem, ContentSection } from "@workspace/api-client-react";

type CmsRecord = Record<string, unknown>;

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

const iconMap: Record<string, LucideIcon> = {
  book: BookOpen,
  "book-open": BookOpen,
  briefcase: BriefcaseBusiness,
  clock: Clock,
  compass: Compass,
  graduation: GraduationCap,
  "heart-handshake": HeartHandshake,
  landmark: Landmark,
  lightbulb: Lightbulb,
  shield: ShieldCheck,
  sparkles: Sparkles,
  target: Target,
  users: Users,
};

function StrengthIcon({ name }: { name: string }) {
  const Icon = iconMap[name.toLowerCase()] || Sparkles;
  return <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />;
}

export function AboutInstitutionalStrengthsSection({
  section,
  items,
}: {
  section: ContentSection;
  items: ContentItem[];
}) {
  const strengths = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.sectionId === section.id &&
            item.itemType === "institutional-strength" &&
            item.isVisible,
        )
        .sort((first, second) => first.position - second.position),
    [items, section.id],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    strengths[0]?.id ?? null,
  );
  const selected = strengths.find((item) => item.id === selectedId) ?? strengths[0];
  const titleId = `about-strengths-title-${section.id}`;
  const eyebrow = text(record(section.content).eyebrow);

  useEffect(() => {
    if (!selected || selected.id !== selectedId) {
      setSelectedId(strengths[0]?.id ?? null);
    }
  }, [selected, selectedId, strengths]);

  if (!section.isVisible) return null;

  return (
    <section
      className="site-grid overflow-hidden border-b border-[#0b3472]/10 bg-[#fbfaf6] px-5 py-16 sm:px-8 sm:py-20 lg:py-28"
      aria-labelledby={titleId}
      data-testid={`section-about-institutional-strengths-${section.id}`}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          {eyebrow ? (
            <p
              className="eyebrow text-[#c07823]"
              data-testid={`text-about-strengths-eyebrow-${section.id}`}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={titleId}
            className="mt-3 font-display text-[clamp(2.65rem,5.5vw,5.2rem)] font-extrabold leading-[.95] tracking-[-.065em] text-[#0b3472]"
            data-testid={`text-about-strengths-title-${section.id}`}
          >
            {section.title}
          </h2>
          {section.subtitle ? (
            <p
              className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#52647c] sm:text-lg"
              data-testid={`text-about-strengths-subtitle-${section.id}`}
            >
              {section.subtitle}
            </p>
          ) : null}
        </header>

        {strengths.length ? (
          <div className="mt-12 grid gap-7 lg:grid-cols-[minmax(230px,.72fr)_minmax(0,1.28fr)] lg:gap-10">
            <div
              className="flex flex-col gap-1"
              role="tablist"
              aria-label={section.title}
              data-testid={`list-about-strengths-${section.id}`}
            >
              {strengths.map((item, index) => {
                const itemContent = record(item.content);
                const iconName = text(itemContent.icon);
                const isSelected = item.id === selected?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={`about-strength-panel-${item.id}`}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setSelectedId(item.id)}
                    onKeyDown={(event) => {
                      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                        return;
                      }
                      event.preventDefault();
                      const currentIndex = strengths.findIndex(
                        (candidate) => candidate.id === item.id,
                      );
                      const nextIndex =
                        event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? strengths.length - 1
                            : (currentIndex +
                                (event.key === "ArrowDown" ? 1 : -1) +
                                strengths.length) %
                              strengths.length;
                      const next = strengths[nextIndex];
                      setSelectedId(next.id);
                      window.requestAnimationFrame(() => {
                        document
                          .getElementById(`about-strength-tab-${next.id}`)
                          ?.focus();
                      });
                    }}
                    id={`about-strength-tab-${item.id}`}
                    className={`focus-ring group flex min-h-16 items-center gap-4 border-l-2 px-4 py-3 text-left transition-[transform,opacity] duration-200 sm:px-5 ${
                      isSelected
                        ? "border-[#e3212b] bg-white shadow-[0_12px_30px_rgba(11,52,114,.07)]"
                        : "border-transparent hover:translate-x-1 hover:border-[#0b3472]/20"
                    }`}
                    data-testid={`button-select-about-strength-${item.id}`}
                  >
                    <span
                      className={`font-mono text-xs font-bold tracking-[.12em] ${
                        isSelected ? "text-[#e3212b]" : "text-[#8491a2]"
                      }`}
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block font-display text-base font-extrabold ${
                          isSelected ? "text-[#0b3472]" : "text-[#203b63]"
                        }`}
                        data-testid={`text-about-strength-title-${item.id}`}
                      >
                        {item.title}
                      </span>
                      {item.description ? (
                        <span className="mt-1 block truncate text-xs text-[#718096]">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>

            {selected ? (
              <article
                key={selected.id}
                id={`about-strength-panel-${selected.id}`}
                role="tabpanel"
                aria-labelledby={`about-strength-tab-${selected.id}`}
                className="relative overflow-hidden rounded-[1.6rem] border border-[#0b3472]/10 bg-white p-6 shadow-[0_18px_50px_rgba(11,52,114,.08)] transition-[transform,opacity] duration-300 sm:p-8 lg:min-h-[300px] lg:p-10"
                data-testid={`panel-about-strength-${selected.id}`}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-[#c07823]/30"
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f7efe3] text-[#c07823]">
                    <StrengthIcon name={text(record(selected.content).icon)} />
                  </div>
                  <span className="font-mono text-xs font-bold tracking-[.16em] text-[#c07823]">
                    {String(strengths.findIndex((item) => item.id === selected.id) + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="relative mt-8">
                  <h3
                    className="font-display text-2xl font-extrabold leading-tight text-[#0b3472] sm:text-3xl"
                    data-testid={`text-about-strength-panel-title-${selected.id}`}
                  >
                    {selected.title}
                  </h3>
                  {selected.description ? (
                    <p
                      className="mt-4 max-w-2xl text-base leading-8 text-[#52647c]"
                      data-testid={`text-about-strength-panel-description-${selected.id}`}
                    >
                      {selected.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ) : null}
          </div>
        ) : (
          <div
            className="mx-auto mt-12 max-w-xl rounded-[1.5rem] border border-dashed border-[#0b3472]/20 bg-white px-6 py-14 text-center text-sm leading-6 text-[#52647c]"
            data-testid={`empty-about-strengths-${section.id}`}
          >
            {section.subtitle || section.title}
          </div>
        )}
      </div>
    </section>
  );
}

export default AboutInstitutionalStrengthsSection;