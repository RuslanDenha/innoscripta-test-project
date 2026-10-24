import { useCallback, useState } from "react";
import { authorNames } from "./authors";
import FeedView from "./components/FeedView";
import SearchView from "./components/SearchView";
import { Tabs } from "./components/ui";
import type { Article } from "./news";

type View = "feed" | "search";

export default function App() {
  const [view, setView] = useState<View>("feed");
  // Authors seen in any results, offered as suggestions when customizing the feed.
  const [knownAuthors, setKnownAuthors] = useState<string[]>([]);

  const rememberAuthors = useCallback((articles: Article[]) => {
    setKnownAuthors((current) => {
      const merged = [...new Set([...current, ...authorNames(articles)])].sort((a, b) => a.localeCompare(b));
      return merged.length === current.length ? current : merged;
    });
  }, []);

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>innoscripta</h1>
          <p>News from NewsAPI, The Guardian and The New York Times.</p>
        </div>
        <Tabs
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: "feed", label: "My feed" },
            { value: "search", label: "Search" },
          ]}
        />
      </header>

      <FeedView active={view === "feed"} authorSuggestions={knownAuthors} onArticles={rememberAuthors} />
      <SearchView active={view === "search"} onArticles={rememberAuthors} />
    </main>
  );
}
