import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { fetchAdminKeyStats, addKeysToPool, fetchKeyPool, removeKeyFromPool } from '@/lib/api';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Package, CheckCircle, Upload, FileText } from 'lucide-react';

const KeyManager = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [addKeysOpen, setAddKeysOpen] = useState(false);
  const [newKeys, setNewKeys] = useState('');
  const [duration, setDuration] = useState('1 day');
  const [uploadMethod, setUploadMethod] = useState<'paste' | 'file'>('paste');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: keyStats, isLoading } = useQuery({
    queryKey: ['admin-key-stats'],
    enabled: Boolean(token),
    queryFn: () => fetchAdminKeyStats(token ?? '')
  });

  const { data: poolData } = useQuery({
    queryKey: ['admin-key-pool', selectedPool],
    enabled: Boolean(token && selectedPool),
    queryFn: () => fetchKeyPool(token ?? '', selectedPool ?? '')
  });

  const addKeysMutation = useMutation({
    mutationFn: (keys: string[]) =>
      addKeysToPool(token ?? '', {
        productType: 'premium', // Fixed product type
        duration,
        keys
      }),
    onSuccess: (data) => {
      toast.success(`Added ${data.added} keys to pool (${data.duplicates} duplicates skipped)`);
      setNewKeys('');
      setAddKeysOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-key-stats'] });
      if (selectedPool === duration) {
        queryClient.invalidateQueries({ queryKey: ['admin-key-pool', selectedPool] });
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add keys');
    }
  });

  const removeKeyMutation = useMutation({
    mutationFn: (keyToRemove: string) =>
      removeKeyFromPool(token ?? '', selectedPool ?? '', keyToRemove),
    onSuccess: () => {
      toast.success('Key removed from pool');
      queryClient.invalidateQueries({ queryKey: ['admin-key-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-key-pool', selectedPool] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove key');
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setNewKeys(text);
        setUploadMethod('paste');
        toast.success('File loaded! Review the keys below and click "Add Keys" when ready.');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleAddKeys = () => {
    const keysArray = newKeys
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keysArray.length === 0) {
      toast.error('Please enter at least one key');
      return;
    }

    addKeysMutation.mutate(keysArray);
  };

  const pools = keyStats?.pools || {};
  const poolEntries = Object.entries(pools).sort(([a], [b]) => {
    // Sort by duration: 1 day, 7 days, 30 days
    const order = ['1 day', '7 days', '30 days'];
    const aDuration = a.split('-')[1] || '';
    const bDuration = b.split('-')[1] || '';
    return (order.indexOf(aDuration) - order.indexOf(bDuration)) || a.localeCompare(b);
  });

  // Group pools by duration for better organization
  // Since pools are now duration-only, poolKey IS the duration
  const poolsByDuration: Record<string, Array<[string, typeof pools[string]]>> = {};
  poolEntries.forEach(([poolKey, stats]) => {
    const duration = poolKey; // Pool key is now just the duration
    if (!poolsByDuration[duration]) {
      poolsByDuration[duration] = [];
    }
    poolsByDuration[duration].push([poolKey, stats]);
  });

  return (
    <section className="glass-card rounded-2xl border border-border/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Key Management
          </h2>
          <p className="text-sm text-muted-foreground">Manage license key pools and track assignments.</p>
        </div>
        <Dialog open={addKeysOpen} onOpenChange={setAddKeysOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Keys to Pool
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Keys to Duration Pool</DialogTitle>
              <DialogDescription>
                Upload keys from a file or paste them manually. Keys will be added to the selected duration pool.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="duration-select">Duration Pool</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 day">1 Day Pool</SelectItem>
                    <SelectItem value="7 days">7 Days Pool</SelectItem>
                    <SelectItem value="30 days">30 Days Pool</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Keys will be added to the <strong>{duration}</strong> pool
                </p>
              </div>

              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'paste' | 'file')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="paste">
                    <FileText className="w-4 h-4 mr-2" />
                    Paste Keys
                  </TabsTrigger>
                  <TabsTrigger value="file">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="paste" className="space-y-4">
                  <div>
                    <Label htmlFor="keys">Keys (one per line)</Label>
                    <Textarea
                      id="keys"
                      value={newKeys}
                      onChange={(e) => setNewKeys(e.target.value)}
                      placeholder="KEY-12345-ABCDE&#10;KEY-67890-FGHIJ&#10;KEY-11111-KLMNO&#10;..."
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste keys from your document, one key per line. Empty lines will be ignored.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="file" className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Upload Key File</Label>
                    <div className="mt-2">
                      <Input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept=".txt,.doc,.docx"
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload a .txt, .doc, or .docx file containing keys (one per line). The file will be read and keys will appear in the paste area.
                      </p>
                    </div>
                    {newKeys && (
                      <div className="mt-4">
                        <Label>Preview ({newKeys.split('\n').filter(k => k.trim()).length} keys found)</Label>
                        <Textarea
                          value={newKeys}
                          onChange={(e) => setNewKeys(e.target.value)}
                          rows={8}
                          className="font-mono text-sm mt-2"
                          readOnly={false}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {newKeys && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>{newKeys.split('\n').filter(k => k.trim()).length}</strong> keys ready to add to{' '}
                    <strong>{duration}</strong> pool
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setAddKeysOpen(false);
                  setNewKeys('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddKeys} disabled={addKeysMutation.isPending || !newKeys.trim()}>
                  {addKeysMutation.isPending ? 'Adding...' : `Add Keys to ${duration} Pool`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading key statistics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pool Statistics - Organized by Duration */}
          <div className="space-y-4">
            {['1 day', '7 days', '30 days'].map((duration) => {
              const durationPools = poolsByDuration[duration] || [];
              if (durationPools.length === 0) {
                return (
                  <Card key={duration} className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{duration.charAt(0).toUpperCase() + duration.slice(1)} Pool</span>
                        <Badge variant="outline">Empty</Badge>
                      </CardTitle>
                      <CardDescription>No keys in this pool yet</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDuration(duration);
                          setAddKeysOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Keys to {duration} Pool
                      </Button>
                    </CardContent>
                  </Card>
                );
              }

              return durationPools.map(([poolKey, stats]) => {
                const assigned = keyStats?.assignedStats[poolKey] || 0;
                const poolDuration = poolKey; // Pool key is now just the duration
                return (
                  <Card key={poolKey}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{poolDuration.charAt(0).toUpperCase() + poolDuration.slice(1)} Pool</CardTitle>
                          <CardDescription>Key Pool Statistics</CardDescription>
                        </div>
                        <Badge variant={stats.available > 0 ? 'default' : 'destructive'}>
                          {stats.available > 0 ? `${stats.available} Available` : 'Out of Stock'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Available Keys</span>
                            <div className="text-2xl font-bold text-primary mt-1">{stats.available}</div>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Assigned Keys</span>
                            <div className="text-2xl font-bold mt-1">{assigned}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedPool(poolKey)}
                          >
                            View All Keys
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDuration(poolDuration);
                              setAddKeysOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Refill
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })}
          </div>

          {/* Pool Details */}
          {selectedPool && poolData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pool: {selectedPool}</CardTitle>
                    <CardDescription>{poolData.count} keys available</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPool(null)}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {poolData.keys.length > 0 ? (
                    poolData.keys.map((key, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/40"
                      >
                        <code className="text-sm font-mono flex-1">{key}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKeyMutation.mutate(key)}
                          disabled={removeKeyMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No keys in this pool</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total Statistics */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Total Assigned: {keyStats?.totalAssigned || 0}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default KeyManager;

