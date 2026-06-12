import { useCallback, useEffect, useState } from 'react';

const KEY = 'vatuur:recent-listings';
const MAX = 24;

export interface RecentListingEntry {
  id: string;
  title: string;
  price: number | null;
  image: string | null;
  city: string | null;
  viewedAt: number;
}

function read(): RecentListingEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentListing(entry: Omit<RecentListingEntry, 'viewedAt'>) {
  try {
    const list = read().filter((e) => e.id !== entry.id);
    list.unshift({ ...entry, viewedAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* noop */
  }
}

export function useRecentlyViewedListings() {
  const [items, setItems] = useState<RecentListingEntry[]>([]);

  useEffect(() => {
    setItems(read());
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setItems([]);
  }, []);

  const removeOne = useCallback((id: string) => {
    const next = read().filter((e) => e.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    setItems(next);
  }, []);

  return { items, clear, removeOne };
}
