import { useMemo } from "react";
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

export function AboutCoreValuesSection({
  section,
  items,
}: {
  section: ContentSection;
  items: ContentItem[];
}) {
  const values = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.sectionId === section.id &&
            item.itemType === "core-value" &&
            item.isVisible,
        )
        .sort((first, second) => first.position - second.position),
    [items, section.id],
  );
  const eyebrow = text(record(section.content).eyebrow);
  const titleId = `about-values-title-${section.id}`;

  if (!section.isVisible) return null;

  return (
    <section
      className="overflow-hidden border-b border-[#0b3472]/10 bg-[#f1f4f8] px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
      aria-labelledby={titleId}
      data-testid={`section-about-core-values-${section.id}`}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          {eyebrow ? (
            <p
              className="eyebrow text-[#c07823]"
              data-testid={`text-about-values-eyebrow-${section.id}`}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={titleId}
            className="mt-3 font-display text-[clamp(2.7rem,5.5vw,5.1rem)] font-extrabold leading-[.95] tracking-[-.065em] text-[#0b3472]"
            data-testid={`text-about-values-title-${section.id}`}
          >
            {section.title}
          </h2>
          {section.subtitle ? (
            <p
              className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#52647c] sm:text-lg"
              data-testid={`text-about-values-subtitle-${section.id}`}
            >
              {section.subtitle}
            </p>
          ) : null}
        </header>

        {values.length ? (
          <ul
            className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4"
            data-testid={`list-about-core-values-${section.id}`}
          >
            {values.map((value) => (
              <li
                key={value.id}
                className="group min-w-[min(100%,13rem)] flex-1 rounded-2xl border border-[#0b3472]/10 bg-[#fbfaf6] px-5 py-4 shadow-[0_7px_20px_rgba(11,52,114,.045)] transition-[transform,opacity] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(11,52,114,.09)] sm:max-w-[16rem]"
                data-testid={`card-about-core-value-${value.id}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c07823] transition-transform duration-200 group-hover:scale-125"
                    aria-hidden="true"
                  />
                  <div>
                    <h3
                      className="font-display text-lg font-extrabold leading-tight text-[#0b3472]"
                      data-testid={`text-about-core-value-title-${value.id}`}
                    >
                      {value.title}
                    </h3>
                    {value.description ? (
                      <p
                        className="mt-2 text-sm leading-6 text-[#52647c]"
                        data-testid={`text-about-core-value-description-${value.id}`}
                      >
                        {value.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-[#0b3472]/20 bg-[#fbfaf6] px-6 py-12 text-center text-sm leading-6 text-[#52647c]"
            data-testid={`empty-about-core-values-${section.id}`}
          >
            {section.subtitle || section.title}
          </div>
        )}
      </div>
    </section>
  );
}

export default AboutCoreValuesSection;