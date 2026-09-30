import { useMemo, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import type { CmsPage, ContentItem, ContentSection } from "@workspace/api-client-react";
import { assetUrl, ProfileModal, profileData } from "@/components/faculty-profile-modal";

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function AboutBoardSection({
  section,
  faculty,
  facultyLoading,
  facultyError,
  onRetryFaculty,
}: {
  section: ContentSection;
  faculty?: CmsPage;
  facultyLoading: boolean;
  facultyError: boolean;
  onRetryFaculty: () => void;
}) {
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const content = record(section.content);
  const eyebrow = textValue(content.eyebrow);
  const members = useMemo(
    () =>
      (faculty?.items ?? [])
        .filter((item) => {
          const itemContent = record(item.content);
          return (
            item.itemType === "faculty-profile" &&
            item.isVisible === true &&
            itemContent.showOnAboutBoard === true
          );
        })
        .sort((a, b) => a.position - b.position),
    [faculty?.items],
  );
  const titleId = `about-board-title-${section.id}`;

  return (
    <>
      <section
        className="site-grid overflow-hidden border-b border-[#0b3472]/10 bg-[#f7f5ef] px-5 py-16 sm:px-8 sm:py-20 lg:py-28"
        aria-labelledby={titleId}
        data-testid={`section-about-board-${section.id}`}
      >
        <div className="mx-auto max-w-7xl">
          <header className="mx-auto max-w-3xl text-center">
            {eyebrow ? (
              <p className="eyebrow text-[#c07823]" data-testid={`text-about-board-eyebrow-${section.id}`}>
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="mt-3 font-display text-[clamp(2.7rem,5.5vw,5.25rem)] font-extrabold leading-[.95] tracking-[-.065em] text-[#0b3472]"
              data-testid={`text-about-board-title-${section.id}`}
            >
              {section.title}
            </h2>
            {section.subtitle ? (
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#52647c] sm:text-lg" data-testid={`text-about-board-subtitle-${section.id}`}>
                {section.subtitle}
              </p>
            ) : null}
          </header>

          {facultyLoading ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" data-testid="status-about-board-loading">
              {[0, 1, 2].map((item) => (
                <div key={item} className="overflow-hidden rounded-[1.5rem] border border-[#0b3472]/10 bg-white">
                  <div className="aspect-[4/3] animate-pulse bg-[#dce5f1]" />
                  <div className="space-y-3 p-6">
                    <div className="h-6 w-3/4 animate-pulse rounded bg-[#e4e0d8]" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-[#efd2ca]" />
                  </div>
                </div>
              ))}
            </div>
          ) : facultyError ? (
            <div className="mx-auto mt-12 max-w-xl rounded-[1.5rem] border border-[#0b3472]/10 bg-white p-8 text-center" role="alert" data-testid="status-about-board-error">
              <p className="eyebrow text-[#e3212b]">Leadership profiles unavailable</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">The leadership profiles could not be loaded, but the rest of the About page remains available.</p>
              <button type="button" onClick={onRetryFaculty} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full bg-[#0b3472] px-5 py-3 text-sm font-bold text-white" data-testid="button-retry-about-board">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            </div>
          ) : members.length ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid={`grid-about-board-${section.id}`}>
              {members.map((member) => {
                const profile = profileData(member);
                const leadershipRole = textValue(record(member.content).leadershipRole) || profile.professionalTitle;
                return (
                  <article key={member.id} className="group overflow-hidden rounded-[1.5rem] border border-[#0b3472]/10 bg-white shadow-[0_12px_30px_rgba(11,52,114,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(11,52,114,.12)]" data-testid={`card-about-board-${member.id}`}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#e7edf5]">
                      {member.imageUrl ? (
                        <img src={assetUrl(member.imageUrl)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" data-testid={`img-about-board-${member.id}`} />
                      ) : (
                        <div className="flex h-full items-center justify-center font-display text-6xl font-extrabold text-[#0b3472]/25" role="img" aria-label={member.title} data-testid={`img-about-board-placeholder-${member.id}`}>
                          {member.title.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b3472]/90 to-transparent px-5 pb-5 pt-16">
                        <p className="font-display text-2xl font-extrabold text-white" data-testid={`text-about-board-name-${member.id}`}>{member.title}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[.1em] text-[#f3b9a7]" data-testid={`text-about-board-role-${member.id}`}>{leadershipRole}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <button type="button" onClick={() => setSelected(member)} className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-[#e3212b]" data-testid={`button-open-about-board-profile-${member.id}`}>
                        View Profile <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto mt-12 max-w-xl rounded-[1.5rem] border border-dashed border-[#0b3472]/20 bg-white px-6 py-14 text-center" data-testid="empty-about-board">
              <h3 className="font-display text-2xl font-extrabold text-[#0b3472]">Leadership profiles are being prepared.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">Please check back soon for the people guiding Shastra Junior College.</p>
            </div>
          )}
        </div>
      </section>
      {selected ? <ProfileModal item={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

export default AboutBoardSection;