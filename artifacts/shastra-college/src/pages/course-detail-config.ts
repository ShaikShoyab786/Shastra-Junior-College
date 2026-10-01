export const COURSE_DETAILS = [
  { slug: "mpc", name: "MPC", adminView: "course-mpc" },
  { slug: "bipc", name: "BiPC", adminView: "course-bipc" },
  { slug: "iit-jee", name: "IIT-JEE", adminView: "course-iit-jee" },
  { slug: "neet", name: "NEET", adminView: "course-neet" },
  { slug: "mpc-eamcet", name: "MPC + EAMCET", adminView: "course-mpc-eamcet" },
  { slug: "integrated", name: "Integrated", adminView: "course-integrated", isDraft: true },
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
  mpc: ["mathematics", "physics", "chemistry"],
  bipc: ["biology", "physics", "chemistry"],
  "iit-jee": ["mathematics", "physics", "chemistry", "iit-jee"],
  neet: ["biology", "physics", "chemistry", "neet"],
  "mpc-eamcet": ["mathematics", "physics", "chemistry", "eamcet"],
  integrated: [],
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
    | "gallery-preview",
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
          : "hero";
  return `course-${slug}-${suffix}`;
}

export function getCourseDetail(slug: string) {
  return COURSE_DETAILS.find((course) => course.slug === slug);
}

const COURSE_MENU_CARD_SLUGS: Record<string, CourseDetailSlug> = {
  mpc: "mpc",
  bipc: "bipc",
  "mpc-iit-jee": "iit-jee",
  "bipc-neet": "neet",
  "mpc-eamcet": "mpc-eamcet",
};

export function getCourseDetailForMenuCard(card: {
  id: string;
  destination?: string | null;
}) {
  const destinationSlug = card.destination?.match(/^\/courses\/([^/?#]+)/)?.[1];
  return getCourseDetail(
    COURSE_MENU_CARD_SLUGS[card.id] ?? destinationSlug ?? "",
  );
}