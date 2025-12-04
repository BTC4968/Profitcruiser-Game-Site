import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bitcoin, Coins, DollarSign, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCryptoPrices, fetchPaymentProviders } from '@/lib/api';

interface CryptoPaymentSelectorProps {
  selectedMethod: string | null;
  onMethodChange: (method: string) => void;
  totalPrice: number;
  currency: string;
}

const cryptoIcons = {
  btc: Bitcoin,
  eth: Coins,
  usdterc20: DollarSign,
  usdcerc20: DollarSign
};

const cryptoColors = {
  btc: 'text-orange-500',
  eth: 'text-blue-500',
  usdterc20: 'text-green-500',
  usdcerc20: 'text-blue-600'
};

export const CryptoPaymentSelector = ({ 
  selectedMethod, 
  onMethodChange, 
  totalPrice, 
  currency 
}: CryptoPaymentSelectorProps) => {
  const [cryptoAmounts, setCryptoAmounts] = useState<Record<string, number>>({});

  const { data: providerData } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: fetchPaymentProviders,
    staleTime: 1000 * 60 * 10
  });

  const { data: cryptoData } = useQuery({
    queryKey: ['crypto-prices'],
    queryFn: fetchCryptoPrices,
    staleTime: 1000 * 60 * 2, // Refresh every 2 minutes
    refetchInterval: 1000 * 60 * 2
  });

  const cryptoProviders = providerData?.providers?.filter(p => p.type === 'crypto') ?? [];
  const cryptoPrices = cryptoData?.prices ?? {};
  const currencies = cryptoData?.currencies ?? [];

  // Calculate crypto amounts when prices change
  useEffect(() => {
    const amounts: Record<string, number> = {};
    
    currencies.forEach(crypto => {
      const priceKey = `currency_${crypto.code.toLowerCase()}`;
      const price = cryptoPrices[priceKey];
      
      if (price && price > 0) {
        amounts[crypto.code] = totalPrice / price;
      } else {
        // Fallback: use estimated amounts when prices aren't available
        const fallbackRates = {
          btc: 0.000025, // Rough estimate: 1 EUR ≈ 0.000025 BTC
          eth: 0.0004,   // Rough estimate: 1 EUR ≈ 0.0004 ETH
          usdterc20: 1.0, // 1 EUR ≈ 1 USDT
          usdcerc20: 1.0  // 1 EUR ≈ 1 USDC
        };
        
        const fallbackRate = fallbackRates[crypto.code as keyof typeof fallbackRates];
        if (fallbackRate) {
          amounts[crypto.code] = totalPrice * fallbackRate;
        }
      }
    });

    setCryptoAmounts(amounts);
  }, [cryptoPrices, totalPrice, currencies]);

  const formatCryptoAmount = (amount: number, decimals: number = 6) => {
    if (amount < 0.000001) {
      return amount.toExponential(2);
    }
    return amount.toFixed(decimals).replace(/\.?0+$/, '');
  };

  const getCryptoIcon = (code: string) => {
    const IconComponent = cryptoIcons[code as keyof typeof cryptoIcons] || Coins;
    return IconComponent;
  };

  const getCryptoColor = (code: string) => {
    return cryptoColors[code as keyof typeof cryptoColors] || 'text-gray-500';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Crypto Payment</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select your preferred cryptocurrency to complete the payment
        </p>
      </div>

      <div className="grid gap-3">
        {cryptoProviders.map((provider) => {
          const cryptoCode = provider.payCurrency?.toLowerCase();
          const cryptoInfo = currencies.find(c => c.code.toLowerCase() === cryptoCode);
          const cryptoAmount = cryptoAmounts[cryptoCode || ''];
          const IconComponent = getCryptoIcon(cryptoCode || '');
          const colorClass = getCryptoColor(cryptoCode || '');

          if (!cryptoInfo || !cryptoAmount) return null;

          return (
            <Card 
              key={provider.key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedMethod === provider.key 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onMethodChange(provider.key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-background/80 ${colorClass}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{cryptoInfo.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {cryptoInfo.symbol}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCryptoAmount(cryptoAmount)} {cryptoCode?.toUpperCase()}
                        {Object.keys(cryptoPrices).length === 0 && (
                          <span className="text-xs text-orange-500 ml-1">(est.)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCryptoAmount(cryptoAmount, 8)} {cryptoCode?.toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ≈ {totalPrice.toFixed(2)} {currency}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cryptoData?.timestamp && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span>
            {Object.keys(cryptoPrices).length > 0 
              ? `Prices updated ${new Date(cryptoData.timestamp).toLocaleTimeString()}`
              : 'Using estimated prices - live rates will be calculated at checkout'
            }
          </span>
        </div>
      )}

      {cryptoProviders.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Coins className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Crypto payments are not available at the moment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
