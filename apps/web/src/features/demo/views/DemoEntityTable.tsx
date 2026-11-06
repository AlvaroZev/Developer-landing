import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useLocation } from "react-router-dom";
import type { ComplexityLevel } from "@triunder/domain";
import type { ShowroomIndustry } from "@triunder/industry-registry";
import type { SolutionDefinition } from "@triunder/solution-registry";
import { useI18n } from "../../../state/i18n-context";
import {
  addToCart,
  deleteRecord,
  pushNotification,
  simulateCheckout,
  upsertRecord,
  type DemoRecord,
  type DemoStore,
} from "../engine/demo-store";

interface Props {
  industry: ShowroomIndustry;
  solution: SolutionDefinition;
  complexity: ComplexityLevel;
  store: DemoStore;
  setStore: Dispatch<SetStateAction<DemoStore>>;
}

export function DemoEntityTable({
  industry,
  solution,
  complexity,
  store,
  setStore,
}: Props) {
  const { messages, locale } = useI18n();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const terminology = industry.terminology[locale];

  const collection = resolveCollection(location.pathname, solution.demoTemplateId);
  const records = store.entities[collection] ?? [];

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const matchesQuery =
        !query ||
        Object.values(record).some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query.toLowerCase()),
        );
      const matchesStatus =
        statusFilter === "all" || String(record.status) === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [records, query, statusFilter]);

  const statuses = Array.from(
    new Set(records.map((r) => String(r.status ?? "")).filter(Boolean)),
  );

  const columns = inferColumns(filtered[0]);

  const createRecord = () => {
    const id = `${collection.slice(0, 3)}-${Date.now()}`;
    const record: DemoRecord = {
      id,
      name: `${terminology.entitySingular} ${filtered.length + 1}`,
      status: "new",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setStore((prev) =>
      pushNotification(
        upsertRecord(prev, collection, record),
        "Record created",
        `${record.name} added to ${collection}`,
      ),
    );
  };

  const advanceStatus = (record: DemoRecord) => {
    const nextStatus = nextStatusFor(solution.demoTemplateId, String(record.status ?? "new"));
    setStore((prev) =>
      pushNotification(
        upsertRecord(prev, collection, { ...record, status: nextStatus }),
        "Status updated",
        `${record.name ?? record.id} → ${nextStatus}`,
      ),
    );
  };

  const isEcommerceCatalog =
    solution.demoTemplateId === "ecommerce" && collection === "products";
  const isCart = solution.demoTemplateId === "ecommerce" && location.pathname.includes("/cart");

  if (isCart) {
    return (
      <EcommerceCart
        store={store}
        setStore={setStore}
        messages={messages}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={messages.demo.search}
          className="rounded border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--tri-border)",
            background: "var(--tri-surface)",
            color: "var(--tri-text)",
          }}
          aria-label={messages.demo.search}
        />
        {complexity !== "starter" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--tri-border)",
              background: "var(--tri-surface)",
              color: "var(--tri-text)",
            }}
            aria-label={messages.demo.filter}
          >
            <option value="all">All</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={createRecord}
          className="rounded px-3 py-2 text-sm font-medium"
          style={{ background: "var(--tri-primary)", color: "var(--tri-bg)" }}
        >
          {messages.demo.create}
        </button>
        {solution.demoTemplateId === "agriculture-iot" && collection === "primary" && (
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            style={{ borderColor: "var(--tri-border)" }}
            onClick={() =>
              setStore((prev) =>
                pushNotification(
                  prev,
                  "Irrigation started",
                  "Simulated irrigation cycle started for Zone B",
                ),
              )
            }
          >
            {terminology.primaryAction}
          </button>
        )}
      </div>

      <div
        className="mt-4 overflow-x-auto rounded border"
        style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }}
      >
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr style={{ color: "var(--tri-muted)" }}>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 font-medium">
                  {col}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-6" colSpan={columns.length + 1}>
                  {messages.demo.empty}
                </td>
              </tr>
            ) : (
              filtered.map((record) => (
                <tr key={record.id} className="border-t" style={{ borderColor: "var(--tri-border)" }}>
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2">
                      {String(record[col] ?? "")}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => advanceStatus(record)}
                      >
                        Advance
                      </button>
                      {isEcommerceCatalog && (
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={() =>
                            setStore((prev) =>
                              pushNotification(
                                addToCart(prev, record.id, 1),
                                "Added to cart",
                                String(record.name),
                              ),
                            )
                          }
                        >
                          Add to cart
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-xs underline"
                        style={{ color: "var(--tri-error)" }}
                        onClick={() =>
                          setStore((prev) => deleteRecord(prev, collection, record.id))
                        }
                      >
                        {messages.demo.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EcommerceCart({
  store,
  setStore,
  messages,
}: {
  store: DemoStore;
  setStore: Dispatch<SetStateAction<DemoStore>>;
  messages: { demo: { empty: string } };
}) {
  const products = store.entities.products ?? [];
  const cart = store.cart ?? [];
  const lines = cart.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    return {
      ...line,
      name: String(product?.name ?? line.productId),
      price: Number(product?.price ?? 0),
    };
  });
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="font-display text-2xl">Cart</h2>
      {lines.length === 0 ? (
        <p style={{ color: "var(--tri-muted)" }}>{messages.demo.empty}</p>
      ) : (
        <ul className="space-y-3">
          {lines.map((line) => (
            <li
              key={line.productId}
              className="flex justify-between border-b py-2 text-sm"
              style={{ borderColor: "var(--tri-border)" }}
            >
              <span>
                {line.name} × {line.quantity}
              </span>
              <span>${(line.price * line.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between">
        <strong>Total: ${total.toFixed(2)}</strong>
        <button
          type="button"
          disabled={lines.length === 0}
          className="rounded px-4 py-2 text-sm font-medium disabled:opacity-40"
          style={{ background: "var(--tri-primary)", color: "var(--tri-bg)" }}
          onClick={() => setStore((prev) => simulateCheckout(prev))}
        >
          Simulate checkout
        </button>
      </div>
      <p className="text-xs" style={{ color: "var(--tri-muted)" }}>
        Demo only — no real payments are processed.
      </p>
    </div>
  );
}

function resolveCollection(pathname: string, templateId: string): string {
  if (pathname.includes("/catalog") || pathname.includes("/products")) return "products";
  if (pathname.includes("/orders")) return "orders";
  if (pathname.includes("/customers")) return "customers";
  if (pathname.includes("/machines") || pathname.includes("/vehicles") || pathname.includes("/zones"))
    return "secondary";
  if (pathname.includes("/drivers")) return "drivers";
  if (pathname.includes("/lines")) return "lines";
  if (pathname.includes("/devices") || pathname.includes("/entities") || pathname.includes("/shipments") || pathname.includes("/work-orders"))
    return "primary";
  if (pathname.includes("/secondary") || pathname.includes("/appointments") || pathname.includes("/properties"))
    return "secondary";
  if (templateId === "ecommerce") return "products";
  return "primary";
}

function inferColumns(sample?: DemoRecord): string[] {
  if (!sample) return ["id", "name", "status"];
  return Object.keys(sample).slice(0, 6);
}

function nextStatusFor(templateId: string, current: string): string {
  const flows: Record<string, string[]> = {
    crm: ["new", "active", "follow-up", "inactive"],
    ecommerce: ["in-stock", "low-stock", "out-of-stock"],
    mes: ["queued", "running", "completed", "downtime"],
    fleet: ["assigned", "in-transit", "delivered", "exception"],
    "agriculture-iot": ["online", "degraded", "offline", "online"],
  };
  const flow = flows[templateId] ?? ["new", "active", "closed"];
  const index = flow.indexOf(current);
  return flow[(index + 1) % flow.length] ?? flow[0]!;
}
