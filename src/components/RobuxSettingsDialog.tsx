import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { fetchRobuxSettings, updateRobuxSettings, type RobuxSettings } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const RobuxSettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<RobuxSettings>>({});

  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data: robuxData } = useQuery({
    queryKey: ['robux-settings'],
    queryFn: () => fetchRobuxSettings(token ?? ''),
    enabled: Boolean(token) && open
  });

  const updateRobuxMutation = useMutation({
    mutationFn: (settings: Partial<RobuxSettings>) => updateRobuxSettings(token ?? '', settings),
    onSuccess: () => {
      toast.success('Robux store settings updated successfully!');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['robux-settings'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    }
  });

  useEffect(() => {
    if (robuxData?.robuxSettings) {
      setFormData(robuxData.robuxSettings);
    }
  }, [robuxData]);

  const handleInputChange = (field: keyof RobuxSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuickSelectChange = (value: string) => {
    const packs = value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    setFormData(prev => ({ ...prev, quickSelectPacks: packs }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRobuxMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Configure Store
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Robux Store Configuration</DialogTitle>
          <DialogDescription>
            Configure the Robux store settings including amounts, pricing, and quick select packs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minRobux">Min Robux</Label>
                <Input
                  id="minRobux"
                  type="number"
                  value={formData.minRobux || ''}
                  onChange={(e) => handleInputChange('minRobux', parseInt(e.target.value) || 0)}
                  placeholder="400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRobux">Max Robux</Label>
                <Input
                  id="maxRobux"
                  type="number"
                  value={formData.maxRobux || ''}
                  onChange={(e) => handleInputChange('maxRobux', parseInt(e.target.value) || 0)}
                  placeholder="20000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stepRobux">Step Size</Label>
                <Input
                  id="stepRobux"
                  type="number"
                  value={formData.stepRobux || ''}
                  onChange={(e) => handleInputChange('stepRobux', parseInt(e.target.value) || 0)}
                  placeholder="200"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseMarketPrice">Base Market Price (€)</Label>
                <Input
                  id="baseMarketPrice"
                  type="number"
                  step="0.0001"
                  value={formData.baseMarketPrice || ''}
                  onChange={(e) => handleInputChange('baseMarketPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.0039"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="markup">Markup Multiplier</Label>
                <Input
                  id="markup"
                  type="number"
                  step="0.1"
                  value={formData.markup || ''}
                  onChange={(e) => handleInputChange('markup', parseFloat(e.target.value) || 0)}
                  placeholder="1.6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quickSelectPacks">Quick Select Packs</Label>
                <Input
                  id="quickSelectPacks"
                  value={formData.quickSelectPacks?.join(', ') || ''}
                  onChange={(e) => handleQuickSelectChange(e.target.value)}
                  placeholder="800, 2000, 5000, 10000, 20000"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of Robux amounts
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Preview</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Min: {formData.minRobux || 400} Robux</p>
              <p>Max: {formData.maxRobux || 20000} Robux</p>
              <p>Step: {formData.stepRobux || 200} Robux</p>
              <p>Price per Robux: €{((formData.baseMarketPrice || 0.0039) * (formData.markup || 1.6)).toFixed(4)}</p>
              <p>Quick Packs: {formData.quickSelectPacks?.join(', ') || '800, 2000, 5000, 10000, 20000'}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateRobuxMutation.isPending}>
              {updateRobuxMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

