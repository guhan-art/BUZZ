type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const responseCache = new Map<string, CacheEntry<unknown>>();

type FetchJsonWithCacheOptions = RequestInit & {
  ttlMs?: number;
  forceRefresh?: boolean;
};

export async function fetchJsonWithCache<T>(
  url: string,
  options: FetchJsonWithCacheOptions = {},
): Promise<T> {
  const {
    ttlMs = 15000,
    forceRefresh = false,
    method = "GET",
    ...requestInit
  } = options;

  const upperMethod = method.toUpperCase();
  const canUseCache = upperMethod === "GET" && !forceRefresh;

  if (canUseCache) {
    const cached = responseCache.get(url) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
  }

  const response = await fetch(url, { method: upperMethod, ...requestInit });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const json = (await response.json()) as T;

  if (upperMethod === "GET") {
    responseCache.set(url, {
      value: json,
      expiresAt: Date.now() + ttlMs,
    });
  }

  return json;
}

export function clearCachedUrl(url: string) {
  responseCache.delete(url);
}
