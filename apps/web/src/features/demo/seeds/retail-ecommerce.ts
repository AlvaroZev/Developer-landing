import type { DemoSeed } from "../engine/demo-store";

export function retailEcommerceSeed(): DemoSeed {
  return {
    templateId: "ecommerce",
    industryId: "retail",
    entities: {
      products: [
        {
          id: "prd-1",
          name: "Canvas Field Jacket",
          price: 148,
          stock: 24,
          status: "in-stock",
        },
        {
          id: "prd-2",
          name: "Merino Crew Sweater",
          price: 96,
          stock: 41,
          status: "in-stock",
        },
        {
          id: "prd-3",
          name: "Trail Runner Shoe",
          price: 128,
          stock: 8,
          status: "low-stock",
        },
        {
          id: "prd-4",
          name: "Compact Daypack",
          price: 84,
          stock: 0,
          status: "out-of-stock",
        },
      ],
      orders: [
        {
          id: "ord-9001",
          status: "fulfilled",
          total: 244,
          createdAt: "2026-03-09",
        },
        {
          id: "ord-9002",
          status: "processing",
          total: 128,
          createdAt: "2026-03-11",
        },
      ],
      customers: [
        {
          id: "cus-1",
          name: "Ava Thompson",
          status: "active",
          email: "ava.thompson@example.invalid",
        },
        {
          id: "cus-2",
          name: "Diego Ruiz",
          status: "active",
          email: "diego.ruiz@example.invalid",
        },
      ],
      primary: [],
    },
    metrics: {
      revenue: "$12,480",
      ordersToday: 17,
      conversionRate: "3.1%",
    },
    charts: {
      salesChart: [
        { label: "Mon", value: 1200 },
        { label: "Tue", value: 1580 },
        { label: "Wed", value: 1420 },
        { label: "Thu", value: 1810 },
        { label: "Fri", value: 2100 },
      ],
    },
  };
}
