import { Badge } from '@/components/ui/badge';
import { scripts } from '@/data/scripts';
import { useMemo } from 'react';

interface TagFilterProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export const TagFilter = ({ selectedTags, onTagToggle }: TagFilterProps) => {
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    scripts.forEach((script) => {
      script.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, []);

  return (
    <div>
      <p className="text-sm font-medium mb-2">Tags</p>
      <div className="flex flex-wrap justify-center gap-2">
        {allTags.map((tag) => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
            className="cursor-pointer transition-all hover:scale-105"
            onClick={() => onTagToggle(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};
