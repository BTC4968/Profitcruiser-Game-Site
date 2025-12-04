import http from 'node:http';
import { createHmac, randomUUID } from 'node:crypto';
import { createReadStream, writeFile, mkdir } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import Busboy from 'busboy';

// Promisify file system functions
const writeFileAsync = promisify(writeFile);
const mkdirAsync = promisify(mkdir);
import { loadState, saveState } from './storage.js';
import {
  createActivityEntry,
  createChatId,
  createOrderId,
  hashPassword,
  ROBUX_CHAT_INTRO_MESSAGE
} from './defaults.js';

const parseEnv = (content) => {
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .forEach((line) => {
      if (!line || line.startsWith('#')) {
        return;
      }

      const equalsIndex = line.indexOf('=');
      if (equalsIndex === -1) {
        return;
      }

      const key = line.slice(0, equalsIndex).trim();
      if (!key) {
        return;
      }

      let value = line.slice(equalsIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
};

const loadEnvFile = async (relativePath) => {
  try {
    const filePath = fileURLToPath(new URL(relativePath, import.meta.url));
    const content = await readFile(filePath, 'utf8');
    parseEnv(content);
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      console.warn(`Failed to load env file ${relativePath}:`, error.message);
    }
  }
};

await loadEnvFile('../.env');
await loadEnvFile('../.env.production');

const sanitizeDomain = (value) => {
  if (!value) {
    return '';
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const rawDomain = process.env.PUBLIC_DOMAIN ?? 'http://localhost:5173';
const PUBLIC_DOMAIN = sanitizeDomain(rawDomain);
const NOWPAYMENTS_API_BASE = process.env.NP_API_BASE ?? 'https://api.nowpayments.io';
const NOWPAYMENTS_API_KEY = process.env.NP_API_KEY ?? '';
const NOWPAYMENTS_IPN_SECRET = process.env.NP_IPN_SECRET ?? '';
const PAY_CURRENCY = (process.env.PAY_CURRENCY ?? 'btc').toLowerCase();
const NOWPAYMENTS_WEBHOOK_URL =
  process.env.NP_WEBHOOK_URL ?? `${PUBLIC_DOMAIN}/api/nowpayments/webhook`;
const successUrlTemplate =
  process.env.NP_SUCCESS_URL ??
  `${PUBLIC_DOMAIN}/account?order={{orderId}}&status=success`;
const cancelUrlTemplate =
  process.env.NP_CANCEL_URL ??
  `${PUBLIC_DOMAIN}/account?order={{orderId}}&status=cancelled`;
const NOWPAYMENTS_ENABLED = Boolean(
  NOWPAYMENTS_API_KEY && NOWPAYMENTS_IPN_SECRET && NOWPAYMENTS_WEBHOOK_URL
);

// Supported crypto currencies (using NOWPayments format)
const SUPPORTED_CRYPTO_CURRENCIES = [
  { code: 'btc', name: 'Bitcoin', symbol: '₿' },
  { code: 'eth', name: 'Ethereum', symbol: 'Ξ' },
  { code: 'usdterc20', name: 'Tether USD (ERC-20)', symbol: '₮' },
  { code: 'usdcerc20', name: 'USD Coin (ERC-20)', symbol: '$' }
];

const resolveTemplate = (template, orderId) =>
  template.replace(/\{\{orderId\}\}/g, encodeURIComponent(orderId));

const mapNowPaymentsStatus = (status) => {
  const normalized = (status ?? '').toLowerCase();
  if (['finished', 'confirmed', 'completed'].includes(normalized)) {
    return 'paid';
  }
  if (['waiting', 'confirming', 'sending', 'partially_paid'].includes(normalized)) {
    return 'pending';
  }
  if (['failed', 'expired', 'refunded', 'chargeback'].includes(normalized)) {
    return 'failed';
  }
  return normalized || 'pending';
};

// Fetch crypto prices from NOWPayments
const fetchCryptoPrices = async (fiatCurrency = 'EUR') => {
  if (!NOWPAYMENTS_ENABLED) {
    return {};
  }

  try {
    const response = await fetch(`${NOWPAYMENTS_API_BASE}/v1/estimate?amount=1&currency_from=${fiatCurrency.toLowerCase()}`, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY
      }
    });

    if (!response.ok) {
      console.warn('Failed to fetch crypto prices from NOWPayments');
      return {};
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Error fetching crypto prices:', error.message);
    return {};
  }
};

const createNowPaymentsInvoice = async ({
  orderId,
  amount,
  currency,
  product,
  username,
  payCurrency = PAY_CURRENCY
}) => {
  const successUrl = successUrlTemplate
    ? resolveTemplate(successUrlTemplate, orderId)
    : undefined;
  const cancelUrl = cancelUrlTemplate
    ? resolveTemplate(cancelUrlTemplate, orderId)
    : undefined;

  const payload = {
    price_amount: Number(amount),
    price_currency: currency.toLowerCase(),
    pay_currency: payCurrency.toLowerCase(),
    order_id: orderId,
    order_description: `${product} for ${username}`,
    ipn_callback_url: NOWPAYMENTS_WEBHOOK_URL,
    success_url: successUrl,
    cancel_url: cancelUrl
  };

  const response = await fetch(`${NOWPAYMENTS_API_BASE}/v1/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': NOWPAYMENTS_API_KEY
    },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ?? data?.error ?? `NOWPayments request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return {
    invoiceId: data?.id ?? null,
    invoiceUrl: data?.invoice_url ?? null,
    status: (data?.status ?? 'waiting').toLowerCase(),
    payCurrency: data?.pay_currency ?? payCurrency,
    payAmount:
      data?.pay_amount !== undefined && data?.pay_amount !== null
        ? Number(data.pay_amount)
        : null
  };
};

const verifyNowPaymentsSignature = (rawBody, signature) => {
  if (!NOWPAYMENTS_IPN_SECRET) {
    return false;
  }
  const digest = createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
    .update(rawBody)
    .digest('hex');
  return digest === signature;
};

const paymentProviders = new Map();

paymentProviders.set('manual', {
  key: 'manual',
  label: 'Manual Payment',
  type: 'manual',
  payCurrency: null,
  supportsRedirect: false,
  async createPayment({ amount, currency, createdAt }) {
    const normalizedAmount = Number(amount);
    return {
      orderStatus: 'paid',
      payment: {
        provider: 'manual',
        providerLabel: 'Manual Payment',
        invoiceId: null,
        invoiceUrl: null,
        status: 'paid',
        payCurrency: currency,
        payAmount: normalizedAmount,
        actuallyPaid: normalizedAmount,
        createdAt,
        updatedAt: createdAt
      }
    };
  }
});

if (NOWPAYMENTS_ENABLED) {
  // Create individual payment providers for each crypto currency
  SUPPORTED_CRYPTO_CURRENCIES.forEach(crypto => {
    paymentProviders.set(`nowpayments-${crypto.code}`, {
      key: `nowpayments-${crypto.code}`,
      label: `NOWPayments (${crypto.name})`,
      type: 'crypto',
      payCurrency: crypto.code.toUpperCase(),
      supportsRedirect: true,
      cryptoInfo: crypto,
      async createPayment({ orderId, amount, currency, product, username, createdAt }) {
        const invoice = await createNowPaymentsInvoice({
          orderId,
          amount,
          currency,
          product,
          username,
          payCurrency: crypto.code
        });

        return {
          orderStatus: mapNowPaymentsStatus(invoice.status),
          payment: {
            provider: `nowpayments-${crypto.code}`,
            providerLabel: `NOWPayments (${crypto.name})`,
            invoiceId: invoice.invoiceId,
            invoiceUrl: invoice.invoiceUrl,
            status: invoice.status,
            payCurrency: invoice.payCurrency,
            payAmount: invoice.payAmount,
            actuallyPaid: null,
            createdAt,
            updatedAt: createdAt
          }
        };
      }
    });
  });

  // Note: Individual crypto providers are created above, no generic provider needed
}

const toTitleCase = (value) =>
  value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getProviderLabel = (providerKey) => {
  if (!providerKey) {
    return 'Payment';
  }
  const normalized = providerKey.toLowerCase();
  const provider = paymentProviders.get(normalized);
  if (provider?.label) {
    return provider.label;
  }
  if (normalized === 'nowpayments') {
    return 'NOWPayments';
  }
  return toTitleCase(providerKey);
};

const listPaymentProviders = () =>
  Array.from(paymentProviders.values()).map((provider) => ({
    key: provider.key,
    label: provider.label,
    type: provider.type,
    payCurrency: provider.payCurrency,
    supportsRedirect: provider.supportsRedirect === true
  }));

const ensureOrderPaymentShape = (order) => {
  if (!('payment' in order) || order.payment == null) {
    order.payment = null;
    return;
  }

  if (!('providerLabel' in order.payment) || !order.payment.providerLabel) {
    order.payment.providerLabel = getProviderLabel(order.payment.provider);
  }
};

const state = await loadState();
state.orders.forEach(ensureOrderPaymentShape);

// Initialize scripts from static file if not already loaded
if (!state.scripts || state.scripts.length === 0) {
  try {
    // Import the static scripts
    const { scripts } = await import('../src/data/scripts.ts');
    state.scripts = scripts.map(script => ({
      ...script,
      views: 0 // Initialize view count
    }));
    await saveState(state);
    console.log(`Initialized ${scripts.length} scripts from static file`);
  } catch (error) {
    console.warn('Could not load static scripts:', error.message);
    state.scripts = [];
  }
}

const PORT = Number(process.env.PORT ?? 5174);

const distDir = fileURLToPath(new URL('../dist', import.meta.url));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const fileExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const serveFile = (res, filePath, method = 'GET') => {
  const extension = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] ?? 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  if (method === 'HEAD') {
    res.end();
    return;
  }

  createReadStream(filePath).pipe(res);
};

const attemptServeStatic = async (req, res, url) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }

  const hasDist = await fileExists(distDir);
  if (!hasDist) {
    return false;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    return false;
  }

  const rawRelativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\//, '');
  const normalizedPath = normalize(rawRelativePath);

  if (normalizedPath.startsWith('..')) {
    return false;
  }

  const absolutePath = join(distDir, normalizedPath);

  if (!absolutePath.startsWith(distDir)) {
    return false;
  }

  const isAssetRequest = extname(absolutePath) !== '';

  if (await fileExists(absolutePath)) {
    serveFile(res, absolutePath, req.method);
    return true;
  }

  if (!isAssetRequest) {
    const indexPath = join(distDir, 'index.html');
    if (await fileExists(indexPath)) {
      serveFile(res, indexPath, req.method);
      return true;
    }
  }

  return false;
};

const send = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end(body);
};

