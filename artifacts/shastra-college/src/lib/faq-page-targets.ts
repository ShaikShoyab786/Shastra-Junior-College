import type { ContentItem } from "@workspace/api-client-react";
import {
  COURSE_DETAILS,
  type CourseDetailSlug,
} from "@/pages/course-detail-config";

export type CourseFaqPageTarget = `course:${CourseDetailSlug}`;
export type FaqPageTarget =
  | "home"
  | "about"
  | "contact"
  | "courses"
  | CourseFaqPageTarget;

export const FAQ_PAGE_TARGETS: Array<{ value: FaqPageTarget; label: string }> = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "contact", label: "Contact" },
  { value: "courses", label: "All Courses" },
  ...COURSE_DETAILS.map((course) => ({
    value: `course:${course.slug}` as CourseFaqPageTarget,
    label:
      course.slug === "iit-jee"
        ? "IIT-JEE / JEE Main"
        : "isDraft" in course && course.isDraft
          ? `${course.name} (draft)`
          : course.name,
  })),
] as const;

const faqPageTargetValues = new Set<string>(
  FAQ_PAGE_TARGETS.map((target) => target.value),
);

export function courseFaqPageTarget(slug: CourseDetailSlug): CourseFaqPageTarget {
  return `course:${slug}`;
}

export function faqPageTargets(item: ContentItem): FaqPageTarget[] {
  const value = item.content.pageTargets;
  if (!Array.isArray(value)) return [];
  return value.filter(
    (target): target is FaqPageTarget =>
      typeof target === "string" && faqPageTargetValues.has(target),
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