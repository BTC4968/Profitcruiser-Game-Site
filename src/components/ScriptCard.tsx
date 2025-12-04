import { Link } from 'react-router-dom';
import { Script } from '@/types/script';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, AlertCircle, CheckCircle, Star, Eye } from 'lucide-react';

interface ScriptCardProps {
  script: Script;
  featured?: boolean;
  viewCount?: number;
}

const categoryColors: Record<string, string> = {
  shooter: 'bg-red-500/20 text-red-300 border-red-500/30',
  rpg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  simulator: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  tycoon: 'bg-green-500/20 text-green-300 border-green-500/30',
  fighting: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  adventure: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  misc: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const statusConfig = {
  active: { icon: CheckCircle, color: 'bg-success/20 text-success border-success/30', label: 'Active' },
  patched: { icon: AlertCircle, color: 'bg-destructive/20 text-destructive border-destructive/30', label: 'Patched' },
  private: { icon: AlertCircle, color: 'bg-warning/20 text-warning border-warning/30', label: 'Private' },
  archived: { icon: AlertCircle, color: 'bg-muted/20 text-muted-foreground border-muted/30', label: 'Archived' },
};

export const ScriptCard = ({ script, featured = false, viewCount }: ScriptCardProps) => {
  const StatusIcon = statusConfig[script.status].icon;

  return (
    <Link to={`/scripts/${script.slug}`} className="group">
      <div className={`glass-card rounded-xl overflow-hidden transition-all duration-300 hover:glow-card hover:scale-[1.02] h-full flex flex-col ${featured ? 'border-primary/50 glow-primary' : ''}`}>
        <div className="relative overflow-hidden aspect-video">
          <img
            src={script.thumbnail}
            alt={script.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-60" />
          <div className="absolute top-3 right-3 flex gap-2">
            {featured && (
              <Badge className="bg-primary/90 backdrop-blur-sm">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            <Badge className={statusConfig[script.status].color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig[script.status].label}
            </Badge>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {script.title}
            </h3>
            <Badge variant="outline" className={categoryColors[script.category]}>
              {script.category}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {script.short}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {script.features.slice(0, 3).map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {script.features.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{script.features.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {script.compatibility.pc && (
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                )}
                {script.compatibility.mobile && (
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              {viewCount !== undefined ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  {viewCount > 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
                </div>
              ) : script.views ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  {script.views > 1000 ? `${(script.views / 1000).toFixed(1)}k` : script.views}
                </div>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground">v{script.version}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
