import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Link } from 'react-router-dom';
import {
  fetchAdminOverview,
  type AdminOverviewResponse,
  updateAdminSettings,
  updateScriptVisibility,
  fetchAdminScripts,
  createScript,
  updateScript,
  deleteScript,
  fetchRobuxSettings,
  updateRobuxSettings,
  fetchScripts,
  type ScriptData,
  type RobuxSettings
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AddScriptDialog } from '@/components/AddScriptDialog';
import { EditScriptDialog } from '@/components/EditScriptDialog';
import { DeleteScriptDialog } from '@/components/DeleteScriptDialog';
import { RobuxSettingsDialog } from '@/components/RobuxSettingsDialog';
import AdminChatManager from '@/components/AdminChatManager';
import KeyManager from '@/components/KeyManager';
import { toast } from 'sonner';

const formatDate = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const formatOrderStatus = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Failed';
    case 'pending':
      return 'Pending';
    default:
      return status;
  }
};

const formatProviderStatus = (status?: string | null) => {
  if (!status) {
    return null;
  }
  return status.replace(/_/g, ' ');
};

const formatProviderLabel = (payment?: { provider?: string | null; providerLabel?: string | null } | null) => {
  if (!payment) {
    return 'Payment';
  }
  if (payment.providerLabel) {
    return payment.providerLabel;
  }
  const provider = payment.provider;
  if (!provider) {
    return 'Payment';
  }
  if (provider.toLowerCase() === 'nowpayments') {
    return 'NOWPayments';
  }
  return provider
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const AdminDashboard = () => {
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [settingsDraft, setSettingsDraft] = useState<Record<string, unknown>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    enabled: Boolean(token),
    queryFn: () => fetchAdminOverview(token ?? '')
  });

  const { data: scriptsData } = useQuery({
    queryKey: ['scripts'],
    queryFn: fetchScripts,
    staleTime: 1000 * 60 * 5
  });

  const scriptTitles = useMemo(
    () => Object.fromEntries((scriptsData?.scripts ?? []).map((script) => [script.slug, script.title])),
    [scriptsData]
  );

  const visibilityMutation = useMutation({
    mutationFn: ({ slug, hidden }: { slug: string; hidden: boolean }) =>
      updateScriptVisibility(token ?? '', slug, hidden),
    onSuccess: (_, variables) => {
      toast.success(
        variables.hidden ? `Skjulte ${variables.slug}` : `Viser ${variables.slug}`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Kunne ikke oppdatere script');
    }
  });

  const settingsMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateAdminSettings(token ?? '', payload),
    onSuccess: () => {
      toast.success('Innstillinger oppdatert');
      setSettingsDraft({});
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Kunne ikke lagre innstillinger');
    }
  });

  if (!data || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Laster adminpanel...
        </div>
      </div>
    );
  }

  const totalScripts = scriptsData?.scripts?.length ?? 0;
  const hiddenSlugs = new Set(data.visibility.filter((item) => item.hidden).map((item) => item.slug));
  const visibleScripts = totalScripts - hiddenSlugs.size;

  const handleSettingsChange = (field: string, value: unknown) => {
    setSettingsDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    if (Object.keys(settingsDraft).length === 0) {
      toast.info('Ingen endringer å lagre.');
      return;
    }
    settingsMutation.mutate(settingsDraft);
  };

  const settings = data.settings as AdminOverviewResponse['settings'];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Adminpanel • <span className="text-primary">Profit</span>Cruiser
            </h1>
            <p className="text-sm text-muted-foreground">
              Total kontroll over scripts, robux-salg og support.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="destructive" onClick={logout}>
            Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-10">
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Synlige scripts
            </p>
            <p className="text-3xl font-semibold text-foreground">{visibleScripts}</p>
            <p className="text-xs text-muted-foreground mt-2">{totalScripts} totalt (inkl. skjulte)</p>
          </div>
          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Total views</p>
            <p className="text-3xl font-semibold text-foreground">{data.totals.views.toLocaleString('no-NO')}</p>
            <p className="text-xs text-muted-foreground mt-2">Oppdatert: {formatDate(data.totals.lastActivity)}</p>
          </div>
          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Active Buyer</p>
            <p className="text-3xl font-semibold text-foreground">{data.totals.activeBuyers}</p>
            <p className="text-xs text-muted-foreground mt-2">Siste 30 dager</p>
          </div>
          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Open chats</p>
            <p className="text-3xl font-semibold text-foreground">{data.totals.openChats}</p>
            <p className="text-xs text-muted-foreground mt-2">Gj.sn. svartid {data.charts.averageChatResponseMinutes} min</p>
          </div>
        </section>

        {/* Chat Management Section */}
        <AdminChatManager />

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Views per dag</h2>
              <Badge variant="secondary">Cloudflare + D1</Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.viewsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.45)" />
                  <YAxis stroke="rgba(255,255,255,0.45)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(18,18,24,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Sales last week</h2>
              <Badge variant="secondary">Robux + tjenester</Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.salesLast30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.45)" hide />
                  <YAxis stroke="rgba(255,255,255,0.45)" />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Omsetning']}
                    contentStyle={{
                      backgroundColor: 'rgba(18,18,24,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                  <Bar dataKey="total" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <h2 className="text-xl font-semibold mb-4">🥇 Mest viste scripts</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {data.charts.topScripts.map((item) => (
                <li key={item.slug} className="flex items-center justify-between">
                  <span>
                    {scriptTitles[item.slug] ?? item.slug}
                  </span>
                  <span>{item.views.toLocaleString('no-NO')} Views</span>
                </li>
              ))}
              {data.charts.topScripts.length === 0 && (
                <li className="text-center text-muted-foreground">Ingen registrerte visninger ennå.</li>
              )}
            </ul>
          </div>

          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <h2 className="text-xl font-semibold mb-4">💵 Mest kjøpte produkter</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {data.charts.topProducts.map((item) => (
                <li key={item.product} className="flex items-center justify-between">
                  <span>{item.product}</span>
                  <span>{item.sales} kjøp</span>
                </li>
              ))}
              {data.charts.topProducts.length === 0 && (
                <li className="text-center text-muted-foreground">Ingen salg registrert.</li>
              )}
            </ul>
          </div>
        </section>

        <section className="glass-card rounded-2xl border border-border/60 p-6">
          <h2 className="text-xl font-semibold mb-6">Payments / Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.orders.map((order) => (
                  <tr key={order.id} className="text-foreground">
                    <td className="py-3">{order.id}</td>
                    <td className="py-3">{order.username}</td>
                    <td className="py-3">
                      ${order.amount.toFixed(2)} {order.currency}
                    </td>
                    <td className="py-3">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="py-3">{order.product}</td>
                    <td className="py-3 capitalize">
                      <div>{formatOrderStatus(order.status)}</div>
                      {order.payment?.status && (
                        <div className="text-xs text-muted-foreground">
                          {formatProviderLabel(order.payment)}: {formatProviderStatus(order.payment.status)}
                        </div>
                      )}
                      {order.payment?.payCurrency && order.payment?.payAmount != null && (
                        <div className="text-xs text-muted-foreground">
                          {order.payment.payAmount}{' '}
                          {order.payment.payCurrency.toUpperCase()}
                        </div>
                      )}
                      {order.payment?.invoiceUrl && (
                        <a
                          href={order.payment.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-xs text-primary hover:underline"
                        >
                          Open invoice
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {data.orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      Ingen ordre registrert ennå.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass-card rounded-2xl border border-border/60 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Scriptadministrasjon</h2>
              <p className="text-sm text-muted-foreground">Skjul eller aktiver scripts uten å røre kildekoden.</p>
            </div>
            <Badge variant="outline">Totalt {totalScripts}</Badge>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(scriptsData?.scripts ?? []).map((script) => {
              const isHidden = hiddenSlugs.has(script.slug);
              return (
                <div
                  key={script.slug}
                  className="border border-border/60 rounded-xl bg-background/70 px-4 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{script.title}</p>
                    <p className="text-xs text-muted-foreground">/{script.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Skjul</span>
                    <Switch
                      checked={isHidden}
                      onCheckedChange={(value) =>
                        visibilityMutation.mutate({ slug: script.slug, hidden: value })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-card rounded-2xl border border-border/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Brand & API</h2>
              <p className="text-sm text-muted-foreground">
                Oppdater logo, tittel, nøkler og betalingsinfo for Revolut/Stripe.
              </p>
            </div>
            <Button onClick={handleSaveSettings} disabled={settingsMutation.isPending || Object.keys(settingsDraft).length === 0}>
              Lagre endringer
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sidetittel</label>
                <Input
                  defaultValue={(settings.siteName as string) ?? ''}
                  onChange={(event) => handleSettingsChange('siteName', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Tagline</label>
                <Textarea
                  defaultValue={(settings.siteTagline as string) ?? ''}
                  onChange={(event) => handleSettingsChange('siteTagline', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Logo URL</label>
                <Input
                  defaultValue={(settings.logoUrl as string) ?? ''}
                  onChange={(event) => handleSettingsChange('logoUrl', event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Stripe API</label>
                <Input
                  defaultValue={(settings.stripeKey as string) ?? ''}
                  onChange={(event) => handleSettingsChange('stripeKey', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Payhip API</label>
                <Input
                  defaultValue={(settings.payhipKey as string) ?? ''}
                  onChange={(event) => handleSettingsChange('payhipKey', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Work.ink API</label>
                <Input
                  defaultValue={(settings.workinkKey as string) ?? ''}
                  onChange={(event) => handleSettingsChange('workinkKey', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Revolut IBAN</label>
                <Input
                  defaultValue={(settings.revolutIban as string) ?? ''}
                  onChange={(event) => handleSettingsChange('revolutIban', event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm">
              <span>Chat aktiv</span>
              <Switch
                checked={Boolean(settingsDraft.chatEnabled ?? settings.chatEnabled)}
                onCheckedChange={(value) => handleSettingsChange('chatEnabled', value)}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm">
              <span>Logging</span>
              <Switch
                checked={Boolean(settingsDraft.loggingEnabled ?? settings.loggingEnabled)}
                onCheckedChange={(value) => handleSettingsChange('loggingEnabled', value)}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm">
              <span>Varsler</span>
              <Switch
                checked={Boolean(settingsDraft.notificationsEnabled ?? settings.notificationsEnabled)}
                onCheckedChange={(value) => handleSettingsChange('notificationsEnabled', value)}
              />
            </label>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Systemlogg</h2>
              <Badge variant="secondary">Automatisk</Badge>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground max-h-72 overflow-y-auto pr-2">
              {data.activityLog.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                    {formatDate(entry.timestamp)}
                  </p>
                  <p className="text-foreground mt-1">{entry.message}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card rounded-2xl border border-border/60 p-6">
            <h2 className="text-xl font-semibold mb-4">Zero Trust</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Beskytt <code className="px-1 py-0.5 rounded bg-primary/10 text-primary">/admin</code> via Cloudflare Access. Tillat kun
              din e-post og bruk Google/Microsoft/GitHub for pålogging. 2FA, IP-begrensning og tokens håndteres direkte i
              Cloudflare-panelet – ingen passord lagres her.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              <li>• Zero Trust → Access → Applications → Protect a self-hosted app</li>
              <li>• URL: <code className="bg-primary/10 px-1 py-0.5 rounded">https://dittdomene.com/admin</code></li>
              <li>• Tillat kun din e-post (f.eks. didrik@...)</li>
              <li>• Aktiver 2FA og eventuelt IP-filter</li>
            </ul>
          </div>
        </section>

        <section className="glass-card rounded-2xl border border-border/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Script Management</h2>
              <p className="text-sm text-muted-foreground">Add, edit, and manage scripts directly from the admin panel.</p>
            </div>
            <AddScriptDialog />
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(scriptsData?.scripts ?? []).map((script) => (
                <div key={script.slug} className="border border-border/60 rounded-xl bg-background/70 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{script.title}</h3>
                      <p className="text-xs text-muted-foreground">/{script.slug}</p>
                    </div>
                    <Badge variant={script.status === 'active' ? 'default' : 'secondary'}>
                      {script.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{script.short}</p>
                  <div className="flex items-center gap-2">
                    <EditScriptDialog script={script}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </EditScriptDialog>
                    <DeleteScriptDialog script={script}>
                      <Button size="sm" variant="destructive">
                        Delete
                      </Button>
                    </DeleteScriptDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <KeyManager />

        <section className="glass-card rounded-2xl border border-border/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Robux Store Configuration</h2>
              <p className="text-sm text-muted-foreground">Configure Robux amounts, pricing, and quick select packs.</p>
            </div>
            <RobuxSettingsDialog />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Current Settings</h4>
            <div className="text-sm text-muted-foreground">
              <p>Click "Configure Store" to modify Robux store settings including min/max amounts, pricing, and quick select packs.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;