const noContent = (res) => {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end();
};

const parseBody = async (req, options = {}) =>
  new Promise((resolve, reject) => {
    const { returnRaw = false, allowInvalidJson = false } = options;
    const chunks = [];
    req
      .on('data', (chunk) => {
        chunks.push(chunk);
      })
      .on('end', () => {
        if (chunks.length === 0) {
          resolve(returnRaw ? { raw: '', data: null } : null);
          return;
        }

        const raw = Buffer.concat(chunks).toString('utf8');

        if (returnRaw) {
          try {
            resolve({ raw, data: raw ? JSON.parse(raw) : null });
          } catch {
            resolve({ raw, data: null });
          }
          return;
        }

        try {
          resolve(raw ? JSON.parse(raw) : null);
        } catch (error) {
          if (allowInvalidJson) {
            resolve(null);
            return;
          }
          reject(error);
        }
      })
      .on('error', reject);
  });

const authenticate = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice(7);
  const session = state.sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    state.sessions = state.sessions.filter((item) => item.token !== token);
    return null;
  }
  return state.users.find((user) => user.id === session.userId) ?? null;
};

const createSession = (userId) => {
  const token = randomUUID() + randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  state.sessions.push({ token, userId, createdAt: new Date().toISOString(), expiresAt });
  return token;
};

