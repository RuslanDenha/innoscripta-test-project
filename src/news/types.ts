export type Provider = "newsapi" | "guardian" | "nyt";

export type Category = "business" | "technology" | "science" | "health" | "sports" | "entertainment";

export interface Article {
  id: string; // unique across all sources
  title: string;
  description: string | null; // short summary
  url: string; // link to the original article
  imageUrl: string | null;
  author: string | null;
  publishedAt: string; // ISO 8601 date
  source: string; // "BBC News", "The Guardian", "The New York Times"
  category: string | null;
  provider: Provider;
}

export interface SearchParams {
  query?: string;
  from?: string; // YYYY-MM-DD, inclusive
  to?: string; // YYYY-MM-DD, inclusive
  categories?: Category[]; // matches any of them
  providers?: Provider[]; // empty or missing means all
}
