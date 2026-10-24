import { useCallback, useRef, useState } from "react";
import type { FetchResult } from "../news";

// Holds the latest fetch result. Starting a new fetch cancels the one still in flight,
// so its requests stop and its response can never overwrite newer results.
export function useArticles() {
  const [result, setResult] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const current = useRef<AbortController | null>(null);

  const load = useCallback(async (fetcher: (signal: AbortSignal) => Promise<FetchResult>, label: string) => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;

    setLoading(true);
    try {
      const data = await fetcher(controller.signal);
      if (controller.signal.aborted) return;
      console.log(`${label}: ${data.articles.length} articles`, data);
      setResult(data);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  return { result, loading, load };
}