const getViewTotals = () =>
  Object.values(state.views).reduce((acc, value) => acc + value, 0);

const updateViewTimeline = (dateString) => {
  const entry = state.viewTimeline.find((item) => item.date === dateString);
  if (entry) {
    entry.count += 1;
  } else {
    state.viewTimeline.push({ date: dateString, count: 1 });
  }
};

const calculateSales = (days) => {
  const map = new Map();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));

  state.orders
    .filter((order) => order.status === 'paid')
    .forEach((order) => {
      const dateKey = order.createdAt.slice(0, 10);
      const date = new Date(order.createdAt);
      if (date >= cutoff) {
        map.set(dateKey, (map.get(dateKey) ?? 0) + Number(order.amount || 0));
      }
    });

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, total]) => ({ date, total }));
};

const averageResponseMinutes = () => {
  const relevant = state.chats
    .map((chat) => chat.responseMinutes)
    .filter((value) => typeof value === 'number');
  if (relevant.length === 0) {
    return state.metrics.chatResponseMinutes ?? 0;
  }
  const sum = relevant.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / relevant.length);
};

const ensureAdminUser = () => {
  const hasAdmin = state.users.some((user) => user.role === 'admin');
  if (!hasAdmin) {
    state.users.push({
      id: randomUUID(),
      email: 'admin@profitcruiser.gg',
      username: 'Admin',
      passwordHash: hashPassword('ChangeMe123!'),
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    });
  }
};

// Function to automatically open a chat with admins when payment is confirmed
const openAdminChatOnPayment = async (order) => {
  // Check if a chat already exists for this order
  const existingChat = state.chats.find(chat => chat.orderId === order.id);
  if (existingChat) {
    return existingChat;
  }

  // Get admin users
  const adminUsers = state.users.filter(user => user.role === 'admin');
  if (adminUsers.length === 0) {
    console.warn('No admin users found to open chat with');
    return null;
  }

  // Create a new chat with admins
  const chat = {
    id: createChatId(),
    orderId: order.id,
    userId: order.userId,
    username: order.username,
    status: 'open',
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    responseMinutes: null,
    messages: [
      {
        id: randomUUID(),
        author: 'system',
        body: `Payment confirmed for order ${order.id} - Chat opened with admins`,
        createdAt: new Date().toISOString()
      },
      {
        id: randomUUID(),
        author: 'system',
        body: `Payment of ${order.amount} ${order.currency} has been confirmed. Please process the Robux delivery for ${order.username}.`,
        createdAt: new Date().toISOString()
      }
    ]
  };

  state.chats.push(chat);
  
  // Add activity log entry
  state.activityLog.push(
    createActivityEntry(`Admin chat opened automatically for paid order ${order.id} (${order.username})`)
  );

  await saveState(state);
  return chat;
};

