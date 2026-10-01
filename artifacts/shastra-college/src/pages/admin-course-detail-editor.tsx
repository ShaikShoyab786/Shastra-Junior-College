import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowRight, ArrowUp, Eye, EyeOff, ImagePlus, Plus, Save, Trash2, Upload } from "lucide-react";
import {
  getGetAdminCoursesMenuQueryKey,
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useCreateContentItem,
  useDeleteContentItem,
  useGetAdminCmsPage,
  useGetAdminCoursesMenu,
  useRequestUploadUrl,
  useUpdateContentItem,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type { ContentItem, ContentItemInput, ContentSection } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  COURSE_DETAILS,
  COURSE_MENTOR_SUBJECTS,
  courseSectionKey,
  getCourseMentorSubjectsForCourse,
  getCourseDetailForMenuCard,
  type CourseDetail,
} from "./course-detail-config";

type Flash = { tone: "success" | "error"; message: string };
type SectionDraft = {
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
  isVisible: boolean;
};
type HighlightDraft = {
  clientKey: string;
  id?: string;
  category: string;
  title: string;
  description: string;
  isVisible: boolean;
};
type CurriculumDraft = {
  clientKey: string;
  id?: string;
  title: string;
  description: string;
  topics: string[];
  isVisible: boolean;
};

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(content: Record<string, unknown>, key: string) {
  return typeof content[key] === "string" ? content[key] as string : "";
}

function isSafeImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function errorMessage(error: unknown) {
  const candidate = error as { message?: string; response?: { data?: { error?: string } } };
  return candidate?.response?.data?.error || candidate?.message || "The course page could not be saved. Please try again.";
}

