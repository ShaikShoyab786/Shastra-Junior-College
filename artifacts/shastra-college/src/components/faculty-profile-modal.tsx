import { useEffect, useRef } from "react";
import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  X,
} from "lucide-react";
import type { ContentItem } from "@workspace/api-client-react";

type RecordValue = Record<string, unknown>;

export type SocialLinks = {
  linkedin: string;
  facebook: string;
  instagram: string;
  website: string;
};

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function assetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`)
    ? `${basePath}${path}`
    : path;
}

export function socialLinks(item: ContentItem): SocialLinks {
  const links = record(item.content.socialLinks);
  return {
    linkedin: text(links.linkedin),
    facebook: text(links.facebook),
    instagram: text(links.instagram),
    website: text(links.website),
  };
}

export function profileData(item: ContentItem) {
  const content = record(item.content);
  const subjects = Array.isArray(content.subjectsTaught)
    ? content.subjectsTaught.filter(
        (subject): subject is string => typeof subject === "string",
      )
    : [];
  return {
    professionalTitle: text(content.professionalTitle, "Faculty member"),
    shortDescription: text(content.shortDescription, item.description || ""),
    qualifications: text(
      content.qualifications,
      "Qualifications available on request",
    ),
    subjectsTaught: subjects,
    experience: text(content.experience),
    biography: text(content.biography, item.description || ""),
    socialLinks: socialLinks(item),
  };
}

function SocialLinks({
  links,
  compact = false,
}: {
  links: SocialLinks;
  compact?: boolean;
}) {
  const entries = [
    { key: "linkedin", label: "LinkedIn", icon: Linkedin },
    { key: "facebook", label: "Facebook", icon: Facebook },
    { key: "instagram", label: "Instagram", icon: Instagram },
    { key: "website", label: "Website", icon: Globe },
  ] as const;
  const visible = entries.filter((entry) => links[entry.key].trim());
  if (!visible.length) return null;

  return (
    <div
      className={`flex flex-wrap gap-2 ${compact ? "mt-3" : "mt-6"}`}
      aria-label="Professional links"
      data-testid="group-faculty-social-links"
    >
      {visible.map(({ key, label, icon: Icon }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#0b3472]/15 bg-white px-3 py-2 text-xs font-bold text-[#0b3472] transition hover:border-[#e3212b] hover:text-[#e3212b]"
          data-testid={`link-faculty-social-${key}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
        </a>
      ))}
    </div>
  );
}

export function ProfileModal({
  item,
  onClose,
}: {
  item: ContentItem;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const profile = profileData(item);

  useEffect(() => {
    lastFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[role="dialog"] button, [role="dialog"] a, [role="dialog"] input, [role="dialog"] textarea, [role="dialog"] select, [role="dialog"] [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => !element.hasAttribute("disabled"));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      lastFocused.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1b35]/65 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="modal-faculty-profile"
    >
      <div
        className="relative grid max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] bg-[#fbfaf6] shadow-[0_24px_80px_rgba(11,52,114,.25)] sm:grid-cols-[.8fr_1.2fr] sm:rounded-[2rem]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`faculty-profile-title-${item.id}`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="focus-ring absolute right-4 top-4 z-10 rounded-full bg-[#f7f5ef] p-3 text-[#0b3472] shadow-sm transition hover:bg-[#e8eef7]"
          aria-label="Close faculty profile"
          data-testid="button-close-faculty-profile"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="relative flex min-h-[270px] items-end overflow-hidden bg-[#e7edf5] sm:min-h-[560px]">
          {item.imageUrl ? (
            <img
              src={assetUrl(item.imageUrl)}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover"
              data-testid={`img-faculty-profile-${item.id}`}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b3472]/75 via-transparent to-transparent" />
          <div className="relative p-6 text-white sm:p-9">
            <p className="eyebrow text-[#f3b9a7]">Faculty profile</p>
            <p className="mt-2 text-sm font-semibold text-white/80">
              {profile.professionalTitle}
            </p>
          </div>
        </div>
        <div className="overflow-y-auto p-6 sm:p-10">
          <h2
            id={`faculty-profile-title-${item.id}`}
            className="max-w-lg font-display text-4xl font-extrabold leading-[.98] tracking-[-.04em] text-[#0b3472] sm:text-5xl"
            data-testid={`text-faculty-profile-name-${item.id}`}
          >
            {item.title}
          </h2>
          <div className="mt-7 grid gap-4 rounded-2xl border border-[#0b3472]/10 bg-white p-5 sm:grid-cols-2">
            <div>
              <p className="eyebrow text-slate-400">Qualifications</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#15243d]">
                {profile.qualifications}
              </p>
            </div>
            <div>
              <p className="eyebrow text-slate-400">Experience</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#15243d]">
                {profile.experience || "Details available from the college office"}
              </p>
            </div>
            {profile.subjectsTaught.length ? (
              <div className="sm:col-span-2">
                <p className="eyebrow text-slate-400">Subjects taught</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.subjectsTaught.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-[#eaf1fb] px-3 py-1.5 text-xs font-bold text-[#0b3472]"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-8">
            <p className="eyebrow text-[#e3212b]">Biography</p>
            <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-600">
              {profile.biography || profile.shortDescription}
            </p>
          </div>
          <SocialLinks links={profile.socialLinks} />
        </div>
      </div>
    </div>
  );
}