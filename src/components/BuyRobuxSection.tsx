import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Sparkles, Timer, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { createRobuxOrder, fetchPaymentProviders } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CryptoPaymentSelector } from '@/components/CryptoPaymentSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const BASE_MARKET_PRICE = 0.0039; // €0.0039 per Robux (reference)
const PROFITCRUISER_MARKUP = 1.6; // 60% increase
const PRICE_PER_ROBUX = BASE_MARKET_PRICE * PROFITCRUISER_MARKUP; // €0.00624
const MIN_ROBUX = 400;
const MAX_ROBUX = 20000;
const STEP_ROBUX = 200;

const euroFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const euroDetailedFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const quickSelectPacks = [800, 2000, 5000, 10000, 20000];

export const BuyRobuxSection = () => {
  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentTab, setPaymentTab] = useState<string>('crypto');
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const { data: providerData } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: fetchPaymentProviders,
    staleTime: 1000 * 60 * 10
  });

  const allProviders = providerData?.providers ?? [];
  const cryptoProviders = allProviders.filter(p => p.type === 'crypto');
  const traditionalProviders = allProviders.filter(p => p.type !== 'crypto');

  const currentProviders = paymentTab === 'crypto' ? cryptoProviders : traditionalProviders;

  useEffect(() => {
    if (currentProviders.length === 0) {
      setSelectedMethod(null);
      return;
    }
    if (!selectedMethod || !currentProviders.find(p => p.key === selectedMethod)) {
      setSelectedMethod(currentProviders[0]?.key || null);
    }
  }, [currentProviders, selectedMethod, paymentTab]);

  const selectedProvider = currentProviders.find((provider) => provider.key === selectedMethod) ?? null;

  const purchaseMutation = useMutation({
    mutationFn: () =>
      createRobuxOrder(token ?? '', {
        amount: Number(totalPrice.toFixed(2)),
        currency: 'EUR',
        product: 'Robux',
        robuxAmount: selectedAmount,
        paymentMethod: selectedMethod ?? undefined
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });

      const paymentUrl = response?.payment?.invoiceUrl ?? response?.order?.payment?.invoiceUrl ?? null;
      const providerLabel = response?.payment?.providerLabel ?? selectedProvider?.label ?? 'the payment gateway';

      if (paymentUrl) {
        toast.success(`Redirecting you to ${providerLabel}…`);
        setTimeout(() => {
          window.location.assign(paymentUrl);
        }, 150);
        return;
      }

      toast.success('Order registered! A private chat has been opened.');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Could not complete the order');
    }
  });

  const totalPrice = useMemo(
    () => selectedAmount * PRICE_PER_ROBUX,
    [selectedAmount],
  );
  const deliveryWindow = '1 Day';

  const handlePurchase = () => {
    if (!user || !token) {
      toast.error('You must log in to purchase Robux.');
      navigate('/login', { state: { from: '/robux' } });
      return;
    }

    if (!selectedMethod) {
      toast.error('Select a payment method before continuing.');
      return;
    }

    purchaseMutation.mutate();
  };

  return (
    <section className="mt-20">
      <div className="glass-card rounded-3xl border border-border/60 bg-background/70 p-10 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="uppercase tracking-[0.3em] text-xs text-primary/80 font-semibold">
              ProfitCruiser Marketplace
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
              Robux Store
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Skip the queue and secure Robux straight from the ProfitCruiser vault. Our premium pricing guarantees stock,
              personal handling, and private delivery for every order.
            </p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-2 rounded-full bg-primary/10 text-primary border-primary/30">
            <Sparkles className="w-4 h-4 mr-2" /> Premium Access Only
          </Badge>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
          <div className="space-y-8">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
                <Sparkles className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-semibold text-lg">Curated Supply</h3>
                <p className="text-sm text-muted-foreground mt-1">
                Robux will almost always be in stock, but if we’re out, the purchase won’t go through..
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
                <ShieldCheck className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-semibold text-lg">Manual Verification</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Every transfer is verified by the ProfitCruiser staff so your balance lands safely without flags.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
                <Timer className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-semibold text-lg">Scheduled Delivery</h3>
                <p className="text-sm text-muted-foreground mt-1">
                Choose the amount you need and get a private ETA.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-background/80 p-6">
              <h3 className="text-xl font-semibold mb-4">How to Purchase</h3>
              <ol className="space-y-3 text-muted-foreground text-sm list-decimal list-inside">
                <li>Select the Robux amount and finish checkout with our premium rate.</li>
                <li>Redirecting you to an admin chat.
                Replies are usually between 07–10 and 16–22 (EU time)</li>
                <li>Stay online while our staff delivers the Robux through a secure private server.</li>
                <li>Confirm receipt and rate your experience to unlock loyalty upgrades.</li>
              </ol>
            </div>

            <div className="rounded-3xl border border-primary/40 bg-primary/5 p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span role="img" aria-hidden="true">
                    💡
                  </span>
                  How It Works
                </h3>
                <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Create a Gamepass or T-shirt linked to your Roblox account.</li>
                  <li>
                    After your payment is completed, provide the direct link to your Gamepass or T-shirt in the order chat.
                  </li>
                  <li>
                    Once we purchase your item, Robux will be pending for 3–5 days as per Roblox’s standard processing time.
                  </li>
                  <li>After the pending period the Robux will be available in your account.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-center md:text-left">
                  👉🏻 Special Service  👈🏻
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                When a purchase is above 20k, we handle the transfer one-on-one for safety reasons. If you want to buy more than that, please join the Discord and create a ticket.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span role="img" aria-hidden="true">
                    ⚠️
                  </span>
                  Important Notes
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>
                    Roblox applies a 30% tax on all sales. If you sell an item for 1,000 Robux, you’ll receive about 700 Robux
                    after tax.
                  </li>
                  <li>
                    Once your Gamepass is purchased, the pending time or any issues related to delayed Robux are fully handled by
                    Roblox.
                  </li>
                  <li>
                    Buying Robux from third parties is against Roblox’s Terms of Service, so please proceed at your own risk.
                  </li>
                  <li>
                  If you want to pay with another payment method, please join the Discord and open a ticket — we’re thrilled to help you!
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(132,94,247,0.18),_transparent_60%)]" />
            <CardHeader className="relative">
              <CardTitle className="text-2xl">Price</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs uppercase tracking-wide">Premium rate</Badge>
                <span>Includes concierge verification</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.25em]">
                  Selected Robux
                </Label>
                <p className="text-4xl font-bold text-foreground mt-2">
                  {selectedAmount.toLocaleString('en-US')} <span className="text-lg text-muted-foreground">RBX</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-[0.3em]">
                    <span>{MIN_ROBUX.toLocaleString('en-US')}</span>
                    <span>{MAX_ROBUX.toLocaleString('en-US')}</span>
                  </div>
                  <Slider
                    value={[selectedAmount]}
                    min={MIN_ROBUX}
                    max={MAX_ROBUX}
                    step={STEP_ROBUX}
                    onValueChange={(value) => setSelectedAmount(value[0])}
                    aria-label="Robux amount"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {quickSelectPacks.map((pack) => (
                    <Button
                      key={pack}
                      type="button"
                      variant={selectedAmount === pack ? 'default' : 'outline'}
                      className="flex-1 min-w-[110px]"
                      onClick={() => setSelectedAmount(pack)}
                    >
                      {pack.toLocaleString('en-US')}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.25em]">
                  Payment Method
                </Label>
                
                <Tabs value={paymentTab} onValueChange={setPaymentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="crypto" className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Crypto
                    </TabsTrigger>
                    <TabsTrigger value="traditional" className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Coming Soon
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="crypto" className="mt-4">
                    {cryptoProviders.length > 0 ? (
                      <CryptoPaymentSelector
                        selectedMethod={selectedMethod}
                        onMethodChange={setSelectedMethod}
                        totalPrice={totalPrice}
                        currency="EUR"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Crypto payments are not available at the moment
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="traditional" className="mt-4">
                    <Select
                      value={selectedMethod ?? undefined}
                      onValueChange={(value) => setSelectedMethod(value)}
                      disabled={traditionalProviders.length === 0}
                    >
                      <SelectTrigger className="bg-background/80">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {traditionalProviders.map((provider) => (
                          <SelectItem key={provider.key} value={provider.key}>
                            {provider.label}
                            {provider.payCurrency ? ` · ${provider.payCurrency.toUpperCase()}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {traditionalProviders.length === 0 ? (
                      <p className="text-xs text-muted-foreground mt-2">
                        No traditional payment methods are available. Try crypto payments instead.
                      </p>
                    ) : selectedProvider ? (
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedProvider.supportsRedirect
                          ? 'You will be redirected to payment after ordering.'
                          : 'Card payment coming soon'}
                      </p>
                    ) : null}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-3 rounded-2xl border border-primary/40 bg-primary/10 p-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>ProfitCruiser rate</span>
                  <span className="font-semibold text-foreground">{euroDetailedFormatter.format(PRICE_PER_ROBUX)}</span>
                </div>
                <div className="border-t border-primary/30 pt-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">Total</p>
                  <p className="text-3xl font-semibold text-primary">{euroFormatter.format(totalPrice)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Includes manual verification and scheduled delivery.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/80 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <Timer className="w-4 h-4 text-primary" /> Delivery ETA
                  </span>
                  <span>{deliveryWindow}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <Wallet className="w-4 h-4 text-primary" /> Payment
                  </span>
                  <span>
                    {selectedProvider
                      ? `${selectedProvider.label}${selectedProvider.payCurrency ? ` · ${selectedProvider.payCurrency.toUpperCase()}` : ''}`
                      : 'Velg betalingsmetode'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Need a custom amount or region? Open a Discord ticket and we&apos;ll tailor a premium delivery.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1"
                  size="lg"
                  type="button"
                  onClick={handlePurchase}
                  disabled={
                    purchaseMutation.isPending || !selectedMethod || currentProviders.length === 0
                  }
                >
                  {purchaseMutation.isPending ? 'Processing...' : 'Buy Now'}
                </Button>
                <Button variant="outline" size="lg" className="flex-1" asChild>
                  <a href="https://discord.gg/M8RUGdQcng" target="_blank" rel="noopener noreferrer">
                    Chat on Discord
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BuyRobuxSection;
