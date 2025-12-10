import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { fetchKeyProducts, createKeyOrder } from '@/lib/api';
import { toast } from 'sonner';
import { ShoppingCart, Check, Clock, Package } from 'lucide-react';
import { CryptoPaymentSelector } from '@/components/CryptoPaymentSelector';
import { CardPaymentSelector } from '@/components/CardPaymentSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, CreditCard } from 'lucide-react';

const KeyStore = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentTab, setPaymentTab] = useState<string>('crypto');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['key-products'],
    queryFn: fetchKeyProducts
  });

  const { data: providersData } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: () => import('@/lib/api').then(m => m.fetchPaymentProviders())
  });

  const allProviders = providersData?.providers ?? [];
  const cryptoProviders = allProviders.filter(p => p.type === 'crypto');
  const cardProviders = allProviders.filter(p => p.type === 'card');

  const purchaseMutation = useMutation({
    mutationFn: (product: { id: string; productType: string; duration: string; price: number; currency: string; description: string }) =>
      createKeyOrder(token ?? '', {
        amount: product.price,
        currency: product.currency,
        product: product.description,
        productType: product.productType,
        duration: product.duration,
        paymentMethod: selectedPaymentMethod ?? undefined
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['keys'] });

      const paymentUrl = response?.payment?.invoiceUrl ?? response?.order?.payment?.invoiceUrl ?? null;
      const providerLabel = response?.payment?.providerLabel ?? 'the payment gateway';

      if (paymentUrl) {
        toast.success(`Redirecting you to ${providerLabel}…`);
        setTimeout(() => {
          window.location.assign(paymentUrl);
        }, 150);
        return;
      }

      toast.success('Order registered! Your key will be assigned after payment confirmation.');
      navigate('/account');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Could not complete the order');
    }
  });

  const handlePurchase = (product: typeof productsData.products[0]) => {
    if (!user || !token) {
      toast.error('You must log in to purchase keys.');
      navigate('/login', { state: { from: '/keys' } });
      return;
    }

    if (!product.inStock) {
      toast.error('This product is out of stock.');
      return;
    }

    if (selectedPaymentMethod) {
      setSelectedProduct(product.id);
      purchaseMutation.mutate(product);
    } else {
      setSelectedProduct(product.id);
    }
  };

  const products = productsData?.products || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border backdrop-blur bg-background/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-foreground">
            <span className="text-primary">Profit</span>Cruiser
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/">Home</Link>
            </Button>
            <Button asChild>
              <Link to="/account">My Account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
            Key Store
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Purchase premium license keys for exclusive access to our scripts
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : (
          <>
            {selectedProduct && (() => {
              const product = products.find(p => p.id === selectedProduct);
              if (!product) return null;
              
              return (
                <div className="mb-8 glass-card border border-border/60 rounded-xl p-6">
                  <Tabs value={paymentTab} onValueChange={setPaymentTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="crypto" className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Crypto
                      </TabsTrigger>
                      <TabsTrigger value="card" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Card
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="crypto">
                      {cryptoProviders.length > 0 ? (
                        <CryptoPaymentSelector
                          selectedMethod={selectedPaymentMethod}
                          onMethodChange={setSelectedPaymentMethod}
                          totalPrice={product.price}
                          currency={product.currency}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            Crypto payments are not available at the moment
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="card">
                      {cardProviders.length > 0 ? (
                        <CardPaymentSelector
                          selectedMethod={selectedPaymentMethod}
                          onMethodChange={setSelectedPaymentMethod}
                          totalPrice={product.price}
                          currency={product.currency}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            Card payments are not available at the moment
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              );
            })()}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const isSelected = selectedProduct === product.id;
                const isOutOfStock = !product.inStock;

                return (
                  <Card
                    key={product.id}
                    className={`relative overflow-hidden transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${isOutOfStock ? 'opacity-60' : 'hover:shadow-lg'}`}
                  >
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                        <Badge variant="destructive" className="text-lg px-4 py-2">
                          Out of Stock
                        </Badge>
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-2xl">{product.duration}</CardTitle>
                        {product.inStock && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {product.stockCount} left
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{product.description}</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-primary">
                            {product.price.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">{product.currency}</span>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            <span>Unique license key</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            <span>Instant delivery after payment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            <span>One-time use only</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(product)}
                        disabled={isOutOfStock || purchaseMutation.isPending}
                        size="lg"
                      >
                        {purchaseMutation.isPending && isSelected ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isSelected && !selectedPaymentMethod
                              ? 'Select Payment Method Above'
                              : 'Purchase Key'}
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12 glass-card rounded-xl">
                <p className="text-lg text-muted-foreground">No key products available at this time.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default KeyStore;

