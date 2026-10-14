import { db } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import {
  contentItemsTable,
  contentSectionsTable,
  coursesMenuSettingsTable,
  articleCategoriesTable,
  articleHubSettingsTable,
  articlesTable,
  knowledgeHubMenuSettingsTable,
  studyResourceCategoriesTable,
  studyResourceHubSettingsTable,
  studyResourcesTable,
  examCalendarEntriesTable,
  examUpdateHubSettingsTable,
  examUpdateNoticesTable,
  videoCategoriesTable,
  videoHubSettingsTable,
  videosTable,
  siteSettingsTable,
  type CmsJson,
  type CoursesMenuContent,
  type KnowledgeHubMenuContent,
} from "@workspace/db";
import { logger } from "./logger";

const DEFAULT_KNOWLEDGE_HUB_MENU: KnowledgeHubMenuContent = {
  heading: {
    eyebrow: "LEARNING RESOURCES",
    title: "Explore the Knowledge Hub",
    description:
      "Find articles, videos, study resources, and exam information in one place.",
  },
  items: [
    {
      key: "article-hub",
      order: 0,
      title: "Article Hub",
      description: "Read focused articles and explainers for your studies.",
    },
    {
      key: "video-hub",
      order: 1,
      title: "Video Hub",
      description: "Watch subject walkthroughs and learning videos.",
    },
    {
      key: "study-resources",
      order: 2,
      title: "Study Resources",
      description: "Browse study guides and learning materials.",
    },
    {
      key: "exam-updates",
      order: 3,
      title: "Exam Updates",
      description: "Keep up with information for upcoming examinations.",
    },
  ],
  ctaLabel: "Explore Knowledge Hub",
};

const DEFAULT_COURSES_MENU: CoursesMenuContent = {
  brandPanel: {
    collegeName: "Shastra Junior College",
    tagline: "Junior College",
    headline: "Explore course pathways",
    supportingText:
      "Explore science pathways at Shastra Junior College, then contact the college for current course information.",
    logoImageUrl:
      "/objects/uploads/ea7f7c4b-0ce9-4a86-b551-bb7f3481e88e",
    logoImageAlt: "Shastra Junior College crest",
    backgroundImageUrl:
      "/objects/uploads/0be0c4d9-6701-4b4a-8963-4be6e72b25e8",
    backgroundImageAlt:
      "Student studying a biology lesson for NEET preparation",
  },
  heading: {
    eyebrow: "Academic pathways",
    title: "Explore course pathways",
    pathwayBadge: null,
  },
  courseCards: [
    {
      id: "mpc",
      order: 0,
      title: "MPC",
      category: "Intermediate science",
      description:
        "Mathematics, Physics and Chemistry are the core subjects in this science pathway.",
      destination: "/courses/mpc",
      isVisible: true,
      icon: null,
      tint: null,
      imageUrl: null,
      imageAlt: "",
    },
    {
      id: "bipc",
      order: 1,
      title: "BIPC",
      category: "Intermediate science",
      description:
        "Biology, Physics and Chemistry are the core subjects in this science pathway.",
      destination: "/courses/bipc",
      isVisible: true,
      icon: null,
      tint: null,
      imageUrl: null,
      imageAlt: "",
    },
    {
      id: "mpc-iit-jee",
      order: 2,
      title: "MPC+IIT-JEE",
      category: "IIT-JEE Main pathway",
      description:
        "Mathematics, Physics and Chemistry alongside preparation for IIT-JEE Main.",
      destination: "/courses/iit-jee",
      isVisible: true,
      icon: null,
      tint: null,
      imageUrl: null,
      imageAlt: "",
    },
    {
      id: "bipc-neet",
      order: 3,
      title: "BIPC+NEET",
      category: "NEET pathway",
      description:
        "Biology, Physics and Chemistry alongside preparation for NEET.",
      destination: "/courses/neet",
      isVisible: true,
      icon: null,
      tint: null,
      imageUrl: null,
      imageAlt: "",
    },
    {
      id: "mpc-eamcet",
      order: 4,
      title: "MPC+EAMCET",
      category: "EAMCET pathway",
      description:
        "A Mathematics, Physics and Chemistry pathway associated with EAMCET.",
      destination: "/courses/mpc-eamcet",
      isVisible: true,
      icon: null,
      tint: null,
      imageUrl: null,
      imageAlt: "",
    },
  ],
  comingSoonCard: null,
  benefits: [
    {
      id: "science-subjects",
      order: 0,
      title: "Science subject pathways",
      description:
        "Explore Mathematics, Physics, Chemistry and Biology across the listed options.",
      icon: null,
      isVisible: true,
    },
    {
      id: "exam-pathways",
      order: 1,
      title: "Exam pathways",
      description:
        "Compare pathways featuring IIT-JEE Main, NEET and EAMCET.",
      icon: null,
      isVisible: true,
    },
    {
      id: "course-information",
      order: 2,
      title: "Course information",
      description:
        "Contact the college for current course details.",
      icon: null,
      isVisible: true,
    },
  ],
  utilityLinks: [
    {
      id: "about",
      order: 0,
      label: "About",
      destination: "/about",
      isVisible: true,
    },
    {
      id: "faculty",
      order: 1,
      label: "Faculty",
      destination: "/faculty",
      isVisible: true,
    },
    {
      id: "contact",
      order: 2,
      label: "Contact",
      destination: "/contact",
      isVisible: true,
    },
  ],
  ctaButtons: [
    {
      id: "explore-courses",
      order: 0,
      label: "Explore courses",
      destination: "/courses",
      variant: "primary",
      isVisible: true,
    },
    {
      id: "contact-college",
      order: 1,
      label: "Contact the college",
      destination: "/contact",
      variant: "secondary",
      isVisible: true,
    },
  ],
};

const DEFAULT_PUBLIC_NAVIGATION = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Courses", path: "/courses" },
  { label: "Faculty", path: "/faculty" },
  { label: "Gallery", path: "/gallery" },
  { label: "Knowledge Hub", path: "/knowledge-hub" },
  { label: "Contact", path: "/contact" },
];

const LEGACY_DEFAULT_PUBLIC_NAVIGATION = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Academics", path: "/academics" },
  { label: "Admissions", path: "/admissions" },
  { label: "Campus Life", path: "/campus-life" },
  { label: "Knowledge Hub", path: "/knowledge-hub" },
  { label: "Contact", path: "/contact" },
];

const LEGACY_MINIMAL_PUBLIC_NAVIGATION = [
  { label: "Home", path: "/" },
  { label: "Faculty", path: "/faculty" },
  { label: "Gallery", path: "/gallery" },
];

const demoEnquiryForm = {
  eyebrow: "ADMISSIONS ENQUIRY",
  title: "Talk with our team",
  description:
    "Share a few details about your interests so we can guide your next step.",
  submitLabel: "Send enquiry",
  note: "Your details will be shared with the college admissions team.",
  successMessage: "Thank you. Our admissions team has received your enquiry.",
  __optionalMessageFieldVersion: 1,
  fields: [
    {
      name: "fullName",
      type: "text",
      label: "Your name",
      placeholder: "Enter your name",
      required: true,
    },
    {
      name: "email",
      type: "email",
      label: "Email address",
      placeholder: "you@example.com",
      required: true,
    },
    {
      name: "phone",
      type: "tel",
      label: "Phone number",
      placeholder: "Optional",
      required: false,
    },
    {
      name: "pathway",
      type: "select",
      label: "Area of interest",
      placeholder: "Choose an option",
      options: ["IIT", "NIT", "IIIT", "IPE"],
      required: true,
    },
    {
      name: "message",
      type: "textarea",
      label: "Message",
      placeholder: "Write an optional message",
      required: false,
    },
  ],
};

const OPTIONAL_MESSAGE_FIELD_VERSION_KEY = "__optionalMessageFieldVersion";

function ensureOptionalEnquiryMessageField(
  form: Record<string, unknown>,
): { form: Record<string, unknown>; changed: boolean } {
  if (form[OPTIONAL_MESSAGE_FIELD_VERSION_KEY] === 1) {
    return { form, changed: false };
  }

  const fieldsKey = ["fields", "formFields", "inputs"].find((key) =>
    Array.isArray(form[key]),
  );
  if (!fieldsKey) return { form, changed: false };

  const fields = form[fieldsKey] as unknown[];
  const alreadyHasMessage = fields.some((entry) => {
    const field = isCmsRecord(entry) ? entry : {};
    const name = typeof field.name === "string" ? field.name.trim() : "";
    const label = typeof field.label === "string" ? field.label.trim() : "";
    return name.toLowerCase() === "message" || /\bmessage\b/i.test(label);
  });

  return {
    form: {
      ...form,
      [fieldsKey]: alreadyHasMessage
        ? fields
        : [
            ...fields,
            {
              name: "message",
              type: "textarea",
              label: "Message",
              placeholder: "Write an optional message",
              required: false,
            },
          ],
      [OPTIONAL_MESSAGE_FIELD_VERSION_KEY]: 1,
    },
    changed: true,
  };
}

