import { ArrowLeft, BookOpenText } from "lucide-react";
import { Link, useParams } from "wouter";
import { getGetArticleBySlugQueryKey, useGetArticleBySlug, useGetHomePage } from "@workspace/api-client-react";
import { Footer, Header } from "./public-home";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const imageUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") && basePath && !path.startsWith(`${basePath}/`) ? `${basePath}${path}` : path;
};
const dateLabel = (date?: string | null) => date ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date)) : "";

export default function PublicArticleDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const query = useGetArticleBySlug(slug, { query: { queryKey: getGetArticleBySlugQueryKey(slug) } });
  const home = useGetHomePage();
  if (query.isLoading) return <div className="min-h-[100dvh] bg-[#f5f3eb]"><Header home={home.data} /><main className="min-h-[75dvh] px-5 py-16" aria-busy="true"><div className="mx-auto max-w-4xl"><div className="h-4 w-32 animate-pulse rounded bg-[#ead9bd]" /><div className="mt-7 h-14 max-w-3xl animate-pulse rounded-xl bg-[#dbe4df]" /><div className="mt-6 h-80 animate-pulse rounded-3xl bg-white" /></div></main>{home.data ? <Footer home={home.data} /> : null}</div>;
  if (query.isError || !query.data?.article) return <div className="min-h-[100dvh] bg-[#f5f3eb]"><Header home={home.data} /><main className="flex min-h-[75dvh] items-center justify-center p-6"><div role="alert" className="max-w-md rounded-3xl border border-[#12335a]/10 bg-white p-8 text-center"><BookOpenText className="mx-auto h-8 w-8 text-[#a3473c]" aria-hidden="true" /><h1 className="mt-4 font-display text-2xl font-extrabold text-[#12335a]">This article is unavailable.</h1><p className="mt-2 text-sm leading-6 text-[#65727b]">Return to the journal to browse the current articles.</p><div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => void query.refetch()} className="rounded-full border border-[#12335a]/20 px-4 py-2.5 text-sm font-bold text-[#12335a]" data-testid="button-retry-article">Try again</button><Link href="/knowledge-hub/article-hub" className="rounded-full bg-[#12335a] px-4 py-2.5 text-sm font-bold text-white" data-testid="link-back-article-hub-error">Article Hub</Link></div></div></main>{home.data ? <Footer home={home.data} /> : null}</div>;
  const article = query.data.article;
  return <div className="min-h-[100dvh] bg-[#f5f3eb]" data-testid="page-public-article-detail"><Header home={home.data} /><main className="mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
    <Link href="/knowledge-hub/article-hub" className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#12335a]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#12335a] transition hover:border-[#a3473c]/40 hover:text-[#a3473c]" data-testid="link-back-article-hub"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to Article Hub</Link>
    <article className="mt-8 overflow-hidden rounded-[2rem] border border-[#12335a]/10 bg-white">
      {article.imageUrl ? <div className="aspect-[16/7] min-h-56 bg-[#dfe8e4] sm:min-h-80"><img src={imageUrl(article.imageUrl)} alt={article.imageAlt} className="h-full w-full object-cover" /></div> : null}
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-10 sm:py-12">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-extrabold uppercase tracking-[.15em] text-[#a3473c]"><span>{article.categoryName}</span>{dateLabel(article.publishedAt) && <><span aria-hidden="true">·</span><time dateTime={article.publishedAt || undefined}>{dateLabel(article.publishedAt)}</time></>}</div>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-[#12335a] sm:text-5xl" data-testid="text-article-title">{article.title}</h1>
        <p className="mt-5 text-lg leading-8 text-[#536575]" data-testid="text-article-excerpt">{article.excerpt}</p>
        <div className="mt-7 border-y border-[#12335a]/10 py-4 text-sm font-semibold text-[#536575]">By <span className="text-[#12335a]">{article.author}</span></div>
        <div className="prose prose-slate mt-8 max-w-none whitespace-pre-line text-[16px] leading-8 text-[#33485c]" data-testid="text-article-body">{article.body}</div>
        <div className="mt-12 border-t border-[#12335a]/10 pt-6"><Link href="/knowledge-hub/article-hub" className="focus-ring inline-flex items-center gap-2 text-sm font-extrabold text-[#a3473c] hover:text-[#12335a]" data-testid="link-return-to-articles"><ArrowLeft className="h-4 w-4" aria-hidden="true" />More from the journal</Link></div>
      </div>
    </article>
  </main>{home.data ? <Footer home={home.data} /> : null}</div>;
}