import { useCallback, useEffect, useRef } from "react";

interface Options<T> {
  // Params the results on screen already match, so they don't trigger a search.
  initial: T;
  // How long to wait after the last change before searching.
  delayMs: number;
  // Return true for changes that should search at once instead of waiting (e.g. a click).
  isInstant?: (previous: T, next: T) => boolean;
}

// Calls onSearch whenever params change: immediately for instant changes, otherwise once
// they've stopped changing for delayMs. Params equal to the last search are skipped.
// searchNow searches right away (e.g. on submit) and cancels any pending delayed search.
export function useAutoSearch<T>(params: T, onSearch: (params: T) => void, { initial, delayMs, isInstant }: Options<T>) {
  const lastSearch = useRef(initial);
  const timer = useRef<number | undefined>(undefined);
  // Keep the latest callbacks without restarting the timer when they change identity.
  // (Updated in an effect declared first, so it runs before the search effect below.)
  const onSearchRef = useRef(onSearch);
  const isInstantRef = useRef(isInstant);
  useEffect(() => {
    onSearchRef.current = onSearch;
    isInstantRef.current = isInstant;
  });

  const searchNow = useCallback((next: T) => {
    window.clearTimeout(timer.current);
    lastSearch.current = next;
    onSearchRef.current(next);
  }, []);

  const key = JSON.stringify(params);
  useEffect(() => {
    if (key === JSON.stringify(lastSearch.current)) return;
    if (isInstantRef.current?.(lastSearch.current, params)) {
      searchNow(params);
      return;
    }
    timer.current = window.setTimeout(() => searchNow(params), delayMs);
    return () => window.clearTimeout(timer.current);
  }, [key, delayMs, searchNow]); // key stands for params

  return { searchNow };
}
