import { CATEGORIES } from "../categories";
import { getJson, requireKey } from "../http";
import type { Article, Category, SearchParams } from "../types";

interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
}

interface NewsApiResponse {
  status: "ok" | "error";
  articles: NewsApiArticle[];
}

const REMOVED = "[Removed]";

// Titles end with " - Outlet", spelled loosely ("- BBC" for "BBC News", "- NBC Sports" for
// "NBCSports.com"); the card already shows the outlet as a tag, so drop it.
function withoutOutletSuffix(title: string, outlet: string): string {
  const at = title.lastIndexOf(" - ");
  if (at <= 0) return title;
  const letters = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const suffix = letters(title.slice(at + 3));
  const name = letters(outlet);
  return suffix && (name.startsWith(suffix) || suffix.startsWith(name)) ? title.slice(0, at) : title;
}

function toArticle(a: NewsApiArticle, category: Category | undefined): Article {
  return {
    id: `newsapi:${a.url}`,
    title: withoutOutletSuffix(a.title, a.source.name),
    description: a.description,
    url: a.url,
    imageUrl: a.urlToImage,
    author: a.author,
    publishedAt: a.publishedAt,
    source: a.source.name,
    category: category ? CATEGORIES[category].label : null,
    provider: "newsapi",
  };
}

async function request(
  endpoint: string,
  params: URLSearchParams,
  signal: AbortSignal | undefined,
  category?: Category,
): Promise<Article[]> {
  params.set("apiKey", requireKey(import.meta.env.VITE_NEWSAPI_KEY, "VITE_NEWSAPI_KEY"));
  params.set("pageSize", "20");
  const data = await getJson<NewsApiResponse>(`https://newsapi.org/v2/${endpoint}?${params}`, signal);
  return data.articles
    .filter((a) => a.title !== REMOVED && a.url !== "https://removed.com")
    .map((a) => toArticle(a, category));
}

export async function fetchNewsApi(
  { query, from, to, categories }: SearchParams,
  signal?: AbortSignal,
): Promise<Article[]> {
  // /everything supports keyword + dates but not categories and needs a query.
  if (query && !categories?.length) {
    const params = new URLSearchParams({ q: query, language: "en", sortBy: "publishedAt" });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return request("everything", params, signal);
  }

  // /top-headlines supports keyword + one category per request, but not dates (filtered afterwards).
  const perCategory: (Category | undefined)[] = categories?.length ? categories : [undefined];
  const results = await Promise.all(
    perCategory.map((category) => {
      const params = new URLSearchParams({ country: "us" });
      if (query) params.set("q", query);
      if (category) params.set("category", CATEGORIES[category].newsapi);
      return request("top-headlines", params, signal, category);
    }),
  );
  return results.flat();
}
