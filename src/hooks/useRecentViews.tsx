import { useState, useEffect } from 'react';

const RECENT_VIEWS_KEY = 'profitcruiser_recent_views';
const MAX_RECENT_VIEWS = 10;

export const useRecentViews = () => {
  const [recentViews, setRecentViews] = useState<string[]>(() => {
    const stored = localStorage.getItem(RECENT_VIEWS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(recentViews));
  }, [recentViews]);

  const addRecentView = (slug: string) => {
    setRecentViews((prev) => {
      const filtered = prev.filter((s) => s !== slug);
      return [slug, ...filtered].slice(0, MAX_RECENT_VIEWS);
    });
  };

  return { recentViews, addRecentView };
};
