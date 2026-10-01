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

export function courseSectionKey(
  slug: CourseDetailSlug,
  section: "hero" | "highlights",
) {
  return `course-${slug}-${section === "highlights" ? "highlights" : "hero"}`;
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