import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, ChevronDown, RefreshCw, Send } from "lucide-react";
import { Link } from "wouter";
import {
  getGetHomePageQueryKey,
  useGetHomePage,
} from "@workspace/api-client-react";
import type {
  ContentItem,
  ContentSection,
  HomePage,
} from "@workspace/api-client-react";

const logoPath = "/shastra-college-logo.png";

type UnknownRecord = Record<string, unknown>;

type EnquiryField = {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select";
  placeholder: string;
  required: boolean;
  options: Array<{ label: string; value: string }>;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(
  source: UnknownRecord,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function booleanValue(source: UnknownRecord, keys: string[], fallback: boolean) {
  for (const key of keys) {
    if (typeof source[key] === "boolean") return source[key] as boolean;
  }
  return fallback;
}

function isDemo(source: UnknownRecord): boolean {
  return (
    source.demoCopy === true ||
    source.isDemoCopy === true ||
    source.isDemo === true ||
    source.seeded === true ||
    source.source === "demo"
  );
}

function DemoMarker({ show, dark = false }: { show: boolean; dark?: boolean }) {
  if (!show) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
        dark
          ? "border-white/20 bg-white/10 text-white/75"
          : "border-[#e3212b]/20 bg-[#e3212b]/[.07] text-[#c71927]"
      }`}
      data-testid="badge-demo-copy"
    >
      Demo copy
    </span>
  );
}

function Logo({ home }: { home?: HomePage }) {
  return (
    <Link
      href="/"
      className="focus-ring flex min-w-0 items-center gap-3"
      data-testid="link-brand"
    >
      <img
        src={logoPath}
        alt={home?.settings.collegeName || "Shastra Junior College"}
        className="h-12 w-12 shrink-0 object-contain"
        data-testid="img-college-logo"
      />
      <span className="min-w-0">
        <span className="block truncate font-display text-[1.05rem] font-extrabold tracking-tight text-[#0b3472]">
          {home?.settings.collegeName || "Shastra Junior College"}
        </span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Junior College
        </span>
      </span>
    </Link>
  );
}

function Header({ home }: { home?: HomePage }) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-[#0b3472]/10 bg-[#f7f5ef]/95 px-5 backdrop-blur-xl sm:px-8"
      data-testid="site-header"
    >
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-8">
        <Logo home={home} />
        <nav
          className="flex items-center gap-5 sm:gap-8"
          aria-label="Primary navigation"
          data-testid="nav-primary"
        >
          <Link
            href="/"
            className="focus-ring text-sm font-bold text-[#0b3472] transition-colors hover:text-[#e3212b]"
            data-testid="link-nav-home"
          >
            Home
          </Link>
          <Link
            href="/sign-in"
            className="focus-ring rounded-full border border-[#0b3472]/20 px-4 py-2 text-sm font-bold text-[#0b3472] transition-colors hover:border-[#e3212b] hover:text-[#e3212b] sm:px-5 sm:py-2.5"
            data-testid="link-nav-staff-login"
          >
            Staff Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SectionKicker({
  children,
  dark = false,
}: {
  children: string;
  dark?: boolean;
}) {
  return (
    <span
      className={`eyebrow ${dark ? "text-[#f3b9a7]" : "text-[#e3212b]"}`}
    >
      {children}
    </span>
  );
}

function getHeroFormContent(content: UnknownRecord) {
  const nested =
    isRecord(content.form) ? content.form : isRecord(content.enquiryForm) ? content.enquiryForm : {};
  const merged = { ...content, ...nested };
  const rawFields = merged.fields ?? merged.formFields ?? merged.inputs;
  const fields = Array.isArray(rawFields)
    ? rawFields
        .map((raw, index) => {
          if (!isRecord(raw)) return null;
          const rawType = stringValue(raw, ["type", "inputType"], "text").toLowerCase();
          const type: EnquiryField["type"] =
            rawType === "email" ||
            rawType === "tel" ||
            rawType === "number" ||
            rawType === "textarea" ||
            rawType === "select"
              ? rawType
              : "text";
          const label = stringValue(raw, ["label", "title", "name"], `Field ${index + 1}`);
          const key = stringValue(raw, ["name", "key", "id"], label)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || `field-${index + 1}`;
          const rawOptions = raw.options;
          const options = Array.isArray(rawOptions)
            ? rawOptions
                .map((option) => {
                  if (typeof option === "string" || typeof option === "number") {
                    return { label: String(option), value: String(option) };
                  }
                  if (!isRecord(option)) return null;
                  const optionLabel = stringValue(option, ["label", "title", "name"]);
                  const optionValue = stringValue(option, ["value", "id"], optionLabel);
                  return optionLabel ? { label: optionLabel, value: optionValue } : null;
                })
                .filter((option): option is { label: string; value: string } => Boolean(option))
            : [];
          return {
            key,
            label,
            type,
            placeholder: stringValue(raw, ["placeholder", "hint"]),
            required: booleanValue(raw, ["required", "isRequired"], false),
            options,
          };
        })
        .filter((field): field is EnquiryField => Boolean(field))
    : [];

  return {
    title: stringValue(
      merged,
      ["formTitle", "enquiryTitle", "title"],
      "Make an enquiry",
    ),
    description: stringValue(
      merged,
      ["formDescription", "enquiryDescription", "description"],
      "Tell us a little about what you are looking for.",
    ),
    button: stringValue(
      merged,
      ["formButton", "buttonLabel", "submitLabel"],
      "Send enquiry",
    ),
    successMessage: stringValue(
      merged,
      ["successMessage"],
      "This client-only demo confirmation stays on this page. Nothing was sent externally.",
    ),
    fields:
      fields.length > 0
        ? fields
        : [
            {
              key: "name",
              label: "Your name",
              type: "text" as const,
              placeholder: "Enter your name",
              required: true,
              options: [],
            },
            {
              key: "email",
              label: "Email address",
              type: "email" as const,
              placeholder: "you@example.com",
              required: true,
              options: [],
            },
            {
              key: "phone",
              label: "Phone number",
              type: "tel" as const,
              placeholder: "Your phone number",
              required: false,
              options: [],
            },
          ],
  };
}

function initialFieldValues(fields: EnquiryField[]) {
  return fields.reduce<Record<string, string>>((values, field) => {
    values[field.key] = "";
    return values;
  }, {});
}

function EnquiryForm({ section }: { section: ContentSection }) {
  const config = useMemo(() => getHeroFormContent(section.content), [section.content]);
  const [values, setValues] = useState(() => initialFieldValues(config.fields));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setValues(initialFieldValues(config.fields));
    setSubmitted(false);
  }, [config.fields]);

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="flex min-h-[390px] flex-col justify-between rounded-[2rem] bg-[#0b3472] p-7 text-white shadow-[0_22px_60px_rgba(11,52,114,.18)] sm:p-9"
        data-testid="status-enquiry-confirmation"
        role="status"
        aria-live="polite"
      >
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e3212b]">
            <Check className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#f3b9a7]">
            Enquiry preview complete
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
            Thank you.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/75">
            {config.successMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="focus-ring mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
          data-testid="button-submit-another-enquiry"
        >
          Submit another enquiry <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form
      id="enquire"
      onSubmit={handleSubmit}
      className="rounded-[2rem] bg-[#0b3472] p-6 text-white shadow-[0_22px_60px_rgba(11,52,114,.18)] sm:p-9"
      data-testid="form-enquiry"
    >
      <div className="mb-7 border-b border-white/15 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f3b9a7]">
          Enquiry desk
        </p>
        <h2
          className="mt-3 font-display text-3xl font-extrabold tracking-tight"
          data-testid={`text-enquiry-title-${section.id}`}
        >
          {config.title}
        </h2>
        <p
          className="mt-3 max-w-md text-sm leading-6 text-blue-100/75"
          data-testid={`text-enquiry-description-${section.id}`}
        >
          {config.description}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {config.fields.map((field) => (
          <label
            key={field.key}
            className={`block ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
            data-testid={`field-enquiry-${field.key}`}
          >
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-blue-100/80">
              {field.label}
              {field.required ? <span className="ml-1 text-[#f3b9a7]">*</span> : null}
            </span>
            {field.type === "textarea" ? (
              <textarea
                value={values[field.key] || ""}
                onChange={(event) => updateValue(field.key, event.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
                className="focus-ring w-full resize-y rounded-xl border border-white/15 bg-white/[.08] px-4 py-3 text-sm text-white placeholder:text-blue-100/40"
                data-testid={`textarea-enquiry-${field.key}`}
              />
            ) : field.type === "select" ? (
              <span className="relative block">
                <select
                  value={values[field.key] || ""}
                  onChange={(event) => updateValue(field.key, event.target.value)}
                  required={field.required}
                  className="focus-ring w-full appearance-none rounded-xl border border-white/15 bg-white/[.08] px-4 py-3 text-sm text-white"
                  data-testid={`select-enquiry-${field.key}`}
                >
                  <option value="" className="text-[#0b3472]">
                    {field.placeholder || "Select an option"}
                  </option>
                  {field.options.map((option) => (
                    <option
                      value={option.value}
                      key={`${field.key}-${option.value}`}
                      className="text-[#0b3472]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/70"
                  aria-hidden="true"
                />
              </span>
            ) : (
              <input
                type={field.type}
                value={values[field.key] || ""}
                onChange={(event) => updateValue(field.key, event.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="focus-ring w-full rounded-xl border border-white/15 bg-white/[.08] px-4 py-3 text-sm text-white placeholder:text-blue-100/40"
                data-testid={`input-enquiry-${field.key}`}
              />
            )}
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e3212b] px-5 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
        data-testid="button-submit-enquiry"
      >
        {config.button}
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
      <p className="mt-3 text-center text-[11px] leading-5 text-blue-100/55">
        Demo form only. No information leaves this page.
      </p>
    </form>
  );
}

function HeroSection({ section }: { section: ContentSection }) {
  const content = section.content;
  const eyebrow = stringValue(
    content,
    ["eyebrow"],
    "Shastra Junior College",
  );
  const title = stringValue(
    content,
    ["headline", "heroTitle", "title"],
    section.title || "Shastra Junior College",
  );
  const description = stringValue(
    content,
    ["introduction", "description", "body"],
    section.subtitle || "Find a pathway that fits the next step in your education.",
  );
  const imageUrl = stringValue(content, ["imageUrl", "image"]);

  return (
    <section
      id="hero"
      className="relative overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24"
      data-testid={`section-hero-${section.id}`}
    >
      <div className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full border-[32px] border-[#e3212b]/10" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[#e7edf6]" />
      <div className="relative mx-auto grid max-w-7xl items-end gap-12 lg:grid-cols-[1fr_0.82fr] lg:gap-20">
        <div className="reveal max-w-3xl">
          <div className="mb-7 flex flex-wrap items-center gap-3">
            <SectionKicker>{eyebrow}</SectionKicker>
            <DemoMarker show={isDemo(content)} />
          </div>
          <h1
            className="max-w-4xl font-display text-[clamp(3.25rem,8vw,7.5rem)] font-extrabold leading-[0.91] tracking-[-0.065em] text-[#0b3472]"
            data-testid={`text-hero-title-${section.id}`}
          >
            {title}
          </h1>
          <p
            className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl"
            data-testid={`text-hero-description-${section.id}`}
          >
            {description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#programs"
              className="focus-ring group inline-flex items-center gap-3 rounded-full bg-[#0b3472] px-5 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
              data-testid="link-hero-explore"
            >
              {stringValue(content, ["primaryLabel"], "Explore pathways")}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
            {stringValue(content, ["secondaryLabel"], "Enquire") ? (
              <a
                href="#enquire"
                className="focus-ring inline-flex items-center rounded-full border border-[#0b3472]/20 px-5 py-3.5 text-sm font-bold text-[#0b3472] transition-colors hover:border-[#e3212b] hover:text-[#e3212b]"
                data-testid="link-hero-enquire"
              >
                {stringValue(content, ["secondaryLabel"], "Enquire")}
              </a>
            ) : null}
          </div>
          {imageUrl ? (
            <div className="mt-12 max-w-xl overflow-hidden rounded-[1.5rem] border border-[#0b3472]/10 bg-[#e7edf6]">
              <img
                src={imageUrl}
                alt=""
                className="h-36 w-full object-cover sm:h-44"
                data-testid={`img-hero-${section.id}`}
              />
            </div>
          ) : (
            <div
              className="mt-12 flex max-w-xl items-center gap-4 border-t border-[#0b3472]/15 pt-5"
              data-testid="hero-identity-note"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#e3212b]" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#0b3472]/65">
                A clear start to what comes next
              </span>
            </div>
          )}
        </div>
        <div className="reveal reveal-delay-2">
          <EnquiryForm section={section} />
        </div>
      </div>
    </section>
  );
}

function PathwayImage({ item, index }: { item: ContentItem; index: number }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.title}
        className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.035] sm:h-60"
        data-testid={`img-pathway-${item.id}`}
      />
    );
  }
  return (
    <div
      className={`relative h-52 overflow-hidden sm:h-60 ${
        index % 2 === 0 ? "bg-[#dce7f4]" : "bg-[#f1d8d0]"
      }`}
      aria-hidden="true"
      data-testid={`image-fallback-pathway-${item.id}`}
    >
      <span
        className={`absolute -right-10 -top-14 h-44 w-44 rounded-full border-[24px] ${
          index % 2 === 0 ? "border-[#0b3472]/15" : "border-[#e3212b]/20"
        }`}
      />
      <span
        className={`absolute bottom-0 left-0 h-24 w-32 rounded-tr-[3rem] ${
          index % 2 === 0 ? "bg-[#0b3472]/10" : "bg-[#e3212b]/10"
        }`}
      />
    </div>
  );
}

function PathwaysSection({
  section,
  items,
}: {
  section: ContentSection;
  items: ContentItem[];
}) {
  return (
    <section
      id="programs"
      className="bg-[#fbfaf6] px-5 py-16 sm:px-8 sm:py-24"
      data-testid={`section-programs-${section.id}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#0b3472]/15 pb-7 sm:flex-row sm:items-end">
          <div>
            <SectionKicker>Explore pathways</SectionKicker>
            <h2
              className="mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-[-0.045em] text-[#0b3472] sm:text-6xl"
              data-testid={`text-programs-title-${section.id}`}
            >
              {section.title || "Explore Pathways"}
            </h2>
          </div>
          {section.subtitle ? (
            <p
              className="max-w-sm text-sm leading-6 text-slate-600 sm:text-right"
              data-testid={`text-programs-subtitle-${section.id}`}
            >
              {section.subtitle}
            </p>
          ) : null}
        </div>

        {items.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {items.map((item, index) => {
              const internalPath =
                item.linkPath && item.linkPath.startsWith("#") ? item.linkPath : null;
              return (
                <article
                  key={item.id}
                  className={`group overflow-hidden rounded-[1.75rem] border border-[#0b3472]/10 bg-white ${
                    index === 0 && items.length > 2 ? "md:row-span-2" : ""
                  }`}
                  data-testid={`card-pathway-${item.id}`}
                >
                  <PathwayImage item={item} index={index} />
                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#e3212b]">
                        Pathway
                      </span>
                      <span className="font-mono text-xs text-[#0b3472]/40">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3
                      className="mt-4 font-display text-2xl font-extrabold tracking-tight text-[#0b3472]"
                      data-testid={`text-pathway-title-${item.id}`}
                    >
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p
                        className="mt-3 max-w-lg text-sm leading-6 text-slate-600"
                        data-testid={`text-pathway-description-${item.id}`}
                      >
                        {item.description}
                      </p>
                    ) : null}
                    {internalPath ? (
                      <a
                        href={internalPath}
                        className="focus-ring mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0b3472]"
                        data-testid={`link-pathway-${item.id}`}
                      >
                        {item.label || "View pathway"}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-[1.75rem] border border-dashed border-[#0b3472]/20 bg-[#eaf0f8]/50 px-6 py-14 text-center"
            data-testid="empty-programs"
          >
            <p className="font-display text-2xl font-extrabold text-[#0b3472]">
              Pathways will appear here.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Published programme information will be shown when it is available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

type Metric = {
  value: number | null;
  raw: string;
  prefix: string;
  suffix: string;
  decimals: number;
};

function metricFor(item: ContentItem): Metric {
  const content = item.content;
  const rawValue = content.value ?? content.stat ?? content.number ?? content.amount;
  const raw = typeof rawValue === "string" || typeof rawValue === "number" ? String(rawValue) : "";
  const match = raw.match(/[-+]?\d[\d,]*(?:\.\d+)?/);
  const value = match ? Number(match[0].replace(/,/g, "")) : null;
  const explicitPrefix = stringValue(content, ["prefix"]);
  const explicitSuffix = stringValue(content, ["suffix", "unit"]);
  const matchStart = match?.index ?? 0;
  const matchEnd = match ? matchStart + match[0].length : 0;
  const prefix = explicitPrefix || raw.slice(0, matchStart).trim();
  const suffix = explicitSuffix || raw.slice(matchEnd).trim();
  const decimals = match?.[0].split(".")[1]?.length || 0;
  return { value, raw, prefix, suffix, decimals };
}

function formatMetric(metric: Metric, value: number | null) {
  if (value === null) return metric.raw;
  return `${metric.prefix}${value.toFixed(metric.decimals)}${metric.suffix}`;
}

function StatisticsBar({
  section,
  items,
}: {
  section: ContentSection;
  items: ContentItem[];
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);
  const metrics = useMemo(() => items.map(metricFor), [items]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener?.("change", updateMotion);
    return () => mediaQuery.removeEventListener?.("change", updateMotion);
  }, []);

  useEffect(() => {
    const node = barRef.current;
    if (!node || animatedRef.current || items.length === 0) return;

    let frame = 0;
    let observer: IntersectionObserver | undefined;
    const start = () => {
      if (animatedRef.current) return;
      animatedRef.current = true;
      if (reducedMotion) {
        setCounts(
          metrics.reduce<Record<string, number>>((result, metric, index) => {
            if (metric.value !== null) result[String(index)] = metric.value;
            return result;
          }, {}),
        );
        return;
      }

      const startedAt = performance.now();
      const duration = 1150;
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCounts(
          metrics.reduce<Record<string, number>>((result, metric, index) => {
            if (metric.value !== null) result[String(index)] = metric.value * eased;
            return result;
          }, {}),
        );
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    if (reducedMotion) {
      start();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            start();
            observer?.disconnect();
          }
        },
        { threshold: 0.24 },
      );
      observer.observe(node);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [items.length, metrics, reducedMotion, items]);

  return (
    <section
      ref={barRef}
      id="statistics"
      className="relative overflow-hidden bg-[#0b3472] px-5 py-14 text-white sm:px-8 sm:py-20"
      data-testid={`section-statistics-${section.id}`}
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[34px] border-white/[.07]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-9 max-w-xl">
          <div className="flex flex-wrap items-center gap-3">
            <SectionKicker dark>Statistics</SectionKicker>
            <DemoMarker show={isDemo(section.content)} dark />
          </div>
          <h2
            className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
            data-testid={`text-statistics-title-${section.id}`}
          >
            {section.title || "At a glance"}
          </h2>
          {section.subtitle ? (
            <p
              className="mt-3 text-sm leading-6 text-blue-100/70"
              data-testid={`text-statistics-subtitle-${section.id}`}
            >
              {section.subtitle}
            </p>
          ) : null}
        </div>

        {items.length > 0 ? (
          <div className="grid border-y border-white/15 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => {
              const metric = metrics[index];
              const count = metric.value === null ? null : counts[String(index)] ?? 0;
              return (
                <article
                  key={item.id}
                  className="border-b border-white/15 px-1 py-6 sm:px-6 sm:nth-[n+3]:border-b-0 lg:border-b-0 lg:border-l lg:first:border-l-0"
                  data-testid={`stat-${item.id}`}
                >
                  <div
                    className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
                    data-testid={`value-stat-${item.id}`}
                  >
                    {formatMetric(metric, count)}
                  </div>
                  <h3
                    className="mt-3 text-sm font-bold text-white"
                    data-testid={`text-stat-title-${item.id}`}
                  >
                    {item.title}
                  </h3>
                  {item.description ? (
                    <p
                      className="mt-1 text-xs leading-5 text-blue-100/65"
                      data-testid={`text-stat-description-${item.id}`}
                    >
                      {item.description}
                    </p>
                  ) : null}
                  <DemoMarker show={isDemo(item.content)} dark />
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="border-y border-white/15 py-10 text-sm text-blue-100/70"
            data-testid="empty-statistics"
          >
            Published statistics will appear here when they are available.
          </div>
        )}
      </div>
    </section>
  );
}

function PageSections({ home }: { home: HomePage }) {
  const sections = useMemo(() => {
    const visible = home.sections.filter((section) => section.isVisible);
    const byKey = new Map<string, ContentSection>();
    visible.forEach((section) => {
      const key = section.sectionKey.toLowerCase();
      if (
        (key === "hero" || key === "programs" || key === "statistics") &&
        !byKey.has(key)
      ) {
        byKey.set(key, section);
      }
    });
    return ["hero", "programs", "statistics"]
      .map((key) => byKey.get(key))
      .filter((section): section is ContentSection => Boolean(section));
  }, [home.sections]);

  const itemsBySection = useMemo(() => {
    const visibleItems = home.items.filter((item) => item.isVisible);
    return new Map(
      sections.map((section) => [
        section.id,
        visibleItems
          .filter((item) => item.sectionId === section.id)
          .sort((a, b) => a.position - b.position),
      ]),
    );
  }, [home.items, sections]);

  return (
    <main className="flex flex-col" data-testid="homepage-sections">
      {sections.map((section) => {
        const items = itemsBySection.get(section.id) || [];
        if (section.sectionKey.toLowerCase() === "hero") {
          return <HeroSection key={section.id} section={section} />;
        }
        if (section.sectionKey.toLowerCase() === "programs") {
          return <PathwaysSection key={section.id} section={section} items={items} />;
        }
        return <StatisticsBar key={section.id} section={section} items={items} />;
      })}
    </main>
  );
}

function LoadingHome() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f5ef]" data-testid="status-home-loading">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between border-b border-[#0b3472]/10 px-5 sm:px-8">
        <div className="h-10 w-52 animate-pulse rounded-lg bg-[#dce5f1]" />
        <div className="h-9 w-28 animate-pulse rounded-full bg-[#dce5f1]" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2">
        <div>
          <div className="h-4 w-36 animate-pulse rounded bg-[#efd2ca]" />
          <div className="mt-7 h-32 max-w-2xl animate-pulse rounded-2xl bg-[#dce5f1]" />
          <div className="mt-7 h-8 max-w-xl animate-pulse rounded bg-[#e4e0d8]" />
        </div>
        <div className="min-h-[390px] animate-pulse rounded-[2rem] bg-[#dce5f1]" />
      </div>
    </div>
  );
}

function ErrorHome({ retry }: { retry: () => void }) {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center bg-[#f7f5ef] p-6"
      data-testid="status-home-error"
    >
      <div className="max-w-md rounded-[2rem] border border-[#0b3472]/10 bg-white p-9 text-center shadow-[0_18px_45px_rgba(11,52,114,.08)]">
        <p className="eyebrow text-[#e3212b]">Connection issue</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#0b3472]">
          The homepage could not load.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Please try again. The published college content is still available when
          the connection returns.
        </p>
        <button
          type="button"
          onClick={retry}
          className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white"
          data-testid="button-retry-home"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}

export default function PublicHomePage() {
  const query = useGetHomePage({
    query: { queryKey: getGetHomePageQueryKey() },
  });

  if (query.isLoading) return <LoadingHome />;
  if (query.isError || !query.data) return <ErrorHome retry={() => query.refetch()} />;

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#f7f5ef]">
      <Header home={query.data} />
      <PageSections home={query.data} />
    </div>
  );
}