import { useCallback, useEffect, useRef } from "react";
import { useArticles } from "../hooks/useArticles";
import { fetchAllArticles, type Article, type SearchParams } from "../news";
import Results from "./Results";
import SearchForm from "./SearchForm";

interface Props {
  active: boolean;
  onArticles: (articles: Article[]) => void;
}

export default function SearchView({ active, onArticles }: Props) {
  const { result, loading, load } = useArticles();
  const loaded = useRef(false);

  const search = useCallback((params: SearchParams) => load((signal) => fetchAllArticles(params, signal), "Search"), [load]);

  // Load the latest news the first time the tab is opened (once, even under StrictMode).
  useEffect(() => {
    if (!active || loaded.current) return;
    loaded.current = true;
    void search({});
  }, [active, search]);

  useEffect(() => {
    if (result) onArticles(result.articles);
  }, [result, onArticles]);

  return (
    <div hidden={!active}>
      <SearchForm loading={loading} onSearch={search} />
      <Results result={result} loading={loading} />
    </div>
  );
}
