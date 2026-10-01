import { ArrowRight, Mail, Map, MapPin, Phone, RefreshCw } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";
import {
  getGetCmsPageQueryKey,
  getGetHomePageQueryKey,
  useGetCmsPage,
  useGetHomePage,
} from "@workspace/api-client-react";
import type { ContentSection } from "@workspace/api-client-react";
import {
  EnquiryForm,
  Footer,
  Header,
} from "./public-home";
import FaqSection from "../components/faq-section";
import {
  getPhoneHref,
  getWhatsAppHref,
  isGoogleMapsEmbedUrl,
  isValidPublicEmail,
  readContactDetails,
} from "../lib/contact-details";

type Destination = "courses" | "knowledge-hub" | "contact";

const destinationContent: Record<
  Destination,
  { eyebrow: string; title: string; description: string; notice: string }
> = {
  courses: {
    eyebrow: "ACADEMIC PATHWAYS",
    title: "Courses",
    description: "Explore course information from Shastra Junior College.",
    notice:
      "Course details are being prepared for this page. Contact the college to ask about current course options.",
  },
  "knowledge-hub": {
    eyebrow: "LEARNING RESOURCES",
    title: "Knowledge Hub",
    description: "A place for learning resources and college updates.",
    notice:
      "Resources and learning updates will appear here as the college shares them.",
  },
  contact: {
    eyebrow: "GET IN TOUCH",
    title: "Contact",
    description:
      "Send an enquiry to the college team using the form below.",
    notice: "The college enquiry form is currently unavailable.",
  },
};

function PageLoading() {
  return (
    <div
      className="min-h-[100dvh] bg-[#f7f5ef] px-5 py-16 sm:px-8"
      aria-busy="true"
      data-testid="status-public-destination-loading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-36 animate-pulse rounded bg-[#efd2ca]" />
        <div className="mt-6 h-14 max-w-xl animate-pulse rounded-xl bg-[#dce5f1]" />
        <div className="mt-5 h-6 max-w-2xl animate-pulse rounded bg-[#e4e0d8]" />
      </div>
    </div>
  );
}

function PageError({ retry }: { retry: () => void }) {
  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-[#f7f5ef] p-6"
      role="alert"
      data-testid="status-public-destination-error"
    >
      <div className="max-w-md rounded-[2rem] border border-[#0b3472]/10 bg-white p-9 text-center shadow-[0_18px_45px_rgba(11,52,114,.08)]">
        <p className="eyebrow text-[#e3212b]">Connection issue</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#0b3472]">
          This page could not load.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Please try again when the college site connection is available.
        </p>
        <button
          type="button"
          onClick={retry}
          className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white"
          data-testid="button-retry-public-destination"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </main>
  );
}

