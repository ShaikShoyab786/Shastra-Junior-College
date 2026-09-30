import type { ContentSection } from "@workspace/api-client-react";
import { assetUrl } from "@/components/faculty-profile-modal";

type ChairmanContent = {
  eyebrow?: unknown;
  greeting?: unknown;
  messageParagraphs?: unknown;
  imageUrl?: unknown;
  imageAlt?: unknown;
  signatureClosing?: unknown;
  signatureName?: unknown;
  signatureTitle?: unknown;
};

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export function AboutChairmanSection({
  section,
}: {
  section: ContentSection;
}) {
  const content = section.content as ChairmanContent;
  const eyebrow = textValue(content.eyebrow);
  const greeting = textValue(content.greeting);
  const paragraphs = textList(content.messageParagraphs);
  const imageUrl = textValue(content.imageUrl);
  const imageAlt = textValue(content.imageAlt);
  const signatureClosing = textValue(content.signatureClosing);
  const signatureName = textValue(content.signatureName);
  const signatureTitle = textValue(content.signatureTitle);
  const titleId = `about-chairman-title-${section.id}`;

  return (
    <section
      className="overflow-hidden border-b border-[#0b3472]/10 bg-[#fbfaf6] px-5 py-16 sm:px-8 sm:py-20 lg:py-28"
      aria-labelledby={titleId}
      data-testid={`section-about-chairman-${section.id}`}
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(250px,.72fr)_minmax(0,1.28fr)] lg:items-center lg:gap-20">
        <div className="relative mx-auto w-full max-w-sm lg:mx-0">
          <div className="absolute -inset-3 rounded-[1.6rem] border border-dashed border-[#c9953f]/70 sm:-inset-5" aria-hidden="true" />
          <figure className="relative m-0 aspect-[.82/1] overflow-hidden rounded-[1.35rem] border border-[#0b3472]/15 bg-[#e7edf5] shadow-[0_20px_46px_rgba(11,52,114,.14)]">
            {imageUrl ? (
              <img
                src={assetUrl(imageUrl)}
                alt={imageAlt}
                className="h-full w-full object-cover"
                data-testid={`img-about-chairman-${section.id}`}
              />
            ) : (
              <div
                className="flex h-full items-center justify-center px-8 text-center text-sm font-semibold text-[#0b3472]/65"
                role="img"
                aria-label={imageAlt || "Chairman portrait"}
                data-testid={`img-about-chairman-placeholder-${section.id}`}
              >
                {imageAlt || "Chairman portrait"}
              </div>
            )}
          </figure>
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-[#0b3472]/90 px-4 py-3 text-white backdrop-blur-sm sm:inset-x-5 sm:bottom-5">
            <p className="eyebrow text-[#f3b9a7]">Leadership message</p>
            {signatureName ? (
              <p className="mt-1 font-display text-lg font-extrabold">{signatureName}</p>
            ) : null}
            {signatureTitle ? (
              <p className="mt-1 text-[.65rem] font-bold uppercase tracking-[.12em] text-white/70">
                {signatureTitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="min-w-0">
          {eyebrow ? (
            <p className="eyebrow text-[#c07823]" data-testid={`text-about-chairman-eyebrow-${section.id}`}>
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={titleId}
            className="mt-3 max-w-3xl font-display text-[clamp(2.7rem,5.5vw,5.4rem)] font-extrabold leading-[.95] tracking-[-.065em] text-[#0b3472]"
            data-testid={`text-about-chairman-title-${section.id}`}
          >
            {section.title}
          </h2>
          <div className="mt-8 max-w-3xl space-y-5 text-[#3f5068]">
            {greeting ? (
              <p className="font-display text-xl font-bold leading-8 text-[#15243d]" data-testid={`text-about-chairman-greeting-${section.id}`}>
                {greeting}
              </p>
            ) : null}
            {paragraphs.map((paragraph, index) => (
              <p
                key={`${section.id}-message-${index}`}
                className="text-base leading-8 sm:text-[1.05rem]"
                data-testid={`text-about-chairman-paragraph-${section.id}-${index}`}
              >
                {paragraph}
              </p>
            ))}
          </div>
          {signatureClosing || signatureName || signatureTitle ? (
            <div className="mt-9 border-t border-[#0b3472]/10 pt-5" data-testid={`group-about-chairman-signature-${section.id}`}>
              {signatureClosing ? <p className="text-sm font-bold text-[#15243d]">{signatureClosing}</p> : null}
              {signatureName ? <p className="mt-2 font-display text-2xl font-extrabold italic text-[#0b3472]">{signatureName}</p> : null}
              {signatureTitle ? <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{signatureTitle}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default AboutChairmanSection;