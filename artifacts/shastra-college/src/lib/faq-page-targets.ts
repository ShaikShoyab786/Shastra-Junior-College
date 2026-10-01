import type { ContentItem } from "@workspace/api-client-react";

export const FAQ_PAGE_TARGETS = [
  { value: "home", label: "Home" },
  { value: "contact", label: "Contact" },
  { value: "courses", label: "All Courses" },
] as const;

export type FaqPageTarget = (typeof FAQ_PAGE_TARGETS)[number]["value"];

export function faqPageTargets(item: ContentItem): FaqPageTarget[] {
  const value = item.content.pageTargets;
  if (!Array.isArray(value)) return [];
  return value.filter(
    (target): target is FaqPageTarget =>
      target === "home" || target === "contact" || target === "courses",
  );
}

export function faqItemsForPage(items: ContentItem[], target: FaqPageTarget) {
  return items
    .filter(
      (item) =>
        item.itemType === "faq" &&
        item.isVisible &&
        faqPageTargets(item).includes(target),
    )
    .sort((first, second) => first.position - second.position);
}