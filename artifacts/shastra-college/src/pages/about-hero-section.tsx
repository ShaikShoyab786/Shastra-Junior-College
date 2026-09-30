import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { ContentItem, ContentSection } from "@workspace/api-client-react";
import {
  formatMetric,
  useAnimatedStatistics,
} from "@/lib/animated-statistics";

type AboutHeroContent = {
  eyebrow?: unknown;
  imageUrl?: unknown;
  imageAlt?: unknown;
  primaryCtaLabel?: unknown;
  primaryCtaPath?: unknown;
  secondaryCtaLabel?: unknown;
  secondaryCtaPath?: unknown;
};

type AboutHeroSectionProps = {
  section: ContentSection;
  statistics: ContentItem[];
};

function textValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function contentFrom(section: ContentSection): AboutHeroContent {
  return section.content as AboutHeroContent;
}

function assetUrl(value: string): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  if (value.startsWith("/") && basePath && !value.startsWith(`${basePath}/`)) {
    return `${basePath}${value}`;
  }
  return value;
}

function isExternalPath(path: string): boolean {
  return /^(?:https?:\/\/|mailto:|tel:)/i.test(path);
}

function CtaLink({
  label,
  path,
  variant,
  testId,
}: {
  label: string;
  path: string;
  variant: "primary" | "secondary";
  testId: string;
}) {
  const className =
    variant === "primary"
      ? "focus-ring group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#0b3472] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(11,52,114,.15)] transition-colors hover:bg-[#082859]"
      : "focus-ring inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#0b3472]/25 bg-transparent px-6 py-3.5 text-sm font-bold text-[#0b3472] transition-colors hover:border-[#e3212b] hover:text-[#e3212b]";

  const children = (
    <>
      <span>{label}</span>
      <ArrowRight
        className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      />
    </>
  );

  if (isExternalPath(path)) {
    return (
      <a
        href={path}
        className={className}
        data-testid={testId}
        rel={path.startsWith("http") ? "noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={path} className={className} data-testid={testId}>
      {children}
    </Link>
  );
}

export function AboutHeroSection({
  section,
  statistics,
}: AboutHeroSectionProps) {
  const { containerRef: statisticsRef, metrics, counts } =
    useAnimatedStatistics<HTMLDListElement>(statistics);
  const content = contentFrom(section);
  const eyebrow = textValue(content.eyebrow);
  const imageUrl = textValue(content.imageUrl);
  const imageAlt = textValue(content.imageAlt);
  const primaryCtaLabel = textValue(content.primaryCtaLabel);
  const primaryCtaPath = textValue(content.primaryCtaPath);
  const secondaryCtaLabel = textValue(content.secondaryCtaLabel);
  const secondaryCtaPath = textValue(content.secondaryCtaPath);

  return (
    <section
      className="about-hero-section overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
      aria-labelledby={`about-hero-title-${section.id}`}
      data-testid={`section-about-hero-${section.id}`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.93fr)_minmax(0,1.07fr)] lg:gap-x-14 lg:gap-y-12">
        <div className="order-1 flex flex-col justify-center lg:col-start-1 lg:row-start-1">
          {eyebrow ? (
            <p
              className="eyebrow mb-4 text-[#e3212b]"
              data-testid={`text-about-hero-eyebrow-${section.id}`}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            id={`about-hero-title-${section.id}`}
            className="about-hero-heading max-w-[12ch] font-display text-[clamp(2.9rem,6vw,5.9rem)] font-extrabold leading-[0.97] tracking-[-0.06em] text-[#0b3472]"
            data-testid={`text-about-hero-title-${section.id}`}
          >
            {section.title}
          </h1>
          {section.subtitle ? (
            <p
              className="mt-6 max-w-xl text-base leading-7 text-[#3f5068] sm:text-lg sm:leading-8"
              data-testid={`text-about-hero-subtitle-${section.id}`}
            >
              {section.subtitle}
            </p>
          ) : null}
          <div
            className="mt-7 flex flex-wrap gap-3"
            data-testid={`group-about-hero-ctas-${section.id}`}
          >
            <CtaLink
              label={primaryCtaLabel}
              path={primaryCtaPath}
              variant="primary"
              testId={`link-about-hero-primary-${section.id}`}
            />
            <CtaLink
              label={secondaryCtaLabel}
              path={secondaryCtaPath}
              variant="secondary"
              testId={`link-about-hero-secondary-${section.id}`}
            />
          </div>
        </div>

        <figure className="order-2 m-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="relative aspect-[1.18/1] overflow-hidden rounded-[1.5rem] border border-[#0b3472]/15 bg-[#dce5f1] shadow-[0_22px_50px_rgba(11,52,114,.14)] sm:rounded-[2rem]">
            {imageUrl ? (
              <img
                src={assetUrl(imageUrl)}
                alt={imageAlt}
                className="h-full w-full object-cover"
                data-testid={`img-about-hero-${section.id}`}
              />
            ) : (
              <div
                className="flex h-full items-center justify-center px-8 text-center text-sm font-semibold text-[#0b3472]/65"
                role="img"
                aria-label={imageAlt}
                data-testid={`img-about-hero-placeholder-${section.id}`}
              >
                {imageAlt}
              </div>
            )}
          </div>
          <figcaption className="sr-only">{imageAlt}</figcaption>
        </figure>

        <dl
          ref={statisticsRef}
          className="order-3 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-[#0b3472]/15 pt-6 sm:grid-cols-3 lg:col-start-1 lg:row-start-2 lg:grid-cols-3 lg:gap-x-7 xl:grid-cols-4"
          data-testid={`list-about-hero-statistics-${section.id}`}
        >
          {statistics.map((item, index) => {
            const metric = metrics[index];
            const count =
              metric.value === null ? null : counts[String(index)] ?? 0;
            return (
              <div
                key={item.id}
                className="flex flex-col"
                data-testid={`stat-about-hero-${item.id}`}
              >
                <dt
                  className="order-2 mt-2 text-[0.68rem] font-bold uppercase leading-4 tracking-[0.12em] text-[#52647c]"
                  data-testid={`text-about-hero-stat-label-${item.id}`}
                >
                  {item.title}
                </dt>
                <dd
                  className="order-1 m-0 whitespace-nowrap font-display text-[clamp(1.35rem,2.3vw,1.8rem)] font-extrabold leading-none tracking-[-0.045em] text-[#e3212b]"
                  data-testid={`text-about-hero-stat-value-${item.id}`}
                >
                  {formatMetric(metric, count)}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

export default AboutHeroSection;