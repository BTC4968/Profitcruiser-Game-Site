import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'profitcruiser_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  const isFavorite = (slug: string) => favorites.includes(slug);

  return { favorites, toggleFavorite, isFavorite };
};
