import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  getGetAdminCmsPageQueryKey,
  getGetCmsPageQueryKey,
  useCreateContentItem,
  useCreateContentSection,
  useDeleteContentItem,
  useGetAdminCmsPage,
  useUpdateContentItem,
  useUpdateContentSection,
} from "@workspace/api-client-react";
import type {
  ContentItem,
  ContentSection,
  ContentItemInput,
} from "@workspace/api-client-react";

type CmsRecord = Record<string, unknown>;

export type AboutCollectionConfig = {
  sectionKey: "institutional-strengths" | "core-values";
  itemType: "institutional-strength" | "core-value";
  label: string;
  position: number;
  defaultEyebrow: string;
  defaultTitle: string;
  defaultSubtitle: string;
  supportsIcons: boolean;
};

export type AboutCollectionFlash = {
  tone: "success" | "error";
  message: string;
};

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown): string {
  const candidate = error as { message?: string; response?: { status?: number }; status?: number };
  if (candidate?.response?.status === 403 || candidate?.status === 403) {
    return "Your account is signed in, but it is not on the staff allowlist.";
  }
  return candidate?.message || "The change could not be saved. Please try again.";
}

function invalidateAbout(client: ReturnType<typeof useQueryClient>) {
  void Promise.all([
    client.invalidateQueries({ queryKey: getGetAdminCmsPageQueryKey("about") }),
    client.invalidateQueries({ queryKey: getGetCmsPageQueryKey("about") }),
  ]);
}