ensureAdminUser();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    noContent(res);
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  try {
    if (req.method === 'POST' && url.pathname.startsWith('/api/views/')) {
      const slug = decodeURIComponent(url.pathname.replace('/api/views/', ''));
      state.views[slug] = (state.views[slug] ?? 0) + 1;
      const today = new Date().toISOString().slice(0, 10);
      updateViewTimeline(today);
      state.activityLog.push(createActivityEntry(`View recorded for ${slug}`));
      await saveState(state);
      send(res, 200, { slug, views: state.views[slug], total: getViewTotals() });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/views') {
      send(res, 200, { views: state.views, timeline: state.viewTimeline });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/payments/providers') {
      send(res, 200, { providers: listPaymentProviders() });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/crypto/prices') {
      const prices = await fetchCryptoPrices('EUR');
      send(res, 200, { 
        prices,
        currencies: SUPPORTED_CRYPTO_CURRENCIES,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/scripts') {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      // Return current scripts from the static file
      const scripts = state.scripts || [];
      send(res, 200, { scripts });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/scripts') {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const body = (await parseBody(req)) ?? {};
      const { slug, title, short, category, tags, features, thumbnail, workink_url, status, compatibility, version, release_date, updated_at, seo, description } = body;

      if (!slug || !title || !category) {
        send(res, 400, { message: 'Missing required fields: slug, title, category' });
        return;
      }

      // Check if script already exists
      const existingScript = state.scripts?.find(s => s.slug === slug);
      if (existingScript) {
        send(res, 409, { message: 'Script with this slug already exists' });
        return;
      }

      const newScript = {
        slug,
        title,
        short: short || '',
        category,
        tags: tags || [],
        features: features || [],
        thumbnail: thumbnail || '/images/scripts/placeholder.webp',
        workink_url: workink_url || '',
        status: status || 'active',
        compatibility: compatibility || { pc: true, mobile: false, executor_required: true },
        version: version || '1.0.0',
        release_date: release_date || new Date().toISOString().split('T')[0],
        updated_at: updated_at || new Date().toISOString().split('T')[0],
        seo: seo || { title: title, description: short, keywords: [] },
        description: description || '',
        views: 0
      };

      if (!state.scripts) {
        state.scripts = [];
      }
      state.scripts.push(newScript);

      state.activityLog.push(createActivityEntry(`New script added: ${title} (${slug})`));
      await saveState(state);

      send(res, 201, { script: newScript });
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/admin/scripts/')) {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const slug = decodeURIComponent(url.pathname.replace('/api/admin/scripts/', ''));
      const body = (await parseBody(req)) ?? {};

      const scriptIndex = state.scripts?.findIndex(s => s.slug === slug);
      if (scriptIndex === -1 || !state.scripts) {
        send(res, 404, { message: 'Script not found' });
        return;
      }

      // Update script with new data
      state.scripts[scriptIndex] = { ...state.scripts[scriptIndex], ...body };
      state.scripts[scriptIndex].updated_at = new Date().toISOString().split('T')[0];

      state.activityLog.push(createActivityEntry(`Script updated: ${state.scripts[scriptIndex].title} (${slug})`));
      await saveState(state);

      send(res, 200, { script: state.scripts[scriptIndex] });
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/scripts/')) {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const slug = url.pathname.replace('/api/admin/scripts/', '');
      
      const scriptIndex = state.scripts?.findIndex(s => s.slug === slug);
      if (scriptIndex === -1 || !state.scripts) {
        send(res, 404, { message: 'Script not found' });
        return;
      }

      const scriptTitle = state.scripts[scriptIndex].title;
      state.scripts.splice(scriptIndex, 1);

      state.activityLog.push(createActivityEntry(`Script deleted: ${scriptTitle} (${slug})`));
      await saveState(state);

      send(res, 200, { message: 'Script deleted successfully' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/robux-settings') {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const robuxSettings = state.robuxSettings || {
        minRobux: 400,
        maxRobux: 20000,
        stepRobux: 200,
        quickSelectPacks: [800, 2000, 5000, 10000, 20000],
        baseMarketPrice: 0.0039,
        markup: 1.6
      };

      send(res, 200, { robuxSettings });
      return;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/admin/robux-settings') {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const body = (await parseBody(req)) ?? {};
      const { minRobux, maxRobux, stepRobux, quickSelectPacks, baseMarketPrice, markup } = body;

      if (!state.robuxSettings) {
        state.robuxSettings = {};
      }

      if (minRobux !== undefined) state.robuxSettings.minRobux = Number(minRobux);
      if (maxRobux !== undefined) state.robuxSettings.maxRobux = Number(maxRobux);
      if (stepRobux !== undefined) state.robuxSettings.stepRobux = Number(stepRobux);
      if (quickSelectPacks !== undefined) state.robuxSettings.quickSelectPacks = quickSelectPacks;
      if (baseMarketPrice !== undefined) state.robuxSettings.baseMarketPrice = Number(baseMarketPrice);
      if (markup !== undefined) state.robuxSettings.markup = Number(markup);

      state.activityLog.push(createActivityEntry('Robux store settings updated'));
      await saveState(state);

      send(res, 200, { robuxSettings: state.robuxSettings });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/upload/test') {
      send(res, 200, { message: 'Test endpoint working' });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/upload/image') {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      console.log('Upload endpoint hit');
      
      try {
        const busboy = Busboy({ headers: req.headers });
        let filename = '';
        let fileData = null;
        let fileContentType = '';
        let fileReceived = false;
        let responseSent = false;

        // Set a timeout to handle cases where busboy doesn't fire events
        const timeout = setTimeout(() => {
          if (!responseSent) {
            console.log('Upload timeout - no file received');
            responseSent = true;
            send(res, 400, { message: 'Upload timeout - no file received' });
          }
        }, 10000); // 10 second timeout

        busboy.on('file', (fieldname, file, info) => {
          console.log('File received:', fieldname, info);
          const { filename: uploadedFilename, mimeType } = info;
          filename = uploadedFilename;
          fileContentType = mimeType;
          
          const chunks = [];
          file.on('data', (chunk) => {
            chunks.push(chunk);
          });
          
          file.on('end', () => {
            fileData = Buffer.concat(chunks);
            fileReceived = true;
            console.log('File data received, size:', fileData.length);
          });
        });

        busboy.on('finish', async () => {
          console.log('Busboy finish event');
          clearTimeout(timeout);
          
          if (responseSent) return;
          responseSent = true;
          
          try {
            if (!filename || !fileData || !fileReceived) {
              console.log('No file data:', { filename, hasFileData: !!fileData, fileReceived });
              send(res, 400, { message: 'No file uploaded' });
              return;
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(fileContentType)) {
              console.log('Invalid file type:', fileContentType);
              send(res, 400, { message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' });
              return;
            }

            // Generate unique filename
            const fileExt = extname(filename).toLowerCase();
            const uniqueFilename = `${randomUUID()}${fileExt}`;
            
            // Create uploads directory if it doesn't exist
            const uploadsDir = join(distDir, 'images', 'scripts');
            await mkdirAsync(uploadsDir, { recursive: true });
            
            // Save file
            const filePath = join(uploadsDir, uniqueFilename);
            await writeFileAsync(filePath, fileData);
            
            // Return the public URL
            const publicUrl = `http://localhost:${PORT}/images/scripts/${uniqueFilename}`;
            console.log('Upload successful:', publicUrl);
            send(res, 200, { url: publicUrl });
          } catch (error) {
            console.error('Upload error:', error);
            send(res, 500, { message: 'Upload failed' });
          }
        });

        busboy.on('error', (error) => {
          console.error('Busboy error:', error);
          clearTimeout(timeout);
          if (!responseSent) {
            responseSent = true;
            send(res, 500, { message: 'Upload failed' });
          }
        });

        req.pipe(busboy);
      } catch (error) {
        console.error('Upload error:', error);
        send(res, 500, { message: 'Upload failed' });
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/scripts') {
      // Return all scripts for the frontend
      const allScripts = state.scripts || [];
      const hiddenSlugs = new Set(
        Object.entries(state.scriptVisibility)
          .filter(([, hiddenValue]) => hiddenValue === true)
          .map(([slug]) => slug)
      );
      
      // Filter out hidden scripts
      const visibleScripts = allScripts.filter(script => !hiddenSlugs.has(script.slug));
      
      send(res, 200, { scripts: visibleScripts });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/scripts/visibility') {
      const hidden = Object.entries(state.scriptVisibility)
        .filter(([, hiddenValue]) => hiddenValue === true)
        .map(([slug]) => slug);
      send(res, 200, { hidden });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/register') {
      const body = (await parseBody(req)) ?? {};
      const { email, username, password } = body;
      if (!email || !username || !password) {
        send(res, 400, { message: 'Missing email, username or password' });
        return;
      }

      const exists = state.users.some((user) => user.email === email.toLowerCase());
      if (exists) {
        send(res, 409, { message: 'Email already registered' });
        return;
      }

      const user = {
        id: randomUUID(),
        email: email.toLowerCase(),
        username,
        passwordHash: hashPassword(password),
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };

      state.users.push(user);
      const token = createSession(user.id);
      state.activityLog.push(createActivityEntry(`User ${username} registered`));
      await saveState(state);
      send(res, 201, {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = (await parseBody(req)) ?? {};
      const { email, password } = body;
      if (!email || !password) {
        send(res, 400, { message: 'Missing credentials' });
        return;
      }

      const user = state.users.find((item) => item.email === email.toLowerCase());
      if (!user || user.passwordHash !== hashPassword(password)) {
        send(res, 401, { message: 'Invalid email or password' });
        return;
      }

      const token = createSession(user.id);
      user.lastLoginAt = new Date().toISOString();
      state.activityLog.push(createActivityEntry(`User ${user.username} logged in`));
      await saveState(state);
      send(res, 200, {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/auth/me') {
      const user = authenticate(req);
      if (!user) {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }
      send(res, 200, {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/orders') {
      const user = authenticate(req);
      if (!user) {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const body = (await parseBody(req)) ?? {};
      const { amount, currency = 'EUR', product, robuxAmount, paymentMethod } = body;
      if (!amount || !product) {
        send(res, 400, { message: 'Missing order details' });
        return;
      }

      const orderId = createOrderId();
      const createdAt = new Date().toISOString();

      let selectedProvider = null;
      if (typeof paymentMethod === 'string' && paymentMethod.trim() !== '') {
        selectedProvider = paymentProviders.get(paymentMethod.toLowerCase());
        if (!selectedProvider) {
          send(res, 400, { message: 'Ukjent betalingsmetode' });
          return;
        }
      } else {
        selectedProvider = paymentProviders.get('nowpayments') ?? paymentProviders.get('manual');
      }

      if (!selectedProvider) {
        send(res, 500, { message: 'Ingen betalingsløsning er aktivert' });
        return;
      }

      let payment = null;
      let orderStatus = 'pending';

      try {
        const providerResult = await selectedProvider.createPayment({
          orderId,
          amount,
          currency,
          product,
          username: user.username,
          createdAt
        });

        const basePayment = providerResult?.payment ?? null;
        if (basePayment) {
          payment = {
            provider: basePayment.provider ?? selectedProvider.key,
            providerLabel: basePayment.providerLabel ?? selectedProvider.label,
            invoiceId: basePayment.invoiceId ?? null,
            invoiceUrl: basePayment.invoiceUrl ?? null,
            status: basePayment.status ?? null,
            payCurrency: basePayment.payCurrency ?? null,
            payAmount:
              basePayment.payAmount !== undefined && basePayment.payAmount !== null
                ? Number(basePayment.payAmount)
                : null,
            actuallyPaid:
              basePayment.actuallyPaid !== undefined && basePayment.actuallyPaid !== null
                ? Number(basePayment.actuallyPaid)
                : null,
            createdAt: basePayment.createdAt ?? createdAt,
            updatedAt: basePayment.updatedAt ?? createdAt
          };
        }

        orderStatus = providerResult?.orderStatus ?? orderStatus;
      } catch (error) {
        console.error(`Failed to create payment with ${selectedProvider.label}`, error);
        send(res, 502, {
          message: `Kunne ikke opprette betaling via ${selectedProvider.label}. Prøv igjen senere.`
        });
        return;
      }

      const order = {
        id: orderId,
        userId: user.id,
        username: user.username,
        amount: Number(amount),
        currency,
        product,
        robuxAmount: robuxAmount ?? null,
        status: orderStatus,
        createdAt,
        payment
      };

      state.orders.push(order);

      // Create chat - if order is immediately paid, open admin chat
      let chat;
      if (orderStatus === 'paid') {
        // For immediately paid orders (like manual payments), open admin chat
        try {
          chat = await openAdminChatOnPayment(order);
        } catch (error) {
          console.error('Failed to open admin chat for paid order:', error);
          // Fallback to regular chat if admin chat fails
          chat = {
            id: createChatId(),
            orderId,
            userId: user.id,
            username: user.username,
            status: 'open',
            createdAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            responseMinutes: null,
            messages: [
              {
                id: randomUUID(),
                author: 'system',
                body: `Chat opened for order ${orderId}`,
                createdAt: new Date().toISOString()
              },
              {
                id: randomUUID(),
                author: 'system',
                body: ROBUX_CHAT_INTRO_MESSAGE,
                createdAt: new Date().toISOString()
              }
            ]
          };
          state.chats.push(chat);
        }
      } else {
        // For pending orders, create regular chat
        chat = {
          id: createChatId(),
          orderId,
          userId: user.id,
          username: user.username,
          status: 'open',
          createdAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          responseMinutes: null,
          messages: [
            {
              id: randomUUID(),
              author: 'system',
              body: `Chat opened for order ${orderId}`,
              createdAt: new Date().toISOString()
            },
            {
              id: randomUUID(),
              author: 'system',
              body: ROBUX_CHAT_INTRO_MESSAGE,
              createdAt: new Date().toISOString()
            }
          ]
        };
        state.chats.push(chat);
      }
      const providerLabel = payment?.providerLabel ?? getProviderLabel(selectedProvider.key);
      const pendingCurrency = payment?.payCurrency ?? selectedProvider.payCurrency ?? currency;
      if (orderStatus === 'paid') {
        state.activityLog.push(
          createActivityEntry(
            `New payment via ${providerLabel} from ${user.username} (${Number(amount).toFixed(2)} ${currency})`
          )
        );
      } else {
        state.activityLog.push(
          createActivityEntry(
            `Order ${orderId} awaiting payment via ${providerLabel}${pendingCurrency ? ` (${pendingCurrency.toUpperCase()})` : ''} from ${user.username}`
          )
        );
      }
      if (payment?.invoiceUrl) {
        state.activityLog.push(
          createActivityEntry(`${providerLabel} invoice created for order ${orderId}`)
        );
      }
      state.activityLog.push(createActivityEntry(`Chat opened (Order ${orderId})`));

      await saveState(state);

      send(res, 201, { order, chat, payment });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/orders') {
      const user = authenticate(req);
      if (!user) {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const orders = state.orders.filter((order) => order.userId === user.id);
      send(res, 200, { orders });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/nowpayments/webhook') {
      if (!NOWPAYMENTS_ENABLED) {
        noContent(res);
        return;
      }

      const signatureHeader =
        (req.headers['x-nowpayments-sig'] ?? req.headers['x-nowpayments-signature']) ?? '';
      const { raw, data } = await parseBody(req, {
        returnRaw: true,
        allowInvalidJson: true
      });

      if (!raw) {
        noContent(res);
        return;
      }

      if (!signatureHeader || !verifyNowPaymentsSignature(raw, String(signatureHeader))) {
        send(res, 401, { message: 'Invalid signature' });
        return;
      }

      const payload = data && typeof data === 'object' ? data : {};
      const orderId = payload.order_id ?? payload.orderId ?? null;
      if (!orderId) {
        noContent(res);
        return;
      }

      const order = state.orders.find((item) => item.id === orderId);
      if (!order) {
        noContent(res);
        return;
      }

      ensureOrderPaymentShape(order);

      const updatedAt = new Date().toISOString();
      const providerStatus = (payload.payment_status ?? payload.invoice_status ?? order.payment?.status ?? '')
        .toLowerCase();

      const payAmount =
        payload.pay_amount !== undefined && payload.pay_amount !== null
          ? Number(payload.pay_amount)
          : order.payment?.payAmount ?? null;

      const actuallyPaid =
        payload.actually_paid !== undefined && payload.actually_paid !== null
          ? Number(payload.actually_paid)
          : order.payment?.actuallyPaid ?? null;

      const providerLabel = getProviderLabel('nowpayments');

      const payment = {
        provider: 'nowpayments',
        providerLabel,
        invoiceId: payload.invoice_id ?? order.payment?.invoiceId ?? null,
        invoiceUrl: payload.invoice_url ?? order.payment?.invoiceUrl ?? null,
        status: providerStatus || order.payment?.status || null,
        payCurrency: payload.pay_currency ?? order.payment?.payCurrency ?? null,
        payAmount,
        actuallyPaid,
        createdAt: order.payment?.createdAt ?? order.createdAt,
        updatedAt
      };

      order.payment = payment;

      const previousStatus = order.status;
      order.status = mapNowPaymentsStatus(payment.status);

      let activityMessage = `${providerLabel} status update for order ${orderId}: ${payment.status ?? 'unknown'}`;
      if (order.status === 'paid' && previousStatus !== 'paid') {
        activityMessage = `${providerLabel} confirmed payment for order ${orderId}`;
        
        // Automatically open chat with admins when payment is confirmed
        try {
          await openAdminChatOnPayment(order);
        } catch (error) {
          console.error('Failed to open admin chat for paid order:', error);
        }
      } else if (order.status === 'failed' && previousStatus !== 'failed') {
        activityMessage = `${providerLabel} marked order ${orderId} as failed (${payment.status ?? 'unknown'})`;
      }

      state.activityLog.push(createActivityEntry(activityMessage));
      await saveState(state);

      noContent(res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/chats') {
      const user = authenticate(req);
      if (!user) {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const chats = state.chats.filter((chat) => chat.userId === user.id);
      send(res, 200, { chats });
      return;
    }

    // Admin chat management endpoints
    if (req.method === 'GET' && url.pathname === '/api/admin/chats') {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      // Return all chats with full details for admin
      const chats = state.chats.map(chat => ({
        ...chat,
        order: state.orders.find(order => order.id === chat.orderId)
      }));
      
      send(res, 200, { chats });
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/admin/chats/')) {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const chatId = url.pathname.replace('/api/admin/chats/', '');
      const chat = state.chats.find(chat => chat.id === chatId);
      
      if (!chat) {
        send(res, 404, { message: 'Chat not found' });
        return;
      }

      const order = state.orders.find(order => order.id === chat.orderId);
      send(res, 200, { chat: { ...chat, order } });
      return;
    }

    if (req.method === 'POST' && url.pathname.startsWith('/api/admin/chats/')) {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const chatId = url.pathname.replace('/api/admin/chats/', '').replace('/messages', '');
      const chat = state.chats.find(chat => chat.id === chatId);
      
      if (!chat) {
        send(res, 404, { message: 'Chat not found' });
        return;
      }

      const body = (await parseBody(req)) ?? {};
      const { message } = body;
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        send(res, 400, { message: 'Message is required' });
        return;
      }

      const newMessage = {
        id: randomUUID(),
        author: 'admin',
        body: message.trim(),
        createdAt: new Date().toISOString()
      };

      chat.messages.push(newMessage);
      chat.lastActivityAt = new Date().toISOString();
      
      // Update response time if this is the first admin response
      if (!chat.responseMinutes) {
        const chatCreatedAt = new Date(chat.createdAt);
        const now = new Date();
        chat.responseMinutes = Math.round((now.getTime() - chatCreatedAt.getTime()) / (1000 * 60));
      }

      state.activityLog.push(createActivityEntry(`Admin replied to chat ${chat.orderId} (${chat.username})`));
      await saveState(state);

      send(res, 200, { message: newMessage });
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/admin/chats/')) {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const chatId = url.pathname.replace('/api/admin/chats/', '');
      const chat = state.chats.find(chat => chat.id === chatId);
      
      if (!chat) {
        send(res, 404, { message: 'Chat not found' });
        return;
      }

      const body = (await parseBody(req)) ?? {};
      const { status } = body;
      
      if (!status || !['open', 'closed'].includes(status)) {
        send(res, 400, { message: 'Valid status is required (open or closed)' });
        return;
      }

      const previousStatus = chat.status;
      chat.status = status;
      chat.lastActivityAt = new Date().toISOString();

      state.activityLog.push(createActivityEntry(`Admin ${status === 'closed' ? 'closed' : 'reopened'} chat ${chat.orderId} (${chat.username})`));
      await saveState(state);

      send(res, 200, { chat });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/overview') {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const totals = {
        scripts: null,
        views: getViewTotals(),
        activeBuyers: new Set(state.orders.filter((order) => order.status === 'paid').map((order) => order.userId)).size,
        openChats: state.chats.filter((chat) => chat.status === 'open').length,
        lastActivity: state.activityLog.length > 0 ? state.activityLog[state.activityLog.length - 1].timestamp : null
      };

      const topScripts = Object.entries(state.views)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([slug, views]) => ({ slug, views }));

      const topProducts = Object.values(
        state.orders.reduce((acc, order) => {
          if (!acc[order.product]) {
            acc[order.product] = { product: order.product, sales: 0 };
          }
          acc[order.product].sales += 1;
          return acc;
        }, {})
      )
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      const overview = {
        totals,
        charts: {
          viewsPerDay: state.viewTimeline,
          topScripts,
          topProducts,
          salesLast7Days: calculateSales(7),
          salesLast30Days: calculateSales(30),
          averageChatResponseMinutes: averageResponseMinutes()
        },
        orders: state.orders.slice(-20).reverse(),
        chats: state.chats.map((chat) => ({
          id: chat.id,
          orderId: chat.orderId,
          userId: chat.userId,
          username: chat.username,
          status: chat.status,
          lastActivityAt: chat.lastActivityAt
        })),
        activityLog: state.activityLog.slice(-50).reverse(),
        settings: state.settings,
        visibility: Object.entries(state.scriptVisibility).map(([slug, hidden]) => ({ slug, hidden }))
      };

      send(res, 200, overview);
      return;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/admin/settings') {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const body = (await parseBody(req)) ?? {};
      state.settings = {
        ...state.settings,
        ...body
      };

      state.activityLog.push(createActivityEntry('Admin updated settings'));
      await saveState(state);
      send(res, 200, { settings: state.settings });
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/admin/scripts/')) {
      const user = authenticate(req);
      if (!user || user.role !== 'admin') {
        send(res, 401, { message: 'Unauthorized' });
        return;
      }

      const slug = decodeURIComponent(url.pathname.replace('/api/admin/scripts/', '').replace('/visibility', ''));
      const body = (await parseBody(req)) ?? {};
      const { hidden } = body;
      state.scriptVisibility[slug] = Boolean(hidden);
      state.activityLog.push(createActivityEntry(`Script ${slug} visibility set to ${hidden ? 'hidden' : 'visible'}`));
      await saveState(state);
      send(res, 200, { slug, hidden: state.scriptVisibility[slug] });
      return;
    }

    if (!url.pathname.startsWith('/api/')) {
      const served = await attemptServeStatic(req, res, url);
      if (served) {
        return;
      }

      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      });
      res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ProfitCruiser API</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 4rem auto; max-width: 640px; line-height: 1.6; padding: 0 1.5rem; }
      code { background: #f5f5f5; padding: 0.15rem 0.35rem; border-radius: 0.25rem; }
    </style>
  </head>
  <body>
    <h1>ProfitCruiser API running</h1>
    <p>This server only exposes JSON endpoints under <code>/api</code>. To view the frontend, run <code>npm run dev</code> for development or build the static files with <code>npm run build</code> and serve the <code>dist/</code> folder.</p>
  </body>
</html>`);
      return;
    }

    send(res, 404, { message: 'Not found' });
  } catch (error) {
    console.error(error);
    send(res, 500, { message: 'Server error', error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`ProfitCruiser API running on http://localhost:${PORT}`);
});

