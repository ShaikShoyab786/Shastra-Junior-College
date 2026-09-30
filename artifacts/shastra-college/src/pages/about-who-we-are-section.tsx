import type { ContentSection } from "@workspace/api-client-react";
import { ArrowUpRight, Compass, Target } from "lucide-react";

type AboutWhoWeAreContent = {
  eyebrow?: unknown;
  paragraphs?: unknown;
  visionTitle?: unknown;
  visionText?: unknown;
  missionTitle?: unknown;
  missionPoints?: unknown;
};

function textValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string | number =>
      typeof item === "string" || typeof item === "number",
  ).map(String).filter(Boolean);
}

function contentFrom(section: ContentSection): AboutWhoWeAreContent {
  return section.content as AboutWhoWeAreContent;
}

export function AboutWhoWeAreSection({
  section,
}: {
  section: ContentSection;
}) {
  const content = contentFrom(section);
  const eyebrow = textValue(content.eyebrow);
  const paragraphs = textList(content.paragraphs);
  const visionTitle = textValue(content.visionTitle);
  const visionText = textValue(content.visionText);
  const missionTitle = textValue(content.missionTitle);
  const missionPoints = textList(content.missionPoints);
  const titleId = `about-who-we-are-title-${section.id}`;

  return (
    <section
      className="site-grid relative overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 py-16 sm:px-8 sm:py-20 lg:py-28"
      aria-labelledby={titleId}
      data-testid={`section-about-who-we-are-${section.id}`}
    >
      <div
        className="pointer-events-none absolute -right-16 top-16 h-44 w-44 rounded-full border border-[#e3212b]/15 sm:h-64 sm:w-64"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-4 top-28 h-20 w-20 rounded-full border border-[#e3212b]/20 sm:right-16 sm:top-36"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-x-20">
          <header className="reveal reveal-delay-1 lg:sticky lg:top-10 lg:self-start">
            {eyebrow ? (
              <p
                className="eyebrow mb-5 text-[#e3212b]"
                data-testid={`text-about-who-we-are-eyebrow-${section.id}`}
              >
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="max-w-[10ch] font-display text-[clamp(2.8rem,6vw,5.65rem)] font-extrabold leading-[0.95] tracking-[-0.065em] text-[#0b3472]"
              data-testid={`text-about-who-we-are-title-${section.id}`}
            >
              {section.title}
            </h2>
            <div
              className="mt-8 flex items-center gap-3 text-[#52647c]"
              aria-hidden="true"
            >
              <span className="h-px w-14 bg-[#e3212b]" />
              <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
                Our starting point
              </span>
            </div>
          </header>

          <div className="space-y-14">
            <div
              className="reveal reveal-delay-2 max-w-2xl space-y-5"
              data-testid={`group-about-who-we-are-paragraphs-${section.id}`}
            >
              {paragraphs.map((paragraph, index) => (
                <p
                  key={`${section.id}-paragraph-${index}`}
                  className={
                    index === 0
                      ? "font-display text-[clamp(1.35rem,2.4vw,2rem)] font-semibold leading-[1.25] tracking-[-0.025em] text-[#0b3472]"
                      : "max-w-xl text-base leading-8 text-[#3f5068] sm:text-[1.05rem]"
                  }
                  data-testid={`text-about-who-we-are-paragraph-${section.id}-${index}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div
              className="reveal reveal-delay-3 grid grid-cols-1 gap-4 sm:grid-cols-2"
              data-testid={`group-about-who-we-are-pillars-${section.id}`}
            >
              {visionTitle || visionText ? (
                <article
                  className="group relative overflow-hidden rounded-[1.35rem] border border-[#0b3472]/15 bg-[#e8edf4] p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7"
                  data-testid={`card-about-who-we-are-vision-${section.id}`}
                >
                  <div
                    className="mb-12 flex items-start justify-between"
                    aria-hidden="true"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b3472] text-[#f7f5ef]">
                      <Compass className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-[#0b3472]/45 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                  {visionTitle ? (
                    <h3
                      className="font-display text-2xl font-extrabold tracking-[-0.04em] text-[#0b3472]"
                      data-testid={`text-about-who-we-are-vision-title-${section.id}`}
                    >
                      {visionTitle}
                    </h3>
                  ) : null}
                  {visionText ? (
                    <p
                      className="mt-3 text-sm leading-7 text-[#3f5068]"
                      data-testid={`text-about-who-we-are-vision-text-${section.id}`}
                    >
                      {visionText}
                    </p>
                  ) : null}
                </article>
              ) : null}

              {missionTitle || missionPoints.length > 0 ? (
                <article
                  className="group relative overflow-hidden rounded-[1.35rem] bg-[#0b3472] p-6 text-[#f7f5ef] shadow-[0_18px_40px_rgba(11,52,114,.14)] transition-transform duration-300 hover:-translate-y-1 sm:p-7"
                  data-testid={`card-about-who-we-are-mission-${section.id}`}
                >
                  <div
                    className="mb-12 flex items-start justify-between"
                    aria-hidden="true"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3212b] text-white">
                      <Target className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-white/45 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                  {missionTitle ? (
                    <h3
                      className="font-display text-2xl font-extrabold tracking-[-0.04em]"
                      data-testid={`text-about-who-we-are-mission-title-${section.id}`}
                    >
                      {missionTitle}
                    </h3>
                  ) : null}
                  {missionPoints.length > 0 ? (
                    <ul
                      className="mt-4 space-y-3"
                      data-testid={`list-about-who-we-are-mission-${section.id}`}
                    >
                      {missionPoints.map((point, index) => (
                        <li
                          key={`${section.id}-mission-${index}`}
                          className="flex gap-3 text-sm leading-6 text-[#dce5f1]"
                          data-testid={`text-about-who-we-are-mission-point-${section.id}-${index}`}
                        >
                          <span
                            className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e3212b]"
                            aria-hidden="true"
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutWhoWeAreSection;