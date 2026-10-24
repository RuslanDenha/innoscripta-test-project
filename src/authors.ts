import type { Article } from "./news";

// Bylines can name several people ("Rob Smyth (now), Tom Bassam and Tom Davies (earlier)");
// split them into individual names that are usable as feed preferences.
export function authorNames(articles: Article[]): string[] {
  const names = new Set<string>();
  for (const { author } of articles) {
    if (!author) continue;
    for (const part of author.replace(/\([^)]*\)/g, "").split(/\s*(?:,|&|\band\b)\s*/i)) {
      const name = part.trim();
      // Skip outlet names and URLs that some sources put in the author field.
      if (name.includes(" ") && !name.includes(".") && name.length <= 40) names.add(name);
    }
  }
  return [...names];
}
