import type { DemoSeed } from "../engine/demo-store";

export function manufacturingMesSeed(): DemoSeed {
  return {
    templateId: "mes",
    industryId: "manufacturing",
    entities: {
      primary: [
        {
          id: "wo-501",
          name: "Assembly · SKU-A12",
          status: "running",
          product: "SKU-A12",
          lineId: "line-1",
          quantity: 400,
        },
        {
          id: "wo-502",
          name: "Packaging · SKU-B07",
          status: "queued",
          product: "SKU-B07",
          lineId: "line-2",
          quantity: 250,
        },
        {
          id: "wo-503",
          name: "QC · SKU-A12",
          status: "completed",
          product: "SKU-A12",
          lineId: "line-1",
          quantity: 400,
        },
      ],
      secondary: [
        { id: "mch-1", name: "CNC-01", status: "running", lineId: "line-1" },
        { id: "mch-2", name: "PickPlace-02", status: "idle", lineId: "line-2" },
        { id: "mch-3", name: "Oven-03", status: "maintenance", lineId: "line-1" },
      ],
      lines: [
        { id: "line-1", name: "Line Alpha", status: "running", oee: 86 },
        { id: "line-2", name: "Line Beta", status: "setup", oee: 71 },
      ],
    },
    metrics: {
      oee: "82%",
      activeLines: 2,
      downtimeMinutes: 37,
      throughput: 940,
    },
    charts: {
      throughputChart: [
        { label: "06:00", value: 80 },
        { label: "09:00", value: 140 },
        { label: "12:00", value: 160 },
        { label: "15:00", value: 150 },
        { label: "18:00", value: 120 },
      ],
    },
    notifications: [
      {
        id: "n1",
        title: "Maintenance alert",
        body: "Oven-03 exceeded temperature variance threshold (simulated).",
        createdAt: "2026-03-11T11:20:00Z",
        read: false,
      },
    ],
  };
}
