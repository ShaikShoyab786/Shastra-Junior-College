import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { Link } from "wouter";
import {
  getGetAdminEnquiriesQueryKey,
  getGetHomePageQueryKey,
  useCreateEnquiry,
  useGetHomePage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  ContentItem,
  ContentSection,
  HomePage,
} from "@workspace/api-client-react";

const logoPath = "/shastra-college-logo.png";

type UnknownRecord = Record<string, unknown>;

function collegeLogo(path?: string | null) {
  if (!path) return logoPath;
  return path.startsWith("/objects/") ? `/api/storage${path}` : path;
}

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
      aria-label="జి.పి.రెడ్డి గ్రూప్, శస్త్ర విద్యాసంస్థలు"
      className="focus-ring flex min-w-0 items-center gap-2.5 sm:gap-3"
      data-testid="link-brand"
    >
      <img
        src={collegeLogo(home?.settings.logoUrl)}
        alt=""
        className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
        data-testid="img-college-logo"
      />
      <span className="flex min-w-0 flex-col justify-center">
        <span className="font-telugu text-[10px] font-semibold leading-tight text-[#0b3472] sm:text-[13px]">
          జి.పి.రెడ్డి గ్రూప్
        </span>
        <span className="font-telugu mt-0.5 flex items-baseline gap-[0.34em] whitespace-nowrap text-[clamp(1rem,6vw,1.65rem)] font-black leading-tight">
          <span className="brand-name-red">శస్త్ర</span>
          <span className="brand-name-blue">విద్యాసంస్థలు</span>
        </span>
      </span>
    </Link>
  );
}

