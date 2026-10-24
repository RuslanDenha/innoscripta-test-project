import { useMemo, useState } from "react";
import { PROVIDER_LABELS, type FetchResult, type Provider } from "../news";
import ArticleList from "./ArticleList";
import { Select } from "./ui";

interface Props {
  result: FetchResult | null;
  loading: boolean;
  emptyMessage?: string;
}

export default function Results({ result, loading, emptyMessage }: Props) {
  const [source, setSource] = useState("");

  // Outlets present in the results (NewsAPI alone returns many: CNN, BBC News, …).
  const sources = useMemo(
    () => [...new Set(result?.articles.map((a) => a.source))].sort((a, b) => a.localeCompare(b)),
    [result],
  );
  // A picked outlet that isn't in the new results would hide everything, so ignore it.
  const activeSource = sources.includes(source) ? source : "";
  const visible = useMemo(
    () => (activeSource ? result?.articles.filter((a) => a.source === activeSource) : result?.articles) ?? [],
    [result, activeSource],
  );
  const errors = Object.entries(result?.errors ?? {}) as [Provider, string][];

  if (!result) return <p className="empty">{loading ? "Loading articles…" : null}</p>;

  return (
    <section aria-busy={loading} className={loading ? "results is-loading" : "results"}>
      {errors.length > 0 && (
        <ul className="errors" role="alert">
          {errors.map(([provider, message]) => (
            <li key={provider}>
              {PROVIDER_LABELS[provider]}: {message}
            </li>
          ))}
        </ul>
      )}
      <div className="results-bar">
        <span className="results-count">
          {visible.length} {visible.length === 1 ? "article" : "articles"}
        </span>
        <Select value={activeSource} onChange={(e) => setSource(e.target.value)} aria-label="Outlet">
          <option value="">All outlets</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <ArticleList articles={visible} emptyMessage={emptyMessage} />
    </section>
  );
}