export async function seedCoursesPageSections(): Promise<void> {
  await db.transaction(async (tx) => {
    const [coursesMenu] = await tx
      .select({ content: coursesMenuSettingsTable.content })
      .from(coursesMenuSettingsTable)
      .where(eq(coursesMenuSettingsTable.id, "primary"))
      .for("update")
      .limit(1);
    if (!coursesMenu) {
      throw new Error("Courses menu settings must exist before Courses content is seeded.");
    }

    let seedableMenu = coursesMenu.content as CoursesMenuContent & {
      __seedMarkers?: string[];
    };
    const heroImageUrl =
      seedableMenu.brandPanel.backgroundImageUrl ?? null;
    const heroImageAlt =
      seedableMenu.brandPanel.backgroundImageAlt ??
      "Shastra Junior College students learning together";

    const defaults: SeedSection[] = [
      {
        sectionKey: "hero",
        title: "Explore Shastra’s course pathways",
        subtitle:
          "Compare Intermediate MPC and BIPC options alongside the exam pathways listed below. Contact Shastra Junior College for current course information.",
        content: {
          eyebrow: "SHASTRA JUNIOR COLLEGE · COURSE PATHWAYS",
          ctaLabel: "Explore courses",
          imageUrl: heroImageUrl,
          imageAlt: heroImageAlt,
        },
        isVisible: true,
        position: 0,
      },
      {
        sectionKey: "regular-pathways",
        title: "Explore regular pathways",
        subtitle:
          "Review each course name, category, and description before contacting the college.",
        content: { eyebrow: "REGULAR PATHWAYS" },
        isVisible: true,
        position: 1,
      },
    ];

    await tx
      .insert(contentSectionsTable)
      .values(defaults.map((section) => ({ ...section, pageSlug: "courses" })))
      .onConflictDoNothing();

    const seedMarkers = new Set(seedableMenu.__seedMarkers ?? []);
    const courseCardDestinationSeedMarker = "course-detail-card-destinations-v1";
    if (!seedMarkers.has(courseCardDestinationSeedMarker)) {
      const detailDestinations: Record<string, string> = {
        "mpc": "/courses/mpc",
        "bipc": "/courses/bipc",
        "mpc+iit-jee": "/courses/iit-jee",
        "bipc+neet": "/courses/neet",
        "mpc_eamcet": "/courses/mpc-eamcet",
        "mpc+eamcet": "/courses/mpc-eamcet",
      };
      const courseCards = seedableMenu.courseCards.map((card) => {
        const destination = detailDestinations[card.title.trim().toLowerCase()];
        return destination && card.destination === "/courses"
          ? { ...card, destination }
          : card;
      });
      seedableMenu = { ...seedableMenu, courseCards };
      seedMarkers.add(courseCardDestinationSeedMarker);
    }
    const courseDetailsSeedMarker = "course-detail-pages-v1";
    if (!seedMarkers.has(courseDetailsSeedMarker)) {
      const detailPages = [
        {
          slug: "mpc",
          name: "MPC",
          cardTitle: "MPC",
          highlights: [
            { category: "CORE SUBJECT", title: "Mathematics", description: "A core subject in the MPC pathway." },
            { category: "CORE SUBJECT", title: "Physics", description: "A core subject in the MPC pathway." },
            { category: "CORE SUBJECT", title: "Chemistry", description: "A core subject in the MPC pathway." },
          ],
        },
        {
          slug: "bipc",
          name: "BiPC",
          cardTitle: "BIPC",
          highlights: [
            { category: "CORE SUBJECT", title: "Biology", description: "A core subject in the BiPC pathway." },
            { category: "CORE SUBJECT", title: "Physics", description: "A core subject in the BiPC pathway." },
            { category: "CORE SUBJECT", title: "Chemistry", description: "A core subject in the BiPC pathway." },
          ],
        },
        {
          slug: "neet",
          name: "NEET",
          cardTitle: "BIPC+NEET",
          highlights: [
            { category: "CORE SUBJECT", title: "Biology", description: "A core subject in the NEET pathway." },
            { category: "CORE SUBJECT", title: "Physics", description: "A core subject in the NEET pathway." },
            { category: "CORE SUBJECT", title: "Chemistry", description: "A core subject in the NEET pathway." },
            { category: "EXAM PATHWAY", title: "NEET", description: "Preparation for NEET is part of this course pathway." },
          ],
        },
        {
          slug: "iit-jee",
          name: "IIT-JEE",
          cardTitle: "MPC+IIT-JEE",
          highlights: [
            { category: "CORE SUBJECT", title: "Mathematics", description: "A core subject in the IIT-JEE pathway." },
            { category: "CORE SUBJECT", title: "Physics", description: "A core subject in the IIT-JEE pathway." },
            { category: "CORE SUBJECT", title: "Chemistry", description: "A core subject in the IIT-JEE pathway." },
            { category: "EXAM PATHWAY", title: "IIT-JEE Main", description: "Preparation for IIT-JEE Main is part of this course pathway." },
          ],
        },
        {
          slug: "integrated",
          name: "Integrated",
          cardTitle: "",
          highlights: [],
        },
      ] as const;
      const detailSections: Array<SeedSection & { pageSlug: string }> = [];
      const courseCards = seedableMenu.courseCards;

      for (const [index, course] of detailPages.entries()) {
        const courseCard = course.cardTitle
          ? courseCards.find((card) => card.title.toLowerCase() === course.cardTitle.toLowerCase())
          : undefined;
        const description = courseCard?.description?.trim() ?? "";
        const isReadyForPublication = course.slug !== "integrated" && Boolean(description);
        detailSections.push(
          {
            pageSlug: "courses",
            sectionKey: `course-${course.slug}-hero`,
            title: course.name,
            subtitle: description || null,
            content: {
              eyebrow: `${course.name.toUpperCase()} · COURSE DETAILS`,
              statusLabel: "",
              duration: "",
              studyMode: "",
              imageUrl: null,
              imageAlt: "",
              primaryCtaLabel: `Ask about ${course.name}`,
              secondaryCtaLabel: "View all courses",
            },
            isVisible: isReadyForPublication,
            position: 10 + index * 2,
          },
          {
            pageSlug: "courses",
            sectionKey: `course-${course.slug}-highlights`,
            title: "Quick Course Highlights",
            subtitle: description
              ? `Review the subjects and pathway focus associated with ${course.name}.`
              : null,
            content: { eyebrow: "QUICK OVERVIEW" },
            isVisible: isReadyForPublication,
            position: 11 + index * 2,
          },
        );
      }

      await tx
        .insert(contentSectionsTable)
        .values(detailSections)
        .onConflictDoNothing();

      const detailSectionRows = await tx
        .select({
          id: contentSectionsTable.id,
          sectionKey: contentSectionsTable.sectionKey,
        })
        .from(contentSectionsTable)
        .where(eq(contentSectionsTable.pageSlug, "courses"));
      const detailSectionIds = new Map(
        detailSectionRows.map((section) => [section.sectionKey, section.id]),
      );

      for (const course of detailPages) {
        const sectionId = detailSectionIds.get(`course-${course.slug}-highlights`);
        if (!sectionId || course.highlights.length === 0) continue;
        const [existingHighlight] = await tx
          .select({ id: contentItemsTable.id })
          .from(contentItemsTable)
          .where(
            and(
              eq(contentItemsTable.sectionId, sectionId),
              eq(contentItemsTable.itemType, "course-highlight"),
            ),
          )
          .limit(1);
        if (existingHighlight) continue;
        await tx.insert(contentItemsTable).values(
          course.highlights.map((highlight, position) => ({
            sectionId,
            itemType: "course-highlight",
            title: highlight.title,
            description: highlight.description,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: { category: highlight.category },
            isVisible: true,
            position,
          })),
        );
      }
      seedMarkers.add(courseDetailsSeedMarker);
    }

    const eamcetDestinationSeedMarker = "course-detail-mpc-eamcet-destination-v1";
    if (!seedMarkers.has(eamcetDestinationSeedMarker)) {
      const courseCards = seedableMenu.courseCards.map((card) => {
        const isEamcetCard =
          card.id === "mpc-eamcet" ||
          ["mpc_eamcet", "mpc+eamcet"].includes(card.title.trim().toLowerCase());
        if (!isEamcetCard || card.destination !== "/courses/mpc") return card;
        return {
          ...card,
          title: card.title === "MPC_EAMCET" ? "MPC+EAMCET" : card.title,
          destination: "/courses/mpc-eamcet",
        };
      });
      seedableMenu = { ...seedableMenu, courseCards };
      seedMarkers.add(eamcetDestinationSeedMarker);
    }

    const eamcetDetailSeedMarker = "course-detail-mpc-eamcet-sections-v1";
    if (!seedMarkers.has(eamcetDetailSeedMarker)) {
      const courseCard = seedableMenu.courseCards.find(
        (card) => card.id === "mpc-eamcet",
      );
      const description = courseCard?.description?.trim() ?? "";
      const isReadyForPublication = Boolean(description);
      const eamcetSections: Array<SeedSection & { pageSlug: string }> = [
        {
          pageSlug: "courses",
          sectionKey: "course-mpc-eamcet-hero",
          title: "MPC + EAMCET",
          subtitle: description || null,
          content: {
            eyebrow: "MPC + EAMCET · COURSE DETAILS",
            statusLabel: "",
            duration: "",
            studyMode: "",
            imageUrl: null,
            imageAlt: "",
            primaryCtaLabel: "Ask about MPC + EAMCET",
            secondaryCtaLabel: "View all courses",
          },
          isVisible: isReadyForPublication,
          position: 20,
        },
        {
          pageSlug: "courses",
          sectionKey: "course-mpc-eamcet-highlights",
          title: "Quick Course Highlights",
          subtitle: description
            ? "Review the subjects and EAMCET focus associated with this pathway."
            : null,
          content: { eyebrow: "QUICK OVERVIEW" },
          isVisible: isReadyForPublication,
          position: 21,
        },
      ];
      await tx.insert(contentSectionsTable).values(eamcetSections).onConflictDoNothing();

      const [eamcetHighlightsSection] = await tx
        .select({ id: contentSectionsTable.id })
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "courses"),
            eq(contentSectionsTable.sectionKey, "course-mpc-eamcet-highlights"),
          ),
        )
        .limit(1);
      if (eamcetHighlightsSection && description) {
        const [existingHighlight] = await tx
          .select({ id: contentItemsTable.id })
          .from(contentItemsTable)
          .where(
            and(
              eq(contentItemsTable.sectionId, eamcetHighlightsSection.id),
              eq(contentItemsTable.itemType, "course-highlight"),
            ),
          )
          .limit(1);
        if (!existingHighlight) {
          await tx.insert(contentItemsTable).values([
            {
              sectionId: eamcetHighlightsSection.id,
              itemType: "course-highlight",
              title: "Mathematics",
              description: "A core subject in the MPC + EAMCET pathway.",
              imageUrl: null,
              linkPath: null,
              label: null,
              content: { category: "CORE SUBJECT" },
              isVisible: true,
              position: 0,
            },
            {
              sectionId: eamcetHighlightsSection.id,
              itemType: "course-highlight",
              title: "Physics",
              description: "A core subject in the MPC + EAMCET pathway.",
              imageUrl: null,
              linkPath: null,
              label: null,
              content: { category: "CORE SUBJECT" },
              isVisible: true,
              position: 1,
            },
            {
              sectionId: eamcetHighlightsSection.id,
              itemType: "course-highlight",
              title: "Chemistry",
              description: "A core subject in the MPC + EAMCET pathway.",
              imageUrl: null,
              linkPath: null,
              label: null,
              content: { category: "CORE SUBJECT" },
              isVisible: true,
              position: 2,
            },
            {
              sectionId: eamcetHighlightsSection.id,
              itemType: "course-highlight",
              title: "EAMCET",
              description: "Entrance-exam preparation associated with this pathway.",
              imageUrl: null,
              linkPath: null,
              label: null,
              content: { category: "EXAM PATHWAY" },
              isVisible: true,
              position: 3,
            },
          ]);
        }
      }
      seedMarkers.add(eamcetDestinationSeedMarker);
      seedMarkers.add(eamcetDetailSeedMarker);
    }

    const courseCurriculumSeedMarker = "course-curriculum-v1";
    if (!seedMarkers.has(courseCurriculumSeedMarker)) {
      const sampleCurricula = [
        {
          slug: "mpc",
          name: "MPC",
          isVisible: true,
          subjects: [
            {
              title: "Mathematics",
              summary: "Build fluency in algebra, functions, geometry, and calculus.",
              topics: [
                "Algebraic expressions",
                "Equations and functions",
                "Trigonometric identities",
                "Coordinate geometry",
                "Sequences and series",
                "Differential calculus",
              ],
            },
            {
              title: "Physics",
              summary: "Connect mathematical models with physical principles.",
              topics: [
                "Units and measurement",
                "Vectors",
                "Motion and kinematics",
                "Newton's laws",
                "Work, energy, and power",
                "Waves and oscillations",
              ],
            },
            {
              title: "Chemistry",
              summary: "Explore physical, inorganic, and introductory organic chemistry.",
              topics: [
                "Atomic structure",
                "Periodic properties",
                "Chemical bonding",
                "Mole concept and stoichiometry",
                "Chemical equilibrium",
                "Introductory organic chemistry",
              ],
            },
          ],
        },
        {
          slug: "bipc",
          name: "BiPC",
          isVisible: true,
          subjects: [
            {
              title: "Botany",
              summary: "Study plant diversity, structure, function, and heredity.",
              topics: [
                "Plant diversity",
                "Cell structure and division",
                "Plant anatomy",
                "Plant physiology",
                "Principles of genetics",
                "Ecology and environment",
              ],
            },
            {
              title: "Zoology",
              summary: "Build a foundation in animal biology and human systems.",
              topics: [
                "Animal diversity",
                "Structural organisation",
                "Human physiology",
                "Reproduction",
                "Genetics and evolution",
                "Health and disease",
              ],
            },
            {
              title: "Physics",
              summary: "Practice core principles through diagrams and problem solving.",
              topics: [
                "Units and measurement",
                "Motion and forces",
                "Work and energy",
                "Electricity",
                "Optics",
                "Modern physics",
              ],
            },
            {
              title: "Chemistry",
              summary: "Review essential chemical ideas and their applications.",
              topics: [
                "Atomic structure",
                "Chemical bonding",
                "Stoichiometry",
                "States of matter",
                "Introductory organic chemistry",
                "Environmental chemistry",
              ],
            },
          ],
        },
        {
          slug: "iit-jee",
          name: "IIT-JEE",
          isVisible: true,
          subjects: [
            {
              title: "Mathematics",
              summary: "Develop accuracy and depth across advanced problem types.",
              topics: [
                "Functions and relations",
                "Algebraic equations",
                "Trigonometry",
                "Coordinate geometry",
                "Differential and integral calculus",
                "Vectors and three-dimensional geometry",
              ],
            },
            {
              title: "Physics",
              summary: "Apply concepts and mathematical reasoning to multi-step problems.",
              topics: [
                "Mechanics",
                "Work, energy, and power",
                "Rotational motion",
                "Electrostatics",
                "Current electricity",
                "Optics and modern physics",
              ],
            },
            {
              title: "Chemistry",
              summary: "Link numerical chemistry with inorganic and organic concepts.",
              topics: [
                "Stoichiometry",
                "Chemical equilibrium",
                "Thermodynamics",
                "Chemical bonding",
                "Organic reaction basics",
                "Coordination compounds",
              ],
            },
          ],
        },
        {
          slug: "neet",
          name: "NEET",
          isVisible: true,
          subjects: [
            {
              title: "Biology",
              summary: "Organise key concepts across living systems and heredity.",
              topics: [
                "Cell biology",
                "Plant physiology",
                "Human physiology",
                "Reproduction",
                "Genetics and evolution",
                "Ecology and environment",
              ],
            },
            {
              title: "Physics",
              summary: "Strengthen concept recall and reliable numerical methods.",
              topics: [
                "Units and measurement",
                "Mechanics",
                "Thermodynamics",
                "Electricity and magnetism",
                "Optics",
                "Modern physics",
              ],
            },
            {
              title: "Chemistry",
              summary: "Build balanced coverage of physical, inorganic, and organic topics.",
              topics: [
                "Mole concept",
                "Chemical equilibrium",
                "Chemical bonding",
                "Solutions and electrochemistry",
                "Organic functional groups",
                "Biomolecules",
              ],
            },
          ],
        },
        {
          slug: "mpc-eamcet",
          name: "MPC + EAMCET",
          isVisible: true,
          subjects: [
            {
              title: "Mathematics",
              summary: "Cover core mathematics with regular timed practice.",
              topics: [
                "Algebra and equations",
                "Functions and graphs",
                "Trigonometry",
                "Coordinate geometry",
                "Sequences and series",
                "Differential calculus",
              ],
            },
            {
              title: "Physics",
              summary: "Strengthen core concepts and speed on objective problems.",
              topics: [
                "Units and vectors",
                "Motion and kinematics",
                "Laws of motion",
                "Work, energy, and power",
                "Electricity and magnetism",
                "Optics",
              ],
            },
            {
              title: "Chemistry",
              summary: "Review high-frequency concepts across the main chemistry areas.",
              topics: [
                "Atomic structure",
                "Periodic properties",
                "Chemical bonding",
                "Stoichiometry",
                "Chemical equilibrium",
                "Organic chemistry foundations",
              ],
            },
          ],
        },
        {
          slug: "integrated",
          name: "Integrated",
          isVisible: false,
          subjects: [
            {
              title: "Mathematics",
              summary: "Sample foundation topics for a coordinated course plan.",
              topics: [
                "Algebra",
                "Functions and graphs",
                "Trigonometry",
                "Coordinate geometry",
              ],
            },
            {
              title: "Physics",
              summary: "Sample foundations connecting measurement to physical models.",
              topics: [
                "Units and measurement",
                "Vectors",
                "Motion",
                "Forces and energy",
              ],
            },
            {
              title: "Chemistry",
              summary: "Sample introductory topics across core chemistry concepts.",
              topics: [
                "Atomic structure",
                "Periodic table",
                "Chemical bonding",
                "Introductory reactions",
              ],
            },
            {
              title: "Biology",
              summary: "Sample foundations in cells, living systems, and ecology.",
              topics: [
                "Cell structure",
                "Plant and animal systems",
                "Heredity",
                "Ecology",
              ],
            },
          ],
        },
      ] as const;

      for (const [index, course] of sampleCurricula.entries()) {
        const sectionKey = `course-${course.slug}-curriculum`;
        await tx
          .insert(contentSectionsTable)
          .values({
            pageSlug: "courses",
            sectionKey,
            title: "A clear path from concepts to confidence.",
            subtitle:
              "Explore the subjects, key topics, and preparation areas covered throughout the course.",
            content: {
              eyebrow: "CURRICULUM",
              downloadHeading: "Take the curriculum with you.",
              downloadDescription:
                "Download the subject and topic guide for this course.",
              downloadButtonLabel: "Download Curriculum",
              pdfPath: `/curriculum-guides/${course.slug}-curriculum-sample.pdf`,
              pdfFileName: `${course.slug}-curriculum-sample.pdf`,
              isSample: true,
            },
            isVisible: course.isVisible,
            position: 30 + index,
          })
          .onConflictDoNothing();

        const [section] = await tx
          .select({ id: contentSectionsTable.id })
          .from(contentSectionsTable)
          .where(
            and(
              eq(contentSectionsTable.pageSlug, "courses"),
              eq(contentSectionsTable.sectionKey, sectionKey),
            ),
          )
          .limit(1);
        if (!section) continue;

        const [existingCurriculumSubject] = await tx
          .select({ id: contentItemsTable.id })
          .from(contentItemsTable)
          .where(
            and(
              eq(contentItemsTable.sectionId, section.id),
              eq(contentItemsTable.itemType, "course-curriculum-subject"),
            ),
          )
          .limit(1);
        if (existingCurriculumSubject) continue;

        await tx.insert(contentItemsTable).values(
          course.subjects.map((subject, position) => ({
            sectionId: section.id,
            itemType: "course-curriculum-subject",
            title: subject.title,
            description: subject.summary,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: { topics: [...subject.topics] },
            isVisible: true,
            position,
          })),
        );
      }

      seedMarkers.add(courseCurriculumSeedMarker);
    }

    const courseCatalogMarker = "four-course-catalog-iit-nit-iiit-ipe-v1";
    if (!seedMarkers.has(courseCatalogMarker)) {
      const currentCards = seedableMenu.courseCards;
      const archivedCards =
        (seedableMenu as typeof seedableMenu & { __legacyCourseCards?: typeof currentCards })
          .__legacyCourseCards ?? currentCards;
      const courseNames = ["IIT", "NIT", "IIIT", "IPE"] as const;
      const canonicalCards = courseNames.map((title, order) => {
        const slug = title.toLowerCase();
        const existing =
          currentCards.find((card) => card.title.trim().toLowerCase() === title.toLowerCase()) ??
          (title === "IIT"
            ? currentCards.find((card) => card.id === "iit-jee-main" || /iit.?jee/i.test(card.title))
            : undefined);
        return {
          id: slug,
          order,
          title,
          category: "Course",
          description: "",
          destination: `/courses/${slug}`,
          isVisible: true,
          icon: existing?.icon ?? null,
          tint: existing?.tint ?? null,
          imageUrl: title === "IIT" ? existing?.imageUrl ?? null : null,
          imageAlt: title === "IIT" ? existing?.imageAlt ?? "" : "",
        };
      });
      const legacyContent = seedableMenu as typeof seedableMenu & {
        __legacyCourseCards?: typeof currentCards;
      };
      seedableMenu = {
        ...seedableMenu,
        __legacyCourseCards: legacyContent.__legacyCourseCards ?? archivedCards,
        courseCards: canonicalCards,
        brandPanel: {
          ...seedableMenu.brandPanel,
          headline: "Explore our courses",
          supportingText:
            "Explore IIT, NIT, IIIT, and IPE at Shastra Junior College.",
          backgroundImageAlt: "Student studying at Shastra Junior College",
        },
        heading: {
          ...seedableMenu.heading,
          eyebrow: "Courses offered",
          title: "Explore our courses",
        },
        benefits: [
          {
            id: "four-course-options",
            order: 0,
            title: "Four course options",
            description: "IIT, NIT, IIIT, and IPE are the courses offered.",
            icon: null,
            isVisible: true,
          },
        ],
        __seedMarkers: [...seedMarkers, courseCatalogMarker],
      } as typeof seedableMenu;
      seedMarkers.add(courseCatalogMarker);
      await tx
        .update(coursesMenuSettingsTable)
        .set({
          content: {
            ...seedableMenu,
            __seedMarkers: [...seedMarkers],
          } as CoursesMenuContent,
          updatedAt: new Date(),
        })
        .where(eq(coursesMenuSettingsTable.id, "primary"));

      for (const [slug, name] of [
        ["iit", "IIT"],
        ["nit", "NIT"],
        ["iiit", "IIIT"],
        ["ipe", "IPE"],
      ] as const) {
        for (const [suffix, title] of [
          ["hero", name],
          ["highlights", `${name} course details`],
          ["curriculum", `${name} course details`],
        ] as const) {
          await tx
            .insert(contentSectionsTable)
            .values({
              pageSlug: "courses",
              sectionKey: `course-${slug}-${suffix}`,
              title,
              subtitle: null,
              content: {},
              isVisible: false,
              position: 100 + ["iit", "nit", "iiit", "ipe"].indexOf(slug),
            })
            .onConflictDoNothing();
        }
      }

      const coursePageSections = await tx
        .select()
        .from(contentSectionsTable)
        .where(eq(contentSectionsTable.pageSlug, "courses"));
      for (const section of coursePageSections) {
        if (!["hero", "regular-pathways", "pathways"].includes(section.sectionKey)) {
          continue;
        }
        const content = isCmsRecord(section.content) ? { ...section.content } : {};
        const oldCourseCopy =
          /MPC|BIPC|NEET|EAMCET|IIT-JEE|exam pathways/i.test(
            `${section.subtitle ?? ""} ${JSON.stringify(content)}`,
          );
        if (!oldCourseCopy) continue;
        const copy =
          section.sectionKey === "hero"
            ? "Explore the four courses offered at Shastra Junior College: IIT, NIT, IIIT, and IPE."
            : "IIT, NIT, IIIT, and IPE are the four courses currently offered.";
        await tx
          .update(contentSectionsTable)
          .set({
            subtitle: copy,
            content: { ...content, description: copy, introduction: copy },
            updatedAt: new Date(),
          })
          .where(eq(contentSectionsTable.id, section.id));
      }
    }

    const courseListingCleanupMarker = "course-listing-four-course-copy-v1";
    if (!seedMarkers.has(courseListingCleanupMarker)) {
      const sections = await tx
        .select()
        .from(contentSectionsTable)
        .where(eq(contentSectionsTable.pageSlug, "courses"));

      for (const section of sections) {
        if (section.sectionKey === "hero") {
          const content = isCmsRecord(section.content) ? { ...section.content } : {};
          await tx
            .update(contentSectionsTable)
            .set({
              title: "Our courses",
              subtitle: "Explore IIT, NIT, IIIT, and IPE at Shastra Junior College.",
              content: { ...content, eyebrow: "COURSES OFFERED" },
              updatedAt: new Date(),
            })
            .where(eq(contentSectionsTable.id, section.id));
        }

        if (section.sectionKey === "regular-pathways") {
          const content = isCmsRecord(section.content) ? { ...section.content } : {};
          await tx
            .update(contentSectionsTable)
            .set({
              title: "Courses offered",
              subtitle: "IIT, NIT, IIIT, and IPE are the four courses currently offered.",
              content: { ...content, eyebrow: "COURSES OFFERED" },
              updatedAt: new Date(),
            })
            .where(eq(contentSectionsTable.id, section.id));
        }

        if (section.sectionKey === "batch-details-schedule") {
          const items = await tx
            .select()
            .from(contentItemsTable)
            .where(eq(contentItemsTable.sectionId, section.id));
          const hasUnconfirmedCourseCopy = items.some((item) =>
            /MPC|BIPC|NEET|EAMCET|IIT-JEE|JEE Main/i.test(
              `${item.title} ${item.description ?? ""} ${JSON.stringify(item.content)}`,
            ),
          );
          if (hasUnconfirmedCourseCopy) {
            await tx
              .update(contentSectionsTable)
              .set({ isVisible: false, updatedAt: new Date() })
              .where(eq(contentSectionsTable.id, section.id));
          }
        }

        if (section.sectionKey === "admissions-cta") {
          const content = isCmsRecord(section.content) ? { ...section.content } : {};
          if (/NEET|EAMCET|IIT-JEE|MPC|BIPC/i.test(JSON.stringify(content))) {
            const benefits = Array.isArray(content.benefits) ? content.benefits : [];
            const benefitCopy = [
              ["Course information", "Ask about IIT, NIT, IIIT, and IPE."],
              ["Admissions guidance", "Talk with the admissions team about the application process."],
              ["Contact the college", "Connect with the admissions team for further information."],
            ];
            await tx
              .update(contentSectionsTable)
              .set({
                title: "Ask us about our courses.",
                subtitle: "Talk with the admissions team about IIT, NIT, IIIT, and IPE.",
                content: {
                  ...content,
                  eyebrow: "COURSE ENQUIRIES",
                  benefits: benefits.map((benefit, index) => {
                    const existing = isCmsRecord(benefit) ? benefit : {};
                    const [title, description] = benefitCopy[index] ?? benefitCopy[2];
                    return { ...existing, title, description };
                  }),
                },
                updatedAt: new Date(),
              })
              .where(eq(contentSectionsTable.id, section.id));
          }
        }
      }

      const faqItems = await tx
        .select()
        .from(contentItemsTable)
        .where(eq(contentItemsTable.itemType, "faq"));
      for (const item of faqItems) {
        const content = isCmsRecord(item.content) ? { ...item.content } : {};
        const hasLegacyCourseCopy = /MPC|BIPC|NEET|EAMCET|IIT-JEE|JEE Main/i.test(
          `${item.title} ${item.description ?? ""} ${JSON.stringify(content)}`,
        );
        const pageTargets = Array.isArray(content.pageTargets)
          ? content.pageTargets.filter((target): target is string => typeof target === "string")
          : [];
        if (!hasLegacyCourseCopy || !pageTargets.some((target) => target === "courses" || target.startsWith("course:"))) {
          continue;
        }
        const remainingTargets = pageTargets.filter(
          (target) => target !== "courses" && !target.startsWith("course:"),
        );
        await tx
          .update(contentItemsTable)
          .set({
            content: { ...content, pageTargets: remainingTargets },
            isVisible: remainingTargets.length > 0 ? item.isVisible : false,
            updatedAt: new Date(),
          })
          .where(eq(contentItemsTable.id, item.id));
      }

      seedMarkers.add(courseListingCleanupMarker);
      seedableMenu = {
        ...seedableMenu,
        __seedMarkers: [...seedMarkers],
      } as typeof seedableMenu;
      await tx
        .update(coursesMenuSettingsTable)
        .set({ content: seedableMenu as CoursesMenuContent, updatedAt: new Date() })
        .where(eq(coursesMenuSettingsTable.id, "primary"));
    }

    const legacyCoursePagesMarker = "retire-legacy-course-detail-pages-v1";
    if (!seedMarkers.has(legacyCoursePagesMarker)) {
      const legacySlugs = ["mpc", "bipc", "iit-jee", "neet", "mpc-eamcet", "integrated"];
      const courseSections = await tx
        .select()
        .from(contentSectionsTable)
        .where(eq(contentSectionsTable.pageSlug, "courses"));
      for (const section of courseSections) {
        if (!legacySlugs.some((slug) => section.sectionKey.startsWith(`course-${slug}-`))) {
          continue;
        }
        await tx
          .update(contentSectionsTable)
          .set({ isVisible: false, updatedAt: new Date() })
          .where(eq(contentSectionsTable.id, section.id));
        await tx
          .update(contentItemsTable)
          .set({ isVisible: false, updatedAt: new Date() })
          .where(eq(contentItemsTable.sectionId, section.id));
      }
      seedMarkers.add(legacyCoursePagesMarker);
      seedableMenu = {
        ...seedableMenu,
        __seedMarkers: [...seedMarkers],
      } as typeof seedableMenu;
      await tx
        .update(coursesMenuSettingsTable)
        .set({ content: seedableMenu as CoursesMenuContent, updatedAt: new Date() })
        .where(eq(coursesMenuSettingsTable.id, "primary"));
    }

    const courseMenuLabelsMarker = "course-menu-labels-v1";
    if (!seedMarkers.has(courseMenuLabelsMarker)) {
      seedMarkers.add(courseMenuLabelsMarker);
      seedableMenu = {
        ...seedableMenu,
        brandPanel: {
          ...seedableMenu.brandPanel,
          headline: "Explore our courses",
          supportingText: "Explore IIT, NIT, IIIT, and IPE at Shastra Junior College.",
        },
        heading: {
          ...seedableMenu.heading,
          eyebrow: "Courses offered",
          title: "Explore our courses",
        },
        __seedMarkers: [...seedMarkers],
      } as typeof seedableMenu;
      await tx
        .update(coursesMenuSettingsTable)
        .set({ content: seedableMenu as CoursesMenuContent, updatedAt: new Date() })
        .where(eq(coursesMenuSettingsTable.id, "primary"));
    }

    const visibleCourseDetailsMarker = "seed-visible-course-detail-sections-v1";
    if (!seedMarkers.has(visibleCourseDetailsMarker)) {
      const courseNames = [["iit", "IIT"], ["nit", "NIT"], ["iiit", "IIIT"], ["ipe", "IPE"]] as const;
      const sections = await tx.select().from(contentSectionsTable).where(eq(contentSectionsTable.pageSlug, "courses"));
      const homeSections = await tx.select().from(contentSectionsTable).where(eq(contentSectionsTable.pageSlug, "home"));
      const homeFaqSection = homeSections.find((section) => section.sectionKey.toLowerCase() === "faqs");

      for (const [slug, name] of courseNames) {
        const hero = sections.find((section) => section.sectionKey === `course-${slug}-hero`);
        const highlights = sections.find((section) => section.sectionKey === `course-${slug}-highlights`);
        const curriculum = sections.find((section) => section.sectionKey === `course-${slug}-curriculum`);
        if (!hero || !highlights || !curriculum) continue;

        const heroContent = isCmsRecord(hero.content) ? { ...hero.content } : {};
        await tx.update(contentSectionsTable).set({
          title: hero.title.trim() || name,
          subtitle: hero.subtitle?.trim() || `Explore the ${name} course at Shastra Junior College.`,
          content: {
            ...heroContent,
            eyebrow: typeof heroContent.eyebrow === "string" && heroContent.eyebrow.trim() ? heroContent.eyebrow : `${name} COURSE`,
            primaryCtaLabel: typeof heroContent.primaryCtaLabel === "string" && heroContent.primaryCtaLabel.trim() ? heroContent.primaryCtaLabel : `Enquire about ${name}`,
            secondaryCtaLabel: typeof heroContent.secondaryCtaLabel === "string" && heroContent.secondaryCtaLabel.trim() ? heroContent.secondaryCtaLabel : "View all courses",
          },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, hero.id));

        const highlightContent = isCmsRecord(highlights.content) ? { ...highlights.content } : {};
        await tx.update(contentSectionsTable).set({
          title: highlights.title.trim() && highlights.title !== `${name} course details` ? highlights.title : "Quick Course Highlights",
          subtitle: highlights.subtitle?.trim() || `Explore the ${name} course and ask the college about its current details.`,
          content: { ...highlightContent, eyebrow: typeof highlightContent.eyebrow === "string" && highlightContent.eyebrow.trim() ? highlightContent.eyebrow : "QUICK COURSE HIGHLIGHTS" },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, highlights.id));

        const highlightItems = await tx.select().from(contentItemsTable).where(eq(contentItemsTable.sectionId, highlights.id));
        if (!highlightItems.length) {
          await tx.insert(contentItemsTable).values([
            { sectionId: highlights.id, itemType: "course-highlight", title: "Course overview", description: `Explore the ${name} course offered at Shastra Junior College.`, content: { category: "COURSE" }, isVisible: true, position: 0 },
            { sectionId: highlights.id, itemType: "course-highlight", title: "Course information", description: "Contact admissions to confirm current subjects, curriculum, and course details.", content: { category: "INFORMATION" }, isVisible: true, position: 1 },
            { sectionId: highlights.id, itemType: "course-highlight", title: "Admissions guidance", description: "Speak with the admissions team about the current application process.", content: { category: "ADMISSIONS" }, isVisible: true, position: 2 },
          ]);
        } else {
          for (const item of highlightItems.filter((entry) => entry.itemType === "course-highlight")) {
            await tx.update(contentItemsTable).set({ isVisible: true, updatedAt: new Date() }).where(eq(contentItemsTable.id, item.id));
          }
        }

        const curriculumContent = isCmsRecord(curriculum.content) ? { ...curriculum.content } : {};
        const nested = (key: string, defaults: Record<string, unknown>) => {
          const existing = isCmsRecord(curriculumContent[key]) ? curriculumContent[key] as Record<string, unknown> : {};
          return { ...defaults, ...existing, isVisible: true };
        };
        const enrollment = isCmsRecord(curriculumContent.courseEnrollmentProcess) ? curriculumContent.courseEnrollmentProcess : {};
        const enrollmentSteps = Array.isArray(enrollment.steps) && enrollment.steps.length ? enrollment.steps : [
          { id: `course-${slug}-enquiry`, title: "Send an enquiry", description: "Share your interest with the college admissions team." },
          { id: `course-${slug}-information`, title: "Discuss course details", description: "Confirm current course information and admissions guidance with the college." },
          { id: `course-${slug}-next-steps`, title: "Confirm next steps", description: "Follow the current instructions provided by the admissions team." },
        ];
        await tx.update(contentSectionsTable).set({
          title: curriculum.title.trim() && curriculum.title !== `${name} course details` ? curriculum.title : "Course information",
          subtitle: curriculum.subtitle?.trim() || `Ask the college about current ${name} course curriculum and subject details.`,
          content: {
            ...curriculumContent,
            eyebrow: typeof curriculumContent.eyebrow === "string" && curriculumContent.eyebrow.trim() ? curriculumContent.eyebrow : "COURSE INFORMATION",
            downloadHeading: typeof curriculumContent.downloadHeading === "string" && curriculumContent.downloadHeading.trim() ? curriculumContent.downloadHeading : "Course information",
            downloadDescription: typeof curriculumContent.downloadDescription === "string" && curriculumContent.downloadDescription.trim() ? curriculumContent.downloadDescription : `Contact admissions for current information about the ${name} course.`,
            courseFacultyPreview: nested("courseFacultyPreview", { eyebrow: "FACULTY", title: `${name} course faculty`, description: `Contact the college to ask about faculty for the ${name} course.` }),
            courseGalleryPreview: nested("courseGalleryPreview", { eyebrow: "GALLERY", title: `${name} at Shastra`, description: "Explore college photographs and campus moments.", ctaLabel: "View Gallery" }),
            courseEnrollmentProcess: { eyebrow: "ADMISSIONS", title: "Enquire about this course", description: "Contact the college for current course and admissions information.", isVisible: true, steps: enrollmentSteps },
            courseTestimonials: nested("courseTestimonials", { eyebrow: "STUDENT STORIES", title: "Student experiences", description: "Learn more about student experiences at Shastra." }),
            courseFaqs: nested("courseFaqs", { eyebrow: "COURSE QUESTIONS", title: `Questions about ${name}`, description: `Answers and admissions information for the ${name} course.` }),
          },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, curriculum.id));

        const curriculumItems = await tx.select().from(contentItemsTable).where(eq(contentItemsTable.sectionId, curriculum.id));
        if (!curriculumItems.length) {
          await tx.insert(contentItemsTable).values({
            sectionId: curriculum.id,
            itemType: "course-curriculum-subject",
            title: "Course information",
            description: `Contact admissions for current subjects and curriculum details for ${name}.`,
            content: { topics: [] },
            isVisible: true,
            position: 0,
          });
        } else {
          for (const item of curriculumItems.filter((entry) => entry.itemType === "course-curriculum-subject")) {
            await tx.update(contentItemsTable).set({ isVisible: true, updatedAt: new Date() }).where(eq(contentItemsTable.id, item.id));
          }
        }

        if (homeFaqSection) {
          const faqItems = await tx.select().from(contentItemsTable).where(eq(contentItemsTable.sectionId, homeFaqSection.id));
          const target = `course:${slug}`;
          if (!faqItems.some((item) => item.itemType === "faq" && isCmsRecord(item.content) && Array.isArray(item.content.pageTargets) && item.content.pageTargets.includes(target))) {
            const position = faqItems.reduce((max, item) => Math.max(max, item.position), -1) + 1;
            await tx.insert(contentItemsTable).values([
              { sectionId: homeFaqSection.id, itemType: "faq", title: `How can I ask about the ${name} course?`, description: "Use the admissions enquiry form or Contact page to speak with the college team.", content: { pageTargets: [target] }, isVisible: true, position },
              { sectionId: homeFaqSection.id, itemType: "faq", title: `Where can I confirm current ${name} course details?`, description: "Contact the admissions team for the current course information.", content: { pageTargets: [target] }, isVisible: true, position: position + 1 },
            ]);
          }
        }
      }

      seedMarkers.add(visibleCourseDetailsMarker);
      seedableMenu = { ...seedableMenu, __seedMarkers: [...seedMarkers] } as typeof seedableMenu;
      await tx.update(coursesMenuSettingsTable)
        .set({ content: seedableMenu as CoursesMenuContent, updatedAt: new Date() })
        .where(eq(coursesMenuSettingsTable.id, "primary"));
    }

    const approvedCourseCopyMarker = "approved-neutral-course-copy-v2";
    if (!seedMarkers.has(approvedCourseCopyMarker)) {
      const sections = await tx.select().from(contentSectionsTable).where(eq(contentSectionsTable.pageSlug, "courses"));
      for (const [slug, name] of [["iit", "IIT"], ["nit", "NIT"], ["iiit", "IIIT"], ["ipe", "IPE"]] as const) {
        const hero = sections.find((section) => section.sectionKey === `course-${slug}-hero`);
        if (!hero) continue;
        const content = isCmsRecord(hero.content) ? { ...hero.content } : {};
        await tx.update(contentSectionsTable).set({
          title: name,
          subtitle: `Explore the ${name} course at Shastra Junior College. Contact the admissions team for current details.`,
          content: {
            ...content,
            eyebrow: `${name} COURSE`,
            primaryCtaLabel: `Enquire about ${name}`,
            secondaryCtaLabel: "View all courses",
            statusLabel: "",
            duration: "",
            studyMode: "",
          },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, hero.id));
      }

      const testimonials = await tx.select().from(contentItemsTable).where(eq(contentItemsTable.itemType, "testimonial"));
      for (const item of testimonials) {
        const content = isCmsRecord(item.content) ? { ...item.content } : {};
        if (
          content.showOnCoursePages === true &&
          /MPC|BIPC|NEET|EAMCET|IIT-JEE|JEE Main/i.test(`${item.title} ${item.description ?? ""} ${JSON.stringify(content)}`)
        ) {
          await tx.update(contentItemsTable).set({
            content: { ...content, showOnCoursePages: false },
            updatedAt: new Date(),
          }).where(eq(contentItemsTable.id, item.id));
        }
      }

      seedMarkers.add(approvedCourseCopyMarker);
      seedableMenu = { ...seedableMenu, __seedMarkers: [...seedMarkers] } as typeof seedableMenu;
      await tx.update(coursesMenuSettingsTable)
        .set({ content: seedableMenu as CoursesMenuContent, updatedAt: new Date() })
        .where(eq(coursesMenuSettingsTable.id, "primary"));
    }

    const iitCourseCopyMarker = "iit-course-specific-public-copy-v1";
    if (!seedMarkers.has(iitCourseCopyMarker)) {
      const sections = await tx.select().from(contentSectionsTable).where(eq(contentSectionsTable.pageSlug, "courses"));
      const hero = sections.find((section) => section.sectionKey === "course-iit-hero");
      const highlights = sections.find((section) => section.sectionKey === "course-iit-highlights");
      const curriculum = sections.find((section) => section.sectionKey === "course-iit-curriculum");

      if (hero) {
        const content = isCmsRecord(hero.content) ? { ...hero.content } : {};
        await tx.update(contentSectionsTable).set({
          title: "IIT",
          subtitle: "Build a strong foundation in Mathematics, Physics, and Chemistry while preparing for the IIT-JEE pathway.",
          content: { ...content, eyebrow: "IIT-JEE PREPARATION", primaryCtaLabel: "Explore IIT-JEE", secondaryCtaLabel: "View all courses" },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, hero.id));
      }

      if (highlights) {
        const content = isCmsRecord(highlights.content) ? { ...highlights.content } : {};
        await tx.update(contentSectionsTable).set({
          title: "IIT-JEE Course Highlights",
          subtitle: "Explore Mathematics, Physics, Chemistry, and the IIT-JEE preparation pathway.",
          content: { ...content, eyebrow: "IIT-JEE COURSE HIGHLIGHTS" },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, highlights.id));
        const items = await tx.select().from(contentItemsTable).where(eq(contentItemsTable.sectionId, highlights.id));
        const copy = [
          { title: "IIT-JEE pathway", description: "Explore preparation for the IIT-JEE pathway associated with this course.", category: "IIT-JEE" },
          { title: "Mathematics", description: "Build mathematical understanding and problem-solving practice.", category: "MATHEMATICS" },
          { title: "Physics and Chemistry", description: "Study core science subjects alongside IIT-JEE preparation.", category: "CORE SUBJECTS" },
        ];
        const highlightItems = items.filter((item) => item.itemType === "course-highlight").sort((a, b) => a.position - b.position);
        for (let index = 0; index < copy.length; index++) {
          const entry = copy[index];
          const item = highlightItems[index];
          if (item) {
            await tx.update(contentItemsTable).set({
              title: entry.title,
              description: entry.description,
              content: { ...(isCmsRecord(item.content) ? item.content : {}), category: entry.category },
              isVisible: true,
              updatedAt: new Date(),
            }).where(eq(contentItemsTable.id, item.id));
          } else {
            await tx.insert(contentItemsTable).values({
              sectionId: highlights.id, itemType: "course-highlight", title: entry.title,
              description: entry.description, content: { category: entry.category },
              isVisible: true, position: index,
            });
          }
        }
      }

      if (curriculum) {
        const content = isCmsRecord(curriculum.content) ? { ...curriculum.content } : {};
        const facultyPreview = isCmsRecord(content.courseFacultyPreview) ? content.courseFacultyPreview : {};
        const galleryPreview = isCmsRecord(content.courseGalleryPreview) ? content.courseGalleryPreview : {};
        const testimonials = isCmsRecord(content.courseTestimonials) ? content.courseTestimonials : {};
        const faqs = isCmsRecord(content.courseFaqs) ? content.courseFaqs : {};
        await tx.update(contentSectionsTable).set({
          title: "IIT-JEE Course Curriculum",
          subtitle: "Explore Mathematics, Physics, Chemistry, and preparation for the IIT-JEE pathway.",
          content: {
            ...content,
            eyebrow: "IIT-JEE COURSE CURRICULUM",
            downloadHeading: "IIT-JEE course guide",
            downloadDescription: "Explore the IIT-JEE pathway and core subject information.",
            courseFacultyPreview: { ...facultyPreview, isVisible: true, eyebrow: "IIT-JEE FACULTY", title: "IIT-JEE Faculty", description: "Meet faculty selected for Mathematics and the IIT-JEE pathway." },
            courseGalleryPreview: { ...galleryPreview, isVisible: true, eyebrow: "IIT COURSE GALLERY", title: "IIT Course Gallery", description: "Explore campus and classroom moments while learning about the IIT course.", ctaLabel: "View Gallery" },
            courseEnrollmentProcess: {
              eyebrow: "IIT-JEE ENQUIRIES",
              title: "Explore the IIT-JEE pathway",
              description: "Learn about the course focus and ask the college for current details.",
              isVisible: true,
              steps: [
                { id: "iit-course-pathway", title: "Explore IIT-JEE preparation", description: "Review the course focus on Mathematics, Physics, and Chemistry." },
                { id: "iit-course-subjects", title: "Discuss subject support", description: "Ask the college about Mathematics and the other core subjects." },
                { id: "iit-course-next-steps", title: "Plan your next step", description: "Contact admissions for current IIT course and application details." },
              ],
            },
            courseTestimonials: { ...testimonials, isVisible: true, eyebrow: "IIT-JEE STUDENT STORIES", title: "IIT course experiences", description: "Explore student perspectives on learning and preparation at Shastra." },
            courseFaqs: { ...faqs, isVisible: true, eyebrow: "IIT-JEE QUESTIONS", title: "IIT Course Questions", description: "Answers about Mathematics, the IIT-JEE pathway, and course information." },
          },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, curriculum.id));

        const curriculumItems = await tx.select().from(contentItemsTable).where(eq(contentItemsTable.sectionId, curriculum.id));
        const subjectCopy = [
          { title: "Mathematics", description: "Develop mathematical understanding and problem-solving practice for the IIT-JEE pathway." },
          { title: "Physics", description: "Explore Physics as a core subject in IIT-JEE preparation." },
          { title: "Chemistry", description: "Explore Chemistry as a core subject in IIT-JEE preparation." },
        ];
        const existingSubjects = curriculumItems.filter((item) => item.itemType === "course-curriculum-subject").sort((a, b) => a.position - b.position);
        for (let index = 0; index < subjectCopy.length; index++) {
          const entry = subjectCopy[index];
          const item = existingSubjects[index];
          if (item) {
            await tx.update(contentItemsTable).set({
              title: entry.title, description: entry.description, content: { topics: [] },
              isVisible: true, position: index, updatedAt: new Date(),
            }).where(eq(contentItemsTable.id, item.id));
          } else {
            await tx.insert(contentItemsTable).values({
              sectionId: curriculum.id, itemType: "course-curriculum-subject",
              title: entry.title, description: entry.description, content: { topics: [] },
              isVisible: true, position: index,
            });
          }
        }
      }

      const homeSections = await tx.select().from(contentSectionsTable).where(eq(contentSectionsTable.pageSlug, "home"));
      const homeFaqSection = homeSections.find((section) => section.sectionKey.toLowerCase() === "faqs");
      if (homeFaqSection) {
        const faqItems = await tx.select().from(contentItemsTable).where(eq(contentItemsTable.sectionId, homeFaqSection.id));
        const target = "course:iit";
        const iitFaqs = [
          { title: "What subjects does the IIT course focus on?", description: "The IIT-JEE pathway focuses on Mathematics, Physics, and Chemistry. Contact admissions for the current detailed curriculum." },
          { title: "Does the IIT course include IIT-JEE preparation?", description: "The IIT course includes an IIT-JEE preparation pathway. Contact the college for current program details." },
        ];
        const matches = faqItems.filter((item) =>
          item.itemType === "faq" && isCmsRecord(item.content) &&
          Array.isArray(item.content.pageTargets) && item.content.pageTargets.includes(target),
        ).sort((a, b) => a.position - b.position);
        for (let index = 0; index < iitFaqs.length; index++) {
          const entry = iitFaqs[index];
          const item = matches[index];
          if (item) {
            await tx.update(contentItemsTable).set({
              title: entry.title, description: entry.description, isVisible: true, updatedAt: new Date(),
            }).where(eq(contentItemsTable.id, item.id));
          } else {
            await tx.insert(contentItemsTable).values({
              sectionId: homeFaqSection.id, itemType: "faq", title: entry.title,
              description: entry.description, content: { pageTargets: [target] },
              isVisible: true, position: faqItems.reduce((max, faq) => Math.max(max, faq.position), -1) + index + 1,
            });
          }
        }
      }

      seedMarkers.add(iitCourseCopyMarker);
      seedableMenu = { ...seedableMenu, __seedMarkers: [...seedMarkers] } as typeof seedableMenu;
      await tx.update(coursesMenuSettingsTable)
        .set({ content: seedableMenu as CoursesMenuContent, updatedAt: new Date() })
        .where(eq(coursesMenuSettingsTable.id, "primary"));
    }

    const iitTestimonialContextMarker = "iit-testimonial-context-v2";
    if (!seedMarkers.has(iitTestimonialContextMarker)) {
      const curriculum = (await tx.select().from(contentSectionsTable).where(eq(contentSectionsTable.pageSlug, "courses")))
        .find((section) => section.sectionKey === "course-iit-curriculum");
      if (curriculum) {
        const content = isCmsRecord(curriculum.content) ? { ...curriculum.content } : {};
        const testimonials = isCmsRecord(content.courseTestimonials) ? content.courseTestimonials : {};
        await tx.update(contentSectionsTable).set({
          content: {
            ...content,
            courseTestimonials: {
              ...testimonials,
              isVisible: true,
              eyebrow: "SHASTRA STORIES",
              title: "Student and parent stories",
              description: "Explore experiences shared by Shastra families alongside IIT-JEE course information.",
            },
          },
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, curriculum.id));
      }
      seedMarkers.add(iitTestimonialContextMarker);
      seedableMenu = { ...seedableMenu, __seedMarkers: [...seedMarkers] } as typeof seedableMenu;
      await tx.update(coursesMenuSettingsTable)
        .set({ content: seedableMenu as CoursesMenuContent, updatedAt: new Date() })
        .where(eq(coursesMenuSettingsTable.id, "primary"));
    }

    const allCoursePagesCopyMarker = "all-course-page-copy-and-topics-v1";
    if (!seedMarkers.has(allCoursePagesCopyMarker)) {
      const sections = await tx.select().from(contentSectionsTable).where(eq(contentSectionsTable.pageSlug, "courses"));
      const courseCopy = [
        { slug: "iit", name: "IIT", pathway: "IIT-JEE", hero: "Build a strong foundation in Mathematics, Physics, and Chemistry while preparing for the IIT-JEE pathway.", focus: "IIT-JEE", faculty: "Mathematics and the IIT-JEE pathway" },
        { slug: "nit", name: "NIT", pathway: "JEE Main", hero: "Explore the NIT pathway with Mathematics, Physics, Chemistry, and JEE Main preparation.", focus: "JEE Main", faculty: "Mathematics, Physics, Chemistry, and JEE Main" },
        { slug: "iiit", name: "IIIT", pathway: "JEE Main", hero: "Explore the IIIT pathway with Mathematics, Physics, Chemistry, and JEE Main preparation.", focus: "JEE Main", faculty: "Mathematics, Physics, Chemistry, and JEE Main" },
        { slug: "ipe", name: "IPE", pathway: "Intermediate Public Examinations", hero: "Build a strong foundation in Mathematics, Physics, and Chemistry for IPE.", focus: "IPE", faculty: "Mathematics, Physics, and Chemistry" },
      ] as const;
      const subjects = [
        { title: "Mathematics", description: "Build mathematical understanding and problem-solving skills.", topics: ["Algebra", "Trigonometry", "Coordinate geometry", "Calculus fundamentals", "Probability"] },
        { title: "Physics", description: "Explore core Physics concepts and how to apply them to problems.", topics: ["Mechanics", "Waves and optics", "Thermal physics", "Electricity and magnetism"] },
        { title: "Chemistry", description: "Review core Chemistry concepts and their applications.", topics: ["Atomic structure", "Chemical bonding", "Periodic trends", "Organic chemistry fundamentals"] },
      ];
      const fiveSteps = (slug: string, pathway: string) => [
        { id: `${slug}-step-1`, title: "Explore the course", description: `Review the ${pathway} pathway and core subjects.` },
        { id: `${slug}-step-2`, title: "Review Mathematics", description: "Explore Mathematics topics and problem-solving practice." },
        { id: `${slug}-step-3`, title: "Review Physics and Chemistry", description: "Explore the core concepts listed in the course curriculum." },
        { id: `${slug}-step-4`, title: "Discuss your questions", description: "Ask the college for current course and application information." },
        { id: `${slug}-step-5`, title: "Plan your next step", description: "Follow the current guidance shared by the admissions team." },
      ];

      for (const entry of courseCopy) {
        const hero = sections.find((section) => section.sectionKey === `course-${entry.slug}-hero`);
        const highlights = sections.find((section) => section.sectionKey === `course-${entry.slug}-highlights`);
        const curriculum = sections.find((section) => section.sectionKey === `course-${entry.slug}-curriculum`);
        if (!hero || !highlights || !curriculum) continue;
        const heroContent = isCmsRecord(hero.content) ? { ...hero.content } : {};
        await tx.update(contentSectionsTable).set({
          title: entry.name,
          subtitle: entry.hero,
          content: { ...heroContent, eyebrow: `${entry.pathway.toUpperCase()} PATHWAY`, primaryCtaLabel: `Explore ${entry.name}`, secondaryCtaLabel: "View all courses", duration: "", studyMode: "", statusLabel: "" },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, hero.id));

        const highlightContent = isCmsRecord(highlights.content) ? { ...highlights.content } : {};
        await tx.update(contentSectionsTable).set({
          title: `${entry.name} Course Highlights`,
          subtitle: entry.hero,
          content: { ...highlightContent, eyebrow: `${entry.name.toUpperCase()} COURSE HIGHLIGHTS` },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, highlights.id));
        const highlightRows = (await tx.select().from(contentItemsTable).where(eq(contentItemsTable.sectionId, highlights.id)))
          .filter((item) => item.itemType === "course-highlight").sort((a, b) => a.position - b.position);
        const highlightCopy = [
          { title: `${entry.pathway} pathway`, description: `Explore the ${entry.pathway} pathway associated with the ${entry.name} course.`, category: entry.pathway.toUpperCase() },
          { title: "Mathematics", description: "Strengthen mathematical understanding and problem-solving practice.", category: "MATHEMATICS" },
          { title: "Physics and Chemistry", description: "Explore core science subjects through the course curriculum.", category: "CORE SUBJECTS" },
        ];
        for (let i = 0; i < highlightCopy.length; i++) {
          const copy = highlightCopy[i];
          const item = highlightRows[i];
          if (item) {
            await tx.update(contentItemsTable).set({ title: copy.title, description: copy.description, content: { ...(isCmsRecord(item.content) ? item.content : {}), category: copy.category }, isVisible: true, updatedAt: new Date() }).where(eq(contentItemsTable.id, item.id));
          } else {
            await tx.insert(contentItemsTable).values({ sectionId: highlights.id, itemType: "course-highlight", title: copy.title, description: copy.description, content: { category: copy.category }, isVisible: true, position: i });
          }
        }

        const curriculumContent = isCmsRecord(curriculum.content) ? { ...curriculum.content } : {};
        const facultyPreview = isCmsRecord(curriculumContent.courseFacultyPreview) ? curriculumContent.courseFacultyPreview : {};
        const galleryPreview = isCmsRecord(curriculumContent.courseGalleryPreview) ? curriculumContent.courseGalleryPreview : {};
        const testimonials = isCmsRecord(curriculumContent.courseTestimonials) ? curriculumContent.courseTestimonials : {};
        const faqSettings = isCmsRecord(curriculumContent.courseFaqs) ? curriculumContent.courseFaqs : {};
        await tx.update(contentSectionsTable).set({
          title: `${entry.name} Course Curriculum`,
          subtitle: `Explore Mathematics, Physics, Chemistry, and the ${entry.pathway} pathway.`,
          content: {
            ...curriculumContent,
            eyebrow: `${entry.pathway.toUpperCase()} CURRICULUM`,
            downloadHeading: `${entry.name} course guide`,
            downloadDescription: `Explore the ${entry.pathway} pathway and core subject information.`,
            courseFacultyPreview: { ...facultyPreview, isVisible: true, eyebrow: `${entry.name.toUpperCase()} FACULTY`, title: `${entry.name} Course Faculty`, description: `Meet faculty selected for ${entry.faculty}.` },
            courseGalleryPreview: { ...galleryPreview, isVisible: true, eyebrow: `${entry.name.toUpperCase()} GALLERY`, title: `${entry.name} Course Gallery`, description: `Explore campus and classroom moments while learning about the ${entry.name} course.`, ctaLabel: "View Gallery" },
            courseEnrollmentProcess: { eyebrow: `${entry.pathway.toUpperCase()} COURSE ENQUIRIES`, title: `Explore the ${entry.name} pathway`, description: `Review the ${entry.name} course focus and ask the college for current details.`, isVisible: true, steps: fiveSteps(entry.slug, entry.pathway) },
            courseTestimonials: { ...testimonials, isVisible: true, eyebrow: "SHASTRA STORIES", title: "Student and parent stories", description: `Explore experiences shared by Shastra families alongside ${entry.name} course information.` },
            courseFaqs: { ...faqSettings, isVisible: true, eyebrow: `${entry.name.toUpperCase()} QUESTIONS`, title: `${entry.name} Course Questions`, description: `Answers about subjects, the ${entry.pathway} pathway, and course information.` },
          },
          isVisible: true,
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, curriculum.id));

        const curriculumRows = (await tx.select().from(contentItemsTable).where(eq(contentItemsTable.sectionId, curriculum.id)))
          .filter((item) => item.itemType === "course-curriculum-subject").sort((a, b) => a.position - b.position);
        for (let i = 0; i < subjects.length; i++) {
          const subject = subjects[i];
          const item = curriculumRows[i];
          const data = { topics: subject.topics };
          if (item) {
            await tx.update(contentItemsTable).set({ title: subject.title, description: subject.description, content: data, isVisible: true, position: i, updatedAt: new Date() }).where(eq(contentItemsTable.id, item.id));
          } else {
            await tx.insert(contentItemsTable).values({ sectionId: curriculum.id, itemType: "course-curriculum-subject", title: subject.title, description: subject.description, content: data, isVisible: true, position: i });
          }
        }

        const homeSections = await tx.select().from(contentSectionsTable).where(eq(contentSectionsTable.pageSlug, "home"));
        const homeFaq = homeSections.find((section) => section.sectionKey.toLowerCase() === "faqs");
        if (homeFaq) {
          const target = `course:${entry.slug}`;
          const allFaqs = await tx.select().from(contentItemsTable).where(eq(contentItemsTable.sectionId, homeFaq.id));
          const courseFaqs = allFaqs.filter((item) => item.itemType === "faq" && isCmsRecord(item.content) && Array.isArray(item.content.pageTargets) && item.content.pageTargets.includes(target)).sort((a, b) => a.position - b.position);
          const faqCopy = [
            { title: `Which subjects are covered in the ${entry.name} course?`, description: `The course curriculum includes Mathematics, Physics, and Chemistry. Contact the college for current subject details.` },
            { title: `What pathway does the ${entry.name} course follow?`, description: `The course information highlights the ${entry.pathway} pathway. Contact admissions for current program details.` },
          ];
          for (let i = 0; i < faqCopy.length; i++) {
            const copy = faqCopy[i];
            const item = courseFaqs[i];
            if (item) await tx.update(contentItemsTable).set({ title: copy.title, description: copy.description, isVisible: true, updatedAt: new Date() }).where(eq(contentItemsTable.id, item.id));
            else await tx.insert(contentItemsTable).values({ sectionId: homeFaq.id, itemType: "faq", title: copy.title, description: copy.description, content: { pageTargets: [target] }, isVisible: true, position: allFaqs.reduce((max, faq) => Math.max(max, faq.position), -1) + i + 1 });
          }
        }
      }

      const iitCurriculum = sections.find((section) => section.sectionKey === "course-iit-curriculum");
      if (iitCurriculum) {
        const content = isCmsRecord(iitCurriculum.content) ? { ...iitCurriculum.content } : {};
        const enrollment = isCmsRecord(content.courseEnrollmentProcess) ? content.courseEnrollmentProcess : {};
        await tx.update(contentSectionsTable).set({
          content: { ...content, courseEnrollmentProcess: { ...enrollment, isVisible: true, steps: fiveSteps("iit", "IIT-JEE") } },
          updatedAt: new Date(),
        }).where(eq(contentSectionsTable.id, iitCurriculum.id));
      }

      seedMarkers.add(allCoursePagesCopyMarker);
      seedableMenu = { ...seedableMenu, __seedMarkers: [...seedMarkers] } as typeof seedableMenu;
      await tx.update(coursesMenuSettingsTable).set({ content: seedableMenu as CoursesMenuContent, updatedAt: new Date() }).where(eq(coursesMenuSettingsTable.id, "primary"));
    }

    const starterSeedMarker = "courses-batches-schedule-admissions-v1";
    if (seedMarkers.has(starterSeedMarker)) {
      if (seedMarkers.size !== (seedableMenu.__seedMarkers?.length ?? 0)) {
        await tx
          .update(coursesMenuSettingsTable)
          .set({
            content: {
              ...seedableMenu,
              __seedMarkers: [...seedMarkers],
            } as CoursesMenuContent,
            updatedAt: new Date(),
          })
          .where(eq(coursesMenuSettingsTable.id, "primary"));
      }
      return;
    }

    const extendedSections: SeedSection[] = [
      {
        sectionKey: "batch-details-schedule",
        title: "Build a focused study routine.",
        subtitle:
          "Review upcoming preparation batches and the daily class schedule at Shastra Junior College.",
        content: {
          eyebrow: "BATCH DETAILS & SCHEDULE",
          batchHeading: "Upcoming Batches",
          batchDescription:
            "Find the next preparation batch for your examination goal.",
          scheduleHeading: "Daily Schedule",
          scheduleDescription:
            "A considered rhythm for core subjects, breaks, and problem-solving.",
        },
        isVisible: true,
        position: 2,
      },
      {
        sectionKey: "admissions-cta",
        title: "Choose the path that fits your goals.",
        subtitle:
          "Talk through subject choices, exam preparation, upcoming batches, and your next steps with the Shastra admissions team.",
        content: {
          eyebrow: "NEED GUIDANCE?",
          buttonLabel: "Talk with Admissions",
          buttonPath: "/contact",
          benefits: [
            {
              id: "subject-guidance",
              title: "Subject guidance",
              description:
                "Compare subject combinations and examination pathways.",
              isVisible: true,
            },
            {
              id: "batch-details",
              title: "Batch details",
              description:
                "Ask about NEET and IIT-JEE Main preparation starts.",
              isVisible: true,
            },
            {
              id: "admissions-support",
              title: "Admissions support",
              description:
                "Get help understanding the next steps in the process.",
              isVisible: true,
            },
          ],
        },
        isVisible: true,
        position: 3,
      },
    ];

    await tx
      .insert(contentSectionsTable)
      .values(
        extendedSections.map((section) => ({
          ...section,
          pageSlug: "courses",
        })),
      )
      .onConflictDoNothing();

    const courseSections = await tx
      .select({
        id: contentSectionsTable.id,
        sectionKey: contentSectionsTable.sectionKey,
      })
      .from(contentSectionsTable)
      .where(eq(contentSectionsTable.pageSlug, "courses"));
    const sectionIds = new Map(
      courseSections.map((section) => [section.sectionKey, section.id]),
    );

    const batchSectionId = sectionIds.get("batch-details-schedule");
    if (batchSectionId) {
      const [existingBatch] = await tx
        .select({ id: contentItemsTable.id })
        .from(contentItemsTable)
        .where(eq(contentItemsTable.sectionId, batchSectionId))
        .limit(1);
      if (!existingBatch) {
        await tx.insert(contentItemsTable).values([
          {
            sectionId: batchSectionId,
            itemType: "course-batch",
            title: "NEET 2027 Preparation Batch",
            description:
              "Focused preparation across Biology, Physics, and Chemistry for the NEET 2027 examination.",
            imageUrl: null,
            linkPath: null,
            label: null,
            content: {
              status: "Upcoming",
              startDate: "2026-10-15",
              targetExam: "NEET 2027",
            },
            isVisible: true,
            position: 0,
          },
          {
            sectionId: batchSectionId,
            itemType: "course-batch",
            title: "IIT-JEE Main 2027 Preparation Batch",
            description:
              "Focused preparation across Mathematics, Physics, and Chemistry for IIT-JEE Main 2027.",
            imageUrl: null,
            linkPath: null,
            label: null,
            content: {
              status: "Upcoming",
              startDate: "2026-10-15",
              targetExam: "IIT-JEE Main 2027",
            },
            isVisible: true,
            position: 1,
          },
        ]);
      }
    }

    const scheduleSectionId = sectionIds.get("batch-details-schedule");
    if (scheduleSectionId) {
      const [existingSchedule] = await tx
        .select({ id: contentItemsTable.id })
        .from(contentItemsTable)
        .where(
          and(
            eq(contentItemsTable.sectionId, scheduleSectionId),
            eq(contentItemsTable.itemType, "course-schedule"),
          ),
        )
        .limit(1);
      if (!existingSchedule) {
        await tx.insert(contentItemsTable).values([
          {
            sectionId: scheduleSectionId,
            itemType: "course-schedule",
            title: "Mathematics / Biology",
            description: null,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: { startTime: "8:00 AM", endTime: "10:00 AM" },
            isVisible: true,
            position: 0,
          },
          {
            sectionId: scheduleSectionId,
            itemType: "course-schedule",
            title: "Physics",
            description: null,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: { startTime: "10:15 AM", endTime: "12:00 PM" },
            isVisible: true,
            position: 1,
          },
          {
            sectionId: scheduleSectionId,
            itemType: "course-schedule",
            title: "Lunch Break",
            description: null,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: { startTime: "12:00 PM", endTime: "1:00 PM" },
            isVisible: true,
            position: 2,
          },
          {
            sectionId: scheduleSectionId,
            itemType: "course-schedule",
            title: "Chemistry",
            description: null,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: { startTime: "1:00 PM", endTime: "2:00 PM" },
            isVisible: true,
            position: 3,
          },
          {
            sectionId: scheduleSectionId,
            itemType: "course-schedule",
            title: "Problem Solving & Doubt Session",
            description: null,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: { startTime: "2:00 PM", endTime: "3:00 PM" },
            isVisible: true,
            position: 4,
          },
        ]);
      }
    }

    seedMarkers.add(starterSeedMarker);
    await tx
      .update(coursesMenuSettingsTable)
      .set({
        content: {
          ...seedableMenu,
          __seedMarkers: [...seedMarkers],
        } as CoursesMenuContent,
        updatedAt: new Date(),
      })
      .where(eq(coursesMenuSettingsTable.id, "primary"));
  });
}