function newId() {
  return `course-highlight-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
function newCurriculumId() {
  return `course-subject-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function draftFromSection(section: ContentSection): SectionDraft {
  return {
    title: section.title,
    subtitle: section.subtitle || "",
    content: { ...recordValue(section.content) },
    isVisible: section.isVisible,
  };
}

function draftFromItem(item: ContentItem): HighlightDraft {
  return {
    clientKey: item.id,
    id: item.id,
    category: stringValue(recordValue(item.content), "category"),
    title: item.title,
    description: item.description || "",
    isVisible: item.isVisible,
  };
}

function Field({
  label,
  value,
  onChange,
  testId,
  placeholder,
  multiline = false,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
  type?: "text" | "url";
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} placeholder={placeholder} rows={4} className={`${inputClass} resize-y`} data-testid={testId} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.currentTarget.value)} placeholder={placeholder} className={inputClass} data-testid={testId} />
      )}
      {hint ? <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function Panel({
  eyebrow,
  title,
  children,
  testId,
  id,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  testId: string;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7" data-testid={testId}>
      <p className="eyebrow text-[#e3212b]">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function CoursePathwaySelector({
  course,
  onCourseChange,
}: {
  course: CourseDetail;
  onCourseChange: (course: CourseDetail) => void;
}) {
  const menu = useGetAdminCoursesMenu({
    query: { queryKey: getGetAdminCoursesMenuQueryKey() },
  });
  const cards = menu.data?.courseCards.slice().sort((a, b) => a.order - b.order) ?? [];
  const draftCourse = COURSE_DETAILS.find((item) => "isDraft" in item && item.isDraft);

  return (
    <section id="course-pathway-selector" className="scroll-mt-6 rounded-3xl border border-[#0b3472]/15 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7" data-testid="panel-admin-course-pathway-selector">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-[#e3212b]">Course pathway</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">Select a pathway to edit.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Choose a course here. The sidebar links below jump to sections for the selected pathway.</p>
        </div>
      </div>

      {menu.isLoading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : menu.isError ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3" role="alert" data-testid="status-admin-course-selector-error">
          <p className="text-sm font-semibold text-red-800">Course choices could not be loaded.</p>
          <button type="button" onClick={() => void menu.refetch()} className="rounded-lg bg-[#0b3472] px-3 py-2 text-xs font-bold text-white">Try again</button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
              const target = getCourseDetailForMenuCard(card);
              const selected = target?.slug === course.slug;
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={!target}
                  onClick={() => target && onCourseChange(target)}
                  aria-pressed={selected}
                  className={`min-h-24 rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-[#0b3472] bg-[#f1f5fb] ring-1 ring-[#0b3472]/20"
                      : "border-slate-200 bg-white hover:border-[#0b3472]/40 hover:bg-[#f8fafc]"
                  } disabled:cursor-not-allowed disabled:opacity-55`}
                  data-testid={`button-admin-course-select-${card.id}`}
                >
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{card.category || "Course pathway"}</span>
                  <span className="mt-1 block font-bold text-[#0b3472]">{card.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{target ? card.description : "Detail editor not configured"}</span>
                  {!card.isVisible ? <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Hidden from menu</span> : null}
                </button>
              );
            })}
          </div>
          {cards.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No course pathways are configured in the Courses menu.</p> : null}
        </>
      )}

      {draftCourse ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Unlisted draft</p>
            <p className="mt-1 text-xs text-slate-500">This pathway is not in the public Courses menu.</p>
          </div>
          <button
            type="button"
            onClick={() => onCourseChange(draftCourse)}
            aria-pressed={course.slug === draftCourse.slug}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              course.slug === draftCourse.slug
                ? "border-[#0b3472] bg-[#f1f5fb] text-[#0b3472]"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#0b3472]/40"
            }`}
            data-testid={`button-admin-course-select-${draftCourse.slug}`}
          >
            {draftCourse.name} draft
          </button>
        </div>
      ) : null}
    </section>
  );
}

function SectionToggle({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  testId: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} className="h-4 w-4 accent-[#0b3472]" data-testid={testId} />
      {label}
    </label>
  );
}

function HighlightRow({
  entry,
  index,
  count,
  onChange,
  onMove,
  onDelete,
}: {
  entry: HighlightDraft;
  index: number;
  count: number;
  onChange: (entry: HighlightDraft) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <article className={`rounded-2xl border p-4 ${entry.isVisible ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`} data-testid={`row-course-highlight-${entry.clientKey}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#0b3472]">{entry.title || "New highlight"}</p>
          <p className="mt-1 text-xs text-slate-500">{entry.isVisible ? "Published" : "Hidden"} · order {index + 1}</p>
        </div>
        <button type="button" onClick={() => onChange({ ...entry, isVisible: !entry.isVisible })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`${entry.isVisible ? "Hide" : "Show"} ${entry.title || "highlight"}`} data-testid={`button-toggle-course-highlight-${entry.clientKey}`}>
          {entry.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${entry.title || "highlight"} up`} data-testid={`button-move-course-highlight-up-${entry.clientKey}`}><ArrowUp className="h-4 w-4" /></button>
        <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${entry.title || "highlight"} down`} data-testid={`button-move-course-highlight-down-${entry.clientKey}`}><ArrowDown className="h-4 w-4" /></button>
        <button type="button" onClick={onDelete} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label={`Remove ${entry.title || "highlight"}`} data-testid={`button-remove-course-highlight-${entry.clientKey}`}><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Category label" value={entry.category} onChange={(next) => onChange({ ...entry, category: next })} testId={`input-course-highlight-category-${entry.clientKey}`} hint="Keep this short, such as “Core subject” or “Exam pathway.”" />
        <Field label="Highlight title" value={entry.title} onChange={(next) => onChange({ ...entry, title: next })} testId={`input-course-highlight-title-${entry.clientKey}`} />
        <div className="md:col-span-2"><Field label="Description" value={entry.description} onChange={(next) => onChange({ ...entry, description: next })} multiline testId={`textarea-course-highlight-description-${entry.clientKey}`} /></div>
      </div>
    </article>
  );
}

function ImageEditor({
  course,
  imageUrl,
  imageAlt,
  onChange,
  upload,
}: {
  course: CourseDetail;
  imageUrl: string;
  imageAlt: string;
  onChange: (key: string, value: string) => void;
  upload: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = imageUrl.startsWith("/objects/") ? `/api/storage${imageUrl}` : imageUrl;
  const [previewFailed, setPreviewFailed] = useState(false);
  useEffect(() => setPreviewFailed(false), [preview]);

  const selectFile = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      onChange("imageUrl", await upload(file));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-[#f8fafc] p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8eef8]">
          {preview && !previewFailed ? <img src={preview} alt={imageAlt} onError={() => setPreviewFailed(true)} className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-[#0b3472]/30" aria-hidden="true" />}
        </div>
        <label className="inline-flex h-fit cursor-pointer items-center gap-2 rounded-lg border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472]">
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />{busy ? "Uploading…" : "Upload hero image"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void selectFile(file); event.currentTarget.value = ""; }} data-testid={`input-course-${course.slug}-hero-image-file`} />
        </label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Hero image URL or uploaded path" value={imageUrl} onChange={(next) => onChange("imageUrl", next)} testId={`input-course-${course.slug}-hero-image-url`} hint="Accepts uploaded /objects/... paths or full HTTP(S) image URLs." />
        <Field label="Image alt text" value={imageAlt} onChange={(next) => onChange("imageAlt", next)} testId={`input-course-${course.slug}-hero-image-alt`} hint="Describe the image for families using assistive technology." />
      </div>
      {error ? <p className="mt-3 text-xs font-semibold text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}

export default function AdminCourseDetailEditor({
  course,
  onCourseChange,
  onNavigate,
  onFlash,
}: {
  course: CourseDetail;
  onCourseChange: (course: CourseDetail) => void;
  onNavigate: (view: "faculty" | "gallery") => void;
  onFlash: (flash: Flash) => void;
}) {
  const client = useQueryClient();
  const page = useGetAdminCmsPage("courses", { query: { queryKey: getGetAdminCmsPageQueryKey("courses") } });
  const createItem = useCreateContentItem();
  const updateItemMutation = useUpdateContentItem();
  const deleteItem = useDeleteContentItem();
  const updateSection = useUpdateContentSection();
  const requestUpload = useRequestUploadUrl();
  const facultyPage = useGetAdminCmsPage("faculty", {
    query: { queryKey: getGetAdminCmsPageQueryKey("faculty") },
  });
  const galleryPage = useGetAdminCmsPage("gallery", {
    query: { queryKey: getGetAdminCmsPageQueryKey("gallery") },
  });
  const [hero, setHero] = useState<SectionDraft | null>(null);
  const [highlightsSection, setHighlightsSection] = useState<SectionDraft | null>(null);
  const [items, setItems] = useState<HighlightDraft[]>([]);
  const [curriculum, setCurriculum] = useState<SectionDraft | null>(null);
  const [subjects, setSubjects] = useState<CurriculumDraft[]>([]);
  const [hydratedCourse, setHydratedCourse] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);

  const heroSource = page.data?.sections.find((section) => section.sectionKey === courseSectionKey(course.slug, "hero"));
  const highlightsSource = page.data?.sections.find((section) => section.sectionKey === courseSectionKey(course.slug, "highlights"));
  const curriculumSource = page.data?.sections.find((section) => section.sectionKey === `course-${course.slug}-curriculum`);
  const facultySection = facultyPage.data?.sections.find((section) => section.sectionKey === "faculty");
  const gallerySection = galleryPage.data?.sections.find(
    (section) => section.sectionKey.toLocaleLowerCase() === "gallery",
  );
  const courseMentorSubjects = new Set<string>(
    getCourseMentorSubjectsForCourse(course.slug),
  );
  const courseMentors = (facultyPage.data?.items ?? [])
    .filter((item) => {
      if (
        item.sectionId !== facultySection?.id ||
        item.itemType !== "faculty-profile"
      ) {
        return false;
      }
      const content = recordValue(item.content);
      const assignedSubjects = Array.isArray(content.courseMentorSubjects)
        ? content.courseMentorSubjects.filter(
            (subject): subject is string => typeof subject === "string",
          )
        : [];
      return (
        content.courseMentorEligible === true &&
        assignedSubjects.some((subject) => courseMentorSubjects.has(subject))
      );
    })
    .sort((a, b) => {
      const aRole = stringValue(recordValue(a.content), "leadershipRole") || "Faculty";
      const bRole = stringValue(recordValue(b.content), "leadershipRole") || "Faculty";
      return Number(bRole !== "Faculty") - Number(aRole !== "Faculty") || a.position - b.position;
    });
  const mentorSubjectLabels = new Map<string, string>(
    COURSE_MENTOR_SUBJECTS.map((subject) => [subject.value, subject.label]),
  );

  useEffect(() => {
    if (!page.data || !heroSource || !highlightsSource || !curriculumSource || hydratedCourse === course.slug) return;
    setHero(draftFromSection(heroSource));
    setHighlightsSection(draftFromSection(highlightsSource));
    setItems(
      page.data.items
        .filter((item) => item.sectionId === highlightsSource.id && item.itemType === "course-highlight")
        .sort((a, b) => a.position - b.position)
        .map(draftFromItem),
    );
    setCurriculum(draftFromSection(curriculumSource));
    setSubjects(page.data.items
      .filter((item) => item.sectionId === curriculumSource.id && item.itemType === "course-curriculum-subject")
      .sort((a, b) => a.position - b.position)
      .map((item) => {
        const itemContent = recordValue(item.content);
        return {
          clientKey: item.id,
          id: item.id,
          title: item.title,
          description: item.description || "",
          topics: Array.isArray(itemContent.topics) ? itemContent.topics.filter((topic): topic is string => typeof topic === "string") : [],
          isVisible: item.isVisible,
        };
      }));
    setError("");
    setHydratedCourse(course.slug);
  }, [course.slug, page.data, heroSource, highlightsSource, curriculumSource, hydratedCourse]);

  const upload = async (file: File) => {
    setUploadsInProgress((count) => count + 1);
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPEG, or WebP image.");
      if (file.size > 2 * 1024 * 1024) throw new Error("Images must be 2 MB or smaller.");
      const info = await requestUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
      const response = await fetch(info.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("The image upload could not be completed.");
      return info.objectPath;
    } finally {
      setUploadsInProgress((count) => Math.max(0, count - 1));
    }
  };
  const uploadPdf = async (file: File) => {
    setUploadsInProgress((count) => count + 1);
    try {
      const fileType = file.type.toLowerCase();
      if (!file.name.toLowerCase().endsWith(".pdf") || (fileType && !["application/pdf", "application/x-pdf"].includes(fileType))) {
        throw new Error("Choose a PDF file with a .pdf extension.");
      }
      if (file.size > 10 * 1024 * 1024) throw new Error("Curriculum PDFs must be 10 MB or smaller.");
      if (await file.slice(0, 5).text() !== "%PDF-") throw new Error("The selected file does not appear to be a valid PDF.");
      const info = await requestUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType: "application/pdf" } });
      const response = await fetch(info.uploadURL, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file });
      if (!response.ok) throw new Error("The curriculum PDF upload could not be completed.");
      patchCurriculumContent("pdfPath", info.objectPath);
      patchCurriculumContent("pdfFileName", file.name);
      setError("");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUploadsInProgress((count) => Math.max(0, count - 1));
    }
  };

  const patchSectionContent = (
    section: "hero" | "highlights",
    key: string,
    value: unknown,
  ) => {
    const setter = section === "hero" ? setHero : setHighlightsSection;
    setter((current) => current ? { ...current, content: { ...current.content, [key]: value } } : current);
  };
  const patchCurriculumContent = (key: string, value: unknown) =>
    setCurriculum((current) => current ? { ...current, content: { ...current.content, [key]: value } } : current);
  const patchCoursePreviewContent = (
    section: "courseFacultyPreview" | "courseGalleryPreview",
    key: string,
    value: string,
  ) =>
    setCurriculum((current) => current
      ? {
          ...current,
          content: {
            ...current.content,
            [section]: {
              ...recordValue(current.content[section]),
              [key]: value,
            },
          },
        }
      : current);

  const updateHighlightDraft = (next: HighlightDraft) => setItems((current) => current.map((item) => item.clientKey === next.clientKey ? next : item));
  const moveItem = (index: number, direction: -1 | 1) => setItems((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = current.slice();
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const moveSubject = (index: number, direction: -1 | 1) => setSubjects((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = current.slice();
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const currentPage = page.data;
    if (!currentPage || !heroSource || !highlightsSource || !curriculumSource || !hero || !highlightsSection || !curriculum) {
      setError("This course page is still loading. Please try again.");
      return;
    }
    const heroContent = recordValue(hero.content);
    const highlightsContent = recordValue(highlightsSection.content);
    const imageUrl = stringValue(heroContent, "imageUrl");
    const imageAlt = stringValue(heroContent, "imageAlt");
    if (imageUrl.trim() && !isSafeImageUrl(imageUrl.trim())) {
      setError("Use an uploaded image path or a full HTTP(S) image URL.");
      return;
    }
    if (hero.isVisible) {
      if (!hero.title.trim() || !hero.subtitle.trim() || !stringValue(heroContent, "eyebrow").trim() || !stringValue(heroContent, "primaryCtaLabel").trim()) {
        setError("For a published Hero, complete the eyebrow, title, introduction, and primary action label.");
        return;
      }
      if (imageUrl.trim() && !imageAlt.trim()) {
        setError("Add useful alt text for the hero image, or remove the image.");
        return;
      }
    }
    if (highlightsSection.isVisible) {
      if (!highlightsSection.title.trim() || !highlightsSection.subtitle.trim() || !stringValue(highlightsContent, "eyebrow").trim()) {
        setError("For published Quick Course Highlights, complete the label, heading, and introduction.");
        return;
      }
      if (!items.some((item) => item.isVisible)) {
        setError("Publish at least one highlight item, or hide the Quick Course Highlights section.");
        return;
      }
    }
    for (const item of items) {
      if (!item.category.trim() || !item.title.trim() || !item.description.trim()) {
        setError(`Complete or remove the highlight “${item.title || "New highlight"}”.`);
        return;
      }
    }
    if (curriculum.isVisible && (!curriculum.title.trim() || !curriculum.subtitle.trim() || !stringValue(curriculum.content, "eyebrow").trim())) {
      setError("For a published Curriculum, complete the section label, heading, and introduction.");
      return;
    }
    for (const subject of subjects) {
      if (!subject.title.trim() || !subject.description.trim()) {
        setError(`Complete or remove the subject “${subject.title || "New subject"}”.`);
        return;
      }
    }

    setSaving(true);
    try {
      await updateSection.mutateAsync({
        id: heroSource.id,
        data: { title: hero.title.trim(), subtitle: hero.subtitle.trim() || null, content: hero.content, isVisible: hero.isVisible },
      });
      await updateSection.mutateAsync({
        id: highlightsSource.id,
        data: { title: highlightsSection.title.trim(), subtitle: highlightsSection.subtitle.trim() || null, content: highlightsSection.content, isVisible: highlightsSection.isVisible },
      });
      await updateSection.mutateAsync({
        id: curriculumSource.id,
        data: { title: curriculum.title.trim(), subtitle: curriculum.subtitle.trim() || null, content: curriculum.content, isVisible: curriculum.isVisible },
      });

      const savedItemIds = new Set(items.flatMap((item) => item.id ? [item.id] : []));
      for (const existing of currentPage.items) {
        if (existing.sectionId === highlightsSource.id && existing.itemType === "course-highlight" && !savedItemIds.has(existing.id)) {
          await deleteItem.mutateAsync({ id: existing.id });
        }
      }
      for (const [position, item] of items.entries()) {
        const input: ContentItemInput = {
          sectionId: highlightsSource.id,
          itemType: "course-highlight",
          title: item.title.trim(),
          description: item.description.trim(),
          imageUrl: null,
          linkPath: null,
          label: null,
          content: { category: item.category.trim() },
          isVisible: item.isVisible,
          position,
        };
        if (item.id) {
          await updateItemMutation.mutateAsync({ id: item.id, data: input });
        } else {
          await createItem.mutateAsync({ data: input });
        }
      }
      const savedSubjectIds = new Set(subjects.flatMap((subject) => subject.id ? [subject.id] : []));
      for (const existing of currentPage.items) {
        if (existing.sectionId === curriculumSource.id && existing.itemType === "course-curriculum-subject" && !savedSubjectIds.has(existing.id)) {
          await deleteItem.mutateAsync({ id: existing.id });
        }
      }
      for (const [position, subject] of subjects.entries()) {
        const input: ContentItemInput = {
          sectionId: curriculumSource.id,
          itemType: "course-curriculum-subject",
          title: subject.title.trim(),
          description: subject.description.trim(),
          imageUrl: null,
          linkPath: null,
          label: null,
          content: { topics: subject.topics.map((topic) => topic.trim()).filter(Boolean) },
          isVisible: subject.isVisible,
          position,
        };
        if (subject.id) await updateItemMutation.mutateAsync({ id: subject.id, data: input });
        else await createItem.mutateAsync({ data: input });
      }
      await client.invalidateQueries({ queryKey: getGetAdminCmsPageQueryKey("courses") });
      await client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("courses") });
      onFlash({ tone: "success", message: `${course.name} course page saved.` });
    } catch (failure) {
      setError(errorMessage(failure));
      await client.invalidateQueries({ queryKey: getGetAdminCmsPageQueryKey("courses") });
      await client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("courses") });
    } finally {
      setSaving(false);
    }
  };

  if (page.isLoading) {
    return <div className="space-y-6"><CoursePathwaySelector course={course} onCourseChange={onCourseChange} /><div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500" aria-busy="true" data-testid={`status-admin-course-${course.slug}-loading`}>Loading {course.name} course content…</div></div>;
  }
  if (page.isError || !page.data || !heroSource || !highlightsSource || !curriculumSource) {
    return <div className="space-y-6"><CoursePathwaySelector course={course} onCourseChange={onCourseChange} /><div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700" role="alert" data-testid={`status-admin-course-${course.slug}-error`}>The saved course sections are unavailable. Restart the site content service and reload this page.</div></div>;
  }
  if (!hero || !highlightsSection || !curriculum || hydratedCourse !== course.slug) {
    return <div className="space-y-6"><CoursePathwaySelector course={course} onCourseChange={onCourseChange} /><div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500" aria-busy="true" data-testid={`status-admin-course-${course.slug}-loading`}>Loading {course.name} course content…</div></div>;
  }

  const facultyPreviewContent = recordValue(curriculum.content.courseFacultyPreview);
  const galleryPreviewContent = recordValue(curriculum.content.courseGalleryPreview);
  const gallerySectionContent = recordValue(gallerySection?.content);
  const defaultGalleryTitle =
    stringValue(gallerySectionContent, "headline") ||
    gallerySection?.title ||
    "Gallery Preview";
  const defaultGalleryDescription =
    stringValue(gallerySectionContent, "description") ||
    gallerySection?.subtitle ||
    "";

  return (
    <div className="space-y-6">
    <CoursePathwaySelector course={course} onCourseChange={onCourseChange} />
    <form onSubmit={(event) => void save(event)} className="space-y-6" data-testid={`form-admin-course-${course.slug}`}>
      {course.slug === "integrated" ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950" role="status" data-testid="notice-integrated-course-draft">
          The project has no verified Integrated course description yet. This page starts unpublished; add confirmed course details before publishing either section.
        </div>
      ) : null}

      <Panel id={courseSectionKey(course.slug, "hero")} eyebrow={`${course.name} / Section 1`} title="Hero" testId={`panel-admin-course-${course.slug}-hero`}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Section label" value={stringValue(recordValue(hero.content), "eyebrow")} onChange={(value) => patchSectionContent("hero", "eyebrow", value)} testId={`input-course-${course.slug}-hero-eyebrow`} />
          <Field label="Course title" value={hero.title} onChange={(value) => setHero((current) => current ? { ...current, title: value } : current)} testId={`input-course-${course.slug}-hero-title`} />
          <div className="md:col-span-2"><Field label="Introduction" value={hero.subtitle} onChange={(value) => setHero((current) => current ? { ...current, subtitle: value } : current)} multiline testId={`textarea-course-${course.slug}-hero-introduction`} hint="Use verified course information. Leave this blank while unpublished if details have not been confirmed." /></div>
          <Field label="Optional status label" value={stringValue(recordValue(hero.content), "statusLabel")} onChange={(value) => patchSectionContent("hero", "statusLabel", value)} testId={`input-course-${course.slug}-hero-status`} hint="Leave blank unless the status is confirmed and current." />
          <Field label="Duration (optional)" value={stringValue(recordValue(hero.content), "duration")} onChange={(value) => patchSectionContent("hero", "duration", value)} testId={`input-course-${course.slug}-hero-duration`} />
          <Field label="Study mode (optional)" value={stringValue(recordValue(hero.content), "studyMode")} onChange={(value) => patchSectionContent("hero", "studyMode", value)} testId={`input-course-${course.slug}-hero-study-mode`} />
          <Field label="Primary action label" value={stringValue(recordValue(hero.content), "primaryCtaLabel")} onChange={(value) => patchSectionContent("hero", "primaryCtaLabel", value)} testId={`input-course-${course.slug}-hero-primary-cta`} hint="The button uses the existing college enquiry page." />
          <Field label="Secondary action label" value={stringValue(recordValue(hero.content), "secondaryCtaLabel")} onChange={(value) => patchSectionContent("hero", "secondaryCtaLabel", value)} testId={`input-course-${course.slug}-hero-secondary-cta`} hint="The button returns visitors to the existing Courses overview." />
          <div className="md:col-span-2">
            <ImageEditor
              course={course}
              imageUrl={stringValue(recordValue(hero.content), "imageUrl")}
              imageAlt={stringValue(recordValue(hero.content), "imageAlt")}
              onChange={(key, value) => patchSectionContent("hero", key, value)}
              upload={upload}
            />
          </div>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <SectionToggle label="Publish Hero" checked={hero.isVisible} onChange={(value) => setHero((current) => current ? { ...current, isVisible: value } : current)} testId={`checkbox-course-${course.slug}-hero-visible`} />
        </div>
      </Panel>

      <Panel id={courseSectionKey(course.slug, "highlights")} eyebrow={`${course.name} / Section 2`} title="Quick Course Highlights" testId={`panel-admin-course-${course.slug}-highlights`}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Section label" value={stringValue(recordValue(highlightsSection.content), "eyebrow")} onChange={(value) => patchSectionContent("highlights", "eyebrow", value)} testId={`input-course-${course.slug}-highlights-eyebrow`} />
          <Field label="Section heading" value={highlightsSection.title} onChange={(value) => setHighlightsSection((current) => current ? { ...current, title: value } : current)} testId={`input-course-${course.slug}-highlights-title`} />
          <div className="md:col-span-2"><Field label="Introduction" value={highlightsSection.subtitle} onChange={(value) => setHighlightsSection((current) => current ? { ...current, subtitle: value } : current)} multiline testId={`textarea-course-${course.slug}-highlights-introduction`} /></div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">{items.length} highlight{items.length === 1 ? "" : "s"} · reorder to set the public display order</p>
          <button type="button" onClick={() => setItems((current) => [...current, { clientKey: newId(), category: "", title: "", description: "", isVisible: false }])} className="inline-flex items-center gap-2 rounded-lg border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#f4f7fb]" data-testid={`button-add-course-${course.slug}-highlight`}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add highlight
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {items.length ? items.map((item, index) => (
            <HighlightRow
              key={item.clientKey}
              entry={item}
              index={index}
              count={items.length}
              onChange={updateHighlightDraft}
              onMove={(direction) => moveItem(index, direction)}
              onDelete={() => setItems((current) => current.filter((candidate) => candidate.clientKey !== item.clientKey))}
            />
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
              No highlights yet. Add verified course details before publishing this section.
            </div>
          )}
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <SectionToggle label="Publish Quick Course Highlights" checked={highlightsSection.isVisible} onChange={(value) => setHighlightsSection((current) => current ? { ...current, isVisible: value } : current)} testId={`checkbox-course-${course.slug}-highlights-visible`} />
        </div>
      </Panel>

      <Panel id={courseSectionKey(course.slug, "faculty-preview")} eyebrow={`${course.name} / Section 3`} title="Faculty Preview" testId={`panel-admin-course-${course.slug}-faculty-preview`}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Eyebrow text"
            value={stringValue(facultyPreviewContent, "eyebrow") || "FACULTY PREVIEW"}
            onChange={(value) => patchCoursePreviewContent("courseFacultyPreview", "eyebrow", value)}
            testId={`input-course-${course.slug}-faculty-preview-eyebrow`}
          />
          <Field
            label="Section heading"
            value={stringValue(facultyPreviewContent, "title") || "Meet your course mentors"}
            onChange={(value) => patchCoursePreviewContent("courseFacultyPreview", "title", value)}
            testId={`input-course-${course.slug}-faculty-preview-title`}
          />
          <div className="md:col-span-2">
            <Field
              label="Introduction"
              value={stringValue(facultyPreviewContent, "description") || `Faculty selected for the subjects and exam pathway in ${course.name}.`}
              onChange={(value) => patchCoursePreviewContent("courseFacultyPreview", "description", value)}
              multiline
              testId={`textarea-course-${course.slug}-faculty-preview-description`}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-slate-600">
            Faculty profiles, eligibility, and subject matches are managed in Faculty settings.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("faculty")}
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#0b3472]/20 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:bg-[#f4f7fb]"
            data-testid={`button-course-${course.slug}-manage-faculty`}
          >
            Manage Faculty Profiles
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {facultyPage.isLoading ? (
          <div className="mt-4 h-20 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />
        ) : facultyPage.isError ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm font-semibold text-red-800">Faculty profiles could not be loaded.</p>
            <button type="button" onClick={() => void facultyPage.refetch()} className="rounded-lg bg-[#0b3472] px-3 py-2 text-xs font-bold text-white">Try again</button>
          </div>
        ) : courseMentors.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {courseMentors.map((mentor) => {
              const content = recordValue(mentor.content);
              const assignedSubjects = Array.isArray(content.courseMentorSubjects)
                ? content.courseMentorSubjects.filter(
                    (subject): subject is string => typeof subject === "string",
                  )
                : [];
              const matchingLabels = assignedSubjects
                .filter((subject) => courseMentorSubjects.has(subject))
                .map((subject) => mentorSubjectLabels.get(subject))
                .filter((label): label is string => Boolean(label));
              return (
                <article key={mentor.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid={`row-course-faculty-preview-${mentor.id}`}>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#e7edf5]">
                    {mentor.imageUrl ? (
                      <img src={mentor.imageUrl.startsWith("/objects/") ? `/api/storage${mentor.imageUrl}` : mentor.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-xl font-extrabold text-[#0b3472]/40">{mentor.title.charAt(0)}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0b3472]">{mentor.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{stringValue(content, "professionalTitle") || "Faculty member"}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">{matchingLabels.join(" · ")}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
            <p className="font-semibold text-[#0b3472]">No faculty profiles match this pathway yet.</p>
            <p className="mt-1 text-sm text-slate-500">Enable course mentor eligibility and choose matching subjects in Faculty settings.</p>
          </div>
        )}
      </Panel>

      <Panel id={`course-${course.slug}-curriculum`} eyebrow={`${course.name} / Section 4`} title="Curriculum" testId={`panel-admin-course-${course.slug}-curriculum`}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Section label" value={stringValue(curriculum.content, "eyebrow")} onChange={(value) => patchCurriculumContent("eyebrow", value)} testId={`input-course-${course.slug}-curriculum-eyebrow`} />
          <Field label="Section heading" value={curriculum.title} onChange={(value) => setCurriculum((current) => current ? { ...current, title: value } : current)} testId={`input-course-${course.slug}-curriculum-title`} />
          <div className="md:col-span-2"><Field label="Introduction" value={curriculum.subtitle} onChange={(value) => setCurriculum((current) => current ? { ...current, subtitle: value } : current)} multiline testId={`textarea-course-${course.slug}-curriculum-introduction`} /></div>
          <Field label="Guide heading" value={stringValue(curriculum.content, "downloadHeading")} onChange={(value) => patchCurriculumContent("downloadHeading", value)} testId={`input-course-${course.slug}-curriculum-download-heading`} />
          <Field label="Guide description" value={stringValue(curriculum.content, "downloadDescription")} onChange={(value) => patchCurriculumContent("downloadDescription", value)} testId={`input-course-${course.slug}-curriculum-download-description`} />
          <Field label="Download button label" value={stringValue(curriculum.content, "downloadButtonLabel")} onChange={(value) => patchCurriculumContent("downloadButtonLabel", value)} testId={`input-course-${course.slug}-curriculum-download-label`} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="inline-flex h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-[#0b3472]/15 bg-white px-4 text-sm font-bold text-[#0b3472]">
              <Upload className="h-4 w-4" aria-hidden="true" /> {uploadsInProgress ? "Uploading PDF…" : "Upload / replace PDF"}
              <input type="file" accept=".pdf,application/pdf" className="sr-only" disabled={uploadsInProgress > 0} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadPdf(file); event.currentTarget.value = ""; }} data-testid={`input-course-${course.slug}-curriculum-pdf`} />
            </label>
            {stringValue(curriculum.content, "pdfPath") ? (
              <button type="button" onClick={() => { patchCurriculumContent("pdfPath", ""); patchCurriculumContent("pdfFileName", ""); }} className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-700" data-testid={`button-remove-course-${course.slug}-curriculum-pdf`}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove PDF
              </button>
            ) : <span className="pb-3 text-xs text-slate-500">No guide attached</span>}
          </div>
          <p className="md:col-span-2 -mt-2 text-xs text-slate-500">{stringValue(curriculum.content, "pdfFileName") || "PDF not selected"}</p>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <SectionToggle label="Publish Curriculum section" checked={curriculum.isVisible} onChange={(value) => setCurriculum((current) => current ? { ...current, isVisible: value } : current)} testId={`checkbox-course-${course.slug}-curriculum-visible`} />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">{subjects.length} subject{subjects.length === 1 ? "" : "s"} · reorder to change public sequence</p>
          <button type="button" onClick={() => setSubjects((current) => [...current, { clientKey: newCurriculumId(), title: "", description: "", topics: [], isVisible: false }])} className="inline-flex items-center gap-2 rounded-lg border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472]" data-testid={`button-add-course-${course.slug}-curriculum-subject`}><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add subject</button>
        </div>
        <div className="mt-4 space-y-3">
          {subjects.map((subject, index) => (
            <article key={subject.clientKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4" data-testid={`row-course-${course.slug}-curriculum-subject-${subject.clientKey}`}>
              <div className="mb-4 flex items-center gap-2">
                <span className="min-w-0 flex-1 text-xs font-bold uppercase tracking-wider text-slate-500">Subject {String(index + 1).padStart(2, "0")} · {subject.isVisible ? "Published" : "Hidden"}</span>
                <button type="button" disabled={index === 0} onClick={() => moveSubject(index, -1)} className="rounded-lg p-2 text-slate-600 disabled:opacity-30" aria-label={`Move ${subject.title || "subject"} up`} data-testid={`button-move-curriculum-subject-up-${subject.clientKey}`}><ArrowUp className="h-4 w-4" /></button>
                <button type="button" disabled={index === subjects.length - 1} onClick={() => moveSubject(index, 1)} className="rounded-lg p-2 text-slate-600 disabled:opacity-30" aria-label={`Move ${subject.title || "subject"} down`} data-testid={`button-move-curriculum-subject-down-${subject.clientKey}`}><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => setSubjects((current) => current.map((entry) => entry.clientKey === subject.clientKey ? { ...entry, isVisible: !entry.isVisible } : entry))} className="rounded-lg p-2 text-slate-600" aria-label={`${subject.isVisible ? "Hide" : "Publish"} ${subject.title || "subject"}`} data-testid={`button-toggle-curriculum-subject-${subject.clientKey}`}>{subject.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                <button type="button" onClick={() => setSubjects((current) => current.filter((entry) => entry.clientKey !== subject.clientKey))} className="rounded-lg p-2 text-red-700" aria-label={`Delete ${subject.title || "subject"}`} data-testid={`button-delete-curriculum-subject-${subject.clientKey}`}><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Subject name" value={subject.title} onChange={(value) => setSubjects((current) => current.map((entry) => entry.clientKey === subject.clientKey ? { ...entry, title: value } : entry))} testId={`input-curriculum-subject-title-${subject.clientKey}`} />
                <Field label="Short summary" value={subject.description} onChange={(value) => setSubjects((current) => current.map((entry) => entry.clientKey === subject.clientKey ? { ...entry, description: value } : entry))} testId={`input-curriculum-subject-summary-${subject.clientKey}`} />
                <div className="md:col-span-2"><Field label="Topics (one per line)" value={subject.topics.join("\n")} onChange={(value) => setSubjects((current) => current.map((entry) => entry.clientKey === subject.clientKey ? { ...entry, topics: value.split("\n") } : entry))} multiline testId={`textarea-curriculum-subject-topics-${subject.clientKey}`} hint="List the key concepts covered in this subject." /></div>
              </div>
            </article>
          ))}
          {!subjects.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center text-sm text-slate-500">No subjects have been added to this curriculum.</div> : null}
        </div>
        <div className="mt-5 rounded-xl border border-[#0b3472]/10 bg-[#f7f9fc] p-4">
          <p className="eyebrow text-[#0b3472]">Built for competitive success</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">The public benefits panel is fixed: Comprehensive Syllabus, Exam-Oriented Focus, Structured Progression, and Regular Updates.</p>
        </div>
      </Panel>

      <Panel
        id={courseSectionKey(course.slug, "gallery-preview")}
        eyebrow={`${course.name} / Section 5`}
        title="Gallery Preview"
        testId={`panel-admin-course-${course.slug}-gallery-preview`}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Eyebrow text"
            value={stringValue(galleryPreviewContent, "eyebrow") || "GALLERY PREVIEW"}
            onChange={(value) => patchCoursePreviewContent("courseGalleryPreview", "eyebrow", value)}
            testId={`input-course-${course.slug}-gallery-preview-eyebrow`}
          />
          <Field
            label="Section heading"
            value={stringValue(galleryPreviewContent, "title")}
            onChange={(value) => patchCoursePreviewContent("courseGalleryPreview", "title", value)}
            placeholder={defaultGalleryTitle}
            testId={`input-course-${course.slug}-gallery-preview-title`}
          />
          <div className="md:col-span-2">
            <Field
              label="Introduction"
              value={stringValue(galleryPreviewContent, "description") || defaultGalleryDescription}
              onChange={(value) => patchCoursePreviewContent("courseGalleryPreview", "description", value)}
              multiline
              testId={`textarea-course-${course.slug}-gallery-preview-description`}
            />
          </div>
          <Field
            label="Gallery button label"
            value={stringValue(galleryPreviewContent, "ctaLabel") || "View Gallery"}
            onChange={(value) => patchCoursePreviewContent("courseGalleryPreview", "ctaLabel", value)}
            testId={`input-course-${course.slug}-gallery-preview-cta`}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onNavigate("gallery")}
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#0b3472]/20 bg-white px-4 py-2.5 text-sm font-bold text-[#0b3472] transition hover:bg-[#f4f7fb]"
            data-testid={`button-course-${course.slug}-manage-gallery`}
          >
            Manage Gallery Images
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert" data-testid={`error-admin-course-${course.slug}`}>{error}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/courses/${course.slug}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#0b3472] underline underline-offset-4" data-testid={`link-preview-course-${course.slug}`}>
          Preview {course.name} page
        </Link>
        <button type="submit" disabled={saving || uploadsInProgress > 0 || updateSection.isPending || createItem.isPending || updateItemMutation.isPending || deleteItem.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white disabled:opacity-50" data-testid={`button-save-course-${course.slug}`}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {uploadsInProgress ? "Wait for upload…" : saving ? "Saving course page…" : "Save course page"}
        </button>
      </div>
    </form>
    </div>
  );
}