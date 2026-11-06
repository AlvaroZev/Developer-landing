import type { DemoSeed } from "../engine/demo-store";

/** Entirely fictional medical data — never present as real PHI. */
export function healthcareCrmSeed(): DemoSeed {
  return {
    templateId: "crm",
    industryId: "healthcare",
    entities: {
      primary: [
        {
          id: "pat-1001",
          name: "Elena Vargas",
          status: "active",
          email: "elena.vargas@example.invalid",
          createdAt: "2026-01-12",
        },
        {
          id: "pat-1002",
          name: "Marcus Chen",
          status: "active",
          email: "marcus.chen@example.invalid",
          createdAt: "2026-02-03",
        },
        {
          id: "pat-1003",
          name: "Sofia Alvarez",
          status: "follow-up",
          email: "sofia.alvarez@example.invalid",
          createdAt: "2026-02-18",
        },
        {
          id: "pat-1004",
          name: "James Okonkwo",
          status: "inactive",
          email: "james.okonkwo@example.invalid",
          createdAt: "2025-11-09",
        },
      ],
      secondary: [
        {
          id: "apt-2001",
          name: "Elena Vargas · Checkup",
          status: "scheduled",
          professional: "Dr. Rivera",
          createdAt: "2026-03-10",
        },
        {
          id: "apt-2002",
          name: "Marcus Chen · Follow-up",
          status: "completed",
          professional: "Dr. Patel",
          createdAt: "2026-03-08",
        },
        {
          id: "apt-2003",
          name: "Sofia Alvarez · Consultation",
          status: "scheduled",
          professional: "Dr. Rivera",
          createdAt: "2026-03-12",
        },
      ],
      professionals: [
        { id: "pro-1", name: "Dr. Rivera", status: "available", specialty: "Internal Medicine" },
        { id: "pro-2", name: "Dr. Patel", status: "in-clinic", specialty: "Cardiology" },
      ],
    },
    metrics: {
      metricPrimary: 128,
      metricSecondary: 14,
      followUpsDue: 6,
      noShowRate: "4.2%",
    },
    charts: {
      pipelineChart: [
        { label: "Mon", value: 12 },
        { label: "Tue", value: 18 },
        { label: "Wed", value: 15 },
        { label: "Thu", value: 21 },
        { label: "Fri", value: 17 },
      ],
    },
    notifications: [
      {
        id: "n1",
        title: "Follow-up due",
        body: "Sofia Alvarez requires a care pathway update.",
        createdAt: "2026-03-11T09:00:00Z",
        read: false,
      },
    ],
  };
}
