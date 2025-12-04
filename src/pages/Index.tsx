import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ScriptCard } from '@/components/ScriptCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, TrendingUp, Clock, Heart, History, Menu } from 'lucide-react';
import { ScriptCategory, ScriptStatus } from '@/types/script';
import { StatsCounter } from '@/components/StatsCounter';
import { CategoryGrid } from '@/components/CategoryGrid';
import { BackToTop } from '@/components/BackToTop';
import { TagFilter } from '@/components/TagFilter';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecentViews } from '@/hooks/useRecentViews';
import { useAuth } from '@/hooks/useAuth';
import { fetchHiddenScripts, fetchViewAnalytics, fetchScripts } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

type SortOption = 'newest' | 'updated' | 'popular';

const categories: { value: ScriptCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'shooter', label: 'Shooter' },
  { value: 'rpg', label: 'RPG' },
  { value: 'simulator', label: 'Simulator' },
  { value: 'tycoon', label: 'Tycoon' },
  { value: 'fighting', label: 'Fighting' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'misc', label: 'Misc' },
];

const statuses: { value: ScriptStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'patched', label: 'Patched' },
];

const Index = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ScriptCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ScriptStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { favorites, isFavorite } = useFavorites();
  const { recentViews } = useRecentViews();
  const { user } = useAuth();

  const { data: viewData } = useQuery({
    queryKey: ['views'],
    queryFn: fetchViewAnalytics,
    staleTime: 1000 * 60,
  });

  const { data: hiddenData } = useQuery({
    queryKey: ['hidden-scripts'],
    queryFn: fetchHiddenScripts,
    staleTime: 1000 * 60,
  });

  const { data: scriptsData } = useQuery({
    queryKey: ['scripts'],
    queryFn: fetchScripts,
    staleTime: 1000 * 60,
  });

  const hiddenSlugs = useMemo(() => new Set(hiddenData?.hidden ?? []), [hiddenData]);
  const visibleScripts = useMemo(
    () => scriptsData?.scripts ?? [],
    [scriptsData],
  );

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedTags([]);
    setSortBy('newest');
  };

  const filteredScripts = useMemo(() => {
    const filtered = visibleScripts.filter((script) => {
      const matchesSearch =
        search === '' ||
        script.title.toLowerCase().includes(search.toLowerCase()) ||
        script.short.toLowerCase().includes(search.toLowerCase()) ||
        script.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())) ||
        script.features.some((feature) => feature.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || script.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || script.status === selectedStatus;
      const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => script.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesStatus && matchesTags;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      } else if (sortBy === 'updated') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      } else {
        const viewsA = viewData?.views?.[a.slug] ?? a.views ?? 0;
        const viewsB = viewData?.views?.[b.slug] ?? b.views ?? 0;
        return viewsB - viewsA;
      }
    });

    return filtered;
  }, [visibleScripts, search, selectedCategory, selectedStatus, sortBy, selectedTags, viewData]);

  const featuredScripts = useMemo(() => {
    return visibleScripts.filter((s) => s.featured).slice(0, 3);
  }, [visibleScripts]);

  const favoriteScripts = useMemo(() => {
    return visibleScripts.filter((s) => favorites.includes(s.slug));
  }, [favorites, visibleScripts]);

  const recentlyViewedScripts = useMemo(() => {
    return recentViews
      .map((slug) => visibleScripts.find((s) => s.slug === slug))
      .filter((script): script is (typeof visibleScripts)[number] => Boolean(script))
      .slice(0, 4);
  }, [recentViews, visibleScripts]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-lg bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
              >
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  <span className="text-primary">Profit</span>Cruiser
                </h1>
                <p className="text-sm text-muted-foreground">Premium Roblox Scripts</p>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2 border-border/60 bg-background/70 hover:bg-background"
                  >
                    <Menu className="h-4 w-4" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 p-0">
                  <ScrollArea className="max-h-72">
                    <div className="py-2">
                      <DropdownMenuItem asChild>
                        <Link to="/" className="w-full">
                          All scripts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/robux" className="w-full">
                          Robux
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user ? (
                        <DropdownMenuItem asChild>
                          <Link to="/account" className="w-full">
                            Account
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem asChild>
                          <Link to="/login" className="w-full">
                          Log in
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {user?.role === 'admin' && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="w-full">
                            Adminpanel
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <a href="https://discord.gg/M8RUGdQcng" target="_blank" rel="noopener noreferrer" className="w-full">
                          Discord
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href="https://www.youtube.com/@ProftCruiser/videos"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          YouTube
                        </a>
                      </DropdownMenuItem>
                    </div>
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700">
            Roblox Scripts
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Discover powerful scripts for your favorite Roblox games. All scripts are regularly updated and tested.
          </p>
        </div>

        {/* Stats Counter */}
        <StatsCounter scripts={visibleScripts} />

        {/* Category Grid */}
        <CategoryGrid scripts={visibleScripts} onCategoryClick={(cat) => setSelectedCategory(cat)} />

        {/* Featured Scripts */}
        {featuredScripts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-2xl font-bold">Featured Scripts</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredScripts.map((script) => (
                <ScriptCard
                  key={script.slug}
                  script={script}
                  featured
                  viewCount={viewData?.views?.[script.slug] ?? script.views}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="glass-card p-6 rounded-xl mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search scripts, features, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filters</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset filters
              </Button>
            </div>

            {/* Category Filter */}
            <div>
              <p className="text-sm font-medium mb-2">Category</p>
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <p className="text-sm font-medium mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Badge
                    key={status.value}
                    variant={selectedStatus === status.value ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => setSelectedStatus(status.value)}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <TagFilter selectedTags={selectedTags} onTagToggle={handleTagToggle} />

            {/* Sort By */}
            <div>
              <p className="text-sm font-medium mb-2">Sort By</p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={sortBy === 'newest' ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => setSortBy('newest')}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Newest
                </Badge>
                <Badge
                  variant={sortBy === 'updated' ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => setSortBy('updated')}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Recently Updated
                </Badge>
                <Badge
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => setSortBy('popular')}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Viewed */}
        {recentlyViewedScripts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-primary" />
              <h3 className="text-2xl font-bold">Recently Viewed</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewedScripts.map((script) => (
                <ScriptCard
                  key={script.slug}
                  script={script}
                  viewCount={viewData?.views?.[script.slug] ?? script.views}
                />
              ))}
            </div>
          </div>
        )}

        {/* Favorites */}
        {favoriteScripts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-primary fill-primary" />
              <h3 className="text-2xl font-bold">Your Favorites</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteScripts.map((script) => (
                <ScriptCard
                  key={script.slug}
                  script={script}
                  viewCount={viewData?.views?.[script.slug] ?? script.views}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredScripts.length} {filteredScripts.length === 1 ? 'script' : 'scripts'} found
          </p>
        </div>

        {/* Scripts Grid */}
        {filteredScripts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScripts.map((script) => (
              <ScriptCard
                key={script.slug}
                script={script}
                viewCount={viewData?.views?.[script.slug] ?? script.views}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-card rounded-xl">
            <p className="text-lg text-muted-foreground">No scripts found matching your filters.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </main>

      {/* Back to Top */}
      <BackToTop />

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-3">
                <span className="text-primary">Profit</span>Cruiser
              </h3>
              <p className="text-muted-foreground text-sm">
                Premium Roblox Scripts for your favorite games. Regularly updated and tested.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="/" className="block hover:text-primary transition-colors">All Scripts</a>
                <a href="https://www.youtube.com/@ProftCruiser/videos" target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors">YouTube Channel</a>
                <a href="https://discord.gg/M8RUGdQcng" target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors">Discord Server</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Join Community</h4>
              <div className="flex gap-3">
                <a
                  href="https://discord.gg/M8RUGdQcng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-[#5865F2] hover:bg-[#5865F2]/90 text-white transition-all hover:scale-110"
                  aria-label="Discord"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@ProftCruiser/videos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-110"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="text-center text-muted-foreground text-sm space-y-1 pt-8 border-t border-border">
            <p className="font-medium">ProfitCruiser – Premium Roblox Scripts</p>
            <p>All scripts are for educational purposes only.</p>
            <p>&copy; 2025 ProfitCruiser. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
