import { useEffect, useState } from 'react';
import { Script } from '@/types/script';

const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="text-4xl font-bold text-primary">
      {count}{suffix}
    </span>
  );
};

interface StatsCounterProps {
  scripts: Script[];
}

export const StatsCounter = ({ scripts }: StatsCounterProps) => {
  const totalScripts = scripts.length;
  const activeScripts = scripts.filter((s) => s.status === 'active').length;
  const categories = new Set(scripts.map((s) => s.category)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 glass-card p-6 md:p-8 rounded-xl mb-12">
      <div className="text-center">
        <AnimatedCounter value={totalScripts} />
        <p className="text-muted-foreground mt-2">Total Scripts</p>
      </div>
      <div className="text-center">
        <AnimatedCounter value={activeScripts} />
        <p className="text-muted-foreground mt-2">Active Scripts</p>
      </div>
      <div className="text-center">
        <AnimatedCounter value={categories} />
        <p className="text-muted-foreground mt-2">Categories</p>
      </div>
    </div>
  );
};
