import "./_group.css";
import { ArrowUpRight, Compass, Target } from "lucide-react";

const section = {
  id: "about-who-we-are-preview",
  title: "Who We Are",
  content: {
    eyebrow: "LEARNING WITH PURPOSE",
    paragraphs: [
      "At Shastra Junior College, strong subject foundations and thoughtful guidance help students approach their next step with confidence.",
      "Learning here is about more than completing a syllabus. We encourage curiosity, disciplined practice, and clear thinking in a supportive setting where every student can make steady progress.",
    ],
    visionTitle: "Our Vision",
    visionText:
      "To nurture knowledgeable, confident learners who approach the future with curiosity and purpose.",
    missionTitle: "Our Mission",
    missionPoints: [
      "Make complex ideas clear through thoughtful teaching.",
      "Support steady progress with academic guidance and mentoring.",
      "Encourage curiosity, discipline, and independent thinking.",
      "Help students prepare with confidence for their next steps.",
    ],
  },
};

export function WhoWeArePreview({ withImage = false }: { withImage?: boolean }) {
  const content = section.content;
  const titleId = `about-who-we-are-title-${section.id}`;
  const heading = (
    <header
      className={`reveal reveal-delay-1 ${
        withImage ? "lg:self-start" : "lg:sticky lg:top-10 lg:self-start"
      }`}
    >
      <p className="eyebrow mb-5 text-[#e3212b]">{content.eyebrow}</p>
      <h2
        id={titleId}
        className="max-w-[10ch] font-display text-[clamp(2.8rem,6vw,5.65rem)] font-extrabold leading-[0.95] tracking-[-0.065em] text-[#0b3472]"
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
  );

  return (
    <section
      className="site-grid relative overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 py-16 sm:px-8 sm:py-20 lg:py-28"
      aria-labelledby={titleId}
    >
      {!withImage ? (
        <>
          <div
            className="pointer-events-none absolute -right-16 top-16 h-44 w-44 rounded-full border border-[#e3212b]/15 sm:h-64 sm:w-64"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-4 top-28 h-20 w-20 rounded-full border border-[#e3212b]/20 sm:right-16 sm:top-36"
            aria-hidden="true"
          />
        </>
      ) : null}

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-x-20">
          {withImage ? (
            <div className="min-w-0">
              {heading}
              <figure className="reveal reveal-delay-2 mt-8 aspect-square overflow-hidden rounded-[1.5rem] border border-[#0b3472]/10 bg-[#e8edf4] shadow-[0_20px_46px_rgba(11,52,114,.12)]">
                <img
                  src="/__mockup/images/about-classroom-demo.jpg"
                  alt="A teacher guiding students as they work together in a classroom."
                  className="h-full w-full object-cover"
                />
              </figure>
            </div>
          ) : (
            heading
          )}

          <div className="space-y-14">
            <div className="reveal reveal-delay-2 max-w-2xl space-y-5">
              {content.paragraphs.map((paragraph, index) => (
                <p
                  key={`${section.id}-paragraph-${index}`}
                  className={
                    index === 0
                      ? "font-display text-[clamp(1.35rem,2.4vw,2rem)] font-semibold leading-[1.25] tracking-[-0.025em] text-[#0b3472]"
                      : "max-w-xl text-base leading-8 text-[#3f5068] sm:text-[1.05rem]"
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="reveal reveal-delay-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <article className="group relative overflow-hidden rounded-[1.35rem] border border-[#0b3472]/15 bg-[#e8edf4] p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7">
                <div className="mb-12 flex items-start justify-between" aria-hidden="true">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b3472] text-[#f7f5ef]">
                    <Compass className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-[#0b3472]/45 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <h3 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-[#0b3472]">
                  {content.visionTitle}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#3f5068]">
                  {content.visionText}
                </p>
              </article>

              <article className="group relative overflow-hidden rounded-[1.35rem] bg-[#0b3472] p-6 text-[#f7f5ef] shadow-[0_18px_40px_rgba(11,52,114,.14)] transition-transform duration-300 hover:-translate-y-1 sm:p-7">
                <div className="mb-12 flex items-start justify-between" aria-hidden="true">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3212b] text-white">
                    <Target className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-white/45 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <h3 className="font-display text-2xl font-extrabold tracking-[-0.04em]">
                  {content.missionTitle}
                </h3>
                <ul className="mt-4 space-y-3">
                  {content.missionPoints.map((point, index) => (
                    <li
                      key={`${section.id}-mission-${index}`}
                      className="flex gap-3 text-sm leading-6 text-[#dce5f1]"
                    >
                      <span
                        className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e3212b]"
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}