type SeedSection = {
  sectionKey: string;
  title: string;
  subtitle: string | null;
  content: CmsJson;
  isVisible: boolean;
  position: number;
};

function isCmsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const initialSections: SeedSection[] = [
  {
    sectionKey: "announcement",
    title: "Announcement bar",
    subtitle: null,
    content: {
      text: "Add an approved announcement from the Home editor.",
      isDemo: true,
    },
    isVisible: false,
    position: 0,
  },
  {
    sectionKey: "hero",
    title: "Homepage hero",
    subtitle: null,
    content: {
      eyebrow: "IIT • NIT • IIIT • IPE",
      headline: "A strong start for everything ahead.",
      introduction:
        "Explore IIT, NIT, IIIT, and IPE courses at Shastra Junior College. Contact admissions for current course details.",
      imageUrl: null,
      primaryLabel: "Explore pathways",
      primaryPath: "#programs",
      secondaryLabel: "Enquire",
      secondaryPath: "#enquire",
      enquiryForm: demoEnquiryForm,
      isDemo: true,
    },
    isVisible: true,
    position: 1,
  },
  {
    sectionKey: "introduction",
    title: "College introduction",
    subtitle: "A short introduction to Shastra Junior College",
    content: {
      body:
        "This introduction is demo copy. Replace it with an approved overview of Shastra Junior College before publishing.",
      ctaLabel: "About the college",
      ctaPath: "/about",
      isDemo: true,
    },
    isVisible: true,
    position: 2,
  },
  {
    sectionKey: "programs",
    title: "EXPLORE PROGRAM PATHWAYS:",
    subtitle: null,
    content: {},
    isVisible: true,
    position: 3,
  },
  {
    sectionKey: "statistics",
    title: "At a glance",
    subtitle: null,
    content: { countUp: true },
    isVisible: true,
    position: 9,
  },
  {
    sectionKey: "gallery",
    title: "A closer look at campus life",
    subtitle:
      "Explore the spaces, people, and moments that make a college community.",
    content: {
      eyebrow: "Life at Shastra",
      isDemo: true,
    },
    isVisible: true,
    position: 10,
  },
  {
    sectionKey: "features",
    title: "Why choose Shastra?",
    subtitle: "Replace these demo themes with details approved by the college.",
    content: { isDemo: true },
    isVisible: true,
    position: 4,
  },
  {
    sectionKey: "campus-life",
    title: "Campus life",
    subtitle:
      "Illustrative cards only. Replace them with approved details and photos.",
    content: { isDemo: true },
    isVisible: true,
    position: 5,
  },
  {
    sectionKey: "notices",
    title: "Notices & events",
    subtitle: "Add approved updates in the Home editor.",
    content: { isDemo: true },
    isVisible: false,
    position: 6,
  },
  {
    sectionKey: "testimonials",
    title: "Stories & outcomes",
    subtitle: "Hidden until verified, client-approved content is supplied.",
    content: { isDemo: true },
    isVisible: false,
    position: 7,
  },
  {
    sectionKey: "final-cta",
    title: "Final call to action",
    subtitle: null,
    content: {
      headline: "Ready to explore what comes next?",
      body:
        "This is demo copy. Replace it with approved next steps before publishing.",
      buttonLabel: "Explore programs",
      buttonPath: "#programs",
      isDemo: true,
    },
    isVisible: true,
    position: 8,
  },
];