export function Header({ home }: { home?: HomePage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const cmsNavigation = home?.settings.navigation || [];
  const navigation = cmsNavigation.some((link) => link.path === "/gallery")
    ? cmsNavigation
    : [...cmsNavigation, { label: "Gallery", path: "/gallery" }];

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#0b3472]/10 bg-[#f7f5ef]/95 px-5 backdrop-blur-xl sm:px-8"
      data-testid="site-header"
    >
      <div className="relative mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 sm:gap-8">
        <Logo home={home} />
        <nav
          className={`${
            mobileOpen
              ? "absolute left-0 right-0 top-full flex flex-col items-stretch gap-1 border-b border-[#0b3472]/10 bg-[#f7f5ef] p-4 shadow-lg md:static md:flex-row md:items-center md:gap-5 md:border-0 md:bg-transparent md:p-0 md:shadow-none"
              : "hidden md:flex md:items-center md:gap-5 lg:gap-8"
          }`}
          aria-label="Primary navigation"
          data-testid="nav-primary"
        >
          {navigation.length === 0 ? (
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="focus-ring rounded-lg px-3 py-2 text-sm font-bold text-[#0b3472] transition-colors hover:text-[#e3212b] md:px-0 md:py-0"
              data-testid="link-nav-home"
            >
              Home
            </Link>
          ) : (
            navigation.map((link, index) => (
              <Link
                href={link.path}
                key={`${link.path}-${index}`}
                onClick={() => setMobileOpen(false)}
                className="focus-ring rounded-lg px-3 py-2 text-sm font-bold text-[#0b3472] transition-colors hover:text-[#e3212b] md:px-0 md:py-0"
                data-testid={`link-nav-custom-${index}`}
              >
                {link.label}
              </Link>
            ))
          )}
          <Link
            href="/sign-in"
            onClick={() => setMobileOpen(false)}
            className="focus-ring rounded-full border border-[#0b3472]/20 px-4 py-2 text-sm font-bold text-[#0b3472] transition-colors hover:border-[#e3212b] hover:text-[#e3212b] sm:px-5 sm:py-2.5"
            data-testid="link-nav-staff-login"
          >
            Staff Login
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="focus-ring rounded-lg p-2 text-[#0b3472] md:hidden"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          data-testid="button-toggle-site-nav"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}

export function Footer({ home }: { home: HomePage }) {
  const cmsNavigation = home.settings.navigation;
  const navigation = cmsNavigation.some((link) => link.path === "/gallery")
    ? cmsNavigation
    : [...cmsNavigation, { label: "Gallery", path: "/gallery" }];
  return (
    <footer className="bg-[#082859] px-5 py-10 text-white sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-xl items-start gap-4">
          <img
            src={collegeLogo(home.settings.logoUrl)}
            alt=""
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div>
            <p className="font-display text-lg font-extrabold">
              {home.settings.collegeName}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-100/65">
              {home.settings.headerTagline}
            </p>
            {home.settings.footerNote ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-blue-100/75">
                {home.settings.footerNote}
              </p>
            ) : null}
          </div>
        </div>
        {navigation.length > 0 ? (
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-blue-100/80"
            aria-label="Footer navigation"
          >
            {navigation.map((link, index) => (
              <Link
                href={link.path}
                key={`${link.path}-${index}`}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-white/15 pt-4 text-xs text-blue-100/55">
        © {new Date().getFullYear()} {home.settings.collegeName}
      </div>
    </footer>
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
          const key =
            stringValue(raw, ["name", "key", "id"], label).trim() ||
            `field-${index + 1}`;
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
    eyebrow: stringValue(
      merged,
      ["eyebrow", "formEyebrow"],
      "ADMISSIONS ENQUIRY",
    ),
    title: stringValue(
      merged,
      ["formTitle", "enquiryTitle", "title"],
      "Talk with our team",
    ),
    description: stringValue(
      merged,
      ["formDescription", "enquiryDescription", "description"],
      "Share a few details about your interests so we can guide your next step.",
    ),
    button: (() => {
      const label = stringValue(
        merged,
        ["formButton", "buttonLabel", "submitLabel"],
        "Send enquiry",
      );
      return label === "Preview enquiry" ? "Send enquiry" : label;
    })(),
    note: (() => {
      const note = stringValue(
        merged,
        ["note", "privacyNote"],
        "Your details will be shared with the college admissions team.",
      );
      return note.startsWith("Preview only")
        ? "Your details will be shared with the college admissions team."
        : note;
    })(),
    successMessage: (() => {
      const message = stringValue(
        merged,
        ["successMessage"],
        "Thank you. Our admissions team has received your enquiry.",
      );
      return message.startsWith("This preview is complete")
        ? "Thank you. Our admissions team has received your enquiry."
        : message;
    })(),
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
  const queryClient = useQueryClient();
  const createEnquiry = useCreateEnquiry();
  const config = useMemo(() => getHeroFormContent(section.content), [section.content]);
  const [values, setValues] = useState(() => initialFieldValues(config.fields));
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setValues(initialFieldValues(config.fields));
    setSubmitted(false);
    setSubmitError("");
  }, [config.fields]);

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (submitted) setSubmitted(false);
    if (submitError) setSubmitError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createEnquiry.isPending) return;
    setSubmitError("");
    createEnquiry.mutate(
      { data: { values } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getGetAdminEnquiriesQueryKey(),
          });
          setValues(initialFieldValues(config.fields));
          setSubmitted(true);
        },
        onError: (error) => {
          setSubmitError(
            error instanceof Error
              ? error.message
              : "Your enquiry could not be sent. Please try again.",
          );
        },
      },
    );
  };

  if (submitted) {
    return (
      <div
        className="flex h-full flex-col justify-between rounded-[1.75rem] bg-[#0b3472] p-6 text-white shadow-[0_22px_60px_rgba(11,52,114,.16)] sm:p-7"
        data-testid="status-enquiry-confirmation"
        role="status"
        aria-live="polite"
      >
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e3212b]">
            <Check className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#f3b9a7]">
            Enquiry received
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
            Thank you
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
          Send another enquiry <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form
      id="enquire"
      onSubmit={handleSubmit}
      className="flex h-full flex-col rounded-[1.75rem] bg-[#0b3472] p-6 text-white shadow-[0_22px_60px_rgba(11,52,114,.16)] sm:p-7"
      data-testid="form-enquiry"
    >
      <div className="mb-5 border-b border-white/15 pb-5">
        <p
          className="text-xs font-bold uppercase tracking-[0.18em] text-[#f3b9a7]"
          data-testid={`text-enquiry-eyebrow-${section.id}`}
        >
          {config.eyebrow}
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

      <div className="grid flex-1 content-start gap-3 sm:grid-cols-2">
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
        disabled={createEnquiry.isPending}
        className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e3212b] px-5 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
        data-testid="button-submit-enquiry"
      >
        {createEnquiry.isPending ? "Sending…" : config.button}
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
      {submitError ? (
        <p
          className="mt-3 text-center text-sm font-semibold text-rose-200"
          role="alert"
          data-testid="error-enquiry-submit"
        >
          {submitError}
        </p>
      ) : null}
      <p className="mt-3 text-center text-[11px] leading-5 text-blue-100/55">
        {config.note}
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
  return (
    <section
      id="hero"
      className="relative overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 pt-5 pb-7 sm:px-8 sm:pt-6 sm:pb-8 lg:pt-7 lg:pb-9"
      data-testid={`section-hero-${section.id}`}
    >
      <div className="relative mx-auto grid max-w-7xl items-stretch gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
        <div className="reveal max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SectionKicker>{eyebrow}</SectionKicker>
          </div>
          <h1
            className="max-w-[13ch] font-display text-[clamp(3rem,6.1vw,6.5rem)] font-extrabold leading-[0.96] tracking-[-0.06em] text-[#0b3472]"
            data-testid={`text-hero-title-${section.id}`}
          >
            {title}
          </h1>
          <p
            className="mt-5 max-w-xl text-lg leading-7 text-slate-600 sm:text-xl sm:leading-8"
            data-testid={`text-hero-description-${section.id}`}
          >
            {description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
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
        </div>
        <div className="reveal reveal-delay-2 h-full">
          <EnquiryForm section={section} />
        </div>
      </div>
    </section>
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
      className="border-y border-[#0b3472]/10 bg-[#fbfaf6] px-5 py-5 sm:px-8 sm:py-6"
      data-testid={`section-programs-${section.id}`}
    >
      <div className="mx-auto max-w-7xl">
        <h2
          className="eyebrow mb-3 text-[#0b3472]/75"
          data-testid={`text-programs-title-${section.id}`}
        >
          {section.title || "Explore Program Pathways:"}
        </h2>
        <nav aria-label="Program pathways">
          <ul className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href="/"
                  aria-label={`Return home to explore ${item.title}`}
                  className="focus-ring pathway-chip group inline-flex min-h-10 items-center gap-2.5 rounded-full border border-[#0b3472]/20 bg-white px-4 py-2 text-sm font-bold text-[#0b3472] shadow-[0_2px_8px_rgba(11,52,114,.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#0b3472] hover:bg-[#eaf1fb] hover:shadow-[0_8px_18px_rgba(11,52,114,.14)] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:transform-none"
                  data-testid={`link-pathway-${item.id}`}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e3212b] transition-shadow group-hover:shadow-[0_0_0_3px_rgba(227,33,43,.16)]"
                    aria-hidden="true"
                  />
                  <span>{item.title}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>
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
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: metric.decimals,
    maximumFractionDigits: metric.decimals,
  }).format(value);
  return `${metric.prefix}${formatted}${metric.suffix}`;
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
      const duration = 1050;
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
      className="statistics-band border-y border-white/10 bg-[#0b3472] px-5 py-6 text-white sm:px-8 sm:py-8"
      data-testid={`section-statistics-${section.id}`}
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="sr-only" data-testid={`text-statistics-title-${section.id}`}>
          {section.title || "College statistics"}
        </h2>
        {items.length > 0 ? (
          <div
            className="statistics-grid"
            style={{ "--statistics-columns": Math.min(items.length, 4) } as React.CSSProperties}
            data-testid={`grid-statistics-${section.id}`}
          >
            {items.map((item, index) => {
              const metric = metrics[index];
              const count = metric.value === null ? null : counts[String(index)] ?? 0;
              return (
                <article
                  key={item.id}
                  className="min-w-0 border-b border-white/15 px-4 py-4 sm:px-6 sm:py-5 lg:border-b-0 lg:border-l lg:first:border-l-0 lg:px-8"
                  data-testid={`stat-${item.id}`}
                >
                  <div
                    className="statistics-value font-display text-4xl font-extrabold leading-none tracking-tight text-[#e3212b] sm:text-5xl"
                    data-testid={`value-stat-${item.id}`}
                  >
                    {formatMetric(metric, count)}
                  </div>
                  <h3
                    className="mt-3 text-[10px] font-bold uppercase leading-5 tracking-[0.14em] text-blue-100/80 sm:text-[11px]"
                    data-testid={`text-stat-title-${item.id}`}
                  >
                    {item.title}
                  </h3>
                  <span className="mt-2 block">
                    <DemoMarker show={isDemo(item.content) || isDemo(section.content)} dark />
                  </span>
                  {item.description ? (
                    <p
                      className="mt-1 text-xs leading-5 text-blue-100/65"
                      data-testid={`text-stat-description-${item.id}`}
                    >
                      {item.description}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="border-y border-white/15 py-10 text-sm text-blue-100/70"
            data-testid="empty-statistics"
          >
            Statistics will appear here when approved college figures are available.
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
    <div
      className="min-h-[100dvh] overflow-hidden bg-[#f7f5ef]"
      data-college-theme
      style={
        {
          "--college-primary": query.data.settings.primaryColor,
          "--college-accent": query.data.settings.accentColor,
        } as React.CSSProperties
      }
    >
      <Header home={query.data} />
      <PageSections home={query.data} />
      <Footer home={query.data} />
    </div>
  );
}