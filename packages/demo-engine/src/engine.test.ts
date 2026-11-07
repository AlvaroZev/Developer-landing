import { industries } from "@triunder/industry-registry";
import { allCompatiblePairs, solutions } from "@triunder/solution-registry";
import { describe, expect, it } from "vitest";
import { blueprints } from "./blueprints";
import { exerciseDemo } from "./exercise";
import { queryRows } from "./query";
import { initialState, reduceDemo } from "./reduce";
import { integrityIssues, resolveDemo } from "./resolve";

describe("demo engine catalog", () => {
  it("implements every solution and no extra blueprint", () => {
    expect(blueprints).toHaveLength(solutions.length);
    for (const solution of solutions) {
      expect(
        blueprints.some((item) => item.slug === solution.slug),
        solution.slug,
      ).toBe(true);
    }
    expect(new Set(blueprints.map((item) => item.presentation)).size).toBeGreaterThanOrEqual(8);
  });

  it.each(allCompatiblePairs().map((pair) => [`${pair.industry}/${pair.solution}`, pair] as const))(
    "%s seeds cleanly and completes its workflow",
    (_label, pair) => {
      const demo = resolveDemo(pair.industry, pair.solution);
      expect(demo, _label).not.toBeNull();
      if (!demo) return;
      expect(integrityIssues(demo), _label).toEqual([]);
      expect(demo.seeds[demo.entities[0]?.key ?? ""]?.length).toBeGreaterThan(0);
      const result = exerciseDemo(demo);
      expect(result.reason, _label).toBeUndefined();
      expect(result.ok, _label).toBe(true);
    },
  );

  it("rejects pairs that are not on the matrix", () => {
    expect(resolveDemo("healthcare", "robotics")).toBeNull();
    expect(resolveDemo("custom", "crm")).toBeNull();
    expect(resolveDemo("missing", "crm")).toBeNull();
  });

  it("gives shared solutions different industry language and fields", () => {
    const clinic = resolveDemo("healthcare", "crm");
    const brokerage = resolveDemo("real-estate", "crm");
    const patients = clinic?.entities.find((item) => item.key === "contacts");
    const leads = brokerage?.entities.find((item) => item.key === "contacts");
    expect(patients?.singular.en).toBe("Patient");
    expect(patients?.singular.es).toBe("Paciente");
    expect(leads?.singular.en).toBe("Lead");
    expect(patients?.fields.some((field) => field.key === "mrn")).toBe(true);
    expect(leads?.fields.some((field) => field.key === "budget")).toBe(true);
    expect(clinic?.blueprint.presentation).toBe("pipeline");
    expect(resolveDemo("manufacturing", "manufacturing-execution")?.presentation).toBe(
      "operations",
    );
    expect(resolveDemo("agriculture", "smart-agriculture")?.presentation).toBe("telemetry");
    expect(industries.find((item) => item.slug === "healthcare")?.theme.light.primary).not.toBe(
      industries.find((item) => item.slug === "manufacturing")?.theme.light.primary,
    );
  });
});

