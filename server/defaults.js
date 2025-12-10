import { createHash, randomUUID } from 'node:crypto';

export const ROBUX_CHAT_INTRO_MESSAGE =
  'Follow these instructions to add a gamepass: https://www.youtube.com/watch?v=Hl9QPHIXWHk';

export const hashPassword = (password) =>
  createHash('sha256').update(password).digest('hex');

const createSampleChats = () => {
  const alexChatId = randomUUID();
  const julianChatId = randomUUID();

  return [
    {
      id: alexChatId,
      orderId: '#30219',
      userId: 'sample-alex',
      username: 'Alex#123',
      status: 'open',
      createdAt: '2025-10-09T09:45:00.000Z',
      lastActivityAt: '2025-10-09T09:46:00.000Z',
      responseMinutes: 12,
      messages: [
        {
          id: randomUUID(),
          author: 'system',
          body: 'Chat opened for order #30219',
          createdAt: '2025-10-09T09:45:00.000Z'
        },
        {
          id: randomUUID(),
          author: 'system',
          body: ROBUX_CHAT_INTRO_MESSAGE,
          createdAt: '2025-10-09T09:45:10.000Z'
        },
        {
          id: randomUUID(),
          author: 'Alex#123',
          body: 'Hi, just placed an order! Let me know when you are ready.',
          createdAt: '2025-10-09T09:45:30.000Z'
        },
        {
          id: randomUUID(),
          author: 'admin',
          body: 'Thanks Alex! I will deliver within the hour. Stay online in your VIP server.',
          createdAt: '2025-10-09T09:46:00.000Z'
        }
      ]
    },
    {
      id: julianChatId,
      orderId: '#30220',
      userId: 'sample-julian',
      username: 'Julian',
      status: 'closed',
      createdAt: '2025-10-09T09:45:00.000Z',
      lastActivityAt: '2025-10-09T10:05:00.000Z',
      responseMinutes: 8,
      messages: [
        {
          id: randomUUID(),
          author: 'system',
          body: 'Chat opened for order #30220',
          createdAt: '2025-10-09T09:45:00.000Z'
        },
        {
          id: randomUUID(),
          author: 'system',
          body: ROBUX_CHAT_INTRO_MESSAGE,
          createdAt: '2025-10-09T09:45:10.000Z'
        },
        {
          id: randomUUID(),
          author: 'Julian',
          body: 'Looking forward to the private coaching session.',
          createdAt: '2025-10-09T09:47:00.000Z'
        },
        {
          id: randomUUID(),
          author: 'admin',
          body: 'Scheduled for tonight 20:00 CET. See you there!',
          createdAt: '2025-10-09T09:48:00.000Z'
        }
      ]
    }
  ];
};

export const createDefaultState = () => {
  const adminId = randomUUID();
  const createdAt = new Date().toISOString();

  const defaultOrders = [
    {
      id: '#30219',
      userId: 'sample-alex',
      username: 'Alex#123',
      amount: 7.99,
      currency: 'USD',
      product: 'Auto Rob Hub',
      status: 'paid',
      createdAt: '2025-10-09T09:10:00.000Z',
      payment: {
        provider: 'demo',
        providerLabel: 'Demo Checkout',
        invoiceId: null,
        invoiceUrl: null,
        status: 'finished',
        payCurrency: 'USD',
        payAmount: 7.99,
        actuallyPaid: 7.99,
        createdAt: '2025-10-09T09:10:00.000Z',
        updatedAt: '2025-10-09T09:10:00.000Z'
      }
    },
    {
      id: '#30220',
      userId: 'sample-julian',
      username: 'Julian',
      amount: 14.5,
      currency: 'USD',
      product: 'Private Chat',
      status: 'paid',
      createdAt: '2025-10-09T09:15:00.000Z',
      payment: {
        provider: 'demo',
        providerLabel: 'Demo Checkout',
        invoiceId: null,
        invoiceUrl: null,
        status: 'finished',
        payCurrency: 'USD',
        payAmount: 14.5,
        actuallyPaid: 14.5,
        createdAt: '2025-10-09T09:15:00.000Z',
        updatedAt: '2025-10-09T09:15:00.000Z'
      }
    }
  ];

  const chats = createSampleChats();

  return {
    views: {
      'auto-rob-hub': 1580,
      'private-chat': 640
    },
    viewTimeline: [
      { date: '2025-10-03', count: 120 },
      { date: '2025-10-04', count: 140 },
      { date: '2025-10-05', count: 175 },
      { date: '2025-10-06', count: 210 },
      { date: '2025-10-07', count: 260 },
      { date: '2025-10-08', count: 310 },
      { date: '2025-10-09', count: 355 }
    ],
    orders: defaultOrders,
    chats,
    users: [
      {
        id: adminId,
        email: 'aitikgen@gmail.com',
        username: 'Admin',
        passwordHash: hashPassword('Karitraa2207.'),
        role: 'admin',
        createdAt,
        lastLoginAt: null
      }
    ],
    sessions: [],
    scriptVisibility: {},
    settings: {
      siteName: 'ProfitCruiser',
      siteTagline: 'Premium Roblox Scripts',
      logoUrl: '/logo.svg',
      stripeKey: '',
      payhipKey: '',
      workinkKey: '',
      revolutIban: '',
      chatEnabled: true,
      loggingEnabled: true,
      notificationsEnabled: true
    },
    metrics: {
      chatResponseMinutes: 10
    },
    activityLog: [
      {
        id: randomUUID(),
        timestamp: '2025-10-09T09:43:00.000Z',
        message: 'New payment from Alex#123 ($7.99)'
      },
      {
        id: randomUUID(),
        timestamp: '2025-10-09T09:45:00.000Z',
        message: 'Chat opened (Order #30219)'
      },
      {
        id: randomUUID(),
        timestamp: '2025-10-09T09:46:00.000Z',
        message: 'Message sent by Admin'
      },
      {
        id: randomUUID(),
        timestamp: '2025-10-09T09:50:00.000Z',
        message: 'Script "Auto Rob Hub" published'
      }
    ],
    // Key management system
    keyPools: {}, // Format: { "1-day": ["key1", "key2"], "7-day": ["key3"], ... }
    userKeys: [] // Format: [{ id, userId, key, productType, duration, orderId, assignedAt, expiresAt }]
  };
};

export const createActivityEntry = (message) => ({
  id: randomUUID(),
  timestamp: new Date().toISOString(),
  message
});

export const createOrderId = () => `#${Math.floor(10000 + Math.random() * 90000)}`;

export const createChatId = () => randomUUID();