function initialGalleryItems(sectionId: string) {
  const sampleImages = [
    {
      category: "Campus",
      title: "Room to learn and grow",
      description: "An inviting campus setting with space to focus and connect.",
      imageUrl:
        "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=84",
      altText: "A university campus building framed by green trees",
      showOnHome: true,
    },
    {
      category: "Library",
      title: "A quiet place for big ideas",
      description: "A welcoming reading space for research, revision, and discovery.",
      imageUrl:
        "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1400&q=84",
      altText: "A bright library reading room with long tables and bookshelves",
      showOnHome: true,
    },
    {
      category: "Classrooms",
      title: "Learning in every lesson",
      description: "A focused classroom environment for shared learning.",
      imageUrl:
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=84",
      altText: "A teacher and students in a bright classroom",
      showOnHome: true,
    },
    {
      category: "Placements",
      title: "Preparing for what comes next",
      description: "Students collaborating as they build skills for future opportunities.",
      imageUrl:
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=84",
      altText: "A group of young professionals working together around a table",
      showOnHome: true,
    },
    {
      category: "Buildings",
      title: "Spaces made for possibility",
      description: "Contemporary architecture designed around a learning community.",
      imageUrl:
        "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1400&q=84",
      altText: "A modern educational building with clean architectural lines",
      showOnHome: true,
    },
    {
      category: "Events",
      title: "Shared moments, lasting memories",
      description: "A celebratory gathering that brings students together.",
      imageUrl:
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1400&q=84",
      altText: "Graduates celebrating together at a university event",
      showOnHome: true,
    },
    {
      category: "Campus",
      title: "Growing together",
      description: "A glimpse of the friendships and shared experiences of student life.",
      imageUrl:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=84",
      altText: "Students sharing ideas and studying together",
      showOnHome: false,
    },
  ];

  return sampleImages.map((item, position) => ({
    sectionId,
    itemType: "gallery-image",
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    linkPath: null,
    label: null,
    content: {
      category: item.category,
      altText: item.altText,
      isDemo: true,
      showOnHome: item.showOnHome,
    },
    isVisible: true,
    position,
  }));
}

export async function seedInitialHomeContent(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(coursesMenuSettingsTable)
      .values({ id: "primary", content: DEFAULT_COURSES_MENU })
      .onConflictDoNothing();
    await tx
      .insert(knowledgeHubMenuSettingsTable)
      .values({ id: "primary", content: DEFAULT_KNOWLEDGE_HUB_MENU })
      .onConflictDoNothing();

    const [insertedSettings] = await tx
      .insert(siteSettingsTable)
      .values({
        id: "primary",
        collegeName: "Shastra Junior College",
        logoUrl: "/shastra-college-logo.png",
        navigation: DEFAULT_PUBLIC_NAVIGATION,
        footerNote:
          "Homepage demo content — replace with college-approved copy before publishing.",
      })
      .onConflictDoNothing()
      .returning({ id: siteSettingsTable.id });

    if (!insertedSettings) {
      const [existingSettings] = await tx
        .select({ navigation: siteSettingsTable.navigation })
        .from(siteSettingsTable)
        .where(eq(siteSettingsTable.id, "primary"))
        .limit(1);
      const existingNavigation = existingSettings?.navigation;
      const isLegacyDefault = [
        LEGACY_DEFAULT_PUBLIC_NAVIGATION,
        LEGACY_MINIMAL_PUBLIC_NAVIGATION,
      ].some(
        (legacyNavigation) =>
          Array.isArray(existingNavigation) &&
          existingNavigation.length === legacyNavigation.length &&
          existingNavigation.every((entry, index) => {
            if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
              return false;
            }
            const candidate = entry as Record<string, unknown>;
            return (
              candidate.label === legacyNavigation[index].label &&
              candidate.path === legacyNavigation[index].path
            );
          }),
      );
      if (isLegacyDefault) {
        await tx
          .update(siteSettingsTable)
          .set({ navigation: DEFAULT_PUBLIC_NAVIGATION })
          .where(eq(siteSettingsTable.id, "primary"));
      }

      const [gallerySection] = await tx
        .select({ id: contentSectionsTable.id })
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "home"),
            eq(contentSectionsTable.sectionKey, "gallery"),
          ),
        )
        .limit(1);
      const [galleryPageSection] = await tx
        .select({ id: contentSectionsTable.id })
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "gallery"),
            eq(contentSectionsTable.sectionKey, "gallery"),
          ),
        )
        .limit(1);

      if (!gallerySection && !galleryPageSection) {
        const [createdGallerySection] = await tx
          .insert(contentSectionsTable)
          .values({ ...initialSections.find((section) => section.sectionKey === "gallery")!, pageSlug: "home" })
          .returning({ id: contentSectionsTable.id });

        if (createdGallerySection) {
          await tx
            .insert(contentItemsTable)
            .values(initialGalleryItems(createdGallerySection.id));
        }
      }
      return;
    }

    const insertedSections = await tx
      .insert(contentSectionsTable)
      .values(
        initialSections.map((section) => ({
          ...section,
          pageSlug: "home",
        })),
      )
      .onConflictDoNothing()
      .returning({
        id: contentSectionsTable.id,
        sectionKey: contentSectionsTable.sectionKey,
      });

    const sectionIds = new Map(
      insertedSections.map((section) => [section.sectionKey, section.id]),
    );
    const programSectionId = sectionIds.get("programs");
    const featureSectionId = sectionIds.get("features");
    const campusSectionId = sectionIds.get("campus-life");
    const statisticsSectionId = sectionIds.get("statistics");
    const gallerySectionId = sectionIds.get("gallery");

    if (
      !programSectionId ||
      !featureSectionId ||
      !campusSectionId ||
      !statisticsSectionId ||
      !gallerySectionId
    ) {
      throw new Error("Default homepage sections could not be initialized.");
    }

    await tx.insert(contentItemsTable).values([
      {
        sectionId: programSectionId,
        itemType: "program",
        title: "Intermediate",
        description: null,
        imageUrl: null,
        linkPath: "/",
        label: null,
        content: {},
        isVisible: true,
        position: 0,
      },
      {
        sectionId: programSectionId,
        itemType: "program",
        title: "IIT-JEE Main",
        description: null,
        imageUrl: null,
        linkPath: "/",
        label: null,
        content: {},
        isVisible: true,
        position: 1,
      },
      {
        sectionId: programSectionId,
        itemType: "program",
        title: "NEET",
        description: null,
        imageUrl: null,
        linkPath: "/",
        label: null,
        content: {},
        isVisible: true,
        position: 2,
      },
      {
        sectionId: statisticsSectionId,
        itemType: "statistic",
        title: "Years of Excellence",
        description: null,
        content: { value: 40, prefix: "", suffix: "+", isDemo: false },
        isVisible: true,
        position: 0,
      },
      {
        sectionId: statisticsSectionId,
        itemType: "statistic",
        title: "Students Guided",
        description: null,
        content: { value: 35_000, prefix: "", suffix: "+", isDemo: false },
        isVisible: true,
        position: 1,
      },
      {
        sectionId: statisticsSectionId,
        itemType: "statistic",
        title: "Faculty Mentors",
        description: null,
        content: { value: 50, prefix: "", suffix: "+", isDemo: false },
        isVisible: true,
        position: 2,
      },
      {
        sectionId: statisticsSectionId,
        itemType: "statistic",
        title: "Placement Success",
        description: null,
        content: { value: 100, prefix: "", suffix: "%", isDemo: false },
        isVisible: true,
        position: 3,
      },
      {
        sectionId: featureSectionId,
        itemType: "feature",
        title: "Curiosity first",
        description:
          "Demo theme only. Confirm or replace it with the college team.",
        content: { isDemo: true },
        isVisible: true,
        position: 0,
      },
      {
        sectionId: featureSectionId,
        itemType: "feature",
        title: "A thoughtful next step",
        description:
          "Demo theme only. Confirm or replace it with the college team.",
        content: { isDemo: true },
        isVisible: true,
        position: 1,
      },
      {
        sectionId: featureSectionId,
        itemType: "feature",
        title: "Learning, your way",
        description:
          "Demo theme only. Confirm or replace it with the college team.",
        content: { isDemo: true },
        isVisible: true,
        position: 2,
      },
      {
        sectionId: campusSectionId,
        itemType: "campus-preview",
        title: "Campus preview",
        description:
          "Placeholder card. Replace with an approved campus-life detail and photo.",
        linkPath: "/campus-life",
        content: { isDemo: true, imagePlaceholder: true },
        isVisible: true,
        position: 0,
      },
      {
        sectionId: campusSectionId,
        itemType: "campus-preview",
        title: "Moments to share",
        description:
          "Placeholder card. Replace with an approved campus-life detail and photo.",
        linkPath: "/campus-life",
        content: { isDemo: true, imagePlaceholder: true },
        isVisible: true,
        position: 1,
      },
      {
        sectionId: campusSectionId,
        itemType: "campus-preview",
        title: "A day to imagine",
        description:
          "Placeholder card. Replace with an approved campus-life detail and photo.",
        linkPath: "/campus-life",
        content: { isDemo: true, imagePlaceholder: true },
        isVisible: true,
        position: 2,
      },
      ...initialGalleryItems(gallerySectionId),
    ]);

    logger.info("Seeded homepage demo content");
  });

  // Existing projects may already have legacy content and a site-settings row.
  // Add only missing Home content; never remove or replace the older records.
  await db.transaction(async (tx) => {
    const [statistics] = await tx
      .select({ id: contentSectionsTable.id })
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "statistics"),
        ),
      )
      .limit(1);

    if (!statistics) {
      const [created] = await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "home",
          sectionKey: "statistics",
          title: "At a glance",
          subtitle: null,
          content: { countUp: true },
          isVisible: true,
          position: 9,
        })
        .onConflictDoNothing()
        .returning({ id: contentSectionsTable.id });

      if (created) {
        await tx.insert(contentItemsTable).values([
          {
            sectionId: created.id,
            itemType: "statistic",
            title: "Years of Excellence",
            description: null,
            content: { value: 40, prefix: "", suffix: "+", isDemo: false },
            isVisible: true,
            position: 0,
          },
          {
            sectionId: created.id,
            itemType: "statistic",
            title: "Students Guided",
            description: null,
            content: { value: 35_000, prefix: "", suffix: "+", isDemo: false },
            isVisible: true,
            position: 1,
          },
          {
            sectionId: created.id,
            itemType: "statistic",
            title: "Faculty Mentors",
            description: null,
            content: { value: 50, prefix: "", suffix: "+", isDemo: false },
            isVisible: true,
            position: 2,
          },
          {
            sectionId: created.id,
            itemType: "statistic",
            title: "Placement Success",
            description: null,
            content: { value: 100, prefix: "", suffix: "%", isDemo: false },
            isVisible: true,
            position: 3,
          },
        ]);
      }
    }

    const [hero] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "hero"),
        ),
      )
      .limit(1);

    if (hero) {
      const heroContent = { ...hero.content };
      let heroChanged = false;

      if (
        heroContent.eyebrow === "DEMO COPY · REPLACE BEFORE LAUNCH" ||
        heroContent.eyebrow === "INTERMEDIATE • IIT-JEE MAIN • NEET"
      ) {
        heroContent.eyebrow = "IIT • NIT • IIIT • IPE";
        heroChanged = true;
      }
      if (heroContent.headline === "Build your next chapter with curiosity.") {
        heroContent.headline = "A strong start for everything ahead.";
        heroChanged = true;
      }
      if (
        heroContent.introduction ===
          "The words on this homepage are sample copy created for the first build. Replace them with details approved by Shastra Junior College." ||
        heroContent.introduction ===
          "Explore intermediate education and preparation for IIT-JEE Main and NEET at Shastra Junior College. Tell us what you’re aiming for, and we’ll help you explore your next step."
      ) {
        heroContent.introduction =
          "Explore IIT, NIT, IIIT, and IPE courses at Shastra Junior College. Contact admissions for current course details.";
        heroChanged = true;
      }

      const rawForm = heroContent.enquiryForm;
      const enquiryForm: Record<string, unknown> = isCmsRecord(rawForm)
        ? { ...rawForm }
        : { ...demoEnquiryForm };
      if (!isCmsRecord(rawForm)) {
        heroChanged = true;
      }

      if (enquiryForm.title === "Ask us a question") {
        enquiryForm.title = "Talk with our team";
        heroChanged = true;
      }
      if (
        enquiryForm.description ===
        "Share a few details to preview the enquiry form. This demo will not send your information."
      ) {
        enquiryForm.description =
          "Share a few details about your interests so we can guide your next step.";
        heroChanged = true;
      }
      if (enquiryForm.submitLabel === "Send an enquiry") {
        enquiryForm.submitLabel = "Preview enquiry";
        heroChanged = true;
      }
      if (
        enquiryForm.successMessage ===
        "Thanks. Your demo enquiry is complete; nothing was sent or stored."
      ) {
        enquiryForm.successMessage =
          "This preview is complete. Your details were not sent or stored.";
        heroChanged = true;
      }
      if (!("eyebrow" in enquiryForm)) {
        enquiryForm.eyebrow = demoEnquiryForm.eyebrow;
        heroChanged = true;
      }
      if (!("note" in enquiryForm)) {
        enquiryForm.note = demoEnquiryForm.note;
        heroChanged = true;
      }

      const messageFieldMigration =
        ensureOptionalEnquiryMessageField(enquiryForm);
      if (messageFieldMigration.changed) {
        Object.assign(enquiryForm, messageFieldMigration.form);
        heroChanged = true;
      }

      if (Array.isArray(enquiryForm.fields)) {
        const pathwayField = enquiryForm.fields.find(
          (field) => isCmsRecord(field) && field.name === "pathway",
        );
        if (
          isCmsRecord(pathwayField) &&
          Array.isArray(pathwayField.options) &&
          pathwayField.options.some((option) =>
            ["Intermediate", "IIT-JEE Main", "NEET"].includes(String(option)),
          )
        ) {
          pathwayField.options = ["IIT", "NIT", "IIIT", "IPE"];
          heroChanged = true;
        }
      }

      if (heroChanged) {
        heroContent.enquiryForm = enquiryForm;
        await tx
          .update(contentSectionsTable)
          .set({ content: heroContent, updatedAt: new Date() })
          .where(eq(contentSectionsTable.id, hero.id));
      }
    }

    const [programs] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "programs"),
        ),
      )
      .limit(1);

    if (programs) {
      const nextTitle =
        programs.title === "Programs & preparation" ||
        programs.title === "Explore Pathways"
          ? "EXPLORE PROGRAM PATHWAYS:"
          : programs.title;
      const nextSubtitle =
        programs.subtitle ===
        "Explore the areas named in the Shastra logo. Descriptions are demo copy."
          ? null
          : programs.subtitle;

      if (
        nextTitle !== programs.title ||
        nextSubtitle !== programs.subtitle
      ) {
        await tx
          .update(contentSectionsTable)
          .set({
            title: nextTitle,
            subtitle: nextSubtitle,
            updatedAt: new Date(),
          })
          .where(eq(contentSectionsTable.id, programs.id));
      }

      const [existingProgram] = await tx
        .select({ id: contentItemsTable.id })
        .from(contentItemsTable)
        .where(
          and(
            eq(contentItemsTable.sectionId, programs.id),
            eq(contentItemsTable.itemType, "program"),
          ),
        )
        .limit(1);

      if (!existingProgram) {
        await tx.insert(contentItemsTable).values([
          {
            sectionId: programs.id,
            itemType: "program",
            title: "Intermediate",
            description: null,
            imageUrl: null,
            linkPath: "/",
            label: null,
            content: {},
            isVisible: true,
            position: 0,
          },
          {
            sectionId: programs.id,
            itemType: "program",
            title: "IIT-JEE Main",
            description: null,
            imageUrl: null,
            linkPath: "/",
            label: null,
            content: {},
            isVisible: true,
            position: 1,
          },
          {
            sectionId: programs.id,
            itemType: "program",
            title: "NEET",
            description: null,
            imageUrl: null,
            linkPath: "/",
            label: null,
            content: {},
            isVisible: true,
            position: 2,
          },
        ]);
      }

      const programItems = await tx
        .select()
        .from(contentItemsTable)
        .where(
          and(
            eq(contentItemsTable.sectionId, programs.id),
            eq(contentItemsTable.itemType, "program"),
          ),
        );
      const seededTitles = new Set(["Intermediate", "IIT-JEE Main", "NEET"]);
      const seededDescription =
        "Demo copy: replace with approved information for this option.";

      for (const item of programItems) {
        if (!seededTitles.has(item.title)) continue;
        const isSeededDescription = item.description === seededDescription;
        const isSeededLink = isSeededDescription && item.linkPath === "#enquire";
        const itemContent =
          typeof item.content === "object" &&
          item.content !== null &&
          !Array.isArray(item.content)
            ? (item.content as Record<string, unknown>)
            : {};
        const isSeededDemoFlag =
          itemContent.isDemo === true && Object.keys(itemContent).length === 1;

        if (!isSeededDescription && !isSeededDemoFlag) continue;

        await tx
          .update(contentItemsTable)
          .set({
            ...(isSeededDescription ? { description: null } : {}),
            ...(isSeededLink ? { linkPath: "/" } : {}),
            ...(isSeededDemoFlag ? { content: {} } : {}),
            updatedAt: new Date(),
          })
          .where(eq(contentItemsTable.id, item.id));
      }
    }
  });

  // Existing gallery entries predate homepage featuring. Pick one image per
  // category once, then preserve each admin's later checkbox choices.
  await db.transaction(async (tx) => {
    const [gallerySection] = await tx
      .select({ id: contentSectionsTable.id })
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "gallery"),
        ),
      )
      .limit(1);

    if (!gallerySection) return;

    const galleryItems = await tx
      .select()
      .from(contentItemsTable)
      .where(
        and(
          eq(contentItemsTable.sectionId, gallerySection.id),
          eq(contentItemsTable.itemType, "gallery-image"),
        ),
      );
    const byCategory = new Map<string, typeof galleryItems>();

    for (const item of galleryItems) {
      const content = isCmsRecord(item.content) ? item.content : {};
      const category =
        typeof content.category === "string" ? content.category : "";
      if (!category) continue;
      const items = byCategory.get(category) ?? [];
      items.push(item);
      byCategory.set(category, items);
    }

    for (const items of byCategory.values()) {
      if (
        items.some((item) => {
          const content = isCmsRecord(item.content) ? item.content : {};
          return typeof content.showOnHome === "boolean";
        })
      ) {
        continue;
      }

      const firstItem = [...items].sort((a, b) => a.position - b.position)[0];
      for (const item of items) {
        const content = isCmsRecord(item.content) ? item.content : {};
        await tx
          .update(contentItemsTable)
          .set({
            content: { ...content, showOnHome: item.id === firstItem?.id },
            updatedAt: new Date(),
          })
          .where(eq(contentItemsTable.id, item.id));
      }
    }
  });

  const placementProfiles = [
    {
      name: "Aarav Sharma",
      employer: "Northstar Dataworks",
      role: "Associate Data Analyst",
      cohort: "2025–26",
      package: "₹8.4 LPA",
      imageUrl: "/placement-portraits/aarav-sharma.jpg",
    },
    {
      name: "Ananya Reddy",
      employer: "Orchid Cloud Systems",
      role: "Software Developer",
      cohort: "2025–26",
      package: "₹9.2 LPA",
      imageUrl: "/placement-portraits/ananya-reddy.jpg",
    },
    {
      name: "Rohan Verma",
      employer: "Novaforge Digital",
      role: "Junior Cloud Engineer",
      cohort: "2024–25",
      package: "₹7.8 LPA",
      imageUrl: "/placement-portraits/rohan-verma.jpg",
    },
    {
      name: "Priya Nair",
      employer: "BlueQuarry Analytics",
      role: "Business Analyst",
      cohort: "2025–26",
      package: "₹8.1 LPA",
      imageUrl: "/placement-portraits/priya-nair.jpg",
    },
    {
      name: "Kabir Khan",
      employer: "Copperline Automation",
      role: "Associate QA Engineer",
      cohort: "2024–25",
      package: "₹7.5 LPA",
      imageUrl: "/placement-portraits/kabir-khan.jpg",
    },
    {
      name: "Meera Patel",
      employer: "Marigold Fintech",
      role: "Financial Operations Analyst",
      cohort: "2025–26",
      package: "₹8.7 LPA",
      imageUrl: "/placement-portraits/meera-patel.jpg",
    },
    {
      name: "Aditya Rao",
      employer: "PixelHarbor Technologies",
      role: "Frontend Developer",
      cohort: "2024–25",
      package: "₹9.6 LPA",
      imageUrl: "/placement-portraits/aditya-rao.jpg",
    },
    {
      name: "Ishita Desai",
      employer: "VantagePoint HealthTech",
      role: "Data Quality Analyst",
      cohort: "2025–26",
      package: "₹7.9 LPA",
      imageUrl: "/placement-portraits/ishita-desai.jpg",
    },
    {
      name: "Vikram Singh",
      employer: "CedarPeak Networks",
      role: "Systems Support Engineer",
      cohort: "2024–25",
      package: "₹8.8 LPA",
      imageUrl: "/placement-portraits/vikram-singh.jpg",
    },
    {
      name: "Sana Ali",
      employer: "LumenTrail Design Labs",
      role: "UX Research Associate",
      cohort: "2025–26",
      package: "₹7.6 LPA",
      imageUrl: "/placement-portraits/sana-ali.jpg",
    },
    {
      name: "Arjun Menon",
      employer: "SaffronWorks Engineering",
      role: "Automation Engineer",
      cohort: "2024–25",
      package: "₹9.1 LPA",
      imageUrl: "/placement-portraits/arjun-menon.jpg",
    },
    {
      name: "Kavya Iyer",
      employer: "BrightArc Mobile Systems",
      role: "Mobile App Developer",
      cohort: "2025–26",
      package: "₹9.8 LPA",
      imageUrl: "/placement-portraits/kavya-iyer.jpg",
    },
  ] as const;

  const placementContent = (profile: (typeof placementProfiles)[number]) => ({
    employer: profile.employer,
    role: profile.role,
    cohort: profile.cohort,
    package: profile.package,
    altText: `Portrait of ${profile.name}`,
    isDemo: true,
  });

  // Seed once. On existing installs, update only untouched legacy demo rows;
  // the version marker prevents later startup from overwriting admin edits.
  await db.transaction(async (tx) => {
    const [existingSection] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "placement-records"),
        ),
      )
      .limit(1);

    if (!existingSection) {
      const [createdSection] = await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "home",
          sectionKey: "placement-records",
          title: "Global Placement Record",
          subtitle: "Student placements by employer, role, batch, and year.",
          content: { isDemo: true, placementProfilesSeedVersion: 3 },
          isVisible: true,
          position: 11,
        })
        .onConflictDoNothing()
        .returning({ id: contentSectionsTable.id });

      if (!createdSection) return;

      await tx.insert(contentItemsTable).values(
        placementProfiles.map((profile, index) => ({
          sectionId: createdSection.id,
          itemType: "placement-record",
          title: profile.name,
          description: null,
          imageUrl: profile.imageUrl,
          linkPath: null,
          label: null,
          content: placementContent(profile),
          isVisible: true,
          position: index,
        })),
      );
      return;
    }

    const sectionContent = isCmsRecord(existingSection.content)
      ? existingSection.content
      : {};
    if (sectionContent.placementProfilesSeedVersion === 3) return;

    const existingItems = await tx
      .select()
      .from(contentItemsTable)
      .where(
        and(
          eq(contentItemsTable.sectionId, existingSection.id),
          eq(contentItemsTable.itemType, "placement-record"),
        ),
      );

    const migratedLegacyItemIds = new Set<string>();
    for (const [index, profile] of placementProfiles.entries()) {
      const legacyNumber = String(index + 1).padStart(2, "0");
      const legacyItem = existingItems.find(
        (item) => item.title === `Sample Student ${legacyNumber}`,
      );
      if (!legacyItem || legacyItem.imageUrl !== null) continue;

      const legacyContent = isCmsRecord(legacyItem.content)
        ? legacyItem.content
        : {};
      const isUntouchedSeed =
        legacyContent.isDemo === true &&
        legacyContent.employer === `Illustrative Employer ${legacyNumber}` &&
        legacyContent.role === `Illustrative Role ${legacyNumber}` &&
        legacyContent.cohort === "Sample cohort" &&
        Object.keys(legacyContent).length === 4;
      if (!isUntouchedSeed) continue;

      await tx
        .update(contentItemsTable)
        .set({
          title: profile.name,
          imageUrl: profile.imageUrl,
          content: placementContent(profile),
          updatedAt: new Date(),
        })
        .where(eq(contentItemsTable.id, legacyItem.id));
      migratedLegacyItemIds.add(legacyItem.id);
    }

    for (const item of existingItems) {
      if (migratedLegacyItemIds.has(item.id)) continue;
      const itemContent = isCmsRecord(item.content) ? item.content : {};
      if (itemContent.cohort !== "Sample cohort") continue;

      await tx
        .update(contentItemsTable)
        .set({
          content: { ...itemContent, cohort: "2025–26" },
          updatedAt: new Date(),
        })
        .where(eq(contentItemsTable.id, item.id));
    }

    await tx
      .update(contentSectionsTable)
      .set({
        content: {
          ...sectionContent,
          placementProfilesSeedVersion: 3,
        },
        subtitle:
          existingSection.subtitle ===
          "Illustrative placement profiles for layout preview."
            ? "Student placements by employer, role, batch, and year."
            : existingSection.subtitle,
        updatedAt: new Date(),
      })
      .where(eq(contentSectionsTable.id, existingSection.id));
  });

  await seedFacultyAndGalleryPages();
  await seedGalleryHomePreviewDefaults();
  await seedHomeTestimonials();
  await seedHomeKnowledgeHubPreview();
  await seedHomeFaqs();
  await seedAboutPage();
  await seedContactPage();
  await seedKnowledgeHubPage();
}

