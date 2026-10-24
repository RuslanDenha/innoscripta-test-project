import { CATEGORIES } from "../categories";
import { getJson, requireKey } from "../http";
import type { Article, SearchParams } from "../types";

interface GuardianResult {
  id: string;
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  sectionName?: string;
  fields?: { trailText?: string; thumbnail?: string; byline?: string };
}

interface GuardianResponse {
  response: { status: string; results: GuardianResult[] };
}

// trailText can contain HTML (e.g. "<strong>Live:</strong> ..."); keep plain text.
function stripHtml(html: string | undefined): string | null {
  if (!html) return null;
  return new DOMParser().parseFromString(html, "text/html").body.textContent?.trim() || null;
}

export async function fetchGuardian(
  { query, from, to, categories }: SearchParams,
  signal?: AbortSignal,
): Promise<Article[]> {
  const params = new URLSearchParams({
    "api-key": requireKey(import.meta.env.VITE_GUARDIAN_KEY, "VITE_GUARDIAN_KEY"),
    "show-fields": "trailText,thumbnail,byline",
    "page-size": "20",
    "order-by": "newest",
  });
  if (query) params.set("q", query);
  if (from) params.set("from-date", from);
  if (to) params.set("to-date", to);
  if (categories?.length) params.set("section", categories.map((c) => CATEGORIES[c].guardian).join("|"));

  const data = await getJson<GuardianResponse>(`https://content.guardianapis.com/search?${params}`, signal);

  return data.response.results.map((r) => ({
    id: `guardian:${r.id}`,
    title: r.webTitle,
    description: stripHtml(r.fields?.trailText),
    url: r.webUrl,
    imageUrl: r.fields?.thumbnail ?? null,
    author: r.fields?.byline ?? null,
    publishedAt: r.webPublicationDate,
    source: "The Guardian",
    category: r.sectionName ?? null,
    provider: "guardian",
  }));
}
