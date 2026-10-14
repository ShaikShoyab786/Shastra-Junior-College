export const COURSE_DETAILS = [
  { slug: "iit", name: "IIT", adminView: "course-iit" },
  { slug: "nit", name: "NIT", adminView: "course-nit" },
  { slug: "iiit", name: "IIIT", adminView: "course-iiit" },
  { slug: "ipe", name: "IPE", adminView: "course-ipe" },
] as const;

export type CourseDetail = (typeof COURSE_DETAILS)[number];
export type CourseDetailSlug = CourseDetail["slug"];
export type CourseDetailAdminView = CourseDetail["adminView"];
export const COURSE_MENTOR_SUBJECTS = [
  { value: "mathematics", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "iit-jee", label: "IIT-JEE" },
  { value: "neet", label: "NEET" },
  { value: "eamcet", label: "EAMCET" },
] as const;

export type CourseMentorSubject =
  (typeof COURSE_MENTOR_SUBJECTS)[number]["value"];

const COURSE_MENTOR_SUBJECTS_BY_COURSE: Record<
  CourseDetailSlug,
  readonly CourseMentorSubject[]
> = {
  iit: ["mathematics", "iit-jee"],
  nit: [],
  iiit: [],
  ipe: [],
};

export function getCourseMentorSubjectsForCourse(slug: CourseDetailSlug) {
  return COURSE_MENTOR_SUBJECTS_BY_COURSE[slug];
}

export function courseSectionKey(
  slug: CourseDetailSlug,
  section:
    | "hero"
    | "highlights"
    | "faculty-preview"
    | "curriculum"
    | "gallery-preview"
    | "enrollment-process"
    | "testimonials"
    | "faqs",
) {
  const suffix =
    section === "highlights"
      ? "highlights"
      : section === "faculty-preview"
        ? "faculty-preview"
        : section === "curriculum"
          ? "curriculum"
          : section === "gallery-preview"
            ? "gallery-preview"
          : section === "enrollment-process"
            ? "enrollment-process"
            : section === "testimonials"
              ? "testimonials"
              : section === "faqs"
                ? "faqs"
          : "hero";
  return `course-${slug}-${suffix}`;
}

export function getCourseDetail(slug: string) {
  return COURSE_DETAILS.find((course) => course.slug === slug);
}

export function getCourseDetailForMenuCard(card: {
  id: string;
  destination?: string | null;
}) {
  const destinationSlug = card.destination?.match(/^\/courses\/([^/?#]+)/)?.[1];
  return getCourseDetail(destinationSlug ?? "");
}

export const LEGACY_COURSE_SLUGS = new Set([
  "mpc",
  "bipc",
  "iit-jee",
  "neet",
  "mpc-eamcet",
  "integrated",
]);