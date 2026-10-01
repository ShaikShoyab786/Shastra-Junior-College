export type CoursePageSectionSettings = {
  eyebrow: string;
  title: string;
  description: string;
  isVisible: boolean;
};

export const DEFAULT_COURSE_TESTIMONIALS_SETTINGS: CoursePageSectionSettings = {
  eyebrow: "STUDENT STORIES",
  title: "Hear from our students",
  description: "Stories shared by students, families, and alumni in the Shastra community.",
  isVisible: true,
};

export const DEFAULT_COURSE_FAQ_SETTINGS: CoursePageSectionSettings = {
  eyebrow: "COURSE QUESTIONS",
  title: "Frequently Asked Questions",
  description: "Answers about this course and its learning pathway.",
  isVisible: true,
};

export function readCoursePageSectionSettings(
  value: unknown,
  defaults: CoursePageSectionSettings,
): CoursePageSectionSettings {
  const content =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    eyebrow:
      typeof content.eyebrow === "string" ? content.eyebrow : defaults.eyebrow,
    title: typeof content.title === "string" ? content.title : defaults.title,
    description:
      typeof content.description === "string"
        ? content.description
        : defaults.description,
    isVisible:
      typeof content.isVisible === "boolean"
        ? content.isVisible
        : defaults.isVisible,
  };
}