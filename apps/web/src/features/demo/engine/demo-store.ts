/**
 * Demo state manager — in-memory store with deterministic seeded data.
 * Persistence to guest sessions lands with the Go backend (Phase 7).
 * Specialized demos can extend records; keep mutations pure for testability.
 */

export interface DemoRecord {
  id: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface DemoNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface DemoStore {
  entities: Record<string, DemoRecord[]>;
  metrics: Record<string, number | string>;
  charts: Record<string, Array<{ label: string; value: number }>>;
  notifications: DemoNotification[];
  cart?: Array<{ productId: string; quantity: number }>;
  meta: {
    templateId: string;
    industryId: string;
  };
}

export interface DemoSeed {
  templateId: string;
  industryId: string;
  entities: Record<string, DemoRecord[]>;
  metrics: Record<string, number | string>;
  charts: Record<string, Array<{ label: string; value: number }>>;
  notifications?: DemoNotification[];
}

export function createDemoStore(seed: DemoSeed): DemoStore {
  return {
    entities: structuredClone(seed.entities),
    metrics: { ...seed.metrics },
    charts: structuredClone(seed.charts),
    notifications: seed.notifications ? structuredClone(seed.notifications) : [],
    cart: [],
    meta: {
      templateId: seed.templateId,
      industryId: seed.industryId,
    },
  };
}

export function upsertRecord(
  store: DemoStore,
  collection: string,
  record: DemoRecord,
): DemoStore {
  const list = store.entities[collection] ?? [];
  const index = list.findIndex((item) => item.id === record.id);
  const nextList =
    index >= 0
      ? list.map((item, i) => (i === index ? record : item))
      : [...list, record];
  return {
    ...store,
    entities: { ...store.entities, [collection]: nextList },
  };
}

export function deleteRecord(
  store: DemoStore,
  collection: string,
  id: string,
): DemoStore {
  const list = store.entities[collection] ?? [];
  return {
    ...store,
    entities: {
      ...store.entities,
      [collection]: list.filter((item) => item.id !== id),
    },
  };
}

export function pushNotification(
  store: DemoStore,
  title: string,
  body: string,
): DemoStore {
  return {
    ...store,
    notifications: [
      {
        id: `n-${Date.now()}`,
        title,
        body,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...store.notifications,
    ],
  };
}

export function addToCart(
  store: DemoStore,
  productId: string,
  quantity = 1,
): DemoStore {
  const cart = [...(store.cart ?? [])];
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  return { ...store, cart };
}

export function simulateCheckout(store: DemoStore): DemoStore {
  const products = store.entities.products ?? [];
  const cart = store.cart ?? [];
  let nextProducts = products;
  for (const line of cart) {
    nextProducts = nextProducts.map((product) => {
      if (product.id !== line.productId) return product;
      const stock = Number(product.stock ?? 0) - line.quantity;
      return { ...product, stock: Math.max(0, stock) };
    });
  }
  const orderId = `ord-${Date.now()}`;
  const orders = [
    ...(store.entities.orders ?? []),
    {
      id: orderId,
      status: "completed",
      total: cart.reduce((sum, line) => {
        const product = products.find((p) => p.id === line.productId);
        return sum + Number(product?.price ?? 0) * line.quantity;
      }, 0),
      createdAt: new Date().toISOString().slice(0, 10),
    },
  ];
  return pushNotification(
    {
      ...store,
      entities: { ...store.entities, products: nextProducts, orders },
      cart: [],
      metrics: {
        ...store.metrics,
        ordersToday: Number(store.metrics.ordersToday ?? 0) + 1,
      },
    },
    "Order completed",
    `Simulated checkout created ${orderId}`,
  );
}
