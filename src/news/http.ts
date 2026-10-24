export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (error) {
    // A cancelled request isn't a failure; let callers recognise it.
    if (signal?.aborted) throw error;
    // Browsers hide error responses without CORS headers (common for a bad key).
    throw new Error(`Request to ${new URL(url).origin} failed: network error or invalid API key`);
  }
  if (res.status === 429) {
    throw new Error("Too many requests (free API limit). Wait a minute and try again.");
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${new URL(url).origin}${new URL(url).pathname}`);
  }
  return (await res.json()) as T;
}

export function requireKey(key: string | undefined, name: string): string {
  if (!key) throw new Error(`Missing ${name} in .env.local`);
  return key;
}