type AboutCollectionSeed = {
  sectionKey: "institutional-strengths" | "core-values";
  itemType: "institutional-strength" | "core-value";
  title: string;
  subtitle: string;
  eyebrow: string;
  position: number;
  items: Array<{ title: string; description: string; icon?: string }>;
};

const initialAboutCollections: AboutCollectionSeed[] = [
  {
    sectionKey: "institutional-strengths",
    itemType: "institutional-strength",
    title: "Institutional Strengths",
    subtitle:
      "A focused learning experience built around clear teaching, purposeful practice, and student guidance.",
    eyebrow: "WHAT GUIDES OUR LEARNING",
    position: 4,
    items: [
      {
        title: "Strong subject foundations",
        description:
          "Build understanding step by step through clear explanations, deliberate practice, and attention to core concepts.",
        icon: "book-open",
      },
      {
        title: "Focused JEE and NEET preparation",
        description:
          "Structured learning and regular practice support students preparing for competitive entrance exams.",
        icon: "target",
      },
      {
        title: "Supportive faculty",
        description:
          "Approachable teachers help clarify challenging ideas and encourage students to keep asking questions.",
        icon: "users",
      },
      {
        title: "Personal academic guidance",
        description:
          "Students can plan their learning, reflect on progress, and identify practical next steps with guidance.",
        icon: "compass",
      },
      {
        title: "Disciplined study habits",
        description:
          "A steady routine helps learners strengthen focus and approach coursework with purpose.",
        icon: "clock",
      },
      {
        title: "Curiosity beyond the syllabus",
        description:
          "Ask questions, connect ideas, and keep learning with an open and thoughtful approach.",
        icon: "sparkles",
      },
    ],
  },
  {
    sectionKey: "core-values",
    itemType: "core-value",
    title: "Our Core Values",
    subtitle: "Principles that can guide learning, choices, and our shared community.",
    eyebrow: "OUR PRINCIPLES",
    position: 5,
    items: [
      {
        title: "Integrity",
        description: "Act honestly and thoughtfully in learning and everyday choices.",
      },
      {
        title: "Excellence",
        description: "Bring care and attention to the effort behind each goal.",
      },
      {
        title: "Discipline",
        description: "Practice consistently and follow through on commitments.",
      },
      {
        title: "Curiosity",
        description: "Ask questions and explore ideas with an open mind.",
      },
      {
        title: "Innovation",
        description: "Look for fresh ways to understand ideas and solve problems.",
      },
      {
        title: "Responsibility",
        description: "Respect people, shared spaces, and the commitments we make.",
      },
      {
        title: "Student Growth",
        description: "Build knowledge, confidence, and independence over time.",
      },
    ],
  },
];

async function seedAboutPage(): Promise<void> {
  await db.transaction(async (tx) => {
    const [galleryImage] = await tx
      .select({
        imageUrl: contentItemsTable.imageUrl,
        content: contentItemsTable.content,
      })
      .from(contentItemsTable)
      .innerJoin(
        contentSectionsTable,
        eq(contentItemsTable.sectionId, contentSectionsTable.id),
      )
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "gallery"),
          eq(contentItemsTable.itemType, "gallery-image"),
        ),
      )
      .orderBy(asc(contentItemsTable.position), asc(contentItemsTable.createdAt))
      .limit(1);
    const galleryContent =
      galleryImage && isCmsRecord(galleryImage.content)
        ? galleryImage.content
        : {};
    const defaults = {
      eyebrow: "ABOUT SHASTRA",
      imageUrl: galleryImage?.imageUrl || "",
      imageAlt:
        typeof galleryContent.altText === "string"
          ? galleryContent.altText
          : "A campus view of Shastra Junior College",
      primaryCtaLabel: "Explore Programs",
      primaryCtaPath: "/#programs",
      secondaryCtaLabel: "Contact Us",
      secondaryCtaPath: "/#enquire",
    };

    let [heroSection] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "about"),
          eq(contentSectionsTable.sectionKey, "hero"),
        ),
      )
      .limit(1);

    if (!heroSection) {
      const [created] = await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "about",
          sectionKey: "hero",
          title: "A strong foundation for future success",
          subtitle:
            "At Shastra Junior College, students build deep subject knowledge, confidence, and the habits that help them take their next step.",
          content: defaults,
          isVisible: true,
          position: 0,
        })
        .onConflictDoNothing()
        .returning();
      heroSection = created;
    }

    if (!heroSection) {
      [heroSection] = await tx
        .select()
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "about"),
            eq(contentSectionsTable.sectionKey, "hero"),
          ),
        )
        .limit(1);
    }

    if (!heroSection) {
      throw new Error("The default About hero could not be initialized.");
    }

    const [whoWeAreSection] = await tx
      .select({
        id: contentSectionsTable.id,
        content: contentSectionsTable.content,
      })
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "about"),
          eq(contentSectionsTable.sectionKey, "who-we-are"),
        ),
      )
      .limit(1);

    if (!whoWeAreSection) {
      await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "about",
          sectionKey: "who-we-are",
          title: "Who We Are",
          content: {
            eyebrow: "LEARNING WITH PURPOSE",
            imageUrl: "/about-classroom-demo.jpg",
            imageAlt:
              "A teacher guiding students as they learn together in a classroom.",
            paragraphs: [
              "At Shastra Junior College, strong subject foundations and thoughtful guidance help students approach their next step with confidence.",
              "Learning here is about more than completing a syllabus. We encourage curiosity, disciplined practice, and clear thinking in a supportive setting where every student can make steady progress.",
            ],
            visionTitle: "Our Vision",
            visionText:
              "To nurture knowledgeable, confident learners who approach the future with curiosity and purpose.",
            missionTitle: "Our Mission",
            missionPoints: [
              "Make complex ideas clear through thoughtful teaching.",
              "Support steady progress with academic guidance and mentoring.",
              "Encourage curiosity, discipline, and independent thinking.",
              "Help students prepare with confidence for their next steps.",
            ],
          } as CmsJson,
          isVisible: true,
          position: 1,
        })
        .onConflictDoNothing();
    } else {
      const existingContent = isCmsRecord(whoWeAreSection.content)
        ? whoWeAreSection.content
        : {};
      if (existingContent.imageRemoved !== true) {
        const imageUrl =
          typeof existingContent.imageUrl === "string" &&
          existingContent.imageUrl.trim()
            ? existingContent.imageUrl
            : "/about-classroom-demo.jpg";
        const imageAlt =
          typeof existingContent.imageAlt === "string" &&
          existingContent.imageAlt.trim()
            ? existingContent.imageAlt
            : "A teacher guiding students as they learn together in a classroom.";

        if (
          imageUrl !== existingContent.imageUrl ||
          imageAlt !== existingContent.imageAlt
        ) {
          await tx
            .update(contentSectionsTable)
            .set({
              content: {
                ...existingContent,
                imageUrl,
                imageAlt,
              } as CmsJson,
              updatedAt: new Date(),
            })
            .where(eq(contentSectionsTable.id, whoWeAreSection.id));
        }
      }
    }

    let heroSectionContent = isCmsRecord(heroSection.content)
      ? heroSection.content
      : {};
    if (heroSectionContent.aboutLeadershipSeedVersion !== 1) {
      const [chairmanSection] = await tx
        .select({ id: contentSectionsTable.id })
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "about"),
            eq(contentSectionsTable.sectionKey, "chairman-message"),
          ),
        )
        .limit(1);
      if (!chairmanSection) {
        await tx
          .insert(contentSectionsTable)
          .values({
            pageSlug: "about",
            sectionKey: "chairman-message",
            title: "A Message from Our Chairman",
            subtitle: null,
            content: {
              eyebrow: "LEADERSHIP MESSAGE",
              greeting:
                "Dear Students, Parents, and Members of the Shastra Community,",
              messageParagraphs: [
                "Education is most powerful when strong foundations are matched with curiosity, discipline, and care. At Shastra Junior College, we work to make every student feel supported while challenging them to reach their full potential.",
                "Our teachers and staff are committed to thoughtful learning, honest effort, and guidance that helps students make informed choices about the future. We value the trust families place in us and remain focused on helping every learner move forward with confidence.",
                "I invite you to explore what we offer, meet the people who make the college community, and discover the possibilities that begin here.",
              ],
              imageUrl:
                "/leadership-portraits/shastra-chairman-raghavendra-rao.jpg",
              imageAlt:
                "Portrait of Sri Raghavendra Rao, Chairman of Shastra Junior College.",
              signatureClosing: "With best wishes,",
              signatureName: "Sri Raghavendra Rao",
              signatureTitle: "Chairman, Shastra Junior College",
            } as CmsJson,
            isVisible: true,
            position: 2,
          })
          .onConflictDoNothing();
      }

      const [boardSection] = await tx
        .select({ id: contentSectionsTable.id })
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "about"),
            eq(contentSectionsTable.sectionKey, "board-of-directors"),
          ),
        )
        .limit(1);
      if (!boardSection) {
        await tx
          .insert(contentSectionsTable)
          .values({
            pageSlug: "about",
            sectionKey: "board-of-directors",
            title: "Board of Directors",
            subtitle:
              "Guided by thoughtful leadership, dedicated to every learner.",
            content: { eyebrow: "GOVERNANCE & LEADERSHIP" },
            isVisible: true,
            position: 3,
          })
          .onConflictDoNothing();
      }

      heroSectionContent = {
        ...defaults,
        ...heroSectionContent,
        aboutLeadershipSeedVersion: 1,
      };
      await tx
        .update(contentSectionsTable)
        .set({
          content: heroSectionContent as CmsJson,
          updatedAt: new Date(),
        })
        .where(eq(contentSectionsTable.id, heroSection.id));
    }

    if (heroSectionContent.aboutCollectionsSeedVersion !== 1) {
      for (const collection of initialAboutCollections) {
        const [existingSection] = await tx
          .select({ id: contentSectionsTable.id })
          .from(contentSectionsTable)
          .where(
            and(
              eq(contentSectionsTable.pageSlug, "about"),
              eq(contentSectionsTable.sectionKey, collection.sectionKey),
            ),
          )
          .limit(1);

        if (existingSection) continue;

        const [createdSection] = await tx
          .insert(contentSectionsTable)
          .values({
            pageSlug: "about",
            sectionKey: collection.sectionKey,
            title: collection.title,
            subtitle: collection.subtitle,
            content: { eyebrow: collection.eyebrow },
            isVisible: true,
            position: collection.position,
          })
          .onConflictDoNothing()
          .returning({ id: contentSectionsTable.id });

        if (!createdSection) continue;

        await tx.insert(contentItemsTable).values(
          collection.items.map((item, position) => ({
            sectionId: createdSection.id,
            itemType: collection.itemType,
            title: item.title,
            description: item.description,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: item.icon ? { icon: item.icon } : {},
            isVisible: true,
            position,
          })),
        );
      }

      heroSectionContent = {
        ...heroSectionContent,
        aboutCollectionsSeedVersion: 1,
      };
      await tx
        .update(contentSectionsTable)
        .set({
          content: heroSectionContent as CmsJson,
          updatedAt: new Date(),
        })
        .where(eq(contentSectionsTable.id, heroSection.id));
    }

    if (heroSectionContent.aboutCoursesPreviewSeedVersion !== 1) {
      const [existingCoursesPreview] = await tx
        .select({ id: contentSectionsTable.id })
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "about"),
            eq(contentSectionsTable.sectionKey, "courses-preview"),
          ),
        )
        .limit(1);

      if (!existingCoursesPreview) {
        await tx
          .insert(contentSectionsTable)
          .values({
            pageSlug: "about",
            sectionKey: "courses-preview",
            title: "Explore our courses",
            subtitle: "Explore the courses offered at Shastra Junior College.",
            content: { eyebrow: "PATHWAYS AT SHASTRA" },
            isVisible: true,
            position: 6,
          })
          .onConflictDoNothing();
      }

      heroSectionContent = {
        ...heroSectionContent,
        aboutCoursesPreviewSeedVersion: 1,
      };
      await tx
        .update(contentSectionsTable)
        .set({
          content: heroSectionContent as CmsJson,
          updatedAt: new Date(),
        })
        .where(eq(contentSectionsTable.id, heroSection.id));
    }

    if (heroSectionContent.aboutFaqCtaSeedVersion !== 1) {
      const finalSections = [
        {
          sectionKey: "faqs",
          title: "Frequently Asked Questions",
          subtitle:
            "Answers to common questions about Shastra Junior College.",
          content: { eyebrow: "ABOUT SHASTRA" },
          position: 7,
        },
        {
          sectionKey: "cta",
          title: "Ready to take the next step?",
          subtitle:
            "Explore our academic pathways and get in touch with the college team.",
          content: {
            eyebrow: "YOUR NEXT STEP",
            primaryLabel: "Explore Courses",
            primaryPath: "/courses",
            secondaryLabel: "Contact Us",
            secondaryPath: "/contact",
          },
          position: 8,
        },
      ];

      for (const section of finalSections) {
        const [existingSection] = await tx
          .select({ id: contentSectionsTable.id })
          .from(contentSectionsTable)
          .where(
            and(
              eq(contentSectionsTable.pageSlug, "about"),
              eq(contentSectionsTable.sectionKey, section.sectionKey),
            ),
          )
          .limit(1);
        if (existingSection) continue;

        await tx
          .insert(contentSectionsTable)
          .values({
            pageSlug: "about",
            sectionKey: section.sectionKey,
            title: section.title,
            subtitle: section.subtitle,
            content: section.content,
            isVisible: true,
            position: section.position,
          })
          .onConflictDoNothing();
      }

      heroSectionContent = {
        ...heroSectionContent,
        aboutFaqCtaSeedVersion: 1,
      };
      await tx
        .update(contentSectionsTable)
        .set({
          content: heroSectionContent as CmsJson,
          updatedAt: new Date(),
        })
        .where(eq(contentSectionsTable.id, heroSection.id));
    }

    const [statisticsSection] = await tx
      .select({ id: contentSectionsTable.id })
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "statistics"),
        ),
      )
      .limit(1);

    if (!statisticsSection) {
      return;
    }

    const sectionContent = heroSectionContent;
    if (sectionContent.aboutStatisticsSeedVersion === 1) {
      return;
    }

    const statisticItems = await tx
      .select()
      .from(contentItemsTable)
      .where(eq(contentItemsTable.sectionId, statisticsSection.id));

    for (const item of statisticItems) {
      if (item.itemType !== "statistic" || !item.isVisible) {
        continue;
      }
      const itemContent = isCmsRecord(item.content) ? item.content : {};
      if (typeof itemContent.showOnAbout === "boolean") {
        continue;
      }
      await tx
        .update(contentItemsTable)
        .set({
          content: { ...itemContent, showOnAbout: true } as CmsJson,
          updatedAt: new Date(),
        })
        .where(eq(contentItemsTable.id, item.id));
    }

    await tx
      .update(contentSectionsTable)
      .set({
        content: {
          ...defaults,
          ...sectionContent,
          aboutStatisticsSeedVersion: 1,
        } as CmsJson,
        updatedAt: new Date(),
      })
      .where(eq(contentSectionsTable.id, heroSection.id));
  });
}

const facultyProfiles = [
  {
    name: "Dr. Ananya Rao",
    professionalTitle: "Senior Lecturer · Mathematics",
    shortDescription: "Makes challenging ideas feel clear, practical, and within reach.",
    imageUrl: "/faculty-portraits/faculty-ananya-rao.jpg",
    qualifications: "Ph.D. Mathematics, M.Sc. Mathematics, B.Ed.",
    subjectsTaught: ["Mathematics", "Statistics"],
    experience: "18 years",
    biography:
      "Dr. Ananya Rao has spent eighteen years helping students build confidence with mathematical reasoning. Her classes connect strong fundamentals with practical problem-solving, and she is especially committed to helping every student ask questions, test ideas, and learn from the process.",
  },
  {
    name: "Mr. Kiran Reddy",
    professionalTitle: "Physics Faculty · Physics",
    shortDescription: "Connects physics principles to experiments and everyday observations.",
    imageUrl: "/faculty-portraits/faculty-kiran-reddy.jpg",
    qualifications: "M.Sc. Physics, M.Ed., Certificate in Experimental Physics",
    subjectsTaught: ["Physics", "Applied Mechanics"],
    experience: "16 years",
    biography:
      "Mr. Kiran Reddy brings sixteen years of classroom and laboratory experience to physics. He encourages students to investigate how ideas work in the real world, building a careful approach to observation, experimentation, and clear scientific explanation.",
  },
  {
    name: "Ms. Meera Nair",
    professionalTitle: "Chemistry Faculty · Chemistry",
    shortDescription: "Builds strong chemistry foundations through careful, hands-on learning.",
    imageUrl: "/faculty-portraits/faculty-meera-nair.jpg",
    qualifications: "M.Sc. Chemistry, B.Ed., Diploma in Laboratory Safety",
    subjectsTaught: ["Chemistry", "Environmental Science"],
    experience: "13 years",
    biography:
      "Ms. Meera Nair has thirteen years of experience teaching chemistry and guiding student laboratory work. Her teaching pairs clear explanations with safe, structured practical learning so students can understand both the concepts and the evidence behind them.",
  },
  {
    name: "Mr. Arjun Sharma",
    professionalTitle: "Biology Faculty · Biology",
    shortDescription: "Brings the living world into focus with visual, inquiry-led lessons.",
    imageUrl: "/faculty-portraits/faculty-arjun-sharma.jpg",
    qualifications: "M.Sc. Zoology, B.Ed., Certificate in Life Sciences Education",
    subjectsTaught: ["Biology", "Zoology"],
    experience: "14 years",
    biography:
      "Mr. Arjun Sharma has taught biology for fourteen years, with a focus on making complex systems easier to observe and understand. He uses diagrams, guided inquiry, and discussion to help students connect foundational science to the living world around them.",
  },
] as const;

