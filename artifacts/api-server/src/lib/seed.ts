import { db } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import {
  contentItemsTable,
  contentSectionsTable,
  coursesMenuSettingsTable,
  siteSettingsTable,
  type CmsJson,
  type CoursesMenuContent,
} from "@workspace/db";
import { logger } from "./logger";

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
      options: ["Intermediate", "IIT-JEE Main", "NEET"],
      required: true,
    },
  ],
};

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
      eyebrow: "INTERMEDIATE • IIT-JEE MAIN • NEET",
      headline: "A strong start for everything ahead.",
      introduction:
        "Explore intermediate education and preparation for IIT-JEE Main and NEET at Shastra Junior College. Tell us what you’re aiming for, and we’ll help you explore your next step.",
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

      if (heroContent.eyebrow === "DEMO COPY · REPLACE BEFORE LAUNCH") {
        heroContent.eyebrow = "INTERMEDIATE • IIT-JEE MAIN • NEET";
        heroChanged = true;
      }
      if (heroContent.headline === "Build your next chapter with curiosity.") {
        heroContent.headline = "A strong start for everything ahead.";
        heroChanged = true;
      }
      if (
        heroContent.introduction ===
        "The words on this homepage are sample copy created for the first build. Replace them with details approved by Shastra Junior College."
      ) {
        heroContent.introduction =
          "Explore intermediate education and preparation for IIT-JEE Main and NEET at Shastra Junior College. Tell us what you’re aiming for, and we’ll help you explore your next step.";
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
          },
          isVisible: true,
          position: 15,
        })
        .onConflictDoNothing()
        .returning();

      if (!section) return;

      await tx.insert(contentItemsTable).values(
        [...defaultFaqs, ...courseFaqs].map((faq, index) => ({
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

    const sectionContent = isCmsRecord(section.content) ? section.content : {};
    if (sectionContent.courseFaqDefaultsVersion === 1) return;

    const existingItems = await tx
      .select()
      .from(contentItemsTable)
      .where(
        and(
          eq(contentItemsTable.sectionId, section.id),
          eq(contentItemsTable.itemType, "faq"),
        ),
      );
    const nextPosition =
      existingItems.length > 0
        ? Math.max(...existingItems.map((item) => item.position)) + 1
        : 0;
    const existingByQuestion = new Map(
      existingItems.map((item) => [item.title.trim().toLocaleLowerCase(), item]),
    );
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
