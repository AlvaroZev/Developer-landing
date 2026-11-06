import type { DemoSeed } from "../engine/demo-store";

export function realEstateCrmSeed(): DemoSeed {
  return {
    templateId: "crm",
    industryId: "real-estate",
    entities: {
      primary: [
        {
          id: "lead-301",
          name: "Nora Kim",
          status: "qualified",
          email: "nora.kim@example.invalid",
          createdAt: "2026-02-20",
        },
        {
          id: "lead-302",
          name: "Andre Silva",
          status: "new",
          email: "andre.silva@example.invalid",
          createdAt: "2026-03-01",
        },
        {
          id: "lead-303",
          name: "Priya Nair",
          status: "negotiation",
          email: "priya.nair@example.invalid",
          createdAt: "2026-01-28",
        },
      ],
      secondary: [
        {
          id: "prop-401",
          name: "12 Harbor View · Condo",
          status: "listed",
          price: 485000,
          createdAt: "2026-01-15",
        },
        {
          id: "prop-402",
          name: "88 Maple Court · Townhome",
          status: "pending",
          price: 620000,
          createdAt: "2026-02-02",
        },
        {
          id: "prop-403",
          name: "4 Cedar Lane · Single family",
          status: "listed",
          price: 745000,
          createdAt: "2026-02-22",
        },
      ],
      agents: [
        { id: "ag-1", name: "Luis Mendoza", status: "active", deals: 4 },
        { id: "ag-2", name: "Hannah Brooks", status: "active", deals: 7 },
      ],
      viewings: [
        {
          id: "view-1",
          name: "Nora Kim · Harbor View",
          status: "scheduled",
          createdAt: "2026-03-13",
        },
      ],
    },
    metrics: {
      metricPrimary: 42,
      metricSecondary: "$4.2M",
      viewingsWeek: 11,
      dealsClosed: 3,
    },
    charts: {
      pipelineChart: [
        { label: "New", value: 14 },
        { label: "Qualified", value: 9 },
        { label: "Viewing", value: 7 },
        { label: "Offer", value: 4 },
        { label: "Closed", value: 3 },
      ],
    },
    notifications: [
      {
        id: "n1",
        title: "Viewing scheduled",
        body: "Nora Kim · 12 Harbor View tomorrow at 10:00.",
        createdAt: "2026-03-11T14:00:00Z",
        read: false,
      },
    ],
  };
}
