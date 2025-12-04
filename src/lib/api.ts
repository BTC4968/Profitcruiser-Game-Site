const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5174';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export interface OrderPaymentInfo {
  provider: string;
  providerLabel?: string | null;
  invoiceId: string | null;
  invoiceUrl: string | null;
  status: string | null;
  payCurrency: string | null;
  payAmount: number | null;
  actuallyPaid: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PaymentProviderInfo {
  key: string;
  label: string;
  type: string;
  payCurrency: string | null;
  supportsRedirect: boolean;
}

export interface OrderSummary {
  id: string;
  userId?: string;
  username: string;
  amount: number;
  currency: string;
  product: string;
  status: string;
  createdAt: string;
  robuxAmount?: number | null;
  payment?: OrderPaymentInfo | null;
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ message: 'Request failed' }));
    throw new Error(message.message ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const fetchViewAnalytics = () => request<{ views: Record<string, number>; timeline: { date: string; count: number }[] }>('/api/views');

export const recordScriptView = (slug: string) =>
  request<{ slug: string; views: number; total: number }>(`/api/views/${encodeURIComponent(slug)}`, {
    method: 'POST'
  });

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: 'user' | 'admin';
  };
}

export const registerUser = (payload: { email: string; username: string; password: string }) =>
  request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: payload
  });

export const loginUser = (payload: { email: string; password: string }) =>
  request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: payload
  });

export const fetchCurrentUser = (token: string) =>
  request<{ id: string; email: string; username: string; role: 'user' | 'admin' }>('/api/auth/me', {
    token
  });

export interface RobuxOrderResponse {
  order: OrderSummary;
  chat: unknown;
  payment: OrderPaymentInfo | null | undefined;
}

export const createRobuxOrder = (
  token: string,
  payload: {
    amount: number;
    currency?: string;
    product: string;
    robuxAmount: number;
    paymentMethod?: string | null;
  }
) =>
  request<RobuxOrderResponse>('/api/orders', {
    method: 'POST',
    body: payload,
    token
  });

export const fetchPaymentProviders = () =>
  request<{ providers: PaymentProviderInfo[] }>('/api/payments/providers');

export interface CryptoPriceData {
  prices: Record<string, number>;
  currencies: Array<{ code: string; name: string; symbol: string }>;
  timestamp: string;
}

export const fetchCryptoPrices = () =>
  request<CryptoPriceData>('/api/crypto/prices');

export const fetchUserOrders = (token: string) =>
  request<{ orders: OrderSummary[] }>('/api/orders', {
    token
  });

export const fetchUserChats = (token: string) =>
  request<{ chats: Array<{ id: string; orderId: string; status: string; lastActivityAt: string }> }>('/api/chats', {
    token
  });

// Admin chat management interfaces and functions
export interface AdminChatMessage {
  id: string;
  author: 'system' | 'admin' | string;
  body: string;
  createdAt: string;
}

export interface AdminChat {
  id: string;
  orderId: string;
  userId: string;
  username: string;
  status: 'open' | 'closed';
  createdAt: string;
  lastActivityAt: string;
  responseMinutes: number | null;
  messages: AdminChatMessage[];
  order?: OrderSummary;
}

export const fetchAdminChats = (token: string) =>
  request<{ chats: AdminChat[] }>('/api/admin/chats', {
    token
  });

export const fetchAdminChat = (token: string, chatId: string) =>
  request<{ chat: AdminChat }>(`/api/admin/chats/${chatId}`, {
    token
  });

export const sendAdminMessage = (token: string, chatId: string, message: string) =>
  request<{ message: AdminChatMessage }>(`/api/admin/chats/${chatId}/messages`, {
    method: 'POST',
    body: { message },
    token
  });

export const updateChatStatus = (token: string, chatId: string, status: 'open' | 'closed') =>
  request<{ chat: AdminChat }>(`/api/admin/chats/${chatId}`, {
    method: 'PATCH',
    body: { status },
    token
  });

export interface AdminOverviewResponse {
  totals: {
    scripts: number | null;
    views: number;
    activeBuyers: number;
    openChats: number;
    lastActivity: string | null;
  };
  charts: {
    viewsPerDay: Array<{ date: string; count: number }>;
    topScripts: Array<{ slug: string; views: number }>;
    topProducts: Array<{ product: string; sales: number }>;
    salesLast7Days: Array<{ date: string; total: number }>;
    salesLast30Days: Array<{ date: string; total: number }>;
    averageChatResponseMinutes: number;
  };
  orders: OrderSummary[];
  chats: Array<{ id: string; orderId: string; userId: string; username: string; status: string; lastActivityAt: string }>;
  activityLog: Array<{ id: string; timestamp: string; message: string }>;
  settings: Record<string, string | number | boolean | null>;
  visibility: Array<{ slug: string; hidden: boolean }>;
}

export const fetchAdminOverview = (token: string) =>
  request<AdminOverviewResponse>('/api/admin/overview', {
    token
  });

export const updateAdminSettings = (token: string, payload: Record<string, unknown>) =>
  request<{ settings: AdminOverviewResponse['settings'] }>('/api/admin/settings', {
    method: 'PATCH',
    body: payload,
    token
  });

export const updateScriptVisibility = (token: string, slug: string, hidden: boolean) =>
  request<{ slug: string; hidden: boolean }>(`/api/admin/scripts/${encodeURIComponent(slug)}/visibility`, {
    method: 'PATCH',
    body: { hidden },
    token
  });

export const fetchHiddenScripts = () => request<{ hidden: string[] }>('/api/scripts/visibility');

export const fetchScripts = () => request<{ scripts: ScriptData[] }>('/api/scripts');

// Script Management APIs
export interface ScriptData {
  slug: string;
  title: string;
  short: string;
  category: string;
  tags: string[];
  features: string[];
  thumbnail: string;
  workink_url: string;
  status: string;
  compatibility: {
    pc: boolean;
    mobile: boolean;
    executor_required: boolean;
  };
  version: string;
  release_date: string;
  updated_at: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  description: string;
  views?: number;
}

export const fetchAdminScripts = (token: string) =>
  request<{ scripts: ScriptData[] }>('/api/admin/scripts', { token });

export const createScript = (token: string, scriptData: Partial<ScriptData>) =>
  request<{ script: ScriptData }>('/api/admin/scripts', {
    method: 'POST',
    body: scriptData,
    token
  });

export const updateScript = (token: string, slug: string, scriptData: Partial<ScriptData>) =>
  request<{ script: ScriptData }>(`/api/admin/scripts/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: scriptData,
    token
  });

export const deleteScript = (token: string, slug: string) =>
  request<{ message: string }>(`/api/admin/scripts/${slug}`, {
    method: 'DELETE',
    token
  });

// Robux Store Settings APIs
export interface RobuxSettings {
  minRobux: number;
  maxRobux: number;
  stepRobux: number;
  quickSelectPacks: number[];
  baseMarketPrice: number;
  markup: number;
}

export const fetchRobuxSettings = (token: string) =>
  request<{ robuxSettings: RobuxSettings }>('/api/admin/robux-settings', { token });

export const updateRobuxSettings = (token: string, settings: Partial<RobuxSettings>) =>
  request<{ robuxSettings: RobuxSettings }>('/api/admin/robux-settings', {
    method: 'PATCH',
    body: settings,
    token
  });