const leadershipProfiles = [
  {
    name: "Sri Raghavendra Rao",
    professionalTitle: "Founder & Chairman",
    leadershipRole: "Chairman",
    shortDescription:
      "Believes that strong foundations and thoughtful guidance can open new paths for every student.",
    imageUrl: "/leadership-portraits/shastra-chairman-raghavendra-rao.jpg",
    qualifications: "B.Com., M.B.A.",
    subjectsTaught: [],
    experience: "29 years in education and institution leadership",
    biography:
      "Sri Raghavendra Rao founded Shastra Junior College with a commitment to accessible, purposeful education. He works with the college community to strengthen academic foundations, encourage responsible ambition, and help students make confident choices about their future.",
  },
  {
    name: "Dr. Pranav Venkatesh",
    professionalTitle: "Academic Director",
    leadershipRole: "Board Director",
    shortDescription:
      "Guides academic planning with a focus on strong teaching and meaningful student progress.",
    imageUrl: "/leadership-portraits/shastra-board-director-pranav-venkatesh.jpg",
    qualifications: "Ph.D. Education, M.Sc. Physics",
    subjectsTaught: [],
    experience: "22 years in academic leadership",
    biography:
      "Dr. Pranav Venkatesh supports academic planning across the college. His work focuses on clear learning goals, thoughtful assessment, and practical support that helps students build confidence in their chosen subjects.",
  },
  {
    name: "Ms. Anjali Deshpande",
    professionalTitle: "Director of Careers & Student Development",
    leadershipRole: "Board Director",
    shortDescription:
      "Champions student wellbeing, career exploration, and informed next-step decisions.",
    imageUrl: "/leadership-portraits/shastra-board-director-anjali-deshpande.jpg",
    qualifications: "M.A. Psychology, Postgraduate Diploma in Career Guidance",
    subjectsTaught: [],
    experience: "17 years in student guidance",
    biography:
      "Ms. Anjali Deshpande works with students and families as they explore future pathways. She advocates for a supportive college environment where every learner can ask questions, understand their options, and plan the next step with care.",
  },
  {
    name: "Dr. Meena Iyer",
    professionalTitle: "Principal · Shastra Junior College",
    leadershipRole: "Principal",
    shortDescription:
      "Leads the college’s day-to-day academic life and supports a welcoming campus community.",
    imageUrl: "/leadership-portraits/shastra-principal-meena-iyer.jpg",
    qualifications: "Ph.D. Chemistry, M.Sc. Chemistry, M.Ed.",
    subjectsTaught: [],
    experience: "24 years in teaching and college leadership",
    biography:
      "Dr. Meena Iyer leads the academic and student life of Shastra Junior College. She works closely with teaching teams to foster a respectful campus, high expectations, and the consistent guidance that helps students thrive.",
  },
] as const;

const facultySectionContent: CmsJson = {
  eyebrow: "MEET OUR FACULTY",
  headline: "Guidance that brings learning to life",
  description:
    "Get to know the teachers who help students build strong foundations and take their next steps with confidence.",
};

const galleryPreviewContent: CmsJson = {
  eyebrow: "CAMPUS GALLERY",
  headline: "A closer look at Shastra",
  description:
    "Explore the learning spaces, campus moments, and community that make up college life.",
  ctaLabel: "View Gallery",
};

const facultyPreviewContent: CmsJson = {
  eyebrow: "MEET OUR FACULTY",
  headline: "Get to know the people who guide every next step",
  description:
    "Meet the teachers who support students with subject expertise, encouragement, and practical guidance.",
  ctaLabel: "Meet Our Faculty",
};

async function seedFacultyAndGalleryPages(): Promise<void> {
  await db.transaction(async (tx) => {
    const [campusLife] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "campus-life"),
        ),
      )
      .limit(1);
    if (campusLife?.isVisible) {
      await tx
        .update(contentSectionsTable)
        .set({ isVisible: false, updatedAt: new Date() })
        .where(eq(contentSectionsTable.id, campusLife.id));
    }

    const [homeGallery] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "gallery"),
        ),
      )
      .limit(1);
    let galleryPageSection = (
      await tx
        .select()
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "gallery"),
            eq(contentSectionsTable.sectionKey, "gallery"),
          ),
        )
        .limit(1)
    )[0];

    if (homeGallery && !galleryPageSection) {
      const [moved] = await tx
        .update(contentSectionsTable)
        .set({ pageSlug: "gallery", updatedAt: new Date() })
        .where(eq(contentSectionsTable.id, homeGallery.id))
        .returning();
      galleryPageSection = moved;
    } else if (homeGallery && galleryPageSection) {
      const galleryItems = await tx
        .select()
        .from(contentItemsTable)
        .where(eq(contentItemsTable.sectionId, homeGallery.id))
        .orderBy(asc(contentItemsTable.position));
      const galleryExistingItems = await tx
        .select({ position: contentItemsTable.position })
        .from(contentItemsTable)
        .where(eq(contentItemsTable.sectionId, galleryPageSection.id));
      const nextPosition =
        galleryExistingItems.length > 0
          ? Math.max(...galleryExistingItems.map((item) => item.position)) + 1
          : 0;
      for (const [index, item] of galleryItems.entries()) {
        await tx
          .update(contentItemsTable)
          .set({
            sectionId: galleryPageSection.id,
            position: nextPosition + index,
            updatedAt: new Date(),
          })
          .where(eq(contentItemsTable.id, item.id));
      }
      await tx
        .delete(contentSectionsTable)
        .where(eq(contentSectionsTable.id, homeGallery.id));
    }

    if (!galleryPageSection) {
      const [created] = await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "gallery",
          sectionKey: "gallery",
          title: "A closer look at Shastra",
          subtitle: "Explore the places and moments that shape college life.",
          content: { eyebrow: "Campus gallery" },
          isVisible: true,
          position: 0,
        })
        .onConflictDoNothing()
        .returning();
      galleryPageSection = created;
    }

    if (galleryPageSection) {
      const gallerySectionContent =
        galleryPageSection.content as Record<string, unknown>;
      if (gallerySectionContent.gallerySeedCleanupVersion !== 2) {
        const galleryItems = await tx
          .select()
          .from(contentItemsTable)
          .where(eq(contentItemsTable.sectionId, galleryPageSection.id));
        const firstBySignature = new Map<
          string,
          (typeof galleryItems)[number]
        >();
        for (const item of galleryItems) {
          const itemContent = item.content as Record<string, unknown>;
          const signature = JSON.stringify([
            item.itemType,
            item.title,
            item.description,
            item.imageUrl,
            itemContent.category,
          ]);
          const firstItem = firstBySignature.get(signature);
          if (!firstItem) {
            firstBySignature.set(signature, item);
            continue;
          }
          if (itemContent.isDemo === true) {
            await tx
              .update(contentItemsTable)
              .set({ isVisible: false, updatedAt: new Date() })
              .where(eq(contentItemsTable.id, item.id));
          } else if (item.isVisible) {
            await tx
              .update(contentItemsTable)
              .set({ isVisible: false, updatedAt: new Date() })
              .where(eq(contentItemsTable.id, item.id));
          }
          if (
            (firstItem.content as Record<string, unknown>).isDemo === true &&
            !firstItem.isVisible
          ) {
            await tx
              .update(contentItemsTable)
              .set({ isVisible: true, updatedAt: new Date() })
              .where(eq(contentItemsTable.id, firstItem.id));
          }
        }
        await tx
          .update(contentSectionsTable)
          .set({
            content: {
              ...gallerySectionContent,
              gallerySeedCleanupVersion: 2,
            },
            updatedAt: new Date(),
          })
          .where(eq(contentSectionsTable.id, galleryPageSection.id));
      }
    }

    const [existingHomeGalleryPreview] = await tx
      .select({ id: contentSectionsTable.id })
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "gallery-preview"),
        ),
      )
      .limit(1);
    if (!existingHomeGalleryPreview) {
      await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "home",
          sectionKey: "gallery-preview",
          title: "A closer look at Shastra",
          subtitle: "Explore the learning spaces, campus moments, and community that make up college life.",
          content: galleryPreviewContent,
          isVisible: true,
          position: homeGallery?.position ?? 10,
        })
        .onConflictDoNothing();
    }

    const [existingHomeFacultyPreview] = await tx
      .select({ id: contentSectionsTable.id })
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "faculty-preview"),
        ),
      )
      .limit(1);
    if (!existingHomeFacultyPreview) {
      await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "home",
          sectionKey: "faculty-preview",
          title: "Get to know the people who guide every next step",
          subtitle:
            "Meet the teachers who support students with subject expertise, encouragement, and practical guidance.",
          content: facultyPreviewContent,
          isVisible: true,
          position: 12,
        })
        .onConflictDoNothing();
    }

    let [facultySection] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "faculty"),
          eq(contentSectionsTable.sectionKey, "faculty"),
        ),
      )
      .limit(1);
    if (!facultySection) {
      [facultySection] = await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "faculty",
          sectionKey: "faculty",
          title: "Guidance that brings learning to life",
          subtitle:
            "Get to know the teachers who help students build strong foundations and take their next steps with confidence.",
          content: facultySectionContent,
          isVisible: true,
          position: 0,
        })
        .onConflictDoNothing()
        .returning();
    }
    if (!facultySection) return;

    const facultyContent = isCmsRecord(facultySection.content)
      ? facultySection.content
      : {};
    if (facultyContent.facultyProfilesSeedVersion === 3) return;

    const existingProfiles = await tx
      .select({
        id: contentItemsTable.id,
        title: contentItemsTable.title,
        position: contentItemsTable.position,
        content: contentItemsTable.content,
      })
      .from(contentItemsTable)
      .where(
        and(
          eq(contentItemsTable.sectionId, facultySection.id),
          eq(contentItemsTable.itemType, "faculty-profile"),
        ),
      )
      .orderBy(asc(contentItemsTable.position), asc(contentItemsTable.createdAt));
    const existingNames = new Set(existingProfiles.map((item) => item.title));
    const seededLeadershipNames = new Set<string>(
      leadershipProfiles.map((profile) => profile.name),
    );
    const legacyLeadershipProfiles = existingProfiles.filter((item) => {
      if (seededLeadershipNames.has(item.title)) return false;
      const content = isCmsRecord(item.content) ? item.content : {};
      return (
        typeof content.leadershipRole === "string" &&
        content.leadershipRole !== "Faculty"
      );
    });
    const existingTeachingProfiles = existingProfiles.filter((item) => {
      if (seededLeadershipNames.has(item.title)) return false;
      return !legacyLeadershipProfiles.some((leader) => leader.id === item.id);
    });

    for (const [index, profile] of leadershipProfiles.entries()) {
      const existing = existingProfiles.find(
        (item) => item.title === profile.name,
      );
      if (!existing) continue;
      const content = isCmsRecord(existing.content) ? existing.content : {};
      await tx
        .update(contentItemsTable)
        .set({
          position: index,
          content: {
            ...content,
            leadershipRole:
              typeof content.leadershipRole === "string"
                ? content.leadershipRole
                : profile.leadershipRole,
            showOnAboutBoard:
              typeof content.showOnAboutBoard === "boolean"
                ? content.showOnAboutBoard
                : true,
          } as CmsJson,
          updatedAt: new Date(),
        })
        .where(eq(contentItemsTable.id, existing.id));
    }

    for (const [index, item] of legacyLeadershipProfiles.entries()) {
      const content = isCmsRecord(item.content) ? item.content : {};
      await tx
        .update(contentItemsTable)
        .set({
          position: leadershipProfiles.length + index,
          content: {
            ...content,
            leadershipRole:
              typeof content.leadershipRole === "string"
                ? content.leadershipRole
                : "Faculty",
            showOnAboutBoard:
              typeof content.showOnAboutBoard === "boolean"
                ? content.showOnAboutBoard
                : false,
          } as CmsJson,
          updatedAt: new Date(),
        })
        .where(eq(contentItemsTable.id, item.id));
    }

    for (const [index, item] of existingTeachingProfiles.entries()) {
      const content = isCmsRecord(item.content) ? item.content : {};
      await tx
        .update(contentItemsTable)
        .set({
          position:
            leadershipProfiles.length +
            legacyLeadershipProfiles.length +
            index,
          content: {
            ...content,
            leadershipRole:
              typeof content.leadershipRole === "string"
                ? content.leadershipRole
                : "Faculty",
            showOnAboutBoard:
              typeof content.showOnAboutBoard === "boolean"
                ? content.showOnAboutBoard
                : false,
          } as CmsJson,
          updatedAt: new Date(),
        })
        .where(eq(contentItemsTable.id, item.id));
    }

    const leadershipItemsToSeed = leadershipProfiles
      .filter((profile) => !existingNames.has(profile.name))
      .map((profile) => ({
        sectionId: facultySection.id,
        itemType: "faculty-profile",
        title: profile.name,
        description: profile.shortDescription,
        imageUrl: profile.imageUrl,
        linkPath: null,
        label: null,
        content: {
          professionalTitle: profile.professionalTitle,
          leadershipRole: profile.leadershipRole,
          shortDescription: profile.shortDescription,
          qualifications: profile.qualifications,
          subjectsTaught: [...profile.subjectsTaught],
          experience: profile.experience,
          biography: profile.biography,
          socialLinks: {
            linkedin: "",
            facebook: "",
            instagram: "",
            website: "",
          },
          showOnHome: false,
          showOnAboutBoard: true,
        },
        isVisible: true,
        position: leadershipProfiles.findIndex(
          (candidate) => candidate.name === profile.name,
        ),
      }));
    const teachingItemsToSeed = facultyProfiles
      .filter((profile) => !existingNames.has(profile.name))
      .map((profile, index) => ({
        sectionId: facultySection.id,
        itemType: "faculty-profile",
        title: profile.name,
        description: profile.shortDescription,
        imageUrl: profile.imageUrl,
        linkPath: null,
        label: null,
        content: {
          professionalTitle: profile.professionalTitle,
          shortDescription: profile.shortDescription,
          qualifications: profile.qualifications,
          subjectsTaught: [...profile.subjectsTaught],
          experience: profile.experience,
          biography: profile.biography,
          leadershipRole: "Faculty",
          socialLinks: {
            linkedin: "",
            facebook: "",
            instagram: "",
            website: "",
          },
          showOnHome: true,
          showOnAboutBoard: false,
        },
        isVisible: true,
        position:
          leadershipProfiles.length +
          legacyLeadershipProfiles.length +
          existingTeachingProfiles.length +
          index,
      }));
    const itemsToSeed = [...leadershipItemsToSeed, ...teachingItemsToSeed];
    if (itemsToSeed.length) {
      await tx.insert(contentItemsTable).values(itemsToSeed);
    }
    await tx
      .update(contentSectionsTable)
      .set({
        content: {
          ...facultyContent,
          facultyProfilesSeedVersion: 3,
          eyebrow:
            typeof facultyContent.eyebrow === "string"
              ? facultyContent.eyebrow
              : facultySectionContent.eyebrow,
          headline:
            typeof facultyContent.headline === "string"
              ? facultyContent.headline
              : facultySectionContent.headline,
          description:
            typeof facultyContent.description === "string"
              ? facultyContent.description
              : facultySectionContent.description,
        },
        updatedAt: new Date(),
      })
      .where(eq(contentSectionsTable.id, facultySection.id));
  });
}

async function seedGalleryHomePreviewDefaults(): Promise<void> {
  await db.transaction(async (tx) => {
    const [gallerySection] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "gallery"),
          eq(contentSectionsTable.sectionKey, "gallery"),
        ),
      )
      .limit(1);

    if (!gallerySection) return;

    const sectionContent = isCmsRecord(gallerySection.content)
      ? gallerySection.content
      : {};
    if (sectionContent.galleryHomePreviewSeedVersion === 1) return;

    const galleryItems = await tx
      .select()
      .from(contentItemsTable)
      .where(
        and(
          eq(contentItemsTable.sectionId, gallerySection.id),
          eq(contentItemsTable.itemType, "gallery-image"),
        ),
      );

    for (const item of galleryItems) {
      if (!item.isVisible) continue;
      const itemContent = isCmsRecord(item.content) ? item.content : {};
      if (itemContent.showOnHome === true) continue;

      await tx
        .update(contentItemsTable)
        .set({
          content: { ...itemContent, showOnHome: true },
          updatedAt: new Date(),
        })
        .where(eq(contentItemsTable.id, item.id));
    }

    await tx
      .update(contentSectionsTable)
      .set({
        content: {
          ...sectionContent,
          galleryHomePreviewSeedVersion: 1,
        },
        updatedAt: new Date(),
      })
      .where(eq(contentSectionsTable.id, gallerySection.id));
  });
}

async function seedHomeKnowledgeHubPreview(): Promise<void> {
  await db.transaction(async (tx) => {
    const [existingSection] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "knowledge-hub-preview"),
        ),
      )
      .limit(1);

    if (existingSection) return;

    await tx
      .insert(contentSectionsTable)
      .values({
        pageSlug: "home",
        sectionKey: "knowledge-hub-preview",
        title: "Explore the Knowledge Hub",
        subtitle:
          "Discover study guides, subject resources, and learning updates from Shastra.",
        content: {
          eyebrow: "LEARN · EXPLORE · GROW",
          ctaLabel: "Explore Knowledge Hub",
        },
        isVisible: true,
        position: 14,
      })
      .onConflictDoNothing();
  });
}

async function seedContactPage(): Promise<void> {
  await db.transaction(async (tx) => {
    const [homeHero] = await tx
      .select({ content: contentSectionsTable.content })
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "hero"),
        ),
      )
      .limit(1);
    const homeHeroContent =
      homeHero && isCmsRecord(homeHero.content) ? homeHero.content : {};
    const enquiryForm = isCmsRecord(homeHeroContent.enquiryForm)
      ? homeHeroContent.enquiryForm
      : null;

    const defaults = [
      {
        sectionKey: "hero",
        title: "Get in touch with Shastra Junior College",
        subtitle:
          "Send an enquiry to the college team using the form below.",
        content: { eyebrow: "GET IN TOUCH" },
        position: 0,
      },
      {
        sectionKey: "enquiry-form",
        title: "Enquiry form",
        subtitle: null,
        content: enquiryForm ? { enquiryForm } : null,
        position: 1,
      },
      {
        sectionKey: "faqs",
        title: "Frequently Asked Questions",
        subtitle:
          "Answers to common questions about contacting Shastra Junior College.",
        content: { eyebrow: "COMMON QUESTIONS" },
        position: 2,
      },
    ] as const;

    for (const section of defaults) {
      const [existingSection] = await tx
        .select({ id: contentSectionsTable.id })
        .from(contentSectionsTable)
        .where(
          and(
            eq(contentSectionsTable.pageSlug, "contact"),
            eq(contentSectionsTable.sectionKey, section.sectionKey),
          ),
        )
        .limit(1);
      if (existingSection) {
        if (section.sectionKey === "enquiry-form") {
          const [currentSection] = await tx
            .select({
              id: contentSectionsTable.id,
              content: contentSectionsTable.content,
            })
            .from(contentSectionsTable)
            .where(eq(contentSectionsTable.id, existingSection.id))
            .limit(1);
          const sectionContent =
            currentSection && isCmsRecord(currentSection.content)
              ? currentSection.content
              : {};
          const currentForm = isCmsRecord(sectionContent.enquiryForm)
            ? sectionContent.enquiryForm
            : null;
          if (currentSection && currentForm) {
            const messageFieldMigration =
              ensureOptionalEnquiryMessageField(currentForm);
            if (messageFieldMigration.changed) {
              await tx
                .update(contentSectionsTable)
                .set({
                  content: {
                    ...sectionContent,
                    enquiryForm: messageFieldMigration.form,
                  },
                  updatedAt: new Date(),
                })
                .where(eq(contentSectionsTable.id, currentSection.id));
            }
          }
        }
        continue;
      }

      if (section.sectionKey === "enquiry-form" && !enquiryForm) {
        throw new Error(
          "The Contact page enquiry form could not be seeded because the Home form configuration is missing.",
        );
      }

      await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "contact",
          sectionKey: section.sectionKey,
          title: section.title,
          subtitle: section.subtitle,
          content: section.content ?? {},
          isVisible: true,
          position: section.position,
        })
        .onConflictDoNothing();
    }
  });
}

async function seedKnowledgeHubPage(): Promise<void> {
  await db
    .insert(contentSectionsTable)
    .values({
      pageSlug: "knowledge-hub",
      sectionKey: "hub-landing",
      title: "Knowledge Hub",
      subtitle:
        "Explore articles, videos, study resources, and exam updates from Shastra Junior College.",
      content: {
        eyebrow: "LEARNING RESOURCES",
        categories: [
          {
            key: "article-hub",
            title: "Article Hub",
            description: "Read focused articles and explainers for your studies.",
          },
          {
            key: "video-hub",
            title: "Video Hub",
            description: "Watch subject walkthroughs and learning videos.",
          },
          {
            key: "study-resources",
            title: "Study Resources",
            description: "Browse study guides and learning materials.",
          },
          {
            key: "exam-updates",
            title: "Exam Updates",
            description: "Keep up with information for upcoming examinations.",
          },
        ],
      },
      isVisible: true,
      position: 0,
    })
    .onConflictDoNothing();
}

