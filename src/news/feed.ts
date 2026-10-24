import { ALL_PROVIDERS, PROVIDER_FETCHERS, resolveProviders, settle, type FetchResult } from "./index";
import { CATEGORIES } from "./categories";
import type { Article, Category, Provider } from "./types";

export interface FeedPreferences {
  providers: Provider[]; // empty means all
  categories: Category[];
  authors: string[];
}

export const EMPTY_PREFERENCES: FeedPreferences = { providers: [], categories: [], authors: [] };

export function writtenByAny(article: Article, authors: string[]): boolean {
  const byline = article.author?.toLowerCase();
  return Boolean(byline && authors.some((author) => byline.includes(author.toLowerCase())));
}

// None of the APIs filter by author directly, so search for the names and keep only
// articles whose byline matches. NYT can't OR quoted names, so it gets one request per author.
function authorRequests(provider: Provider, authors: string[], signal?: AbortSignal) {
  const queries =
    provider === "nyt" ? authors.map((a) => `"${a}"`) : [authors.map((a) => `"${a}"`).join(" OR ")];
  return queries.map((query) => ({
    provider,
    request: PROVIDER_FETCHERS[provider]({ query }, signal).then((articles) =>
      articles.filter((a) => writtenByAny(a, authors)),
    ),
  }));
}

// The feed shows articles from the preferred sources that are in a preferred category
// OR by a preferred author. With no categories or authors it's simply the latest news.
export function fetchFeed(
  { providers, categories, authors }: FeedPreferences,
  signal?: AbortSignal,
): Promise<FetchResult> {
  const selected = resolveProviders(providers);
  const requests: { provider: Provider; request: Promise<Article[]> }[] = [];

  if (categories.length > 0 || authors.length === 0) {
    for (const provider of selected) {
      requests.push({ provider, request: PROVIDER_FETCHERS[provider]({ categories }, signal) });
    }
  }
  if (authors.length > 0) {
    for (const provider of selected) requests.push(...authorRequests(provider, authors, signal));
  }

  return settle(requests);
}

const STORAGE_KEY = "news-feed-preferences";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

// Preferences live in this browser only; anything unreadable falls back to defaults.
export function loadPreferences(): FeedPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { providers, categories, authors } = data as Record<string, unknown>;
    return {
      providers: isStringArray(providers) ? providers.filter((p): p is Provider => ALL_PROVIDERS.includes(p as Provider)) : [],
      categories: isStringArray(categories) ? categories.filter((c): c is Category => c in CATEGORIES) : [],
      authors: isStringArray(authors) ? authors : [],
    };
  } catch {
    return null;
  }
}

export function savePreferences(preferences: FeedPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the feed still works for this visit.
  }
}