function DestinationContent({
  destination,
  heroSection,
}: {
  destination: Destination;
  heroSection?: ContentSection;
}) {
  const page = destinationContent[destination];

  return (
    <main
      className="min-h-[65vh] bg-[#f7f5ef] px-5 py-14 sm:px-8 sm:py-20"
      data-testid={`page-public-${destination}`}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className={
            destination === "contact"
              ? "grid items-start gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(360px,1fr)] lg:gap-16"
              : "mx-auto max-w-3xl text-center"
          }
        >
          <header className={destination === "contact" ? "pt-2" : ""}>
            <p className="eyebrow text-[#c07823]">{page.eyebrow}</p>
            <h1 className="mt-3 font-display text-[clamp(2.7rem,6vw,5.2rem)] font-extrabold leading-[.95] tracking-[-.065em] text-[#0b3472]">
              {page.title}
            </h1>
            <p className="mt-5 text-base leading-7 text-[#52647c] sm:text-lg">
              {page.description}
            </p>
          </header>

          {destination === "contact" && heroSection ? (
            <EnquiryForm section={heroSection} />
          ) : (
            <section
              className={`mt-9 rounded-[1.5rem] border border-[#0b3472]/10 bg-white p-6 shadow-[0_18px_45px_rgba(11,52,114,.07)] sm:p-8 ${
                destination === "contact" ? "lg:mt-0" : ""
              }`}
              aria-label={`${page.title} information`}
              data-testid={`card-public-${destination}-notice`}
            >
              <p className="text-sm leading-7 text-[#52647c]">{page.notice}</p>
              {destination !== "contact" ? (
                <Link
                  href="/contact"
                  className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#082859]"
                  data-testid={`link-public-${destination}-contact`}
                >
                  Contact the college
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function contentRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function ContactContent({
  heroSection,
  enquirySection,
}: {
  heroSection: ContentSection;
  enquirySection: ContentSection;
}) {
  const heroCopy = contentRecord(heroSection.content);
  const eyebrow =
    typeof heroCopy.eyebrow === "string" ? heroCopy.eyebrow : "";
  const details = readContactDetails(heroCopy);
  const phoneNumbers = details.mobileNumbers
    .filter((number) => getPhoneHref(number))
    .slice(0, 5);
  const publicEmail = isValidPublicEmail(details.email)
    ? details.email.trim()
    : "";
  const whatsappHref = getWhatsAppHref(details.whatsappNumber);
  const mapEmbedUrl = isGoogleMapsEmbedUrl(details.mapEmbedUrl)
    ? details.mapEmbedUrl.trim()
    : "";
  const hasContactDetails = Boolean(
    details.address || publicEmail || phoneNumbers.length || whatsappHref,
  );

  return (
    <main
      className="min-h-[65vh] bg-[#f7f5ef]"
      data-testid="page-public-contact"
    >
      <section
        className="relative overflow-hidden bg-[#0b3472] px-5 py-14 text-white sm:px-8 sm:py-20"
        data-testid="section-contact-hero"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-12 h-56 w-56 rounded-full border border-white/10" />
        <div
          className={`relative mx-auto max-w-7xl ${
            hasContactDetails
              ? "grid items-center gap-10 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-14"
              : "max-w-4xl text-center"
          }`}
        >
          <header className={hasContactDetails ? "pt-2" : ""}>
            <p className="eyebrow text-[#ffc7a0]">{eyebrow}</p>
            <h1 className="mt-3 font-display text-[clamp(2.7rem,6vw,5.2rem)] font-extrabold leading-[.95] tracking-[-.065em]">
              {heroSection.title}
            </h1>
            {heroSection.subtitle ? (
              <p
                className={`mt-5 text-base leading-7 text-blue-100/85 sm:text-lg ${
                  hasContactDetails ? "max-w-2xl" : "mx-auto max-w-2xl"
                }`}
              >
                {heroSection.subtitle}
              </p>
            ) : null}
          </header>

          {hasContactDetails ? (
            <div
              className="grid gap-3 sm:grid-cols-2"
              data-testid="list-contact-hero-details"
            >
              {details.address ? (
                <div
                  className="flex gap-4 rounded-2xl bg-white p-5 text-[#0b3472] shadow-[0_18px_38px_rgba(0,0,0,.12)] sm:col-span-2 sm:p-6"
                  data-testid="card-contact-address"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b3472]/[.07]">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#c07823]">
                      College address
                    </p>
                    <address className="mt-2 whitespace-pre-line text-base font-bold not-italic leading-7 sm:text-lg">
                      {details.address}
                    </address>
                  </div>
                </div>
              ) : null}

              {publicEmail ? (
                <a
                  href={`mailto:${publicEmail}`}
                  className="focus-ring flex min-w-0 items-center gap-4 rounded-2xl bg-white p-4 text-[#0b3472] shadow-[0_18px_38px_rgba(0,0,0,.12)] transition hover:bg-blue-50"
                  data-testid="link-contact-email"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b3472]/[.07]">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold uppercase tracking-[.14em] text-[#c07823]">
                      Email
                    </span>
                    <span className="mt-1 block break-all text-sm font-bold sm:text-base">
                      {publicEmail}
                    </span>
                  </span>
                </a>
              ) : null}

              {phoneNumbers.map((number, index) => (
                <a
                  key={`${number}-${index}`}
                  href={getPhoneHref(number)}
                  className="focus-ring flex min-w-0 items-center gap-4 rounded-2xl bg-white p-4 text-[#0b3472] shadow-[0_18px_38px_rgba(0,0,0,.12)] transition hover:bg-blue-50"
                  data-testid={`link-contact-phone-${index}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b3472]/[.07]">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold uppercase tracking-[.14em] text-[#c07823]">
                      Call us
                    </span>
                    <span className="mt-1 block break-all text-sm font-bold sm:text-base">
                      {number}
                    </span>
                  </span>
                </a>
              ))}

              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat with Shastra Junior College on WhatsApp at ${details.whatsappNumber}`}
                  className="focus-ring flex min-w-0 items-center gap-4 rounded-2xl bg-[#e8f8ee] p-4 text-[#075e36] shadow-[0_18px_38px_rgba(0,0,0,.12)] transition hover:bg-[#d9f2e3]"
                  data-testid="link-contact-whatsapp"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25d366] text-white">
                    <SiWhatsapp className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold uppercase tracking-[.14em]">
                      WhatsApp
                    </span>
                    <span className="mt-1 block break-all text-sm font-bold sm:text-base">
                      {details.whatsappNumber}
                    </span>
                  </span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section
        className="px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14"
        data-testid="section-contact-enquiry"
      >
        <div className="mx-auto max-w-5xl">
          <EnquiryForm section={enquirySection} />
        </div>
      </section>

      {mapEmbedUrl ? (
        <section
          className="px-5 pb-2 pt-8 sm:px-8 sm:pt-10"
          data-testid="section-contact-map"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b3472]/[.07] text-[#0b3472]">
                <Map className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow text-[#c07823]">LOCATION</p>
                <h2 className="font-display text-xl font-extrabold text-[#0b3472] sm:text-2xl">
                  College location
                </h2>
              </div>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-[#0b3472]/10 bg-white shadow-[0_18px_45px_rgba(11,52,114,.08)] sm:aspect-[3/1]">
              <iframe
                src={mapEmbedUrl}
                title="Map showing the college location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="h-full w-full border-0"
                data-testid="iframe-contact-map"
              />
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function PublicDestinationPage({ destination }: { destination: Destination }) {
  const query = useGetHomePage({
    query: { queryKey: getGetHomePageQueryKey() },
  });
  const contactPage = useGetCmsPage("contact", {
    query: {
      queryKey: getGetCmsPageQueryKey("contact"),
      enabled: destination === "contact",
    },
  });

  if (query.isLoading || (destination === "contact" && contactPage.isLoading)) {
    return <PageLoading />;
  }
  if (
    query.isError ||
    !query.data ||
    (destination === "contact" &&
      (contactPage.isError || !contactPage.data))
  ) {
    return (
      <PageError
        retry={() => {
          void query.refetch();
          if (destination === "contact") void contactPage.refetch();
        }}
      />
    );
  }

  const home = query.data;
  if (destination === "contact") {
    const contactSections = contactPage.data?.sections ?? [];
    const contactHero = contactSections.find(
      (section) => section.sectionKey === "hero",
    );
    const enquirySection = contactSections.find(
      (section) => section.sectionKey === "enquiry-form",
    );
    const contactFaqSection = contactSections.find(
      (section) => section.sectionKey === "faqs",
    );

    if (!contactHero || !enquirySection) {
      return (
        <PageError
          retry={() => {
            void query.refetch();
            void contactPage.refetch();
          }}
        />
      );
    }

    const faqItems = home.items.filter((item) => item.itemType === "faq");

    return (
      <div
        className="min-h-[100dvh] bg-[#f7f5ef]"
        data-college-theme
        style={
          {
            "--college-primary": home.settings.primaryColor,
            "--college-accent": home.settings.accentColor,
          } as React.CSSProperties
        }
      >
        <Header home={home} />
        <ContactContent
          heroSection={contactHero}
          enquirySection={enquirySection}
        />
        {contactFaqSection ? (
          <FaqSection
            section={contactFaqSection}
            items={faqItems}
            pageTarget="contact"
          />
        ) : null}
        <Footer home={home} />
      </div>
    );
  }

  const heroSection = home.sections.find(
    (section) => section.sectionKey.toLowerCase() === "hero",
  );
  const faqSection = home.sections.find(
    (section) =>
      section.pageSlug === "home" &&
      section.sectionKey.toLowerCase() === "faqs",
  );
  const faqItems = faqSection
    ? home.items.filter(
        (item) =>
          item.sectionId === faqSection.id && item.itemType === "faq",
      )
    : [];

  return (
    <div
      className="min-h-[100dvh] bg-[#f7f5ef]"
      data-college-theme
      style={
        {
          "--college-primary": home.settings.primaryColor,
          "--college-accent": home.settings.accentColor,
        } as React.CSSProperties
      }
    >
      <Header home={home} />
      <DestinationContent
        destination={destination}
        heroSection={heroSection}
      />
      <Footer home={home} />
    </div>
  );
}

export function CoursesPage() {
  return <PublicDestinationPage destination="courses" />;
}

export function KnowledgeHubPage() {
  return <PublicDestinationPage destination="knowledge-hub" />;
}

export function ContactPage() {
  return <PublicDestinationPage destination="contact" />;
}