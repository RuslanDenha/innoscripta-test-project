import { CATEGORIES } from "../categories";
import { getJson, requireKey } from "../http";
import type { Article, SearchParams } from "../types";

// NYT has shipped two image formats: an array of items with relative URLs
// (older) and an object with absolute `default`/`thumbnail` URLs (newer).
type NytMultimedia =
  | { url: string; subtype?: string }[]
  | { default?: { url?: string }; thumbnail?: { url?: string } }
  | null;

interface NytDoc {
  _id: string;
  web_url: string;
  abstract?: string;
  snippet?: string;
  headline: { main: string };
  byline?: { original?: string | null };
  pub_date: string;
  section_name?: string;
  news_desk?: string;
  multimedia?: NytMultimedia;
}

interface NytResponse {
  response: { docs: NytDoc[] | null };
}

function imageUrl(multimedia: NytMultimedia | undefined): string | null {
  if (!multimedia) return null;
  if (Array.isArray(multimedia)) {
    const item = multimedia.find((m) => m.subtype === "xlarge") ?? multimedia[0];
    if (!item?.url) return null;
    return item.url.startsWith("http") ? item.url : `https://www.nytimes.com/${item.url}`;
  }
  return multimedia.default?.url ?? multimedia.thumbnail?.url ?? null;
}

// NYT dates look like "2024-05-01T12:00:00+0000"; add the colon so the
// offset is valid ISO 8601 and parses in every browser.
function toIso(date: string): string {
  return date.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
}

export async function fetchNyt(
  { query, from, to, categories }: SearchParams,
  signal?: AbortSignal,
): Promise<Article[]> {
  const params = new URLSearchParams({
    "api-key": requireKey(import.meta.env.VITE_NYT_KEY, "VITE_NYT_KEY"),
    sort: "newest",
  });
  if (query) params.set("q", query);
  if (from) params.set("begin_date", from.replaceAll("-", ""));
  if (to) params.set("end_date", to.replaceAll("-", ""));
  if (categories?.length) {
    const names = categories.flatMap((c) => CATEGORIES[c].nyt).map((n) => `"${n}"`).join(" ");
    params.set("fq", `section.name:(${names})`);
  }

  const data = await getJson<NytResponse>(
    `https://api.nytimes.com/svc/search/v2/articlesearch.json?${params}`,
    signal,
  );

  return (data.response.docs ?? []).map((d) => ({
    id: `nyt:${d._id}`,
    title: d.headline.main,
    description: d.abstract || d.snippet || null,
    url: d.web_url,
    imageUrl: imageUrl(d.multimedia),
    author: d.byline?.original?.replace(/^By /, "") || null,
    publishedAt: toIso(d.pub_date),
    source: "The New York Times",
    category: d.section_name || d.news_desk || null,
    provider: "nyt",
  }));
}