async function seedHomeFaqs(): Promise<void> {
  const defaultFaqs = [
    {
      question: "Which course pathways are available?",
      answer:
        "Current course listings include MPC, BiPC, MPC with IIT-JEE preparation, BiPC with NEET preparation, and MPC with EAMCET preparation. Explore All Courses for subject combinations and preparation details.",
      pageTargets: ["home", "courses"],
    },
    {
      question: "What subjects are part of MPC and BiPC?",
      answer:
        "MPC centers on Mathematics, Physics, and Chemistry. BiPC centers on Biology, Physics, and Chemistry.",
      pageTargets: ["home", "courses"],
    },
    {
      question: "How can I ask about admissions?",
      answer:
        "Send an enquiry through the Contact page and include the course you are interested in. The college team can follow up using the details you provide.",
      pageTargets: ["home", "contact", "courses"],
    },
    {
      question: "Where can I find course and batch information?",
      answer:
        "Open All Courses to review the pathways and schedule information shared by the college. For details about a particular option, send an enquiry through Contact.",
      pageTargets: ["contact", "courses"],
    },
  ];
  const courseFaqs = [
    {
      question: "Which subjects are included in the MPC pathway?",
      answer:
        "The MPC pathway centers on Mathematics, Physics, and Chemistry, as listed on the course page.",
      pageTargets: ["course:mpc"],
    },
    {
      question: "Which exam-specific pathways can MPC students explore?",
      answer:
        "Shastra lists IIT-JEE Main and MPC + EAMCET pathways. Open those course pages for their current highlights and curriculum.",
      pageTargets: ["course:mpc"],
    },
    {
      question: "Which subjects are included in the BiPC pathway?",
      answer:
        "The BiPC pathway centers on Biology, Physics, and Chemistry, as listed on the course page.",
      pageTargets: ["course:bipc"],
    },
    {
      question: "Where can I find information about the BiPC and NEET pathway?",
      answer:
        "Shastra lists a dedicated BiPC + NEET pathway. See the NEET course page for its current highlights and curriculum.",
      pageTargets: ["course:bipc"],
    },
    {
      question: "Does the IIT-JEE pathway include JEE Main?",
      answer:
        "The IIT-JEE course highlights list JEE Main as an exam pathway. See that page for the current curriculum and details.",
      pageTargets: ["course:iit-jee"],
    },
    {
      question: "Which core subjects are part of the IIT-JEE pathway?",
      answer:
        "The course highlights identify Mathematics, Physics, and Chemistry as core subjects in the IIT-JEE pathway.",
      pageTargets: ["course:iit-jee"],
    },
    {
      question: "Which stream is paired with NEET in Shastra's course listings?",
      answer:
        "Shastra lists BiPC with NEET. See the NEET course page for its current highlights and curriculum.",
      pageTargets: ["course:neet"],
    },
    {
      question: "Which subjects are associated with the BiPC + NEET pathway?",
      answer:
        "The BiPC + NEET pathway is based on Biology, Physics, and Chemistry, as shown in the course listings.",
      pageTargets: ["course:neet"],
    },
    {
      question: "What does the MPC + EAMCET pathway combine?",
      answer:
        "The course listing combines the MPC pathway with EAMCET preparation. See its course page for the current highlights and curriculum.",
      pageTargets: ["course:mpc-eamcet"],
    },
    {
      question: "Which subjects are included in the MPC part of this pathway?",
      answer:
        "The MPC portion centers on Mathematics, Physics, and Chemistry, as listed on the course page.",
      pageTargets: ["course:mpc-eamcet"],
    },
  ];
  const homeFaqs = [
    {
      question: "Where can I explore the college's course pathways?",
      answer:
        "Visit the Courses page to compare the subject pathways and preparation options shared by Shastra Junior College.",
      pageTargets: ["home"],
    },
    {
      question: "Where can I find learning resources and college updates?",
      answer:
        "Visit the Knowledge Hub to explore learning resources and updates shared by Shastra Junior College.",
      pageTargets: ["home"],
    },
    {
      question: "How can I contact the college team?",
      answer:
        "Use the Contact page to submit an enquiry and the college team can follow up.",
      pageTargets: ["home"],
    },
  ];
  const aboutFaqs = [
    {
      question: "What is Shastra Junior College's approach to learning?",
      answer:
        "Shastra focuses on subject foundations, thoughtful teaching, and academic guidance to help students prepare for their next steps.",
      pageTargets: ["about"],
    },
    {
      question: "Where can I learn about the college's academic pathways?",
      answer:
        "Explore the Courses page for subject combinations and preparation details, or contact the college team with a question.",
      pageTargets: ["about"],
    },
    {
      question: "Where can I learn about Shastra's leadership and community?",
      answer:
        "The About page shares information about the college's leadership, board, strengths, and values.",
      pageTargets: ["about"],
    },
  ];

  await db.transaction(async (tx) => {
    let [section] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "faqs"),
        ),
      )
      .limit(1);

    if (!section) {
      [section] = await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "home",
          sectionKey: "faqs",
          title: "Frequently Asked Questions",
          subtitle: "Answers about courses and getting in touch with the college.",
          content: {
            eyebrow: "COMMON QUESTIONS",
            courseFaqDefaultsVersion: 1,
            homeFaqDefaultsVersion: 1,
            aboutFaqDefaultsVersion: 1,
          },
          isVisible: true,
          position: 15,
        })
        .onConflictDoNothing()
        .returning();

      if (!section) return;

      await tx.insert(contentItemsTable).values(
        [...defaultFaqs, ...courseFaqs, ...homeFaqs, ...aboutFaqs].map((faq, index) => ({
          sectionId: section.id,
          itemType: "faq",
          title: faq.question,
          description: faq.answer,
          imageUrl: null,
          linkPath: null,
          label: null,
          content: { pageTargets: faq.pageTargets },
          isVisible: true,
          position: index,
        })),
      );
      return;
    }

    let sectionContent = isCmsRecord(section.content) ? section.content : {};

    const existingItems = await tx
      .select()
      .from(contentItemsTable)
      .where(
        and(
          eq(contentItemsTable.sectionId, section.id),
          eq(contentItemsTable.itemType, "faq"),
        ),
      );
    let nextPosition =
      existingItems.length > 0
        ? Math.max(...existingItems.map((item) => item.position)) + 1
        : 0;
    const existingByQuestion = new Map(
      existingItems.map((item) => [item.title.trim().toLocaleLowerCase(), item]),
    );
    for (const [marker, defaults] of [
      ["homeFaqDefaultsVersion", homeFaqs],
      ["aboutFaqDefaultsVersion", aboutFaqs],
    ] as const) {
      if (sectionContent[marker] === 1) continue;
      for (const faq of defaults) {
        const questionKey = faq.question.trim().toLocaleLowerCase();
        if (existingByQuestion.has(questionKey)) continue;

        const [created] = await tx
          .insert(contentItemsTable)
          .values({
            sectionId: section.id,
            itemType: "faq",
            title: faq.question,
            description: faq.answer,
            imageUrl: null,
            linkPath: null,
            label: null,
            content: { pageTargets: faq.pageTargets },
            isVisible: true,
            position: nextPosition,
          })
          .returning();
        if (created) {
          existingByQuestion.set(questionKey, created);
          nextPosition += 1;
        }
      }
      sectionContent = { ...sectionContent, [marker]: 1 };
    }

    if (sectionContent.courseFaqDefaultsVersion === 1) {
      await tx
        .update(contentSectionsTable)
        .set({ content: sectionContent as CmsJson, updatedAt: new Date() })
        .where(eq(contentSectionsTable.id, section.id));
      return;
    }

    const newItems: Array<{
      sectionId: string;
      itemType: string;
      title: string;
      description: string;
      imageUrl: null;
      linkPath: null;
      label: null;
      content: { pageTargets: string[] };
      isVisible: boolean;
      position: number;
    }> = [];

    for (const faq of courseFaqs) {
      const existing = existingByQuestion.get(
        faq.question.trim().toLocaleLowerCase(),
      );
      if (!existing) {
        newItems.push({
          sectionId: section.id,
          itemType: "faq",
          title: faq.question,
          description: faq.answer,
          imageUrl: null,
          linkPath: null,
          label: null,
          content: { pageTargets: [...faq.pageTargets] },
          isVisible: true,
          position: nextPosition + newItems.length,
        });
        continue;
      }

      const itemContent = isCmsRecord(existing.content) ? existing.content : {};
      const oldTargets = Array.isArray(itemContent.pageTargets)
        ? itemContent.pageTargets.filter(
            (target): target is string => typeof target === "string",
          )
        : [];
      const pageTargets = [...new Set([...oldTargets, ...faq.pageTargets])];
      await tx
        .update(contentItemsTable)
        .set({ content: { ...itemContent, pageTargets } })
        .where(eq(contentItemsTable.id, existing.id));
    }

    if (newItems.length > 0) {
      await tx.insert(contentItemsTable).values(newItems);
    }
    await tx
      .update(contentSectionsTable)
      .set({
        content: { ...sectionContent, courseFaqDefaultsVersion: 1 },
        updatedAt: new Date(),
      })
      .where(eq(contentSectionsTable.id, section.id));
  });
}

const homeTestimonialProfiles = [
  {
    name: "Anvi Desai",
    role: "Student",
    course: "IIT-JEE Main · 2025",
    feedback:
      "The problem-solving sessions helped me understand why each method works. I felt much more confident tackling unfamiliar questions.",
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&h=320&q=82",
  },
  {
    name: "Vikram Nair",
    role: "Student",
    course: "NEET · 2024",
    feedback:
      "My teachers made it easy to ask questions and kept me focused through the toughest parts of the syllabus.",
    imageUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&h=320&q=82",
  },
  {
    name: "Kavitha Rao",
    role: "Parent",
    course: "Parent of an Intermediate student",
    feedback:
      "The regular updates and approachable teachers helped us understand how our daughter was progressing and where she needed support.",
    imageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&h=320&q=82",
  },
  {
    name: "Ramesh Kulkarni",
    role: "Parent",
    course: "Parent of an IIT-JEE student",
    feedback:
      "The mentoring helped our son build a steady routine and stay curious, even when preparation became demanding.",
    imageUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&h=320&q=82",
  },
  {
    name: "Nisha Varma",
    role: "Alumni",
    course: "NEET · Alumni, 2023",
    feedback:
      "Shastra gave me the confidence to trust my preparation. My teachers were patient, encouraging, and always ready to explain a difficult idea again.",
    imageUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&h=320&q=82",
  },
  {
    name: "Rohan Shah",
    role: "Alumni",
    course: "IIT-JEE Main · Alumni, 2022",
    feedback:
      "The strong foundations I built here still help me in my engineering classes. I value the clarity and care my teachers brought to every lesson.",
    imageUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=320&h=320&q=82",
  },
] as const;

async function seedHomeTestimonials(): Promise<void> {
  await db.transaction(async (tx) => {
    let [section] = await tx
      .select()
      .from(contentSectionsTable)
      .where(
        and(
          eq(contentSectionsTable.pageSlug, "home"),
          eq(contentSectionsTable.sectionKey, "testimonials"),
        ),
      )
      .limit(1);

    if (!section) {
      [section] = await tx
        .insert(contentSectionsTable)
        .values({
          pageSlug: "home",
          sectionKey: "testimonials",
          title: "Stories of progress and possibility",
          subtitle:
            "Hear how students, parents, and alumni describe the guidance and growth they found at Shastra.",
          content: { eyebrow: "FROM THE SHASTRA COMMUNITY" },
          isVisible: true,
          position: 13,
        })
        .onConflictDoNothing()
        .returning();

      if (!section) {
        [section] = await tx
          .select()
          .from(contentSectionsTable)
          .where(
            and(
              eq(contentSectionsTable.pageSlug, "home"),
              eq(contentSectionsTable.sectionKey, "testimonials"),
            ),
          )
          .limit(1);
      }
    }

    if (!section) {
      throw new Error("The Home testimonials section could not be initialized.");
    }

    const sectionContent = isCmsRecord(section.content) ? section.content : {};
    if (sectionContent.testimonialsSeedVersion === 1) return;

    const existingItems = await tx
      .select()
      .from(contentItemsTable)
      .where(
        and(
          eq(contentItemsTable.sectionId, section.id),
          eq(contentItemsTable.itemType, "testimonial"),
        ),
      );
    const existingNames = new Set(
      existingItems.map((item) => item.title.trim().toLocaleLowerCase()),
    );
    const nextPosition =
      existingItems.length > 0
        ? Math.max(...existingItems.map((item) => item.position)) + 1
        : 0;
    const newItems = homeTestimonialProfiles
      .filter((profile) => !existingNames.has(profile.name.toLocaleLowerCase()))
      .map((profile, index) => ({
        sectionId: section.id,
        itemType: "testimonial",
        title: profile.name,
        description: profile.feedback,
        imageUrl: profile.imageUrl,
        linkPath: null,
        label: null,
        content: {
          role: profile.role,
          course: profile.course,
          altText: `Portrait of ${profile.name}`,
          showOnHome: true,
          isDemo: true,
        },
        isVisible: true,
        position: nextPosition + index,
      }));

    if (newItems.length > 0) {
      await tx.insert(contentItemsTable).values(newItems);
    }

    const eyebrow =
      typeof sectionContent.eyebrow === "string" &&
      sectionContent.eyebrow.trim()
        ? sectionContent.eyebrow
        : "FROM THE SHASTRA COMMUNITY";
    const title =
      section.title === "Stories & outcomes" || !section.title.trim()
        ? "Stories of progress and possibility"
        : section.title;
    const subtitle =
      section.subtitle ===
        "Hidden until verified, client-approved content is supplied." ||
      section.subtitle === null
        ? "Hear how students, parents, and alumni describe the guidance and growth they found at Shastra."
        : section.subtitle;

    await tx
      .update(contentSectionsTable)
      .set({
        title,
        subtitle,
        content: {
          ...sectionContent,
          eyebrow,
          testimonialsSeedVersion: 1,
        },
        isVisible: true,
        position: 13,
        updatedAt: new Date(),
      })
      .where(eq(contentSectionsTable.id, section.id));
  });
}

export async function seedArticleHub(): Promise<void> {
  const articleHubSeedVersion = 2;
  const categorySeeds = [
    {
      slug: "physics",
      name: "Physics",
      description: "Conceptual explanations and practical problem-solving methods.",
      position: 0,
    },
    {
      slug: "exam-preparation",
      name: "Exam Preparation",
      description: "Plan revision and use practice papers with purpose.",
      position: 1,
    },
    {
      slug: "biology",
      name: "Biology",
      description: "Active methods for learning biological systems and terms.",
      position: 2,
    },
    {
      slug: "study-skills",
      name: "Study Skills",
      description: "Build routines that support focused, consistent learning.",
      position: 3,
    },
    {
      slug: "career-guidance",
      name: "Career Guidance",
      description: "Explore academic interests and science-related pathways.",
      position: 4,
    },
  ];

  const articleSeeds = [
    {
      categorySlug: "physics",
      slug: "from-diagram-to-equation-physics-problems",
      title: "From Diagram to Equation: A Better Way to Solve Physics Problems",
      excerpt:
        "A careful sketch can reveal the forces, directions, and relationships that a long calculation hides.",
      image: "article-cover-physics.jpg",
      imageAlt: "Student sketching a ray diagram in a physics notebook",
      position: 0,
      featured: true,
      publishedAt: "2026-08-18T09:00:00.000Z",
      body: `When a physics question feels difficult, the first useful step is often to stop calculating. Read the situation once for the physical story, then draw it. A diagram turns objects, directions, and known quantities into something you can inspect before choosing an equation.

Start with the system named in the question. Mark its position, motion, and relevant boundaries. Add arrows for forces or velocities, and label each arrow with a symbol rather than a guessed number. Choose axes that make the important directions easy to describe. For a block on a slope, for example, axes parallel and perpendicular to the slope usually produce simpler components than horizontal and vertical axes.

Next, write down what is known and what must be found. Check units and distinguish a magnitude from a direction. Only then select a relationship that matches the diagram: Newton's second law for forces and acceleration, a conservation law when the system supports it, or a kinematic relation when acceleration is constant.

As you solve, keep each substitution visible. It makes sign errors easier to locate and gives you a chance to check whether the answer has the right units and direction. A final estimate is useful too: if a result is many orders of magnitude away from what the situation suggests, revisit the assumptions and arithmetic.

With practice, this sequence becomes quick: describe, sketch, label, choose, calculate, check. The drawing is not decoration. It is the first model of the problem.`,
    },
    {
      categorySlug: "study-skills",
      slug: "build-a-study-plan-you-can-follow",
      title: "Build a Study Plan You Can Actually Follow",
      excerpt:
        "A useful timetable begins with real available time, clear priorities, and room to adjust after each week.",
      image: "article-cover-study-plan.jpg",
      imageAlt: "Student arranging a weekly study planner beside a notebook",
      position: 1,
      featured: false,
      publishedAt: "2026-08-12T09:00:00.000Z",
      body: `A study plan works when it describes the week you have, not an imaginary week with unlimited energy. Begin by marking classes, travel, meals, sleep, and other fixed commitments. The remaining time is your actual study capacity.

List the topics you need to cover and give each one a next action. “Study chemistry” is hard to start; “solve ten equilibrium questions and correct them” is clear. Estimate the time honestly, then place shorter sessions across several days instead of assigning one long block to a difficult topic.

Mix subjects and types of work. A day might include concept review, worked examples, independent practice, and a brief recall session. Returning to a topic after a gap helps you find what you remember and what still needs attention. Leave one flexible block in the week for work that took longer than expected.

At the end of each week, compare the plan with what happened. Keep the parts that helped, move unfinished work deliberately, and reduce the next week's load if the plan was consistently too full. A timetable is a guide that should respond to evidence.

Make the next action visible before you stop each session. Write down the question to resume, the page to review, or the exercise to attempt. This small step makes it easier to begin again and turns a schedule into a practical learning routine.`,
    },
    {
      categorySlug: "biology",
      slug: "revise-biology-with-retrieval-practice",
      title: "Revise Biology with Retrieval Practice",
      excerpt:
        "Replace repeated rereading with short attempts to explain, draw, and compare key biological ideas from memory.",
      image: "article-cover-biology.jpg",
      imageAlt: "Student reviewing a leaf cross-section in a biology notebook",
      position: 2,
      featured: false,
      publishedAt: "2026-08-06T09:00:00.000Z",
      body: `Biology contains connected systems, precise vocabulary, and many details. Reading the same page several times can make it feel familiar without showing whether you can retrieve the information later. Retrieval practice gives you that evidence.

After a short section, close the book and write what you remember. Recreate a labelled diagram, list the stages of a process, or explain how one structure supports a function. Do not check the source while you are trying. The effort to recall shows which links are secure and which need another look.

Then compare your attempt with the text or class notes. Correct missing labels and inaccurate links in a different color. Turn each gap into a focused prompt: “What changes as blood passes through the lungs?” is more useful than “revise circulation.” Try the prompt again after a day or two, then later in the week.

For similar terms, make a comparison table that records the feature that distinguishes each one. For processes, use a flow diagram with arrows and a short reason beside important transitions. These formats make relationships visible rather than leaving a list of disconnected facts.

Keep sessions manageable. A few minutes of closed-book recall, careful checking, and a later review can reveal more than another uninterrupted reread. Your notes remain important, but use them to verify and repair memory, not only as material to look at.`,
    },
    {
      categorySlug: "exam-preparation",
      slug: "use-practice-tests-to-plan-your-revision",
      title: "Use Practice Tests to Find What to Study Next",
      excerpt:
        "A practice paper becomes more useful when you examine your reasoning, not only the final score.",
      image: "article-cover-exam.jpg",
      imageAlt: "Student completing a timed practice paper at a desk",
      position: 3,
      featured: false,
      publishedAt: "2026-07-30T09:00:00.000Z",
      body: `A practice test can tell you more than how many questions you answered correctly. It can show whether a concept is unclear, a method is unreliable, or time is being spent in the wrong places. The review after the test is where that information becomes a plan.

When you finish, sort missed or uncertain questions by cause. Did you forget a fact, misunderstand what was being asked, choose an unsuitable method, make an arithmetic slip, or run out of time? Keep these categories separate. Each calls for different practice.

For a concept gap, return to the explanation and then solve a fresh question without looking at the worked answer. For a method issue, write the steps you should have considered and practise another problem of the same type. For a calculation error, locate the exact line where the result changed. If time was the issue, record how long you spent and decide what cue will help you move on next time.

Maintain a short error log with the question topic, cause, correction, and a date to retry it. Reattempt the question later from a blank page. If you can explain the reasoning and complete a similar question, mark that skill as stronger; if not, schedule another focused review.

Use full-length timed papers periodically, and shorter topic sets between them. This balance keeps exam conditions familiar without sacrificing the deliberate practice that closes specific gaps.`,
    },
    {
      categorySlug: "biology",
      slug: "make-chemical-bonding-easier-to-recall",
      title: "Make Chemical Bonding Easier to Recall",
      excerpt:
        "Learn bonding by linking particle-level models to observable properties and practising comparisons.",
      image: "article-cover-chemistry.jpg",
      imageAlt: "Molecular model pieces beside a chemistry notebook",
      position: 4,
      featured: false,
      publishedAt: "2026-07-22T09:00:00.000Z",
      body: `Chemical bonding becomes easier to reason about when each model is connected to the particles involved and the properties it helps explain. Instead of memorising isolated descriptions, ask what is attracting what and how that arrangement behaves.

For an ionic solid, describe the repeating arrangement of oppositely charged ions and the electrostatic attractions throughout the lattice. For a simple molecular substance, distinguish the covalent bonds within molecules from the forces between separate molecules. For a metal, picture positive ions arranged among delocalised electrons. These are different models, and choosing the right one matters.

Make a comparison table with columns for particles, structure, bonding or attraction, and a property you can explain. Link each property back to the model: electrical conductivity depends on mobile charged particles; melting behavior depends on the energy needed to overcome the relevant attractions or bonds.

Practise moving in both directions. Given a structure, explain a likely property. Given a property, identify which model could account for it and what evidence would support that model. If a question asks for an explanation, include the particle-level reason rather than stopping at the name of the bond.

Diagrams can help, but label what the symbols represent and avoid treating a sketch as a photograph. After drawing a model from memory, check that it distinguishes the important particles and forces. Repeatedly explaining those links builds understanding that transfers to unfamiliar questions.`,
    },
    {
      categorySlug: "exam-preparation",
      slug: "break-down-multi-step-jee-problems",
      title: "Break Down Multi-Step JEE Problems",
      excerpt:
        "Turn a complex question into smaller decisions by identifying the target, constraints, and useful intermediate results.",
      image: "article-cover-jee.jpg",
      imageAlt: "Student solving a mathematics problem with a compass and ruler nearby",
      position: 5,
      featured: false,
      publishedAt: "2026-07-15T09:00:00.000Z",
      body: `A multi-step entrance-exam problem often combines familiar ideas in an unfamiliar order. Trying to recall a matching solved example can be frustrating. A more reliable approach is to identify the target and work out what information would lead to it.

Read the question for constraints, not just numbers. Note restrictions such as a positive value, a particular interval, a limiting case, or a relationship between variables. Then write the requested quantity clearly. These details can rule out approaches that look plausible but do not answer the question.

Break the work into intermediate results. In mechanics, that may mean finding an acceleration before a time or distance. In algebra, it may mean reducing an expression before solving for a parameter. In geometry, it may mean establishing a relation between angles or lengths before applying a theorem. Record why each step follows, even briefly.

When stuck, try a simpler representation: sketch the geometry, define a variable, check dimensions, or inspect a limiting case. These are ways to reveal structure, not shortcuts that replace the proof. Once the route is clear, calculate carefully and compare the answer with the constraints from the question.

After practice, review the decision points. Mark where you chose the useful relation, where a condition mattered, and which unnecessary step cost time. Redoing selected problems later without notes builds flexibility and improves recognition of the underlying ideas.`,
    },
    {
      categorySlug: "biology",
      slug: "make-neet-biology-revision-more-active",
      title: "Make NEET Biology Revision More Active",
      excerpt:
        "Pair careful textbook reading with diagrams, recall prompts, and regular checks on commonly confused concepts.",
      image: "article-cover-neet.jpg",
      imageAlt: "Student studying a human biology diagram with an open textbook",
      position: 6,
      featured: false,
      publishedAt: "2026-07-08T09:00:00.000Z",
      body: `Biology revision for a competitive examination needs both coverage and accurate recall. A routine built only around reading chapters can leave little time to test what you know. Add small retrieval tasks to every topic so that studying includes answering, not only reviewing.

Before opening the textbook, list the ideas you remember from the previous session. Then read a manageable section with a question in mind: what structure, process, or comparison should you be able to explain afterward? Close the book and answer that question in your own words or with a labelled diagram.

Use the text to verify exact terms and distinctions. Record corrections in a compact set of notes, and create a few prompts for details that are easy to confuse. For example, ask yourself to compare two structures by location, function, and a defining feature rather than copying their descriptions side by side.

Question practice should follow the same learning loop. After checking an answer, identify the reason for the mistake. Was a keyword overlooked, a fact confused, or a relationship not understood? Return to that point, explain it, and solve a related question. This gives each question a purpose beyond its mark.

Revisit topics on a spaced schedule. A brief attempt to recall yesterday's material, a later review in the week, and a mixed-topic session help you see what remains available without prompts. Keep the cycle steady: retrieve, verify, correct, and return.`,
    },
    {
      categorySlug: "study-skills",
      slug: "build-a-concept-map-that-tests-understanding",
      title: "Build a Concept Map That Tests Understanding",
      excerpt:
        "A good concept map explains how ideas connect and makes missing links visible.",
      image: "article-cover-memory.jpg",
      imageAlt: "Student arranging colored study cards into a concept map",
      position: 7,
      featured: false,
      publishedAt: "2026-07-01T09:00:00.000Z",
      body: `A concept map is useful when its connections carry meaning. If it is only a collection of copied headings, it may look complete without showing how one idea affects another. Build the map from memory first, then use your notes to check and refine it.

Choose a focused question or topic. Write the central idea, then add related concepts as separate nodes. Connect them with labelled arrows such as “increases,” “requires,” “is an example of,” or “leads to.” The label should make the relationship readable as a short statement.

Keep different kinds of relationships distinct. A sequence can use arrows to show order; a comparison may need branches that identify shared and different features; a causal link should state the mechanism when you know it. If a link is difficult to label, that is a useful sign to revisit the explanation.

Use the map to ask yourself questions. Can you explain each arrow without reading? Can you predict what changes if one node changes? Can you start at a smaller detail and connect it back to the main idea? These questions test understanding more deeply than recognizing familiar terms.

After checking the map against a trusted source, correct missing or inaccurate links and leave the corrected map easy to review. Return to it later and redraw the main structure on a blank page. The goal is not a decorative poster; it is a compact model you can explain and use.`,
    },
    {
      categorySlug: "career-guidance",
      slug: "explore-science-careers-through-small-questions",
      title: "Explore Science Careers Through Small Questions",
      excerpt:
        "Make career exploration practical by comparing the work, study routes, and daily activities behind different roles.",
      image: "article-cover-career.jpg",
      imageAlt: "Student discussing science study options with a teacher",
      position: 8,
      featured: false,
      publishedAt: "2026-06-24T09:00:00.000Z",
      body: `Career exploration can feel overwhelming when it begins with a long list of job titles. Start instead with the activities that interest you. Do you enjoy explaining ideas, working with data, solving technical problems, caring for people, designing systems, or conducting experiments?

Choose two or three fields that connect with those interests and investigate what people in them do during a typical week. Look beyond the title: daily tasks, work settings, collaboration, and the kinds of questions they solve can differ substantially within the same broad field.

For each field, note the education or training commonly required, the subjects that support it, and the skills people use. Check current information from universities, professional associations, and people working in the field. Requirements can vary by role and location, so compare more than one reliable source.

Then run a small exploration. Attend a talk, ask a teacher for a reading suggestion, complete a short project, or speak with a practitioner about their work. Prepare specific questions, such as which parts of the job require careful communication or how the person developed a particular skill.

Keep a simple comparison table of what you learn and what you still want to know. You do not need to make a permanent choice after one conversation. Each small investigation can clarify which subjects, experiences, and next questions are worth pursuing.`,
    },
    {
      categorySlug: "exam-preparation",
      slug: "turn-mistakes-into-a-weekly-revision-plan",
      title: "Turn Mistakes into a Weekly Revision Plan",
      excerpt:
        "Use a short error log to decide what deserves another explanation, another example, or another attempt.",
      image: "article-cover-revision.jpg",
      imageAlt: "Student reviewing corrected practice questions and a formula sheet",
      position: 9,
      featured: false,
      publishedAt: "2026-06-17T09:00:00.000Z",
      body: `A corrected answer is easy to forget if you only look at the solution and move on. A brief error log turns mistakes into specific work for the next study session.

For each question you miss or guess, record the topic, the reason, and the correction. Keep the reason concrete: a definition was confused, a condition was missed, a diagram was incomplete, or a calculation changed sign. Avoid writing only “careless,” because that does not tell you what action to take.

Match the next step to the cause. Revisit a concept and explain it without notes if understanding was missing. Practise a comparable problem if the method was uncertain. For a reading error, underline the condition that changes the solution and practise scanning for similar cues. For arithmetic, check the working line by line and use a separate estimate to test the result.

At the end of the week, group the log by topic and choose a small number of recurring gaps. Add a short focused session for each, then retry selected questions after a delay. Mark a topic as improving only when you can solve a fresh example and explain the reasoning.

Keep the log brief enough to maintain. Its value comes from reviewing patterns and scheduling a next attempt, not from recording every detail. Over time, it helps you spend revision time where it can make the clearest difference.`,
    },
  ];

  await db.transaction(async (tx) => {
    let [settings] = await tx
      .select()
      .from(articleHubSettingsTable)
      .where(eq(articleHubSettingsTable.id, "primary"))
      .for("update")
      .limit(1);

    if (!settings) {
      await tx
        .insert(articleHubSettingsTable)
        .values({
          id: "primary",
          eyebrow: "THE SHASTRA LEARNING JOURNAL",
          title: "Ideas for learning with confidence",
          introduction:
            "Explore clear explanations, practical study methods, and guidance for your next academic step.",
          heroImageUrl: "/article-images/article-hub-hero.jpg",
          heroImageAlt:
            "Student studying a science lesson in a bright classroom",
        })
        .onConflictDoNothing();
      [settings] = await tx
        .select()
        .from(articleHubSettingsTable)
        .where(eq(articleHubSettingsTable.id, "primary"))
        .for("update")
        .limit(1);
    }

    if (!settings) {
      throw new Error("Article Hub settings could not be initialized.");
    }
    if (settings.contentSeedVersion >= articleHubSeedVersion) return;
    if (settings.contentSeedVersion > 0) {
      if (settings.contentSeedVersion === 1) {
        for (const article of articleSeeds) {
          const previousImagePath = `/article-images/${article.image.replace(/\.jpg$/, ".png")}`;
          await tx
            .update(articlesTable)
            .set({ imageUrl: `/article-images/${article.image}`, updatedAt: new Date() })
            .where(eq(articlesTable.imageUrl, previousImagePath));
        }
        await tx
          .update(articleHubSettingsTable)
          .set({
            heroImageUrl: "/article-images/article-hub-hero.jpg",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(articleHubSettingsTable.id, "primary"),
              eq(
                articleHubSettingsTable.heroImageUrl,
                "/article-images/article-hub-hero.png",
              ),
            ),
          );
        await tx
          .update(articleHubSettingsTable)
          .set({ contentSeedVersion: articleHubSeedVersion, updatedAt: new Date() })
          .where(eq(articleHubSettingsTable.id, "primary"));
      }
      return;
    }

    await tx
      .insert(articleCategoriesTable)
      .values(categorySeeds)
      .onConflictDoNothing();
    const categories = await tx.select().from(articleCategoriesTable);
    const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));
    const missingCategory = articleSeeds.find(
      (article) => !categoryIds.has(article.categorySlug),
    );
    if (missingCategory) {
      throw new Error(`Article Hub category "${missingCategory.categorySlug}" is missing.`);
    }

    await tx
      .insert(articlesTable)
      .values(
        articleSeeds.map((article) => ({
          categoryId: categoryIds.get(article.categorySlug)!,
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          body: article.body,
          imageUrl: `/article-images/${article.image}`,
          imageAlt: article.imageAlt,
          author: "Shastra Academic Desk",
          publishedAt: new Date(article.publishedAt),
          isPublished: true,
          isFeatured: article.featured,
          position: article.position,
        })),
      )
      .onConflictDoNothing();

    await tx
      .update(articleHubSettingsTable)
      .set({ contentSeedVersion: articleHubSeedVersion, updatedAt: new Date() })
      .where(eq(articleHubSettingsTable.id, "primary"));
  });
}

