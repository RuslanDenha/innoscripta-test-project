import { useId, useState, type KeyboardEvent } from "react";
import { ALL_PROVIDERS, CATEGORIES, PROVIDER_LABELS, type Category, type Provider } from "../news";
import type { FeedPreferences } from "../news/feed";
import { Badge, Button, Checkbox, Input, PlusIcon, XIcon } from "./ui";

interface Props {
  preferences: FeedPreferences;
  authorSuggestions: string[];
  onSave: (preferences: FeedPreferences) => void;
  onCancel?: () => void;
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export default function PreferencesPanel({ preferences, authorSuggestions, onSave, onCancel }: Props) {
  const [providers, setProviders] = useState(preferences.providers);
  const [categories, setCategories] = useState(preferences.categories);
  const [authors, setAuthors] = useState(preferences.authors);
  const [authorInput, setAuthorInput] = useState("");
  const suggestionsId = useId();

  function addAuthor() {
    const name = authorInput.trim().replace(/\s+/g, " ");
    if (name && !authors.some((a) => a.toLowerCase() === name.toLowerCase())) setAuthors([...authors, name]);
    setAuthorInput("");
  }

  function handleAuthorKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addAuthor();
    }
  }

  function save() {
    // Store sources in a fixed order; all of them ticked is the same as none (no restriction).
    const ordered = ALL_PROVIDERS.filter((p) => providers.includes(p));
    onSave({
      providers: ordered.length === ALL_PROVIDERS.length ? [] : ordered,
      categories: (Object.keys(CATEGORIES) as Category[]).filter((c) => categories.includes(c)),
      authors,
    });
  }

  const suggestions = authorSuggestions.filter((s) => !authors.includes(s));

  return (
    <section className="prefs-panel" aria-label="Customize your feed">
      <fieldset className="prefs-group">
        <legend className="ui-label">Sources</legend>
        <p className="prefs-hint">Leave all unticked to include every source.</p>
        <div className="prefs-options">
          {ALL_PROVIDERS.map((provider: Provider) => (
            <Checkbox
              key={provider}
              label={PROVIDER_LABELS[provider]}
              checked={providers.includes(provider)}
              onChange={() => setProviders(toggle(providers, provider))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="prefs-group">
        <legend className="ui-label">Categories</legend>
        <div className="prefs-options">
          {(Object.entries(CATEGORIES) as [Category, { label: string }][]).map(([value, { label }]) => (
            <Checkbox
              key={value}
              label={label}
              checked={categories.includes(value)}
              onChange={() => setCategories(toggle(categories, value))}
            />
          ))}
        </div>
      </fieldset>

      <div className="prefs-group">
        <label className="ui-label" htmlFor={`${suggestionsId}-input`}>
          Authors
        </label>
        <p className="prefs-hint">Type a name or pick one from articles you've seen.</p>
        <div className="author-row">
          <Input
            id={`${suggestionsId}-input`}
            list={suggestionsId}
            value={authorInput}
            onChange={(e) => setAuthorInput(e.target.value)}
            onKeyDown={handleAuthorKey}
            placeholder="e.g. Rob Smyth"
          />
          <Button variant="outline" onClick={addAuthor} disabled={!authorInput.trim()}>
            <PlusIcon />
            Add
          </Button>
          <datalist id={suggestionsId}>
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        {authors.length > 0 && (
          <ul className="author-chips">
            {authors.map((author) => (
              <li key={author}>
                <Badge variant="outline" className="author-chip">
                  {author}
                  <button
                    type="button"
                    aria-label={`Remove ${author}`}
                    onClick={() => setAuthors(authors.filter((a) => a !== author))}
                  >
                    <XIcon />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="prefs-actions">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={save}>Save feed</Button>
      </div>
    </section>
  );
}