describe("domain workflows", () => {
  it("clears an invoice balance when a payment is recorded", () => {
    const demo = resolveDemo("finance", "billing");
    if (!demo) throw new Error("missing demo");
    let state = initialState(demo);
    const invoice = state.entities.invoices?.find((row) => row.status === "draft");
    if (!invoice) throw new Error("missing invoice");
    state = reduceDemo(demo, state, {
      type: "transition",
      entity: "invoices",
      id: invoice.id,
      to: "issued",
    }).state;
    const paid = reduceDemo(demo, state, {
      type: "transition",
      entity: "invoices",
      id: invoice.id,
      to: "paid",
    });
    const updated = paid.state.entities.invoices?.find((row) => row.id === invoice.id);
    expect(updated?.balance).toBe(0);
    expect(updated?.status).toBe("paid");
    expect(
      paid.state.entities.payments?.some(
        (row) => row.invoiceId === invoice.id && row.status === "settled",
      ),
    ).toBe(true);
  });

  it("decrements stock and charges tax on a retail order", () => {
    const demo = resolveDemo("retail", "ecommerce");
    if (!demo) throw new Error("missing demo");
    const state = initialState(demo);
    const product = state.entities.products?.[0];
    if (!product) throw new Error("missing product");
    const before = Number(product.stock);
    const result = reduceDemo(demo, state, {
      type: "compose-order",
      lines: [{ productId: product.id, qty: 2 }],
    });
    expect(result.ok).toBe(true);
    expect(result.state.entities.products?.[0]?.stock).toBe(before - 2);
    const order = result.state.entities.orders?.[0];
    expect(order?.tax).toBeGreaterThan(0);
    expect(order?.total).toBe(Number(order?.subtotal) + Number(order?.tax));
  });

  it("keeps a marketplace fee before the seller payout", () => {
    const demo = resolveDemo("ecommerce", "marketplaces");
    if (!demo) throw new Error("missing demo");
    const state = initialState(demo);
    const listing = state.entities.listings?.[0];
    if (!listing) throw new Error("missing listing");
    const result = reduceDemo(demo, state, {
      type: "compose-order",
      lines: [{ productId: listing.id, qty: 1 }],
    });
    const order = result.state.entities.orders?.[0];
    const payout = result.state.entities.payouts?.[0];
    expect(Number(payout?.amount)).toBeCloseTo(Number(order?.total) * 0.9, 2);
  });

  it("refuses a double-booked appointment and accepts a free hour", () => {
    const demo = resolveDemo("healthcare", "scheduling");
    if (!demo) throw new Error("missing demo");
    const result = exerciseDemo(demo);
    expect(result.ok).toBe(true);
    const state = initialState(demo);
    const sample = state.entities.appointments?.[0];
    if (!sample) throw new Error("missing appointment");
    const { id: _id, ...rest } = sample;
    const clash = reduceDemo(demo, state, { type: "create", entity: "appointments", values: rest });
    expect(clash.ok).toBe(false);
    expect(clash.error?.code).toBe("conflict");
  });

  it("rolls project progress up from finished tasks", () => {
    const demo = resolveDemo("construction", "project-management");
    if (!demo) throw new Error("missing demo");
    let state = initialState(demo);
    const task = state.entities.tasks?.find((row) => row.status === "todo");
    if (!task) throw new Error("missing task");
    state = reduceDemo(demo, state, {
      type: "transition",
      entity: "tasks",
      id: task.id,
      to: "doing",
    }).state;
    state = reduceDemo(demo, state, {
      type: "transition",
      entity: "tasks",
      id: task.id,
      to: "done",
    }).state;
    const project = state.entities.projects?.find((row) => row.id === task.projectId);
    const tasks = state.entities.tasks?.filter((row) => row.projectId === task.projectId) ?? [];
    const expected = Math.round(
      (tasks.filter((row) => row.status === "done").length / tasks.length) * 100,
    );
    expect(project?.progress).toBe(expected);
  });

  it("raises a reorder when a posted movement crosses the line", () => {
    const demo = resolveDemo("manufacturing", "inventory-management");
    if (!demo) throw new Error("missing demo");
    const state = initialState(demo);
    const movement = state.entities.movements?.[0];
    if (!movement) throw new Error("missing movement");
    const posted = reduceDemo(demo, state, {
      type: "transition",
      entity: "movements",
      id: movement.id,
      to: "posted",
    });
    const sku = posted.state.entities.skus?.find((row) => row.id === movement.skuId);
    expect(sku?.status).toBe("reorder");
    expect(Number(sku?.onHand)).toBeLessThanOrEqual(Number(sku?.reorderAt));
  });

  it("opens an irrigation valve when automatic moisture is below the threshold", () => {
    const demo = resolveDemo("agriculture", "smart-agriculture");
    if (!demo) throw new Error("missing demo");
    const state = initialState(demo);
    const result = reduceDemo(demo, state, { type: "simulate" });
    expect(result.state.entities.zones?.[0]?.valve).toBe("open");
    expect(result.state.entities.zones?.[0]?.status).toBe("watering");
    expect(result.state.notices.some((item) => item.title === "Irrigation")).toBe(true);
  });

  it("stops a robot and zeroes its speed", () => {
    const demo = resolveDemo("manufacturing", "robotics");
    if (!demo) throw new Error("missing demo");
    const state = initialState(demo);
    const robot = state.entities.robots?.[0];
    if (!robot) throw new Error("missing robot");
    const stopped = reduceDemo(demo, state, {
      type: "control",
      entity: "robots",
      id: robot.id,
      control: "estop",
    });
    const updated = stopped.state.entities.robots?.[0];
    expect(updated?.state).toBe("estop");
    expect(updated?.speed).toBe(0);
  });

  it("retrieves only passages that contain the question", () => {
    const demo = resolveDemo("technology-saas", "rag-applications");
    if (!demo) throw new Error("missing demo");
    const state = initialState(demo);
    const found = reduceDemo(demo, state, { type: "query-knowledge", query: "contact amount" });
    expect(found.state.knowledge.length).toBeGreaterThan(0);
    expect(found.state.knowledge[0]?.excerpt.toLowerCase()).toContain("contact");
    const missed = reduceDemo(demo, state, {
      type: "query-knowledge",
      query: "zzzz-not-in-corpus",
    });
    expect(missed.state.knowledge).toEqual([]);
  });

  it("extracts an email and amount that are actually in the document", () => {
    const demo = resolveDemo("finance", "document-processing");
    if (!demo) throw new Error("missing demo");
    const state = initialState(demo);
    const document = state.entities.documents?.[0];
    if (!document) throw new Error("missing document");
    const result = reduceDemo(demo, state, { type: "extract", id: document.id });
    const updated = result.state.entities.documents?.find((row) => row.id === document.id);
    expect(String(updated?.extractedAmount)).toBe("1840.00");
    expect(String(updated?.extractedEmail)).toContain("@");
    expect(String(document.body)).toContain(String(updated?.extractedEmail));
  });

  it("searches, filters, and sorts without dropping unrelated rows by accident", () => {
    const demo = resolveDemo("healthcare", "crm");
    if (!demo) throw new Error("missing demo");
    const rows = initialState(demo).entities.accounts ?? [];
    expect(queryRows(rows, ["name"], { search: "___none___" })).toHaveLength(0);
    expect(queryRows(rows, ["name"], {}).length).toBe(rows.length);
    const filtered = queryRows(rows, ["name"], { filters: { status: "new" } });
    expect(filtered.every((row) => row.status === "new")).toBe(true);
    const sorted = queryRows(rows, ["name"], { sort: "value", direction: "desc" });
    const values = sorted.map((row) => Number(row.value));
    expect([...values].sort((a, b) => b - a)).toEqual(values);
  });

  it("does not delete a record that is still referenced", () => {
    const demo = resolveDemo("healthcare", "crm");
    if (!demo) throw new Error("missing demo");
    const state = initialState(demo);
    const account = state.entities.accounts?.[0];
    if (!account) throw new Error("missing account");
    const removed = reduceDemo(demo, state, { type: "delete", entity: "accounts", id: account.id });
    expect(removed.ok).toBe(false);
    expect(removed.error?.code).toBe("in_use");
  });
});
