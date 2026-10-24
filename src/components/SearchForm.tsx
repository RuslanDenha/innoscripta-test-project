import { useId, useState, type FormEvent } from "react";
import { useAutoSearch } from "../hooks/useAutoSearch";
import { INITIAL_FILTERS, toSearchParams, useSearchFilters } from "../hooks/useSearchFilters";
import { ALL_PROVIDERS, CATEGORIES, PROVIDER_LABELS, type Category, type SearchParams } from "../news";
import { Button, Checkbox, Field, Input, SearchIcon, Select, SlidersIcon, XIcon } from "./ui";

// How long to wait after the last keystroke before searching automatically.
const DEBOUNCE_MS = 600;

// One-click filters (category, sources) search at once; typed values (keyword, dates typed
// digit by digit) wait until they stop changing.
function isClickedFilterChange(previous: SearchParams, next: SearchParams): boolean {
  return (
    JSON.stringify(previous.categories) !== JSON.stringify(next.categories) ||
    JSON.stringify(previous.providers) !== JSON.stringify(next.providers)
  );
}

interface Props {
  loading: boolean;
  onSearch: (params: SearchParams) => void;
}

export default function SearchForm({ loading, onSearch }: Props) {
  const { filters, setFilter, toggleProvider, reset, params, hasFilters, activeFilterCount } = useSearchFilters();
  const { query, from, to, category, providers } = filters;

  // The page already loads the unfiltered results, so those are the starting point.
  const { searchNow } = useAutoSearch(params, onSearch, {
    initial: toSearchParams(INITIAL_FILTERS),
    delayMs: DEBOUNCE_MS,
    isInstant: isClickedFilterChange,
  });

  // On phones the filters fold away behind a button (see .search-filters in index.css).
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    searchNow(params);
  }

  function clearFilters() {
    reset();
    searchNow(toSearchParams(INITIAL_FILTERS));
  }

  return (
    <form className="search-panel" onSubmit={handleSubmit}>
      <div className="search-row">
        <div className="search-input">
          <SearchIcon className="search-input__icon" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setFilter("query", e.target.value)}
            placeholder="Search articles by keyword"
            aria-label="Keyword"
          />
        </div>
        <Button
          variant="outline"
          className="filters-toggle"
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
          aria-label={activeFilterCount ? `Filters, ${activeFilterCount} active` : "Filters"}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersIcon />
          {activeFilterCount > 0 && <span className="filters-toggle__count">{activeFilterCount}</span>}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      <div id={filtersId} className={filtersOpen ? "search-filters" : "search-filters is-collapsed"}>
        <div className="filter-grid">
          <Field label="From">
            <Input type="date" value={from} max={to || undefined} onChange={(e) => setFilter("from", e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} min={from || undefined} onChange={(e) => setFilter("to", e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setFilter("category", e.target.value as Category | "")}>
              <option value="">All categories</option>
              {Object.entries(CATEGORIES).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="search-footer">
          <fieldset className="providers">
            <legend className="ui-label">Sources</legend>
            {ALL_PROVIDERS.map((provider) => (
              <Checkbox
                key={provider}
                label={PROVIDER_LABELS[provider]}
                checked={providers.includes(provider)}
                onChange={() => toggleProvider(provider)}
              />
            ))}
          </fieldset>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={loading}>
              <XIcon />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
