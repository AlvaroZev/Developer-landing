import type { DemoSeed } from "../engine/demo-store";

export function logisticsFleetSeed(): DemoSeed {
  return {
    templateId: "fleet",
    industryId: "logistics",
    entities: {
      primary: [
        {
          id: "shp-701",
          name: "Austin → Dallas",
          destination: "Dallas DC",
          status: "in-transit",
          vehicleId: "veh-1",
          eta: "2026-03-11",
        },
        {
          id: "shp-702",
          name: "Houston → San Antonio",
          destination: "San Antonio Hub",
          status: "assigned",
          vehicleId: "veh-2",
          eta: "2026-03-12",
        },
        {
          id: "shp-703",
          name: "El Paso → Phoenix",
          destination: "Phoenix Crossdock",
          status: "delivered",
          vehicleId: "veh-3",
          eta: "2026-03-10",
        },
      ],
      secondary: [
        { id: "veh-1", name: "Truck TX-118", status: "en-route", driverId: "drv-1" },
        { id: "veh-2", name: "Van TX-204", status: "available", driverId: "drv-2" },
        { id: "veh-3", name: "Truck TX-091", status: "idle", driverId: "drv-3" },
      ],
      drivers: [
        { id: "drv-1", name: "Carla Mendez", status: "on-duty" },
        { id: "drv-2", name: "Owen Blake", status: "on-duty" },
        { id: "drv-3", name: "Maya Torres", status: "off-duty" },
      ],
    },
    metrics: {
      onTimeRate: "94%",
      activeVehicles: 2,
      deliveriesToday: 28,
      exceptions: 1,
    },
    charts: {
      deliveryChart: [
        { label: "Mon", value: 24 },
        { label: "Tue", value: 31 },
        { label: "Wed", value: 27 },
        { label: "Thu", value: 33 },
        { label: "Fri", value: 29 },
      ],
    },
    notifications: [
      {
        id: "n1",
        title: "Route delay",
        body: "Shipment shp-701 delayed 18 minutes (simulated tracking).",
        createdAt: "2026-03-11T08:40:00Z",
        read: false,
      },
    ],
  };
}
