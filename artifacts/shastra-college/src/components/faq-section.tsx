import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { ContentItem, ContentSection } from "@workspace/api-client-react";
import {
  faqItemsForPage,
  type FaqPageTarget,
} from "@/lib/faq-page-targets";

type FaqSectionProps = {
  section?: Pick<
    ContentSection,
    "id" | "isVisible" | "title" | "subtitle" | "content"
  >;
  items: ContentItem[];
  pageTarget: FaqPageTarget;
};

export default function FaqSection({
  section,
  items,
  pageTarget,
}: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const listId = useId();
  if (!section?.isVisible) return null;

  const faqs = faqItemsForPage(items, pageTarget);
  if (!faqs.length) return null;

  const eyebrow =
    typeof section.content.eyebrow === "string"
      ? section.content.eyebrow
      : "";

  return (
    <section
      id={section.id}
      className="relative overflow-hidden bg-[#fbfaf6] px-5 py-14 sm:px-8 sm:py-20"
      aria-labelledby={`faq-heading-${section.id}`}
      data-testid={`section-faq-${pageTarget}-${section.id}`}
    >
      <div
        className="pointer-events-none absolute -left-28 top-12 h-64 w-64 rounded-full border-[24px] border-[#c07823]/[.08]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-5xl">
        <header className="mx-auto mb-9 max-w-3xl text-center sm:mb-12">
          {eyebrow ? (
            <p
              className="eyebrow text-[#c07823]"
              data-testid={`text-faq-eyebrow-${section.id}`}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={`faq-heading-${section.id}`}
            className="mt-3 font-display text-[clamp(2.2rem,5vw,3.7rem)] font-extrabold leading-[1.02] tracking-[-.06em] text-[#0b3472]"
            data-testid={`text-faq-title-${section.id}`}
          >
            {section.title}
          </h2>
          {section.subtitle ? (
            <p
              className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#53657d] sm:text-lg"
              data-testid={`text-faq-description-${section.id}`}
            >
              {section.subtitle}
            </p>
          ) : null}
        </header>

        <div
          className="divide-y divide-[#0b3472]/10 border-y border-[#0b3472]/10"
          data-testid={`list-faq-${pageTarget}`}
        >
          {faqs.map((faq, index) => {
            const isOpen = openId === faq.id;
            const answerId = `${listId}-answer-${faq.id}`;
            return (
              <article
                key={faq.id}
                className="group"
                data-testid={`item-faq-${faq.id}`}
              >
                <h3>
                  <button
                    type="button"
                    id={`${listId}-question-${faq.id}`}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() =>
                      setOpenId((current) =>
                        current === faq.id ? null : faq.id,
                      )
                    }
                    className="focus-ring flex w-full items-center gap-5 py-5 text-left sm:py-6"
                    data-testid={`button-toggle-faq-${faq.id}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b3472]/[.06] font-mono text-[10px] font-bold tracking-wide text-[#c07823]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 font-display text-lg font-bold leading-snug text-[#0b3472] transition-colors group-hover:text-[#c71927] sm:text-xl">
                      {faq.title}
                    </span>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isOpen
                          ? "border-[#0b3472] bg-[#0b3472] text-white"
                          : "border-[#0b3472]/15 bg-white text-[#0b3472]"
                      }`}
                      aria-hidden="true"
                    >
                      {isOpen ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                </h3>
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={`${listId}-question-${faq.id}`}
                  hidden={!isOpen}
                  className="pb-6 pl-[3.25rem] pr-2 sm:pb-7 sm:pl-[4.25rem]"
                  data-testid={`panel-faq-answer-${faq.id}`}
                >
                  <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-[#53657d] sm:text-base sm:leading-8">
                    {faq.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}