export const DEFAULT_GALLERY_CATEGORIES = [
  "Campus",
  "Library",
  "Classrooms",
  "Placements",
  "Buildings",
  "Events",
] as const;

type CmsRecord = Record<string, unknown>;

function asRecord(value: unknown): CmsRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

export function normalizeGalleryCategory(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || null;
}

export function getGalleryCategories(
  sectionContent: unknown,
  items: readonly { content: unknown }[] = [],
): string[] {
  const saved = asRecord(sectionContent).galleryCategories;
  const configured = Array.isArray(saved) ? saved : [];
  const fromItems = items.map((item) => asRecord(item.content).category);
  const unique = new Map<string, string>();

  for (const candidate of [
    ...DEFAULT_GALLERY_CATEGORIES,
    ...configured,
    ...fromItems,
  ]) {
    const category = normalizeGalleryCategory(candidate);
    if (!category || category.toLocaleLowerCase() === "all") continue;
    const key = category.toLocaleLowerCase();
    if (!unique.has(key)) unique.set(key, category);
  }

  return [...unique.values()];
}