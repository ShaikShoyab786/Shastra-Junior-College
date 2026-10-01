import {
  ArrowRight,
  BookOpen,
  Compass,
  Lightbulb,
  Newspaper,
} from "lucide-react";
import { Link } from "wouter";
import type { ContentSection } from "@workspace/api-client-react";

type PreviewCard = {
  title: string;
  description: string;
  Icon: typeof BookOpen;
};

const previewCards: PreviewCard[] = [
  {
    title: "Study Guides",
    description: "Clear resources for focused preparation.",
    Icon: BookOpen,
  },
  {
    title: "Subject Notes",
    description: "Ideas and concepts to explore further.",
    Icon: Lightbulb,
  },
  {
    title: "Learning Updates",
    description: "News and insights from the college.",
    Icon: Newspaper,
  },
];

function contentRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function textValue(
  content: Record<string, unknown>,
  key: string,
  fallback: string,
) {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default function KnowledgeHubPreview({
  section,
}: {
  section: ContentSection;
}) {
  const content = contentRecord(section.content);
  const eyebrow = textValue(content, "eyebrow", "KNOWLEDGE HUB");
  const ctaLabel = textValue(content, "ctaLabel", "Explore Knowledge Hub");

  return (
    <section
      className="relative overflow-hidden bg-[#f7f5ef] px-5 py-14 sm:px-8 sm:py-20"
      aria-labelledby="home-knowledge-hub-heading"
      data-testid="section-home-knowledge-hub-preview"
    >
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border-[28px] border-[#0b3472]/[.045]"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
        <div className="relative z-10">
          <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
          <h2
            id="home-knowledge-hub-heading"
            className="mt-4 max-w-[15ch] font-display text-4xl font-extrabold leading-[1.04] tracking-[-.055em] text-[#0b3472] sm:text-5xl"
          >
            {section.title}
          </h2>
          {section.subtitle ? (
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#53657d] sm:text-base">
              {section.subtitle}
            </p>
          ) : null}
          <Link
            href="/knowledge-hub"
            className="focus-ring group mt-7 inline-flex items-center gap-3 rounded-full bg-[#e3212b] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(227,33,43,.18)] transition hover:-translate-y-0.5 hover:bg-[#bd1722]"
            data-testid="link-home-knowledge-hub"
          >
            {ctaLabel}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="relative rounded-[2rem] bg-[#0b3472] p-5 shadow-[0_24px_60px_rgba(11,52,114,.16)] sm:p-7">
          <div
            className="pointer-events-none absolute -bottom-20 -right-12 h-56 w-56 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div className="relative mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-blue-100/70">Explore and learn</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
                Find your next idea
              </h3>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#f6b1ac]">
              <Compass className="h-6 w-6" aria-hidden="true" />
            </span>
          </div>
          <div className="relative grid gap-3 sm:grid-cols-3">
            {previewCards.map(({ title, description, Icon }, index) => (
              <Link
                key={title}
                href="/knowledge-hub"
                className="focus-ring group flex min-h-40 flex-col rounded-2xl border border-white/10 bg-white/[.07] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[.12] sm:min-h-48 sm:p-5"
                data-testid={`link-knowledge-hub-preview-card-${index + 1}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3212b]/20 text-[#ffc1bc] transition-colors group-hover:bg-[#e3212b]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-5 font-display text-lg font-extrabold leading-tight text-white">
                  {title}
                </span>
                <span className="mt-2 text-xs leading-5 text-blue-100/70">
                  {description}
                </span>
                <ArrowRight
                  className="mt-auto hidden h-4 w-4 translate-y-1 text-[#f6b1ac] opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 sm:block"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}