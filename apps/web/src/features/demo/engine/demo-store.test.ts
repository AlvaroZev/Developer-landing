import { describe, expect, it } from "vitest";
import {
  addToCart,
  createDemoStore,
  simulateCheckout,
  upsertRecord,
} from "./demo-store";
import { retailEcommerceSeed } from "../seeds/retail-ecommerce";
import { healthcareCrmSeed } from "../seeds/healthcare-crm";
import { manufacturingMesSeed } from "../seeds/manufacturing-mes";
import { logisticsFleetSeed } from "../seeds/logistics-fleet";
import { agricultureIotSeed } from "../seeds/agriculture-iot";
import { realEstateCrmSeed } from "../seeds/real-estate-crm";

describe("demo store", () => {
  it("creates seeded healthcare CRM state", () => {
    const store = createDemoStore(healthcareCrmSeed());
    expect(store.entities.primary?.length).toBeGreaterThan(0);
    expect(store.metrics.metricPrimary).toBeTruthy();
  });

  it("creates real estate CRM with leads and properties", () => {
    const store = createDemoStore(realEstateCrmSeed());
    expect(store.entities.primary?.[0]?.status).toBeTruthy();
    expect(store.entities.secondary?.length).toBeGreaterThan(0);
  });

  it("adds to cart and simulates checkout reducing stock", () => {
    let store = createDemoStore(retailEcommerceSeed());
    const product = store.entities.products![0]!;
    const before = Number(product.stock);
    store = addToCart(store, product.id, 2);
    store = simulateCheckout(store);
    const after = Number(store.entities.products!.find((p) => p.id === product.id)!.stock);
    expect(after).toBe(before - 2);
    expect(store.cart).toEqual([]);
    expect(store.entities.orders!.length).toBeGreaterThan(1);
  });

  it("supports MES work order upsert", () => {
    let store = createDemoStore(manufacturingMesSeed());
    store = upsertRecord(store, "primary", {
      id: "wo-999",
      name: "New WO",
      status: "queued",
      product: "SKU-Z",
      quantity: 10,
    });
    expect(store.entities.primary?.some((r) => r.id === "wo-999")).toBe(true);
  });

  it("seeds logistics and agriculture demos", () => {
    expect(createDemoStore(logisticsFleetSeed()).entities.primary?.length).toBeGreaterThan(0);
    expect(createDemoStore(agricultureIotSeed()).notifications.length).toBeGreaterThan(0);
  });
});
