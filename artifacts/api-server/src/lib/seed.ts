import { db } from "@workspace/db";
import { and, eq } from "drizzle-orm";
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
  submitLabel: "Preview enquiry",
  note: "Preview only — your details are not sent or stored.",
  successMessage:
    "This preview is complete. Your details were not sent or stored.",
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
    title: "Explore Pathways",
    subtitle:
      "Explore the areas named in the Shastra logo. Descriptions are demo copy.",
    content: { isDemo: true },
    isVisible: true,
    position: 3,
  },
  {
    sectionKey: "statistics",
    title: "At a glance",
    subtitle: null,
    content: { isDemo: true, countUp: true },
    isVisible: true,
    position: 9,
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
          { label: "Staff Login", path: "/sign-in" },
        ],
        footerNote:
          "Homepage demo content — replace with college-approved copy before publishing.",
      })
      .onConflictDoNothing()
      .returning({ id: siteSettingsTable.id });

    if (!insertedSettings) {
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

    if (
      !programSectionId ||
      !featureSectionId ||
      !campusSectionId ||
      !statisticsSectionId
    ) {
      throw new Error("Default homepage sections could not be initialized.");
    }

    await tx.insert(contentItemsTable).values([
      {
        sectionId: programSectionId,
        itemType: "program",
        title: "Intermediate",
        description:
          "Demo copy: replace with approved information for this option.",
        linkPath: "#enquire",
        content: { isDemo: true },
        isVisible: true,
        position: 0,
      },
      {
        sectionId: programSectionId,
        itemType: "program",
        title: "IIT-JEE Main",
        description:
          "Demo copy: replace with approved information for this option.",
        linkPath: "#enquire",
        content: { isDemo: true },
        isVisible: true,
        position: 1,
      },
      {
        sectionId: programSectionId,
        itemType: "program",
        title: "NEET",
        description:
          "Demo copy: replace with approved information for this option.",
        linkPath: "#enquire",
        content: { isDemo: true },
        isVisible: true,
        position: 2,
      },
      {
        sectionId: statisticsSectionId,
        itemType: "statistic",
        title: "Sample metric 1",
        description: null,
        content: { value: 0, prefix: "", suffix: "", isDemo: true },
        isVisible: true,
        position: 0,
      },
      {
        sectionId: statisticsSectionId,
        itemType: "statistic",
        title: "Sample metric 2",
        description: null,
        content: { value: 0, prefix: "", suffix: "", isDemo: true },
        isVisible: true,
        position: 1,
      },
      {
        sectionId: statisticsSectionId,
        itemType: "statistic",
        title: "Sample metric 3",
        description: null,
        content: { value: 0, prefix: "", suffix: "", isDemo: true },
        isVisible: true,
        position: 2,
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
          content: { isDemo: true, countUp: true },
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
            title: "Sample metric 1",
            description: null,
            content: { value: 0, prefix: "", suffix: "", isDemo: true },
            isVisible: true,
            position: 0,
          },
          {
            sectionId: created.id,
            itemType: "statistic",
            title: "Sample metric 2",
            description: null,
            content: { value: 0, prefix: "", suffix: "", isDemo: true },
            isVisible: true,
            position: 1,
          },
          {
            sectionId: created.id,
            itemType: "statistic",
            title: "Sample metric 3",
            description: null,
            content: { value: 0, prefix: "", suffix: "", isDemo: true },
            isVisible: true,
            position: 2,
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

    if (programs?.title === "Programs & preparation") {
      await tx
        .update(contentSectionsTable)
        .set({
          title: "Explore Pathways",
          subtitle:
            "Explore the areas named in the Shastra logo. Descriptions are demo copy.",
          updatedAt: new Date(),
        })
        .where(eq(contentSectionsTable.id, programs.id));
    }
  });
}