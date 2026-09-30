import { db } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import {
  contentItemsTable,
  contentSectionsTable,
  siteSettingsTable,
  type CmsJson,
} from "@workspace/db";
import { logger } from "./logger";

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
    const [insertedSettings] = await tx
      .insert(siteSettingsTable)
      .values({
        id: "primary",
        collegeName: "Shastra Junior College",
        logoUrl: "/shastra-college-logo.png",
        navigation: [
          { label: "Home", path: "/" },
          { label: "Faculty", path: "/faculty" },
          { label: "Gallery", path: "/gallery" },
        ],
        footerNote:
          "Homepage demo content — replace with college-approved copy before publishing.",
      })
      .onConflictDoNothing()
      .returning({ id: siteSettingsTable.id });

    if (!insertedSettings) {
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
  await seedAboutPage();
}

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

    const sectionContent = isCmsRecord(heroSection.content)
      ? heroSection.content
      : {};
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
    if (facultyContent.facultyProfilesSeedVersion === 2) return;

    const existingProfiles = await tx
      .select({ title: contentItemsTable.title })
      .from(contentItemsTable)
      .where(
        and(
          eq(contentItemsTable.sectionId, facultySection.id),
          eq(contentItemsTable.itemType, "faculty-profile"),
        ),
      );
    const existingNames = new Set(existingProfiles.map((item) => item.title));
    const itemsToSeed = facultyProfiles
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
          socialLinks: {
            linkedin: "",
            facebook: "",
            instagram: "",
            website: "",
          },
          showOnHome: true,
        },
        isVisible: true,
        position: existingProfiles.length + index,
      }));
    if (itemsToSeed.length) await tx.insert(contentItemsTable).values(itemsToSeed);
    await tx
      .update(contentSectionsTable)
      .set({
        content: {
          ...facultyContent,
          facultyProfilesSeedVersion: 2,
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
