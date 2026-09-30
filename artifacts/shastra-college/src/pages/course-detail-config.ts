export const COURSE_DETAILS = [
  { slug: "mpc", name: "MPC", adminView: "course-mpc" },
  { slug: "bipc", name: "BiPC", adminView: "course-bipc" },
  { slug: "neet", name: "NEET", adminView: "course-neet" },
  { slug: "iit-jee", name: "IIT-JEE", adminView: "course-iit-jee" },
  { slug: "integrated", name: "Integrated", adminView: "course-integrated" },
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