export async function seedVideoHub(): Promise<void> {
  const videoHubSeedVersion = 2;
  const categorySeeds = [
    { slug: "physics", name: "Physics", description: "Motion, forces, and core physics concepts.", position: 0 },
    { slug: "exam-preparation", name: "Exam Preparation", description: "Review lessons for focused exam revision.", position: 1 },
    { slug: "chemistry", name: "Chemistry", description: "Atoms, bonding, and chemical calculations.", position: 2 },
    { slug: "biology", name: "Biology", description: "Cells, organisms, and biological systems.", position: 3 },
  ];
  const videoSeeds = [
    {
      categorySlug: "physics",
      title: "Speed, Velocity, and Acceleration | Physics of Motion Explained",
      description: "An introduction to speed, velocity, and acceleration through the physics of motion.",
      youtubeUrl: "https://www.youtube.com/watch?v=Jyiw6KkedDY",
      thumbnail: "article-cover-physics.jpg",
      thumbnailAlt: "Illustrated physics lesson thumbnail about motion.",
      position: 0,
      featured: true,
    },
    {
      categorySlug: "exam-preparation",
      title: "AP Physics 1: Newton's Laws and Forces Review",
      description: "An exam-prep review covering Newton's laws and common force models.",
      youtubeUrl: "https://www.youtube.com/watch?v=syJ6Bmmquh8",
      thumbnail: "article-cover-exam.jpg",
      thumbnailAlt: "Illustrated exam preparation thumbnail for physics.",
      position: 1,
      featured: false,
    },
    {
      categorySlug: "physics",
      title: "Physics for Beginners: Motion",
      description: "A beginner-friendly introduction to motion and basic physics.",
      youtubeUrl: "https://www.youtube.com/watch?v=wUgYa5YLBbM",
      thumbnail: "article-cover-jee.jpg",
      thumbnailAlt: "Illustrated beginner physics lesson thumbnail.",
      position: 2,
      featured: false,
    },
    {
      categorySlug: "physics",
      title: "College Physics: Motion and Forces",
      description: "A college-level lecture introducing forces as a cause of motion.",
      youtubeUrl: "https://www.youtube.com/watch?v=yYjGUXLoZWM",
      thumbnail: "article-cover-physics.jpg",
      thumbnailAlt: "Illustrated college physics lesson thumbnail.",
      position: 3,
      featured: false,
    },
    {
      categorySlug: "physics",
      title: "Forces: Basic Types and Effects on Motion",
      description: "An overview of common types of force and their effects on motion.",
      youtubeUrl: "https://www.youtube.com/watch?v=IFtLS4q-oFQ",
      thumbnail: "article-cover-memory.jpg",
      thumbnailAlt: "Illustrated physics lesson thumbnail about forces.",
      position: 4,
      featured: false,
    },
    {
      categorySlug: "chemistry",
      title: "How Do Atoms Bond?",
      description: "A lesson about how atoms form bonds and build chemical structures.",
      youtubeUrl: "https://www.youtube.com/watch?v=kNFLsrSpAtA",
      thumbnail: "article-cover-chemistry.jpg",
      thumbnailAlt: "Illustrated chemistry lesson thumbnail about atomic bonds.",
      position: 5,
      featured: false,
    },
    {
      categorySlug: "chemistry",
      title: "Covalent Bonding of Hydrogen, Oxygen, and Nitrogen",
      description: "An introduction to covalent bonding using familiar elements.",
      youtubeUrl: "https://www.youtube.com/watch?v=0HfN3CvXP2M",
      thumbnail: "article-cover-chemistry.jpg",
      thumbnailAlt: "Illustrated chemistry lesson thumbnail about covalent bonding.",
      position: 6,
      featured: false,
    },
    {
      categorySlug: "chemistry",
      title: "Parts of an Atom",
      description: "A visual introduction to the particles that make up an atom.",
      youtubeUrl: "https://www.youtube.com/watch?v=cpBb2bgFO6I",
      thumbnail: "article-cover-career.jpg",
      thumbnailAlt: "Illustrated chemistry lesson thumbnail about atoms.",
      position: 7,
      featured: false,
    },
    {
      categorySlug: "biology",
      title: "What Are Cells?",
      description: "An overview of cells as the fundamental building blocks of living organisms.",
      youtubeUrl: "https://www.youtube.com/watch?v=M1wdIdCOk-Y",
      thumbnail: "article-cover-biology.jpg",
      thumbnailAlt: "Illustrated biology lesson thumbnail about cells.",
      position: 8,
      featured: false,
    },
    {
      categorySlug: "biology",
      title: "What Are Viruses?",
      description: "A short biology lesson introducing viruses as a type of microorganism.",
      youtubeUrl: "https://www.youtube.com/watch?v=rWkNvIUthBI",
      thumbnail: "article-cover-neet.jpg",
      thumbnailAlt: "Illustrated biology lesson thumbnail about viruses.",
      position: 9,
      featured: false,
    },
  ];

  await db.transaction(async (tx) => {
    let [settings] = await tx
      .select()
      .from(videoHubSettingsTable)
      .where(eq(videoHubSettingsTable.id, "primary"))
      .for("update")
      .limit(1);

    if (!settings) {
      await tx
        .insert(videoHubSettingsTable)
        .values({
          id: "primary",
          eyebrow: "THE SHASTRA VIDEO LIBRARY",
          title: "Learn through clear, focused video lessons",
          introduction:
            "Watch subject explainers and revision videos selected to support your next step in learning.",
          heroImageUrl: "/article-images/article-hub-hero.jpg",
          heroImageAlt: "Student studying a science lesson in a bright classroom",
        })
        .onConflictDoNothing();
      [settings] = await tx
        .select()
        .from(videoHubSettingsTable)
        .where(eq(videoHubSettingsTable.id, "primary"))
        .for("update")
        .limit(1);
    }

    if (!settings) {
      throw new Error("Video Hub settings could not be initialized.");
    }
    if (settings.contentSeedVersion >= videoHubSeedVersion) return;
    if (settings.contentSeedVersion === 1) {
      for (const video of videoSeeds) {
        await tx
          .update(videosTable)
          .set({ thumbnailAlt: video.thumbnailAlt, updatedAt: new Date() })
          .where(
            and(
              eq(videosTable.youtubeUrl, video.youtubeUrl),
              eq(videosTable.thumbnailAlt, ""),
            ),
          );
      }
      await tx
        .update(videoHubSettingsTable)
        .set({
          contentSeedVersion: videoHubSeedVersion,
          updatedAt: new Date(),
        })
        .where(eq(videoHubSettingsTable.id, "primary"));
      return;
    }

    await tx
      .insert(videoCategoriesTable)
      .values(categorySeeds)
      .onConflictDoNothing();
    const categories = await tx.select().from(videoCategoriesTable);
    const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));
    const missingCategory = videoSeeds.find(
      (video) => !categoryIds.has(video.categorySlug),
    );
    if (missingCategory) {
      throw new Error(`Video Hub category "${missingCategory.categorySlug}" is missing.`);
    }

    await tx
      .insert(videosTable)
      .values(
        videoSeeds.map((video) => ({
          categoryId: categoryIds.get(video.categorySlug)!,
          title: video.title,
          description: video.description,
          youtubeUrl: video.youtubeUrl,
          thumbnailUrl: `/article-images/${video.thumbnail}`,
          thumbnailAlt: video.thumbnailAlt,
          publishedAt: null,
          isPublished: true,
          isFeatured: video.featured,
          position: video.position,
        })),
      )
      .onConflictDoNothing();

    await tx
      .update(videoHubSettingsTable)
      .set({
        contentSeedVersion: videoHubSeedVersion,
        updatedAt: new Date(),
      })
      .where(eq(videoHubSettingsTable.id, "primary"));
  });
}

export async function seedStudyResources(): Promise<void> {
  const seedVersion = 1;
  const categorySeeds = [
    {
      slug: "mathematics",
      name: "Mathematics",
      description: "Algebra, functions, and problem-solving practice.",
      position: 0,
    },
    {
      slug: "physics",
      name: "Physics",
      description: "Concept notes and practice for core physics topics.",
      position: 1,
    },
    {
      slug: "chemistry",
      name: "Chemistry",
      description: "Revision resources and practice for chemistry.",
      position: 2,
    },
    {
      slug: "biology",
      name: "Biology",
      description: "Study notes and practice for life science topics.",
      position: 3,
    },
    {
      slug: "exam-preparation",
      name: "Exam Preparation",
      description: "Practice sets for focused revision.",
      position: 4,
    },
  ];
  const resourceSeeds = [
    {
      categorySlug: "mathematics",
      title: "Algebra & Functions — Quick Notes",
      description:
        "A concise MPC/JEE revision guide to expressions, equations, functions, and common algebraic patterns.",
      resourceType: "study-notes",
      fileUrl: "/study-resource-pdfs/mpc-mathematics-algebra-functions.pdf",
      fileName: "mpc-mathematics-algebra-functions.pdf",
      thumbnailUrl: "/study-resource-covers/mpc-jee.png",
      thumbnailAlt: "MPC and JEE study resource cover",
      position: 0,
    },
    {
      categorySlug: "physics",
      title: "Motion & Forces — Concept Review",
      description:
        "A focused review of motion graphs, Newton's laws, free-body diagrams, and friction.",
      resourceType: "revision-guide",
      fileUrl: "/study-resource-pdfs/mpc-physics-motion-forces.pdf",
      fileName: "mpc-physics-motion-forces.pdf",
      thumbnailUrl: "/article-images/article-cover-physics.jpg",
      thumbnailAlt: "Illustrated physics resource cover",
      position: 1,
    },
    {
      categorySlug: "chemistry",
      title: "Mole Concept — Practice Worksheet",
      description:
        "Worked examples and short exercises on molar mass, particle count, and chemical quantities.",
      resourceType: "practice-paper",
      fileUrl: "/study-resource-pdfs/mpc-chemistry-mole-concept.pdf",
      fileName: "mpc-chemistry-mole-concept.pdf",
      thumbnailUrl: "/article-images/article-cover-chemistry.jpg",
      thumbnailAlt: "Illustrated chemistry resource cover",
      position: 2,
    },
    {
      categorySlug: "exam-preparation",
      title: "MPC + JEE — Mixed Practice Set",
      description:
        "A short mixed-subject practice set with mathematics, physics, and chemistry questions.",
      resourceType: "practice-paper",
      fileUrl: "/study-resource-pdfs/mpc-jee-mixed-practice-set.pdf",
      fileName: "mpc-jee-mixed-practice-set.pdf",
      thumbnailUrl: "/study-resource-covers/mpc-jee.png",
      thumbnailAlt: "MPC and JEE mixed practice resource cover",
      position: 3,
    },
    {
      categorySlug: "biology",
      title: "Cell Biology — Revision Notes",
      description:
        "A structured overview of cell organelles, membranes, transport, and the cell cycle.",
      resourceType: "revision-guide",
      fileUrl: "/study-resource-pdfs/bipc-biology-cell-biology.pdf",
      fileName: "bipc-biology-cell-biology.pdf",
      thumbnailUrl: "/study-resource-covers/bipc-neet.png",
      thumbnailAlt: "BiPC and NEET study resource cover",
      position: 4,
    },
    {
      categorySlug: "biology",
      title: "Human Physiology — Practice Worksheet",
      description:
        "Review questions covering digestion, circulation, respiration, and homeostasis.",
      resourceType: "practice-paper",
      fileUrl: "/study-resource-pdfs/bipc-biology-human-physiology.pdf",
      fileName: "bipc-biology-human-physiology.pdf",
      thumbnailUrl: "/article-images/article-cover-biology.jpg",
      thumbnailAlt: "Illustrated biology resource cover",
      position: 5,
    },
    {
      categorySlug: "biology",
      title: "Genetics — Key Concepts",
      description:
        "A clear study guide to inheritance, alleles, genotype, phenotype, and simple crosses.",
      resourceType: "study-notes",
      fileUrl: "/study-resource-pdfs/bipc-biology-genetics.pdf",
      fileName: "bipc-biology-genetics.pdf",
      thumbnailUrl: "/article-images/article-cover-neet.jpg",
      thumbnailAlt: "Illustrated biology exam-preparation cover",
      position: 6,
    },
    {
      categorySlug: "exam-preparation",
      title: "BiPC + NEET — Biology Practice Set",
      description:
        "A concise biology practice paper on cells, genetics, plant systems, and human physiology.",
      resourceType: "practice-paper",
      fileUrl: "/study-resource-pdfs/bipc-neet-biology-practice-set.pdf",
      fileName: "bipc-neet-biology-practice-set.pdf",
      thumbnailUrl: "/study-resource-covers/bipc-neet.png",
      thumbnailAlt: "BiPC and NEET biology practice resource cover",
      position: 7,
    },
    {
      categorySlug: "chemistry",
      title: "Chemical Bonding — Revision Notes",
      description:
        "A compact review of ionic and covalent bonding, Lewis structures, and molecular shape.",
      resourceType: "revision-guide",
      fileUrl: "/study-resource-pdfs/chemistry-bonding-revision.pdf",
      fileName: "chemistry-bonding-revision.pdf",
      thumbnailUrl: "/article-images/article-cover-chemistry.jpg",
      thumbnailAlt: "Illustrated chemistry revision cover",
      position: 8,
    },
    {
      categorySlug: "physics",
      title: "Units, Measurements & Graphs",
      description:
        "A practical guide to SI units, significant figures, uncertainty, and reading data graphs.",
      resourceType: "study-notes",
      fileUrl: "/study-resource-pdfs/physics-measurements-graphs.pdf",
      fileName: "physics-measurements-graphs.pdf",
      thumbnailUrl: "/article-images/article-cover-study-plan.jpg",
      thumbnailAlt: "Illustrated study resource cover",
      position: 9,
    },
  ];
  const pdfSizes: Record<string, number> = {
    "mpc-mathematics-algebra-functions.pdf": 3595,
    "mpc-physics-motion-forces.pdf": 3762,
    "mpc-chemistry-mole-concept.pdf": 3684,
    "mpc-jee-mixed-practice-set.pdf": 3660,
    "bipc-biology-cell-biology.pdf": 3720,
    "bipc-biology-human-physiology.pdf": 3734,
    "bipc-biology-genetics.pdf": 3770,
    "bipc-neet-biology-practice-set.pdf": 3889,
    "chemistry-bonding-revision.pdf": 3873,
    "physics-measurements-graphs.pdf": 3701,
  };

  await db.transaction(async (tx) => {
    let [settings] = await tx
      .select()
      .from(studyResourceHubSettingsTable)
      .where(eq(studyResourceHubSettingsTable.id, "primary"))
      .for("update")
      .limit(1);

    if (!settings) {
      await tx
        .insert(studyResourceHubSettingsTable)
        .values({
          id: "primary",
          eyebrow: "STUDY RESOURCES",
          title: "Find focused guides and practice for what you're learning.",
          introduction:
            "Browse subject notes, revision guides, and practice sets prepared to support your next study session.",
          heroImageUrl: "/article-images/article-hub-hero.jpg",
          heroImageAlt: "Student studying in a bright classroom",
        })
        .onConflictDoNothing();
      [settings] = await tx
        .select()
        .from(studyResourceHubSettingsTable)
        .where(eq(studyResourceHubSettingsTable.id, "primary"))
        .for("update")
        .limit(1);
    }

    if (!settings) {
      throw new Error("Study Resources settings could not be initialized.");
    }
    if (settings.contentSeedVersion >= seedVersion) return;

    await tx
      .insert(studyResourceCategoriesTable)
      .values(categorySeeds)
      .onConflictDoNothing();
    const categories = await tx.select().from(studyResourceCategoriesTable);
    const categoryIds = new Map(
      categories.map((category) => [category.slug, category.id]),
    );
    const missingCategory = resourceSeeds.find(
      (resource) => !categoryIds.has(resource.categorySlug),
    );
    if (missingCategory) {
      throw new Error(
        `Study Resources category "${missingCategory.categorySlug}" is missing.`,
      );
    }

    await tx.insert(studyResourcesTable).values(
      resourceSeeds.map((resource) => ({
        categoryId: categoryIds.get(resource.categorySlug)!,
        title: resource.title,
        description: resource.description,
        resourceType: resource.resourceType,
        fileUrl: resource.fileUrl,
        fileName: resource.fileName,
        fileSizeBytes: pdfSizes[resource.fileName] ?? 0,
        isDemo: true,
        thumbnailUrl: resource.thumbnailUrl,
        thumbnailAlt: resource.thumbnailAlt,
        publishedAt: null,
        isPublished: true,
        position: resource.position,
      })),
    );

    await tx
      .update(studyResourceHubSettingsTable)
      .set({ contentSeedVersion: seedVersion, updatedAt: new Date() })
      .where(eq(studyResourceHubSettingsTable.id, "primary"));
  });
}

export async function seedExamUpdates(): Promise<void> {
  const seedVersion = 1;
  const sampleContent = [
    {
      examCode: "jee-main",
      label: "JEE Main",
      sourceUrl: "https://jeemain.nta.ac.in/",
    },
    {
      examCode: "neet-ug",
      label: "NEET UG",
      sourceUrl: "https://neet.nta.nic.in/",
    },
    {
      examCode: "intermediate",
      label: "Intermediate",
      sourceUrl: "https://bie.ap.gov.in/",
    },
    {
      examCode: "ap-eapcet",
      label: "AP EAPCET",
      sourceUrl:
        "https://cets.apsche.ap.gov.in/EAPCET/Eapcet/EAPCET_HomePage",
    },
    {
      examCode: "other",
      label: "Other examinations",
      sourceUrl: "https://www.nta.ac.in/",
    },
  ];

  await db.transaction(async (tx) => {
    let [settings] = await tx
      .select()
      .from(examUpdateHubSettingsTable)
      .where(eq(examUpdateHubSettingsTable.id, "primary"))
      .for("update")
      .limit(1);

    if (!settings) {
      await tx
        .insert(examUpdateHubSettingsTable)
        .values({
          id: "primary",
          eyebrow: "EXAM UPDATES",
          title: "Exam updates and important dates",
          introduction:
            "Browse official notices and key dates for entrance and intermediate examinations.",
        })
        .onConflictDoNothing();
      [settings] = await tx
        .select()
        .from(examUpdateHubSettingsTable)
        .where(eq(examUpdateHubSettingsTable.id, "primary"))
        .for("update")
        .limit(1);
    }

    if (!settings) {
      throw new Error("Exam Updates settings could not be initialized.");
    }
    if (settings.contentSeedVersion >= seedVersion) return;

    await tx.insert(examUpdateNoticesTable).values(
      sampleContent.map((item, position) => ({
        examCode: item.examCode,
        title: `Sample ${item.label} notice`,
        summary: `Sample official-link entry for ${item.label}.`,
        sourceUrl: item.sourceUrl,
        publishedOn: null,
        isSample: true,
        isPublished: true,
        position,
      })),
    );
    await tx.insert(examCalendarEntriesTable).values(
      sampleContent.map((item, position) => ({
        examCode: item.examCode,
        examCycle: "2027",
        title: `${item.label} key dates`,
        description: "Sample calendar entry.",
        startDate: null,
        endDate: null,
        dateStatus: "to-be-announced",
        sourceUrl: item.sourceUrl,
        isSample: true,
        isPublished: true,
        position,
      })),
    );

    await tx
      .update(examUpdateHubSettingsTable)
      .set({ contentSeedVersion: seedVersion, updatedAt: new Date() })
      .where(eq(examUpdateHubSettingsTable.id, "primary"));
  });
}
