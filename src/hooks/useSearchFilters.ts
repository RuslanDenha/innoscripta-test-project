import { useCallback, useMemo, useState } from "react";
import { ALL_PROVIDERS, type Category, type Provider, type SearchParams } from "../news";

// Raw form values, as the inputs show them.
export interface SearchFilters {
  query: string;
  from: string;
  to: string;
  category: Category | "";
  providers: Provider[];
}

export const INITIAL_FILTERS: SearchFilters = { query: "", from: "", to: "", category: "", providers: ALL_PROVIDERS };

// No sources ticked searches all of them, so only a partial selection counts as a filter.
function sourcesFiltered(providers: Provider[]): boolean {
  return providers.length > 0 && providers.length < ALL_PROVIDERS.length;
}

// Turns form values into API params; empty values are left out so equal searches compare equal.
export function toSearchParams({ query, from, to, category, providers }: SearchFilters): SearchParams {
  return {
    query: query.trim() || undefined,
    from: from || undefined,
    to: to || undefined,
    categories: category ? [category] : undefined,
    // Fixed order, so ticking sources in a different order isn't a new search.
    providers: sourcesFiltered(providers) ? ALL_PROVIDERS.filter((p) => providers.includes(p)) : undefined,
  };
}

export function useSearchFilters() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const setFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const toggleProvider = useCallback((provider: Provider) => {
    setFilters((current) => ({
      ...current,
      providers: current.providers.includes(provider)
        ? current.providers.filter((p) => p !== provider)
        : [...current.providers, provider],
    }));
  }, []);

  const reset = useCallback(() => setFilters(INITIAL_FILTERS), []);

  const params = useMemo(() => toSearchParams(filters), [filters]);
  const { query, from, to, category, providers } = filters;
  const activeFilterCount = [from, to, category, sourcesFiltered(providers)].filter(Boolean).length;
  const hasFilters = Boolean(query.trim()) || activeFilterCount > 0;

  return { filters, setFilter, toggleProvider, reset, params, hasFilters, activeFilterCount };
}
