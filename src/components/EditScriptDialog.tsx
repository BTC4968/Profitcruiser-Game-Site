import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateScript, type ScriptData } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ImageUpload';

const CATEGORIES = [
  'shooter',
  'rpg', 
  'simulator',
  'tycoon',
  'fighting',
  'adventure',
  'misc'
];

const STATUS_OPTIONS = [
  'active',
  'patched',
  'private',
  'archived'
];

const TAGS = [
  'no-key',
  'mobile',
  'pc-only',
  'executor-required',
  'premium',
  'free',
  'beta',
  'stable'
];

const FEATURES = [
  'ESP',
  'Aimbot',
  'Speed',
  'Fly',
  'Noclip',
  'God Mode',
  'Auto Farm',
  'Auto Collect',
  'Teleport',
  'Infinite Jump',
  'No Cooldown',
  'Auto Buy',
  'Auto Sell'
];

interface EditScriptDialogProps {
  script: ScriptData;
  children: React.ReactNode;
}

export const EditScriptDialog = ({ script, children }: EditScriptDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ScriptData>>(script);

  const { token } = useAuth();
  const queryClient = useQueryClient();

  const updateScriptMutation = useMutation({
    mutationFn: (scriptData: Partial<ScriptData>) => updateScript(token ?? '', script.slug, scriptData),
    onSuccess: () => {
      toast.success('Script updated successfully!');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update script');
    }
  });

  useEffect(() => {
    if (script) {
      setFormData(script);
    }
  }, [script]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'tags' | 'features' | 'keywords', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.includes(value) 
        ? prev[field]?.filter(item => item !== value)
        : [...(prev[field] || []), value]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug || !formData.title || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateScriptMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Script</DialogTitle>
          <DialogDescription>
            Update the script information. All changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="my-awesome-script"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used in URL (no spaces, lowercase, hyphens only)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="My Awesome Script"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short">Short Description</Label>
                <Input
                  id="short"
                  value={formData.short}
                  onChange={(e) => handleInputChange('short', e.target.value)}
                  placeholder="One-line description of the script"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail Image</Label>
                <ImageUpload
                  value={formData.thumbnail}
                  onChange={(url) => handleInputChange('thumbnail', url)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload an image or drag and drop. Recommended size: 1280×720 or 1920×1080
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workink_url">Work.ink URL</Label>
                <Input
                  id="workink_url"
                  value={formData.workink_url}
                  onChange={(e) => handleInputChange('workink_url', e.target.value)}
                  placeholder="https://work.ink/pc/your-link"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  placeholder="1.0.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="release_date">Release Date</Label>
                <Input
                  id="release_date"
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => handleInputChange('release_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={formData.tags?.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleArrayChange('tags', tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((feature) => (
                  <Badge
                    key={feature}
                    variant={formData.features?.includes(feature) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleArrayChange('features', feature)}
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description with markdown formatting..."
                rows={6}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateScriptMutation.isPending}>
              {updateScriptMutation.isPending ? 'Updating...' : 'Update Script'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

