import { useEffect, useRef, useState } from "react";
import { useArticles } from "../hooks/useArticles";
import { CATEGORIES, PROVIDER_LABELS, type Article } from "../news";
import { EMPTY_PREFERENCES, fetchFeed, loadPreferences, savePreferences, type FeedPreferences } from "../news/feed";
import PreferencesPanel from "./PreferencesPanel";
import Results from "./Results";
import { Badge, Button, SlidersIcon } from "./ui";

interface Props {
  active: boolean;
  authorSuggestions: string[];
  onArticles: (articles: Article[]) => void;
}

export default function FeedView({ active, authorSuggestions, onArticles }: Props) {
  const [saved] = useState(loadPreferences);
  const [preferences, setPreferences] = useState<FeedPreferences>(saved ?? EMPTY_PREFERENCES);
  // First visit: open the settings so people see the feed can be customized.
  const [editing, setEditing] = useState(saved === null);
  const { result, loading, load } = useArticles();

  // Reload whenever the preferences change (once per change, even under StrictMode).
  const loadedKey = useRef<string | null>(null);
  const key = JSON.stringify(preferences);
  useEffect(() => {
    if (key === loadedKey.current) return;
    loadedKey.current = key;
    void load((signal) => fetchFeed(preferences, signal), "Feed");
  }, [key, preferences, load]);

  useEffect(() => {
    if (result) onArticles(result.articles);
  }, [result, onArticles]);

  function handleSave(next: FeedPreferences) {
    savePreferences(next);
    setPreferences(next);
    setEditing(false);
  }

  const { providers, categories, authors } = preferences;
  const isDefault = providers.length === 0 && categories.length === 0 && authors.length === 0;

  return (
    <div hidden={!active}>
      <section className="feed-summary">
        <div className="feed-summary__text">
          <h2>Your feed</h2>
          {isDefault ? (
            <p>Latest news from all sources. Customize it to follow categories and authors.</p>
          ) : (
            <div className="feed-tags">
              <span>{providers.length ? providers.map((p) => PROVIDER_LABELS[p]).join(", ") : "All sources"}</span>
              {categories.map((c) => (
                <Badge key={c}>{CATEGORIES[c].label}</Badge>
              ))}
              {authors.map((a) => (
                <Badge key={a} variant="outline">
                  {a}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <SlidersIcon />
            Customize
          </Button>
        )}
      </section>

      {editing && (
        <PreferencesPanel
          preferences={preferences}
          authorSuggestions={authorSuggestions}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}

      <Results
        result={result}
        loading={loading}
        emptyMessage={
          authors.length > 0 && categories.length === 0
            ? "No recent articles by these authors. Try adding a category or another author."
            : "No articles match your feed."
        }
      />
    </div>
  );
}
