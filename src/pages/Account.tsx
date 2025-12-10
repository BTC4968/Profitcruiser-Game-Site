import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchUserChats, fetchUserOrders, fetchUserKeys } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Copy, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const Account = () => {
  const { token, user, logout } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: orderData } = useQuery({
    queryKey: ['orders'],
    enabled: Boolean(token),
    queryFn: () => fetchUserOrders(token ?? '')
  });

  const { data: chatData } = useQuery({
    queryKey: ['chats'],
    enabled: Boolean(token),
    queryFn: () => fetchUserChats(token ?? '')
  });

  const { data: keysData } = useQuery({
    queryKey: ['keys'],
    enabled: Boolean(token),
    queryFn: () => fetchUserKeys(token ?? '')
  });

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success('Key copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isKeyExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatOrderStatus = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payed';
      case 'failed':
        return 'Payment Feiled';
      case 'pending':
        return 'Awaiting payment';
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
      return 'Betaling';
    }
    if (payment.providerLabel) {
      return payment.providerLabel;
    }
    const provider = payment.provider;
    if (!provider) {
      return 'Betaling';
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-foreground">
            <span className="text-primary">Profit</span>Cruiser
          </Link>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Button asChild variant="outline">
                <Link to="/admin">Open Adminpanel</Link>
              </Button>
            )}
            <Button variant="outline" onClick={logout}>
            Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-10">
        <section className="glass-card border border-border/60 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-4">Account</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <p className="uppercase tracking-[0.25em] text-xs text-muted-foreground/70">Username</p>
              <p className="text-lg text-foreground">{user?.username}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.25em] text-xs text-muted-foreground/70">Email</p>
              <p className="text-lg text-foreground">{user?.email}</p>
            </div>
          </div>
        </section>

        <section className="glass-card border border-border/60 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Orders</h2>
            <Link to="/robux" className="text-sm text-primary hover:underline">
              Buy More Robux
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orderData?.orders.map((order) => (
                  <tr key={order.id} className="text-foreground">
                    <td className="py-3">{order.id}</td>
                    <td className="py-3">{order.product}</td>
                    <td className="py-3">
                      {order.currency} {order.amount.toFixed(2)}
                    </td>
                    <td className="py-3">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="py-3 capitalize">
                      <div>{formatOrderStatus(order.status)}</div>
                      {order.payment?.status && (
                        <div className="text-xs text-muted-foreground">
                          {formatProviderLabel(order.payment)}:{' '}
                          {formatProviderStatus(order.payment.status)}
                        </div>
                      )}
                      {order.payment?.payCurrency && order.payment?.payAmount != null && (
                        <div className="text-xs text-muted-foreground">
                          {order.payment.payAmount}{' '}
                          {order.payment.payCurrency.toUpperCase()}
                        </div>
                      )}
                      {order.payment?.invoiceUrl && order.status !== 'paid' && (
                        <a
                          href={order.payment.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-xs text-primary hover:underline"
                        >
                          Complete Payment
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {orderData && orderData.orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass-card border border-border/60 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">My Keys</h2>
            <Link to="/keys" className="text-sm text-primary hover:underline">
              Buy More Keys
            </Link>
          </div>

          {keysData?.keys && keysData.keys.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {keysData.keys.map((userKey) => {
                const expired = isKeyExpired(userKey.expiresAt);
                return (
                  <Card
                    key={userKey.id}
                    className={`border ${
                      expired ? 'border-destructive/50 opacity-60' : 'border-border/60'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Key className="w-5 h-5 text-primary" />
                          {userKey.duration} - {userKey.productType}
                        </CardTitle>
                        {expired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Order: {userKey.orderId} • Assigned: {new Date(userKey.assignedAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/40">
                          <code className="text-sm font-mono flex-1 break-all">{userKey.key}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(userKey.key)}
                            className="ml-2 shrink-0"
                          >
                            {copiedKey === userKey.key ? (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {expired ? 'Expired' : 'Expires'}: {new Date(userKey.expiresAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-8 text-center">
              <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">You don't have any keys yet.</p>
              <Button asChild>
                <Link to="/keys">Browse Key Store</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="glass-card border border-border/60 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Chats</h2>
            <a
              href="https://discord.gg/M8RUGdQcng"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Open Discord
            </a>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {chatData?.chats.map((chat) => (
              <li
                key={chat.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3"
              >
                <span>
                  Orders {chat.orderId} • {chat.status === 'open' ? 'Open' : 'Closed'}
                </span>
                <span>{chat.lastActivityAt ? new Date(chat.lastActivityAt).toLocaleString() : 'N/A'}</span>
              </li>
            ))}
            {chatData && chatData.chats.length === 0 && (
              <li className="rounded-xl border border-border/60 bg-background/80 px-4 py-5 text-center">
                No chats started yet. A private thread will open automatically when you place an order.
              </li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Account;

