import type { Category, Provider } from "./types";

interface CategoryConfig {
  label: string;
  newsapi: string; // /top-headlines category
  guardian: string; // section ids, "|" means OR
  nyt: string[]; // section.name values
}

// Each API has its own taxonomy; these map one shared category onto all three.
export const CATEGORIES: Record<Category, CategoryConfig> = {
  business: { label: "Business", newsapi: "business", guardian: "business|money", nyt: ["Business"] },
  technology: { label: "Technology", newsapi: "technology", guardian: "technology", nyt: ["Technology"] },
  science: { label: "Science", newsapi: "science", guardian: "science|environment", nyt: ["Science", "Climate"] },
  health: { label: "Health", newsapi: "health", guardian: "society|wellness", nyt: ["Health", "Well"] },
  sports: { label: "Sports", newsapi: "sports", guardian: "sport|football", nyt: ["Sports"] },
  entertainment: {
    label: "Entertainment",
    newsapi: "entertainment",
    guardian: "culture|film|music|tv-and-radio|stage|books",
    nyt: ["Arts", "Movies", "Books", "Theater"],
  },
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  newsapi: "NewsAPI",
  guardian: "The Guardian",
  nyt: "The New York Times",
};
