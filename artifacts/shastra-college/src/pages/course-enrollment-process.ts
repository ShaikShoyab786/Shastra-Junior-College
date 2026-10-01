export type CourseEnrollmentStep = {
  id: string;
  title: string;
  description: string;
};

export type CourseEnrollmentProcessContent = {
  eyebrow: string;
  title: string;
  description: string;
  isVisible: boolean;
  steps: CourseEnrollmentStep[];
};

export const DEFAULT_COURSE_ENROLLMENT_PROCESS: CourseEnrollmentProcessContent = {
  eyebrow: "ADMISSIONS",
  title: "Admission Enrollment Process",
  description: "Clear and straightforward registration steps to reserve your academic seat.",
  isVisible: true,
  steps: [
    {
      id: "submit-query",
      title: "Submit Query",
      description: "Fill out the online application form.",
    },
    {
      id: "career-counselling",
      title: "Career Counseling",
      description: "Review courses with senior counselors.",
    },
    {
      id: "document-verification",
      title: "Document Verification",
      description: "Submit mark sheets for waiver checks.",
    },
    {
      id: "fee-deposit",
      title: "Fee Deposit",
      description: "Pay the enrollment fee to reserve your seat.",
    },
    {
      id: "confirmation",
      title: "Confirmation",
      description: "Get your roll number and class schedule.",
    },
  ],
};

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function readCourseEnrollmentProcess(value: unknown): CourseEnrollmentProcessContent {
  const content = recordValue(value);
  const steps = Array.isArray(content.steps)
    ? content.steps.flatMap((value, index) => {
        const step = recordValue(value);
        if (!Object.keys(step).length) return [];
        return [{
          id: typeof step.id === "string" && step.id
            ? step.id
            : `course-enrollment-step-${index + 1}`,
          title: typeof step.title === "string" ? step.title : "",
          description: typeof step.description === "string" ? step.description : "",
        }];
      })
    : DEFAULT_COURSE_ENROLLMENT_PROCESS.steps.map((step) => ({ ...step }));

  return {
    eyebrow: typeof content.eyebrow === "string"
      ? content.eyebrow
      : DEFAULT_COURSE_ENROLLMENT_PROCESS.eyebrow,
    title: typeof content.title === "string"
      ? content.title
      : DEFAULT_COURSE_ENROLLMENT_PROCESS.title,
    description: typeof content.description === "string"
      ? content.description
      : DEFAULT_COURSE_ENROLLMENT_PROCESS.description,
    isVisible: content.isVisible !== false,
    steps,
  };
}