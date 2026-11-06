import type { DemoSeed } from "../engine/demo-store";

/** Clearly identified simulated telemetry — never presented as live hardware. */
export function agricultureIotSeed(): DemoSeed {
  return {
    templateId: "agriculture-iot",
    industryId: "agriculture",
    entities: {
      primary: [
        {
          id: "dev-801",
          name: "Soil Probe North",
          status: "online",
          zone: "Zone A",
          moisture: 28,
          temperature: 24.1,
          humidity: 61,
        },
        {
          id: "dev-802",
          name: "Soil Probe South",
          status: "online",
          zone: "Zone B",
          moisture: 17,
          temperature: 26.4,
          humidity: 54,
        },
        {
          id: "dev-803",
          name: "Weather Node East",
          status: "degraded",
          zone: "Zone C",
          moisture: 22,
          temperature: 25.0,
          humidity: 58,
        },
      ],
      secondary: [
        { id: "zone-a", name: "Zone A", status: "irrigating", moisture: 28 },
        { id: "zone-b", name: "Zone B", status: "dry", moisture: 17 },
        { id: "zone-c", name: "Zone C", status: "stable", moisture: 22 },
      ],
    },
    metrics: {
      avgMoisture: "22%",
      activeAlerts: 2,
      temperature: "25.2°C",
      irrigationRuntime: "1.4h",
    },
    charts: {
      telemetryChart: [
        { label: "00:00", value: 30 },
        { label: "04:00", value: 27 },
        { label: "08:00", value: 22 },
        { label: "12:00", value: 18 },
        { label: "16:00", value: 20 },
        { label: "20:00", value: 24 },
      ],
    },
    notifications: [
      {
        id: "n1",
        title: "Moisture threshold",
        body: "Zone B moisture below 18% threshold (simulated).",
        createdAt: "2026-03-11T07:15:00Z",
        read: false,
      },
      {
        id: "n2",
        title: "Device degraded",
        body: "Weather Node East connectivity intermittent (simulated).",
        createdAt: "2026-03-11T06:50:00Z",
        read: false,
      },
    ],
  };
}