function Input({
  label,
  value,
  onChange,
  testId,
  multiline = false,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  const className =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10";
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          rows={3}
          required={required}
          placeholder={placeholder}
          className={`${className} resize-y leading-6`}
          data-testid={testId}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          required={required}
          placeholder={placeholder}
          className={className}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function ItemForm({
  config,
  section,
  initial,
  position,
  onFlash,
  onClose,
}: {
  config: AboutCollectionConfig;
  section: ContentSection;
  initial?: ContentItem;
  position: number;
  onFlash: (flash: AboutCollectionFlash) => void;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const create = useCreateContentItem();
  const update = useUpdateContentItem();
  const existingContent = record(initial?.content);
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [icon, setIcon] = useState(text(existingContent.icon));
  const [isVisible, setIsVisible] = useState(initial?.isVisible ?? false);
  const [error, setError] = useState("");
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    const content = record(initial?.content);
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setIcon(text(content.icon));
    setIsVisible(initial?.isVisible ?? false);
    setError("");
  }, [initial?.id, initial?.updatedAt]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Add a title before saving this item.");
      return;
    }
    setError("");
    const content: CmsRecord = { ...existingContent };
    if (config.supportsIcons) {
      if (icon.trim()) content.icon = icon.trim();
      else delete content.icon;
    }
    const data: ContentItemInput = {
      sectionId: section.id,
      itemType: config.itemType,
      title: cleanTitle,
      description: description.trim() || null,
      imageUrl: initial?.imageUrl || null,
      linkPath: initial?.linkPath || null,
      label: initial?.label || null,
      content,
      isVisible,
      position: initial?.position ?? position,
    };
    const options = {
      onSuccess: () => {
        invalidateAbout(client);
        onFlash({
          tone: "success",
          message: initial ? `${config.label} item saved.` : `${config.label} item added.`,
        });
        onClose();
      },
      onError: (failure: unknown) => setError(errorMessage(failure)),
    };
    if (initial) update.mutate({ id: initial.id, data }, options);
    else create.mutate({ data }, options);
  };

  return (
    <form
      onSubmit={save}
      className="mt-4 rounded-2xl border border-[#0b3472]/15 bg-[#f5f8fc] p-4 sm:p-5"
      data-testid={`form-about-collection-item-${initial?.id || "new"}`}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Title"
          value={title}
          onChange={setTitle}
          required
          testId={`input-about-collection-item-title-${initial?.id || "new"}`}
        />
        <Input
          label="Short description"
          value={description}
          onChange={setDescription}
          multiline
          testId={`textarea-about-collection-item-description-${initial?.id || "new"}`}
        />
        {config.supportsIcons ? (
          <label className="block text-sm font-bold text-slate-700">
            Icon name
            <select
              value={icon}
              onChange={(event) => setIcon(event.currentTarget.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0b3472]/50 focus:ring-4 focus:ring-[#0b3472]/10"
              data-testid={`select-about-collection-item-icon-${initial?.id || "new"}`}
            >
              <option value="">No icon</option>
              <option value="book-open">Book</option>
              <option value="briefcase">Briefcase</option>
              <option value="clock">Clock</option>
              <option value="compass">Compass</option>
              <option value="graduation">Graduation</option>
              <option value="heart-handshake">Handshake</option>
              <option value="landmark">Landmark</option>
              <option value="lightbulb">Lightbulb</option>
              <option value="shield">Shield</option>
              <option value="sparkles">Sparkles</option>
              <option value="target">Target</option>
              <option value="users">Users</option>
            </select>
          </label>
        ) : null}
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(event) => setIsVisible(event.currentTarget.checked)}
            className="mt-0.5 h-4 w-4 accent-[#0b3472]"
            data-testid={`checkbox-about-collection-item-visible-${initial?.id || "new"}`}
          />
          <span>
            Show on the public About page
            <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
              Keep this off while the item is still being reviewed.
            </span>
          </span>
        </label>
      </div>
      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700" role="alert" data-testid={`error-about-collection-item-${initial?.id || "new"}`}>
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200/70"
          data-testid={`button-cancel-about-collection-item-${initial?.id || "new"}`}
        >
          <X className="h-4 w-4" aria-hidden="true" /> Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-4 py-2 text-sm font-bold text-white hover:bg-[#082859] disabled:opacity-50"
          data-testid={`button-save-about-collection-item-${initial?.id || "new"}`}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {pending ? "Saving…" : "Save item"}
        </button>
      </div>
    </form>
  );
}

export default function AdminAboutCollectionEditor({
  config,
  onFlash,
}: {
  config: AboutCollectionConfig;
  onFlash: (flash: AboutCollectionFlash) => void;
}) {
  const client = useQueryClient();
  const about = useGetAdminCmsPage("about", {
    query: { queryKey: getGetAdminCmsPageQueryKey("about") },
  });
  const createSection = useCreateContentSection();
  const updateSection = useUpdateContentSection();
  const updateItem = useUpdateContentItem();
  const deleteItem = useDeleteContentItem();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [eyebrow, setEyebrow] = useState(config.defaultEyebrow);
  const [title, setTitle] = useState(config.defaultTitle);
  const [subtitle, setSubtitle] = useState(config.defaultSubtitle);
  const [sectionError, setSectionError] = useState("");

  const section = about.data?.sections.find(
    (candidate) => candidate.sectionKey === config.sectionKey,
  );
  const items = useMemo(
    () =>
      (about.data?.items || [])
        .filter(
          (item) =>
            item.sectionId === section?.id && item.itemType === config.itemType,
        )
        .sort((first, second) => first.position - second.position),
    [about.data?.items, config.itemType, section?.id],
  );
  const pending =
    createSection.isPending || updateSection.isPending || updateItem.isPending || deleteItem.isPending;

  useEffect(() => {
    if (!section) return;
    setEyebrow(text(record(section.content).eyebrow));
    setTitle(section.title);
    setSubtitle(section.subtitle || "");
  }, [section?.id, section?.updatedAt]);

  const addSection = async () => {
    setSectionError("");
    try {
      await createSection.mutateAsync({
        data: {
          pageSlug: "about",
          sectionKey: config.sectionKey,
          title: config.defaultTitle,
          subtitle: config.defaultSubtitle || null,
          content: { eyebrow: config.defaultEyebrow },
          isVisible: false,
          position: config.position,
        },
      });
      invalidateAbout(client);
      onFlash({
        tone: "success",
        message: `${config.label} section added as an unpublished draft. No items were added.`,
      });
    } catch (failure) {
      setSectionError(errorMessage(failure));
    }
  };

  const saveSection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!section) return;
    if (!title.trim()) {
      setSectionError("Add a section title before saving.");
      return;
    }
    setSectionError("");
    try {
      await updateSection.mutateAsync({
        id: section.id,
        data: {
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: { ...record(section.content), eyebrow: eyebrow.trim() },
        },
      });
      invalidateAbout(client);
      onFlash({ tone: "success", message: `${config.label} section saved.` });
    } catch (failure) {
      setSectionError(errorMessage(failure));
    }
  };

  const toggleSection = () => {
    if (!section) return;
    updateSection.mutate(
      { id: section.id, data: { isVisible: !section.isVisible } },
      {
        onSuccess: () => {
          invalidateAbout(client);
          onFlash({
            tone: "success",
            message: section.isVisible
              ? `${config.label} section hidden from the public About page.`
              : `${config.label} section is now visible on the public About page.`,
          });
        },
        onError: (failure) => onFlash({ tone: "error", message: errorMessage(failure) }),
      },
    );
  };

  const toggleItem = (item: ContentItem) => {
    updateItem.mutate(
      { id: item.id, data: { isVisible: !item.isVisible } },
      {
        onSuccess: () => {
          invalidateAbout(client);
          onFlash({
            tone: "success",
            message: item.isVisible ? "Item hidden from the public page." : "Item shown on the public page.",
          });
        },
        onError: (failure) => onFlash({ tone: "error", message: errorMessage(failure) }),
      },
    );
  };

  const moveItem = async (item: ContentItem, direction: -1 | 1) => {
    const index = items.findIndex((candidate) => candidate.id === item.id);
    const target = items[index + direction];
    if (!target) return;
    try {
      await Promise.all([
        updateItem.mutateAsync({ id: item.id, data: { position: target.position } }),
        updateItem.mutateAsync({ id: target.id, data: { position: item.position } }),
      ]);
      invalidateAbout(client);
      onFlash({ tone: "success", message: "Item order saved." });
    } catch (failure) {
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };

  const removeItem = async (item: ContentItem) => {
    if (!window.confirm(`Delete “${item.title}” from this collection?`)) return;
    try {
      await deleteItem.mutateAsync({ id: item.id });
      invalidateAbout(client);
      onFlash({ tone: "success", message: "Item deleted." });
    } catch (failure) {
      onFlash({ tone: "error", message: errorMessage(failure) });
    }
  };

  if (about.isLoading) {
    return (
      <div
        className="mt-6 h-96 animate-pulse rounded-3xl bg-white"
        aria-busy="true"
        data-testid={`loading-admin-about-${config.sectionKey}`}
      />
    );
  }

  if (about.isError || !about.data) {
    return (
      <section
        className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6"
        role="alert"
        data-testid={`error-admin-about-${config.sectionKey}`}
      >
        <p className="font-bold text-red-800">About sections could not be loaded.</p>
        <button
          type="button"
          onClick={() => void about.refetch()}
          className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-red-800"
          data-testid={`button-retry-admin-about-${config.sectionKey}`}
        >
          Try again
        </button>
      </section>
    );
  }

  if (!section) {
    return (
      <section
        className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-8"
        data-testid={`missing-admin-about-${config.sectionKey}`}
      >
        <p className="eyebrow text-[#e3212b]">About collection</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0b3472]">
          {config.label} is not in the current page
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Add an unpublished draft to begin rebuilding this section. It will not create any collection items.
        </p>
        <button
          type="button"
          onClick={() => void addSection()}
          disabled={pending}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white hover:bg-[#082859] disabled:opacity-50"
          data-testid={`button-add-about-${config.sectionKey}`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add {config.label} draft
        </button>
        {sectionError ? (
          <p className="mt-4 text-sm font-semibold text-red-700" role="alert" data-testid={`error-add-about-${config.sectionKey}`}>
            {sectionError}
          </p>
        ) : null}
      </section>
    );
  }

  const nextPosition = items.length ? Math.max(...items.map((item) => item.position)) + 1 : 0;

  return (
    <div className="mt-6 space-y-6" data-testid={`admin-about-collection-${config.sectionKey}`}>
      <form
        onSubmit={saveSection}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[#e3212b]">About collection</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
              {config.label} section
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Shape the introduction and decide whether this collection is visible to families.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleSection}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-[#0b3472] hover:bg-slate-50 disabled:opacity-50"
            data-testid={`button-toggle-about-section-${config.sectionKey}`}
          >
            {section.isVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            {section.isVisible ? "Hide section" : "Publish section"}
          </button>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Input label="Eyebrow" value={eyebrow} onChange={setEyebrow} testId={`input-about-${config.sectionKey}-eyebrow`} />
          <Input label="Title" value={title} onChange={setTitle} required testId={`input-about-${config.sectionKey}-title`} />
          <div className="md:col-span-2">
            <Input label="Subtitle" value={subtitle} onChange={setSubtitle} multiline testId={`textarea-about-${config.sectionKey}-subtitle`} />
          </div>
        </div>
        {sectionError ? (
          <p className="mt-4 text-sm font-semibold text-red-700" role="alert" data-testid={`error-about-${config.sectionKey}`}>
            {sectionError}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b3472] px-5 py-3 text-sm font-bold text-white hover:bg-[#082859] disabled:opacity-50"
            data-testid={`button-save-about-${config.sectionKey}`}
          >
            <Save className="h-4 w-4" aria-hidden="true" /> {pending ? "Saving…" : "Save section"}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(11,52,114,.045)] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[#e3212b]">Collection items</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0b3472]">
              {items.length ? `${items.length} ${config.label.toLowerCase()} items` : `No ${config.label.toLowerCase()} items yet`}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Add, revise, arrange, or hide each item independently.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((current) => (current === "new" ? null : "new"))}
            aria-expanded={editing === "new"}
            className="inline-flex items-center gap-2 rounded-xl border border-[#0b3472]/15 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0b3472] hover:bg-[#0b3472]/5"
            data-testid={`button-add-about-${config.itemType}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> {editing === "new" ? "Close form" : `Add ${config.label.toLowerCase()}`}
          </button>
        </div>

        {editing === "new" ? (
          <ItemForm
            key="new-item"
            config={config}
            section={section}
            position={nextPosition}
            onFlash={onFlash}
            onClose={() => setEditing(null)}
          />
        ) : null}

        {items.length ? (
          <div className="mt-6 space-y-3">
            {items.map((item, index) => (
              <article
                key={item.id}
                className={`rounded-2xl border border-slate-200 p-4 ${item.isVisible ? "bg-white" : "bg-slate-50"}`}
                data-testid={`row-about-${config.itemType}-${item.id}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#0b3472]" data-testid={`text-admin-about-item-title-${item.id}`}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.isVisible ? "Shown publicly" : "Unpublished"} · position {index + 1}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <button type="button" onClick={() => toggleItem(item)} disabled={pending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`${item.isVisible ? "Hide" : "Show"} ${item.title}`} data-testid={`button-toggle-about-item-${item.id}`}>
                      {item.isVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                    <button type="button" onClick={() => void moveItem(item, -1)} disabled={index === 0 || pending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${item.title} up`} data-testid={`button-move-about-item-up-${item.id}`}>
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => void moveItem(item, 1)} disabled={index === items.length - 1 || pending} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${item.title} down`} data-testid={`button-move-about-item-down-${item.id}`}>
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setEditing((current) => (current === item.id ? null : item.id))} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-[#0b3472] hover:bg-[#0b3472]/5" data-testid={`button-edit-about-item-${item.id}`}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> {editing === item.id ? "Close" : "Edit"}
                    </button>
                    <button type="button" onClick={() => void removeItem(item)} disabled={pending} className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${item.title}`} data-testid={`button-delete-about-item-${item.id}`}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {editing === item.id ? (
                  <ItemForm
                    key={item.id}
                    config={config}
                    section={section}
                    initial={item}
                    position={item.position}
                    onFlash={onFlash}
                    onClose={() => setEditing(null)}
                  />
                ) : null}
              </article>
            ))}
          </div>
        ) : editing !== "new" ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm leading-6 text-slate-500" data-testid={`empty-admin-about-${config.itemType}`}>
            This collection is empty. Add the first item when the copy is ready.
          </div>
        ) : null}
      </section>
    </div>
  );
}