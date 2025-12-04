import type { LucideIcon } from 'lucide-react';
import { Target, Swords, Gamepad2, Crown, Flame, Map, Grid3x3 } from 'lucide-react';
import { Script, ScriptCategory } from '@/types/script';

const categoryConfig: Record<ScriptCategory, { icon: LucideIcon; color: string; gradient: string }> = {
  shooter: { 
    icon: Target, 
    color: 'text-red-400',
    gradient: 'from-red-500/20 to-red-600/5'
  },
  fighting: { 
    icon: Swords, 
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-orange-600/5'
  },
  rpg: { 
    icon: Gamepad2, 
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-600/5'
  },
  tycoon: { 
    icon: Crown, 
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-green-600/5'
  },
  simulator: { 
    icon: Flame, 
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-600/5'
  },
  adventure: { 
    icon: Map, 
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-cyan-600/5'
  },
  misc: { 
    icon: Grid3x3, 
    color: 'text-gray-400',
    gradient: 'from-gray-500/20 to-gray-600/5'
  },
};

interface CategoryGridProps {
  scripts: Script[];
  onCategoryClick: (category: ScriptCategory) => void;
}

export const CategoryGrid = ({ scripts, onCategoryClick }: CategoryGridProps) => {
  const categoryCounts = scripts.reduce((acc, script) => {
    acc[script.category] = (acc[script.category] || 0) + 1;
    return acc;
  }, {} as Record<ScriptCategory, number>);

  const visibleCategories = (Object.keys(categoryCounts) as ScriptCategory[]).sort(
    (a, b) => categoryCounts[b] - categoryCounts[a]
  );

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold mb-6">Browse by Category</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {visibleCategories.map((category) => {
          const config = categoryConfig[category];
          const Icon = config?.icon ?? Grid3x3;
          const count = categoryCounts[category] || 0;

          return (
            <button
              key={category}
              onClick={() => onCategoryClick(category)}
              className={`glass-card p-6 rounded-xl bg-gradient-to-br ${config?.gradient ?? 'from-gray-500/20 to-gray-600/5'} hover:scale-105 transition-all duration-300 group cursor-pointer`}
            >
              <Icon className={`w-8 h-8 ${config?.color ?? 'text-gray-400'} mb-3 mx-auto group-hover:scale-110 transition-transform`} />
              <h4 className="font-bold text-foreground capitalize text-center mb-1">{category}</h4>
              <p className="text-xs text-muted-foreground text-center">{count} scripts</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
