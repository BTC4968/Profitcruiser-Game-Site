import { CreditCard, Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CardPaymentSelectorProps {
  selectedMethod: string | null;
  onMethodChange: (method: string) => void;
  totalPrice: number;
  currency: string;
}

export const CardPaymentSelector = ({
  selectedMethod,
  onMethodChange,
  totalPrice,
  currency
}: CardPaymentSelectorProps) => {
  const isStripeSelected = selectedMethod === 'stripe';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Card Payment</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pay securely with your credit or debit card via Stripe
        </p>
      </div>

      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          isStripeSelected
            ? 'ring-2 ring-primary border-primary'
            : 'hover:border-primary/50'
        }`}
        onClick={() => onMethodChange('stripe')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background/80 text-primary">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Credit/Debit Card</span>
                  <Badge variant="outline" className="text-xs">
                    Stripe
                  </Badge>
                  {isStripeSelected && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Visa, Mastercard, Amex, and more
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium">
                {totalPrice.toFixed(2)} {currency}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span>
          Your payment is processed securely by Stripe. We never store your card details.
        </span>
      </div>
    </div>
  );
};

