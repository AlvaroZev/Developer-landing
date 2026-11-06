import { useEffect, useMemo, useRef, useState } from "react";
import type { Complexity, DemoAction, DemoState, EntityRecord, EntitySchema, Locale } from "@triunder/domain";
import { meetsComplexity, readLocale } from "@triunder/domain";
import {
  applyAction,
  cartTotalCents,
  createSession,
  getDemo,
  metricValue,
  navigationFor,
  queryRecords,
  restoreSession,
  schemasFor,
  statusCounts,
} from "@triunder/demo-engine";
import { getModule, listModules } from "@triunder/module-system";
import { formatMoney } from "@triunder/i18n";

/**
 * Renders any registered demonstration from @triunder/demo-engine.
 * The shell does not own business rules. It dispatches DemoAction values
 * and draws the state that comes back, including module and complexity changes.
 */
interface EngineDemoProps {
  industrySlug: string;
  solutionSlug: string;
  complexity: Complexity;
  modules: string[];
  locale: Locale;
}

export function EngineDemo({ industrySlug, solutionSlug, complexity, modules, locale }: EngineDemoProps) {
  const definition = getDemo(industrySlug, solutionSlug);
  const storageKey = `triunder.demo.${industrySlug}.${solutionSlug}`;
  const [state, setState] = useState<DemoState | null>(null);
  const stateRef = useRef<DemoState | null>(null);
  stateRef.current = state;
  const [navId, setNavId] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState("");

  useEffect(() => {
    if (!definition) return;
    const raw = readStorage(storageKey);
    const restored = raw
      ? restoreSession(raw, industrySlug, solutionSlug, complexity, modules)
      : createSession(industrySlug, solutionSlug, complexity, modules);
    setState(restored.state);
    setNavId("dashboard");
  }, [definition, industrySlug, solutionSlug, complexity, modules.join(","), storageKey]);

  useEffect(() => {
    if (state) sessionStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const nav = useMemo(
    () => (definition && state ? navigationFor(definition, state.modules, state.complexity) : []),
    [definition, state],
  );
  const active = nav.find((item) => item.id === navId) ?? nav[0];
  const schemas = definition && state ? schemasFor(definition, state.modules) : [];
  const schema = schemas.find((item) => item.key === active?.entityKey);

  if (!definition || !state || !active) {
    return <p className="p-8">This pairing is not a live demonstration.</p>;
  }

  function dispatch(action: DemoAction) {
    if (!stateRef.current) return;
    const result = applyAction(stateRef.current, action);
    stateRef.current = result.state;
    setState(result.state);
    setError(result.error ? readLocale(result.error.message, locale) : "");
  }

  function reset() {
    sessionStorage.removeItem(storageKey);
    const fresh = createSession(industrySlug, solutionSlug, complexity, modules);
    setState(fresh.state);
    setError("");
  }

  return (
    <div className="min-h-[80vh] border-t" style={{ borderColor: "var(--tri-border)" }}>
      <div className="flex min-h-[80vh]">
        <aside
          className="hidden w-60 shrink-0 border-r p-4 md:block"
          style={{ background: "var(--tri-sidebar)", borderColor: "var(--tri-border)", color: "var(--tri-text)" }}
        >
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--tri-muted)" }}>
            {locale === "es" ? "Simulado" : "Simulated"}
          </p>
          <h2 className="mt-2 font-display text-xl">{readLocale(definition.summary, locale)}</h2>
          <nav className="mt-6 space-y-1" aria-label="Demonstration">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full rounded px-3 py-2 text-left text-sm"
                style={{ background: item.id === active.id ? "color-mix(in srgb, var(--tri-accent) 18%, transparent)" : "transparent" }}
                onClick={() => {
                  setNavId(item.id);
                  setSelected(null);
                  setQuery("");
                }}
              >
                {readLocale(item.label, locale)}
              </button>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1" style={{ background: "var(--tri-bg)", color: "var(--tri-text)" }}>
          <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--tri-border)" }}>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: "var(--tri-muted)" }}>
                {state.complexity}
                {state.simulatedRole ? ` · ${state.simulatedRole}` : ""}
              </p>
              <h1 className="font-display text-2xl">{readLocale(active.label, locale)}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {definition.roles && state.complexity === "enterprise"
                ? definition.roles.map((role) => (
                    <button key={role.id} type="button" className="rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--tri-border)" }} onClick={() => dispatch({ type: "set_role", roleId: role.id })}>
                      {readLocale(role.label, locale)}
                    </button>
                  ))
                : null}
              <button type="button" className="rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--tri-border)" }} onClick={reset}>
                {locale === "es" ? "Reiniciar" : "Reset"}
              </button>
            </div>
          </header>
          {error ? (
            <p role="alert" className="mx-4 mt-4 rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--tri-error)" }}>
              {error}
            </p>
          ) : null}
          <div className="p-4 md:p-6">
            {active.view === "dashboard" ? <Dashboard state={state} locale={locale} /> : null}
            {active.view === "custom" && active.custom === "retail-catalog" ? (
              <RetailCatalog state={state} locale={locale} customer={customer} setCustomer={setCustomer} dispatch={dispatch} />
            ) : null}
            {active.view === "custom" && active.custom === "agriculture-field" ? <Field state={state} locale={locale} dispatch={dispatch} /> : null}
            {active.view === "custom" && active.custom === "robotics-cell" ? <Robots state={state} locale={locale} dispatch={dispatch} /> : null}
            {active.view === "custom" && active.custom === "embedded-diagnostics" && schema ? (
              <RecordBrowser state={state} schema={schemas.find((item) => item.key === "diagnostics") ?? schema} locale={locale} query={query} status={status} setQuery={setQuery} setStatus={setStatus} selected={selected} setSelected={setSelected} dispatch={dispatch} />
            ) : null}
            {active.view === "custom" && active.custom === "analytics-board" ? <Dashboard state={state} locale={locale} /> : null}
            {(active.view === "entity" || active.view === "board") && schema ? (
              <RecordBrowser state={state} schema={schema} locale={locale} query={query} status={status} setQuery={setQuery} setStatus={setStatus} selected={selected} setSelected={setSelected} dispatch={dispatch} board={active.view === "board"} />
            ) : null}
            <Workflows definitionId={definition.id} engine={definition.engine} state={state} locale={locale} dispatch={dispatch} />
            <Modules state={state} locale={locale} dispatch={dispatch} />
            {state.complexity === "enterprise" ? <Audit state={state} locale={locale} /> : null}
            <Notifications state={state} locale={locale} onRead={() => dispatch({ type: "mark_notifications_read" })} />
          </div>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t p-2 md:hidden" aria-label="Demonstration mobile" style={{ borderColor: "var(--tri-border)" }}>
        {nav.map((item) => (
          <button key={item.id} type="button" className="shrink-0 rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--tri-border)" }} onClick={() => setNavId(item.id)}>
            {readLocale(item.label, locale)}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Dashboard({ state, locale }: { state: DemoState; locale: Locale }) {
  const definition = getDemo(state.industry, state.solution);
  if (!definition) return null;
  const metrics = definition.metrics.filter((metric) => meetsComplexity(state.complexity, metric.minComplexity));
  const charts = definition.charts.filter((chart) => meetsComplexity(state.complexity, chart.minComplexity));
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.id} className="rounded border p-4" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--tri-muted)" }}>{readLocale(metric.label, locale)}</p>
            <p className="mt-2 font-display text-3xl">
              {metric.format === "currency" ? formatMoney(locale, metricValue(state.entities, metric)) : metricValue(state.entities, metric)}
            </p>
          </article>
        ))}
      </div>
      {charts.map((chart) => (
        <figure key={chart.id} className="rounded border p-4" style={{ borderColor: "var(--tri-border)" }}>
          <figcaption className="mb-3 text-sm">{readLocale(chart.label, locale)}</figcaption>
          <div className="flex h-28 items-end gap-2">
            {chart.points.map((point, index) => {
              const peak = Math.max(...chart.points.map((item) => item.value), 1);
              return (
                <div key={`${chart.id}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-1 self-stretch">
                  <div
                    className="w-full rounded-sm"
                    style={{
                      height: `${Math.max(8, Math.round((point.value / peak) * 88))}px`,
                      background: "var(--tri-accent)",
                    }}
                  />
                  <span className="text-[10px]" style={{ color: "var(--tri-muted)" }}>{readLocale(point.label, locale)}</span>
                </div>
              );
            })}
          </div>
        </figure>
      ))}
    </div>
  );
}

function RecordBrowser(props: {
  state: DemoState;
  schema: EntitySchema;
  locale: Locale;
  query: string;
  status: string;
  setQuery: (value: string) => void;
  setStatus: (value: string) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  dispatch: (action: DemoAction) => void;
  board?: boolean;
}) {
  const rows = queryRecords(props.state.entities[props.schema.key] ?? [], props.schema, {
    text: props.query,
    status: props.status,
    sort: props.schema.primary,
  });
  const statusField = props.schema.fields.find((field) => field.key === "status");
  const selected = rows.find((row) => row.id === props.selected) ?? null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label className="text-sm">
          <span className="sr-only">{props.locale === "es" ? "Buscar" : "Search"}</span>
          <input className="rounded border px-3 py-2" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }} value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder={props.locale === "es" ? "Buscar" : "Search"} />
        </label>
        {statusField?.options ? (
          <select aria-label={props.locale === "es" ? "Estado" : "Status"} className="rounded border px-3 py-2" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }} value={props.status} onChange={(event) => props.setStatus(event.target.value)}>
            <option value="all">{props.locale === "es" ? "Todos" : "All"}</option>
            {statusField.options.map((option) => (
              <option key={option.value} value={option.value}>{readLocale(option.label, props.locale)}</option>
            ))}
          </select>
        ) : null}
      </div>
      {props.board && statusField?.options ? (
        <div className="grid gap-3 md:grid-cols-3">
          {statusCounts(props.state.entities[props.schema.key] ?? []).map((bucket) => (
            <section key={bucket.status} className="rounded border p-3" style={{ borderColor: "var(--tri-border)" }}>
              <h3 className="text-sm">{bucket.status} · {bucket.count}</h3>
              <ul className="mt-2 space-y-2">
                {rows.filter((row) => row.status === bucket.status).map((row) => (
                  <li key={row.id}>
                    <button type="button" className="text-left text-sm underline" onClick={() => props.setSelected(row.id)}>{String(row[props.schema.primary] ?? row.id)}</button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {props.schema.fields.filter((field) => field.table !== false).slice(0, 5).map((field) => (
                  <th key={field.key} className="border-b px-2 py-2 font-medium" style={{ borderColor: "var(--tri-border)" }}>{readLocale(field.label, props.locale)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td className="px-2 py-4" style={{ color: "var(--tri-muted)" }}>{props.locale === "es" ? "Ningún registro coincide." : "No records match."}</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id}>
                  {props.schema.fields.filter((field) => field.table !== false).slice(0, 5).map((field) => (
                    <td key={field.key} className="border-b px-2 py-2" style={{ borderColor: "var(--tri-border)" }}>
                      <button type="button" className="text-left" onClick={() => props.setSelected(row.id)}>{display(row, field.key, props.locale)}</button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected ? <Detail schema={props.schema} row={selected} locale={props.locale} onClose={() => props.setSelected(null)} dispatch={props.dispatch} /> : null}
      <CreateForm schema={props.schema} locale={props.locale} dispatch={props.dispatch} />
    </div>
  );
}

function Detail({ schema, row, locale, onClose, dispatch }: { schema: EntitySchema; row: EntityRecord; locale: Locale; onClose: () => void; dispatch: (action: DemoAction) => void }) {
  const statusField = schema.fields.find((field) => field.key === "status");
  return (
    <aside className="rounded border p-4" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl">{String(row[schema.primary] ?? row.id)}</h3>
        <button type="button" onClick={onClose}>{locale === "es" ? "Cerrar" : "Close"}</button>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {schema.fields.map((field) => (
          <div key={field.key}>
            <dt style={{ color: "var(--tri-muted)" }}>{readLocale(field.label, locale)}</dt>
            <dd>{display(row, field.key, locale)}</dd>
          </div>
        ))}
      </dl>
      {statusField?.options ? (
        <label className="mt-3 block text-sm">
          {locale === "es" ? "Cambiar estado" : "Change status"}
          <select className="ml-2 rounded border px-2 py-1" style={{ borderColor: "var(--tri-border)" }} value={String(row.status ?? "")} onChange={(event) => dispatch({ type: "set_status", entity: schema.key, id: row.id, status: event.target.value })}>
            {statusField.options.map((option) => (
              <option key={option.value} value={option.value}>{readLocale(option.label, locale)}</option>
            ))}
          </select>
        </label>
      ) : null}
    </aside>
  );
}

function CreateForm({ schema, locale, dispatch }: { schema: EntitySchema; locale: Locale; dispatch: (action: DemoAction) => void }) {
  const fields = schema.fields.filter((field) => field.form !== false);
  return (
    <form
      className="grid gap-2 rounded border p-4 md:grid-cols-2"
      style={{ borderColor: "var(--tri-border)" }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const record: Record<string, unknown> = {};
        for (const field of fields) {
          const raw = String(data.get(field.key) ?? "");
          if (!raw) continue;
          record[field.key] = field.type === "number" || field.type === "currency" ? Number(raw) : raw;
        }
        dispatch({ type: "create", entity: schema.key, data: record });
        event.currentTarget.reset();
      }}
    >
      <h3 className="md:col-span-2 text-sm font-medium">{locale === "es" ? "Nuevo registro" : "New record"}</h3>
      {fields.map((field) => (
        <label key={field.key} className="text-sm">
          {readLocale(field.label, locale)}
          {field.options ? (
            <select name={field.key} className="mt-1 w-full rounded border px-2 py-1" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }} defaultValue="">
              <option value="" />
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>{readLocale(option.label, locale)}</option>
              ))}
            </select>
          ) : (
            <input name={field.key} className="mt-1 w-full rounded border px-2 py-1" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }} />
          )}
        </label>
      ))}
      <button type="submit" className="md:col-span-2 w-fit rounded px-3 py-2 text-sm" style={{ background: "var(--tri-primary)", color: "var(--tri-bg)" }}>
        {locale === "es" ? "Crear" : "Create"}
      </button>
    </form>
  );
}

function RetailCatalog({ state, locale, customer, setCustomer, dispatch }: { state: DemoState; locale: Locale; customer: string; setCustomer: (value: string) => void; dispatch: (action: DemoAction) => void }) {
  const products = state.entities.products ?? [];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((product) => (
          <article key={product.id} className="rounded border p-4" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }}>
            <h3 className="font-medium">{String(product.name)}</h3>
            <p className="text-sm" style={{ color: "var(--tri-muted)" }}>{String(product.category)} · {String(product.sku)}</p>
            <p className="mt-2">{formatMoney(locale, Number(product.priceCents ?? 0))}</p>
            <p className="text-xs">{locale === "es" ? "Existencia" : "Stock"} {String(product.stock)}</p>
            <button type="button" className="mt-3 rounded px-3 py-2 text-sm" style={{ background: "var(--tri-accent)", color: "var(--tri-bg)" }} onClick={() => dispatch({ type: "cart_add", productId: product.id, quantity: 1 })}>
              {locale === "es" ? "Añadir" : "Add"}
            </button>
          </article>
        ))}
      </div>
      <aside className="rounded border p-4" style={{ borderColor: "var(--tri-border)" }}>
        <h3 className="font-medium">{locale === "es" ? "Carrito" : "Cart"}</h3>
        {state.cart.length === 0 ? <p className="mt-2 text-sm" style={{ color: "var(--tri-muted)" }}>{locale === "es" ? "El carrito está vacío." : "The cart is empty."}</p> : (
          <ul className="mt-2 space-y-2 text-sm">
            {state.cart.map((line) => {
              const product = products.find((item) => item.id === line.productId);
              return (
                <li key={line.productId} className="flex items-center justify-between gap-2">
                  <span>{String(product?.name ?? line.productId)} × {line.quantity}</span>
                  <button type="button" onClick={() => dispatch({ type: "cart_set_qty", productId: line.productId, quantity: line.quantity - 1 })}>−</button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-sm">{locale === "es" ? "Total" : "Total"} {formatMoney(locale, cartTotalCents(state))}</p>
        <p className="mt-1 text-xs" style={{ color: "var(--tri-muted)" }}>{locale === "es" ? "No se procesa ningún pago." : "No payment is processed."}</p>
        <label className="mt-3 block text-sm">
          {locale === "es" ? "Cliente" : "Customer"}
          <input className="mt-1 w-full rounded border px-2 py-1" style={{ borderColor: "var(--tri-border)" }} value={customer} onChange={(event) => setCustomer(event.target.value)} />
        </label>
        <button type="button" className="mt-3 rounded px-3 py-2 text-sm" style={{ background: "var(--tri-primary)", color: "var(--tri-bg)" }} onClick={() => dispatch({ type: "checkout", customerName: customer })}>
          {locale === "es" ? "Simular compra" : "Simulate purchase"}
        </button>
      </aside>
    </div>
  );
}

function Field({ state, locale, dispatch }: { state: DemoState; locale: Locale; dispatch: (action: DemoAction) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {(state.entities.devices ?? []).map((device) => (
        <article key={device.id} className="rounded border p-4" style={{ borderColor: "var(--tri-border)", background: "var(--tri-surface)" }}>
          <h3 className="font-medium">{String(device.name)}</h3>
          <p className="text-xs" style={{ color: "var(--tri-muted)" }}>{locale === "es" ? "Dispositivo simulado" : "Simulated device"} · {String(device.firmware)}</p>
          <p className="mt-3 font-display text-3xl">{String(device.moisture)}%</p>
          <p className="text-sm">{String(device.tempC)} °C · {String(device.humidity)}%</p>
          <p className="text-sm">{String(device.irrigation)} · {String(device.status)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--tri-border)" }} onClick={() => dispatch({ type: "special", name: "telemetry.sample", payload: { deviceId: device.id } })}>{locale === "es" ? "Simular lectura" : "Simulate reading"}</button>
            <button type="button" className="rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--tri-border)" }} onClick={() => dispatch({ type: "special", name: "irrigation.set", payload: { id: device.id, running: device.irrigation !== "running" } })}>
              {device.irrigation === "running" ? (locale === "es" ? "Detener riego" : "Stop irrigation") : locale === "es" ? "Iniciar riego" : "Start irrigation"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Robots({ state, locale, dispatch }: { state: DemoState; locale: Locale; dispatch: (action: DemoAction) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: "var(--tri-muted)" }}>{locale === "es" ? "Movimiento simulado. No hay un controlador conectado." : "Simulated motion. No controller is connected."}</p>
      {(state.entities.robots ?? []).map((robot) => (
        <article key={robot.id} className="rounded border p-4" style={{ borderColor: "var(--tri-border)" }}>
          <h3>{String(robot.name)}</h3>
          <p className="text-sm">X {String(robot.x)} · Y {String(robot.y)} · {String(robot.state)} · {String(robot.firmware)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => dispatch({ type: "special", name: "robot.jog", payload: { id: robot.id, axis: "x", delta: 10 } })}>X+</button>
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => dispatch({ type: "special", name: "robot.jog", payload: { id: robot.id, axis: "y", delta: 10 } })}>Y+</button>
            <button type="button" className="rounded px-2 py-1 text-xs" style={{ background: "var(--tri-error)", color: "var(--tri-bg)" }} onClick={() => dispatch({ type: "special", name: "robot.estop", payload: { id: robot.id } })}>{locale === "es" ? "Parada" : "E-stop"}</button>
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => dispatch({ type: "special", name: "robot.reset", payload: { id: robot.id } })}>{locale === "es" ? "Restablecer" : "Reset"}</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Workflows({ definitionId, engine, state, locale, dispatch }: { definitionId: string; engine: string; state: DemoState; locale: Locale; dispatch: (action: DemoAction) => void }) {
  if (engine === "healthcare") {
    return (
      <form className="mt-6 grid gap-2 rounded border p-4 md:grid-cols-2" style={{ borderColor: "var(--tri-border)" }} onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        dispatch({ type: "special", name: "appointment.create", payload: { patientId: data.get("patientId"), professionalId: data.get("professionalId"), start: data.get("start"), reason: data.get("reason") } });
      }}>
        <h3 className="md:col-span-2 text-sm font-medium">{locale === "es" ? "Nueva cita" : "New appointment"}</h3>
        <select name="patientId" aria-label="Patient" className="rounded border px-2 py-1" style={{ borderColor: "var(--tri-border)" }}>{(state.entities.patients ?? []).map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select>
        <select name="professionalId" aria-label="Clinician" className="rounded border px-2 py-1" style={{ borderColor: "var(--tri-border)" }}>{(state.entities.professionals ?? []).map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select>
        <input name="start" aria-label="When" className="rounded border px-2 py-1" style={{ borderColor: "var(--tri-border)" }} placeholder="2026-04-21T09:00:00.000Z" />
        <input name="reason" aria-label="Reason" required className="rounded border px-2 py-1" style={{ borderColor: "var(--tri-border)" }} />
        <button className="w-fit rounded px-3 py-2 text-sm" style={{ background: "var(--tri-primary)", color: "var(--tri-bg)" }} type="submit">{locale === "es" ? "Crear cita" : "Create appointment"}</button>
      </form>
    );
  }
  if (engine === "manufacturing") {
    const draft = (state.entities.work_orders ?? []).find((row) => row.status === "draft" || row.status === "awaiting_release");
    return draft ? (
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => dispatch({ type: "special", name: "workorder.release", payload: { id: draft.id } })}>{locale === "es" ? "Liberar" : "Release"} {String(draft.number)}</button>
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => dispatch({ type: "special", name: "workorder.downtime", payload: { id: draft.id, minutes: 10, reason: "Guard check" } })}>{locale === "es" ? "Registrar paro" : "Record downtime"}</button>
      </div>
    ) : null;
  }
  if (engine === "logistics") {
    const pending = (state.entities.shipments ?? []).find((row) => row.status === "pending" || row.status === "assigned" || row.status === "in_transit");
    if (!pending) return null;
    return (
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => dispatch({ type: "special", name: "shipment.assign", payload: { shipmentId: pending.id, vehicleId: "veh-1", driverId: "drv-ada" } })}>{locale === "es" ? "Asignar" : "Assign"} {String(pending.reference)}</button>
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => dispatch({ type: "special", name: "shipment.deliver", payload: { shipmentId: pending.id } })}>{locale === "es" ? "Marcar entregado" : "Mark delivered"}</button>
      </div>
    );
  }
  if (engine === "realestate") {
    return (
      <button type="button" className="mt-6 rounded border px-3 py-2 text-sm" onClick={() => dispatch({ type: "special", name: "lead.create", payload: { name: locale === "es" ? "Prospecto nuevo" : "New Harborline lead", interest: "Wharf" } })}>
        {locale === "es" ? "Nuevo prospecto" : "New lead"}
      </button>
    );
  }
  if (engine === "booking") {
    const open = (state.entities.services ?? state.entities.departures ?? []).find((row) => Number(row.remaining ?? 0) > 0);
    if (!open) return null;
    return <button type="button" className="mt-6 rounded border px-3 py-2 text-sm" onClick={() => dispatch({ type: "special", name: "booking.confirm", payload: { id: open.id } })}>{locale === "es" ? "Confirmar cupo" : "Confirm a seat"} · {String(open.name)}</button>;
  }
  if (engine === "telemetry") {
    const row = (state.entities.meters ?? state.entities.nodes ?? state.entities.assets ?? [])[0];
    if (!row) return null;
    return <button type="button" className="mt-6 rounded border px-3 py-2 text-sm" onClick={() => dispatch({ type: "special", name: "reading.sample", payload: { id: row.id } })}>{locale === "es" ? "Simular lectura" : "Simulate reading"}</button>;
  }
  if (definitionId === "food-production") {
    const lot = (state.entities.lots ?? []).find((row) => row.status === "released");
    if (!lot) return null;
    return <button type="button" className="mt-6 rounded border px-3 py-2 text-sm" onClick={() => dispatch({ type: "set_status", entity: "lots", id: lot.id, status: "hold" })}>{locale === "es" ? "Retener lote" : "Hold lot"} {String(lot.code)}</button>;
  }
  return null;
}

function Modules({ state, locale, dispatch }: { state: DemoState; locale: Locale; dispatch: (action: DemoAction) => void }) {
  const definition = getDemo(state.industry, state.solution);
  if (!definition) return null;
  const available = listModules().filter((module) => definition.optionalModules.includes(module.id));
  if (available.length === 0) return null;
  return (
    <section className="mt-8">
      <h3 className="text-sm font-medium">{locale === "es" ? "Módulos" : "Modules"}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {available.map((module) => {
          const on = state.modules.includes(module.id);
          const info = getModule(module.id);
          return (
            <li key={module.id}>
              <button type="button" className="rounded border px-3 py-2 text-left text-sm" style={{ borderColor: "var(--tri-border)" }} onClick={() => dispatch(on ? { type: "remove_module", moduleId: module.id } : { type: "add_module", moduleId: module.id, withDependencies: true })}>
                {on ? "−" : "+"} {info ? readLocale(info.name, locale) : module.id}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Audit({ state, locale }: { state: DemoState; locale: Locale }) {
  return (
    <section className="mt-8">
      <h3 className="text-sm font-medium">{locale === "es" ? "Auditoría simulada" : "Simulated audit"}</h3>
      {state.audit.length === 0 ? <p className="text-sm" style={{ color: "var(--tri-muted)" }}>{locale === "es" ? "Sin acciones todavía." : "No actions yet."}</p> : (
        <ul className="mt-2 space-y-1 text-sm">
          {state.audit.slice(-8).map((entry) => <li key={entry.id}>{entry.action}</li>)}
        </ul>
      )}
    </section>
  );
}

function Notifications({ state, locale, onRead }: { state: DemoState; locale: Locale; onRead: () => void }) {
  if (state.notifications.length === 0) return null;
  return (
    <section className="mt-8" aria-label={locale === "es" ? "Avisos" : "Notifications"}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{locale === "es" ? "Avisos" : "Notifications"}</h3>
        <button type="button" className="text-xs underline" onClick={onRead}>{locale === "es" ? "Marcar leídos" : "Mark read"}</button>
      </div>
      <ul className="mt-2 space-y-2">
        {state.notifications.slice(0, 5).map((note) => (
          <li key={note.id} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--tri-border)" }}>
            <strong>{readLocale(note.title, locale)}</strong>
            <p>{readLocale(note.body, locale)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function display(row: EntityRecord, key: string, locale: Locale): string {
  const value = row[key];
  if (typeof value === "number" && key.toLowerCase().includes("cents")) return formatMoney(locale, value);
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function readStorage(key: string): unknown {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
