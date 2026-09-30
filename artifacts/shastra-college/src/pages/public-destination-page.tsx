import { ArrowRight, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import {
  getGetHomePageQueryKey,
  useGetHomePage,
} from "@workspace/api-client-react";
import type { ContentSection } from "@workspace/api-client-react";
import {
  EnquiryForm,
  Footer,
  Header,
} from "./public-home";

type Destination = "courses" | "results" | "knowledge-hub" | "contact";

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
  results: {
    eyebrow: "COLLEGE UPDATES",
    title: "Results",
    description: "Find results information shared by Shastra Junior College.",
    notice:
      "Official results information will be shared here when it is available.",
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

function PublicDestinationPage({ destination }: { destination: Destination }) {
  const query = useGetHomePage({
    query: { queryKey: getGetHomePageQueryKey() },
  });

  if (query.isLoading) return <PageLoading />;
  if (query.isError || !query.data) {
    return <PageError retry={() => void query.refetch()} />;
  }

  const home = query.data;
  const heroSection = home.sections.find(
    (section) => section.sectionKey.toLowerCase() === "hero",
  );

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

export function ResultsPage() {
  return <PublicDestinationPage destination="results" />;
}

export function KnowledgeHubPage() {
  return <PublicDestinationPage destination="knowledge-hub" />;
}

export function ContactPage() {
  return <PublicDestinationPage destination="contact" />;
}