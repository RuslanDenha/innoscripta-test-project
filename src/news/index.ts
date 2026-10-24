import { fetchGuardian } from "./providers/guardian";
import { fetchNewsApi } from "./providers/newsapi";
import { fetchNyt } from "./providers/nyt";
import type { Article, Provider, SearchParams } from "./types";

export { CATEGORIES, PROVIDER_LABELS } from "./categories";
export type { Article, Category, Provider, SearchParams } from "./types";

type ProviderFetcher = (params: SearchParams, signal?: AbortSignal) => Promise<Article[]>;

export const PROVIDER_FETCHERS: Record<Provider, ProviderFetcher> = {
  newsapi: fetchNewsApi,
  guardian: fetchGuardian,
  nyt: fetchNyt,
};

export const ALL_PROVIDERS = Object.keys(PROVIDER_FETCHERS) as Provider[];

export interface FetchResult {
  articles: Article[];
  errors: Partial<Record<Provider, string>>;
}

// No providers selected means no restriction, same as selecting all of them.
export function resolveProviders(providers: Provider[] | undefined): Provider[] {
  return providers?.length ? providers : ALL_PROVIDERS;
}

// Runs provider requests in parallel; one failing request doesn't drop the others.
// Duplicates (same article from two requests) are removed and the newest come first.
export async function settle(requests: { provider: Provider; request: Promise<Article[]> }[]): Promise<FetchResult> {
  const settled = await Promise.allSettled(requests.map((r) => r.request));

  const byId = new Map<string, Article>();
  const errors: FetchResult["errors"] = {};
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      for (const article of result.value) if (!byId.has(article.id)) byId.set(article.id, article);
    } else {
      errors[requests[i].provider] = result.reason instanceof Error ? result.reason.message : String(result.reason);
    }
  });

  return {
    articles: [...byId.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
    errors,
  };
}

// Not every endpoint honours the date range (NewsAPI top-headlines ignores it),
// so apply it again here. Dates are whole local days, both ends inclusive.
function inDateRange(article: Article, from?: string, to?: string): boolean {
  const time = Date.parse(article.publishedAt);
  if (from && time < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && time > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
}

export async function fetchAllArticles(params: SearchParams = {}, signal?: AbortSignal): Promise<FetchResult> {
  const result = await settle(
    resolveProviders(params.providers).map((provider) => ({
      provider,
      request: PROVIDER_FETCHERS[provider](params, signal),
    })),
  );
  return { ...result, articles: result.articles.filter((a) => inDateRange(a, params.from, params.to)) };
}
