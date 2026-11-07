import {
  type DemoAction,
  type DemoState,
  type EntityDef,
  type FieldDef,
  type Row,
  initialState,
  queryRows,
  reduceDemo,
  resolveDemo,
  rowLabel,
  widgetNumber,
  widgetSlices,
} from "@triunder/demo-engine";
import { formatDate, formatMoney } from "@triunder/i18n";
import { getIndustry } from "@triunder/industry-registry";
import { getSolution } from "@triunder/solution-registry";
import { themeToCssVars } from "@triunder/theme-system";
import { type CSSProperties, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Wordmark } from "../components/brand";
import { Field, Modal } from "../components/ui";
import { track } from "../lib/analytics";
import { useLocale } from "../lib/locale";
import { client, useSession } from "../lib/session";

export function DemoPage() {
  const { industry = "", solution = "" } = useParams();
  const demo = resolveDemo(industry, solution);
  const { t, locale } = useLocale();
  if (!demo) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-lg place-items-center px-6 text-center">
        <div>
          <h1 className="font-serif text-4xl">{t("demo.unavailableTitle")}</h1>
          <p className="mt-3 text-[var(--muted)]">{t("demo.unavailableBody")}</p>
          <Link className="btn mt-6" to="/">
            {t("demo.backHome")}
          </Link>
        </div>
      </main>
    );
  }
  return <DemoApplication industry={industry} solution={solution} />;
}

function DemoApplication({ industry, solution }: { industry: string; solution: string }) {
  const demo = resolveDemo(industry, solution);
  const industryDef = getIndustry(industry);
  const solutionDef = getSolution(solution);
  const { t, locale, setLocale } = useLocale();
  const { user, online } = useSession();
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [section, setSection] = useState("overview");
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const storageKey = `triunder.demo.${industry}.${solution}`;
  const [data, setData] = useState<DemoState>(() =>
    readState(storageKey, demo ? initialState(demo) : initialState({ seeds: {} })),
  );

  // demo is rebuilt on every render; industry and solution are the inputs that should restart the session.
  // biome-ignore lint/correctness/useExhaustiveDependencies: route params already cover the resolved demo
  useEffect(() => {
    if (!demo) return;
    setData(readState(storageKey, initialState(demo)));
    setSection("overview");
    track("demo_started", { industry, solution });
    void client.request("/api/v1/guest-sessions", { method: "POST" }).catch(() => undefined);
    void client
      .request<{ state: DemoState | null }>("/api/v1/demo-sessions", {
        method: "POST",
        body: JSON.stringify({ industrySlug: industry, solutionSlug: solution }),
      })
      .then((session) => {
        if (session.state?.entities) setData(session.state);
      })
      .catch(() => undefined);
  }, [industry, solution, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    const handle = window.setTimeout(() => {
      void client
        .request("/api/v1/demo-sessions/current", {
          method: "PUT",
          body: JSON.stringify({ industrySlug: industry, solutionSlug: solution, state: data }),
        })
        .catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [data, industry, solution, storageKey]);

  if (!demo || !industryDef || !solutionDef) return null;
  const theme = mode === "dark" ? industryDef.theme.dark : industryDef.theme.light;

  function dispatch(action: DemoAction) {
    if (!demo) return;
    const result = reduceDemo(demo, data, action);
    if (!result.ok) {
      setNotice(result.error?.message ?? t("errors.generic"));
      return;
    }
    setNotice(result.state.notices[0]?.body ?? "");
    setData(result.state);
    track("demo_interaction", { industry, solution, status: action.type });
  }

  const nav = [
    { id: "overview", label: t("demo.dashboard") },
    ...demo.entities.map((entity) => ({ id: entity.key, label: entity.plural[locale] })),
  ];

  return (
    <div className="demo-shell bg-[var(--bg)] text-[var(--text)]" style={themeToCssVars(theme) as CSSProperties}>
      <aside className={`${menu ? "block" : "hidden"} demo-sidebar md:block`}>
        <Link to="/" className="no-underline">
          <Wordmark />
        </Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          {industryDef.name[locale]}
        </p>
        <h1 className="mt-2 font-serif text-2xl leading-tight">{solutionDef.name[locale]}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{solutionDef.description[locale]}</p>
        <nav className="mt-5 grid gap-1" aria-label={solutionDef.name[locale]}>
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className="nav-item"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => {
                setSection(item.id);
                setMenu(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="demo-topbar">
          <button
            type="button"
            className="btn-quiet md:hidden"
            onClick={() => setMenu((value) => !value)}
          >
            {t("nav.menu")}
          </button>
          <p className="text-sm text-[var(--muted)]">
            {online ? t("demo.guest") : t("demo.localOnly")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-quiet"
              onClick={() => setLocale(locale === "en" ? "es" : "en")}
            >
              {locale === "en" ? "ES" : "EN"}
            </button>
            <button
              type="button"
              className="btn-quiet"
              onClick={() => setMode((value) => (value === "light" ? "dark" : "light"))}
            >
              {mode === "light" ? t("nav.dark") : t("nav.light")}
            </button>
            <button
              type="button"
              className="btn-quiet"
              onClick={() => {
                dispatch({ type: "reset" });
                localStorage.removeItem(storageKey);
              }}
            >
              {t("demo.reset")}
            </button>
            {user ? (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  void client
                    .request("/api/v1/configurations", {
                      method: "POST",
                      body: JSON.stringify({ industrySlug: industry, solutionSlug: solution }),
                    })
                    .then(() => setNotice(t("demo.saved")))
                    .catch(() => setNotice(t("errors.offline")));
                }}
              >
                {t("demo.save")}
              </button>
            ) : null}
            <Link className="btn-accent" to={`/inquiry?industry=${industry}&solution=${solution}`}>
              {t("demo.inquiry")}
            </Link>
          </div>
        </header>
        {demo.blueprint.hardware ? (
          <p className="border-b border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-sm">
            {t("demo.simulated")}
          </p>
        ) : null}
        {notice ? (
          <p className="px-4 pt-3 text-sm" role="status">
            {notice}
          </p>
        ) : null}
        <main className="demo-main">
          {section === "overview" ? (
            <Overview
              demoIndustry={industry}
              demoSolution={solution}
              data={data}
              dispatch={dispatch}
            />
          ) : null}
          {demo.entities
            .filter((entity) => entity.key === section)
            .map((entity) => (
              <EntityScreen
                key={entity.key}
                entity={entity}
                data={data}
                dispatch={dispatch}
                currency={demo.currency}
              />
            ))}
        </main>
      </div>
    </div>
  );
}

function Overview({
  demoIndustry,
  demoSolution,
  data,
  dispatch,
}: {
  demoIndustry: string;
  demoSolution: string;
  data: DemoState;
  dispatch: (action: DemoAction) => void;
}) {
  const demo = resolveDemo(demoIndustry, demoSolution);
  const { locale, t } = useLocale();
  const [draft, setDraft] = useState<{ productId: string; qty: number }[]>([]);
  const [query, setQuery] = useState("");
  if (!demo) return null;
  const order = demo.blueprint.order;
  const products = order ? (data.entities[order.productEntity] ?? []) : [];

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {demo.dashboard
          .filter((widget) => widget.kind === "count" || widget.kind === "sum")
          .map((widget) => (
            <article key={widget.id} className="kpi">
              <p className="text-sm font-medium text-[var(--muted)]">{widget.title[locale]}</p>
              <p className="mt-2 font-serif text-3xl tracking-tight">
                {widget.kind === "sum" &&
                widget.field &&
                /amount|total|price|value|balance|cost|margin/.test(widget.field)
                  ? formatMoney(locale, widgetNumber(data, widget), demo.currency)
                  : widgetNumber(data, widget)}
              </p>
            </article>
          ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {demo.dashboard
          .filter((widget) => widget.kind === "donut" || widget.kind === "bar")
          .map((widget) => (
            <Chart
              key={widget.id}
              title={widget.title[locale]}
              slices={widgetSlices(data, widget)}
            />
          ))}
      </section>
      {demo.presentation === "pipeline" ? (
        <Pipeline entities={demo.entities} data={data} dispatch={dispatch} />
      ) : null}
      {order ? (
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <article key={product.id} className="panel-elevated p-4" data-testid={`product-${product.id}`}>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {String(product.sku ?? product.category ?? "SKU")}
                </p>
                <h3 className="mt-1 font-serif text-xl">{rowLabel(product)}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {formatMoney(locale, Number(product[order.priceField] ?? 0), demo.currency)} ·{" "}
                  {String(product[order.stockField] ?? 0)}
                </p>
                <button
                  type="button"
                  className="btn-accent mt-3"
                  onClick={() => setDraft((lines) => [...lines, { productId: product.id, qty: 1 }])}
                >
                  {t("demo.addLine")}
                </button>
              </article>
            ))}
          </div>
          <form
            className="panel p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const merged = new Map<string, number>();
              for (const line of draft)
                merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.qty);
              dispatch({
                type: "compose-order",
                lines: [...merged.entries()].map(([productId, qty]) => ({ productId, qty })),
              });
              setDraft([]);
            }}
          >
            <h3 className="font-serif text-2xl">{t("demo.compose")}</h3>
            <ul className="my-3 grid gap-1 text-sm">
              {draft.map((line, index) => (
                <li key={`${line.productId}-${index}`}>
                  {line.qty} × {line.productId}
                </li>
              ))}
            </ul>
            <button
              type="submit"
              className="btn"
              data-testid="compose-order"
              disabled={!draft.length}
            >
              {t("demo.compose")}
            </button>
          </form>
        </section>
      ) : null}
      {demo.blueprint.hardware ? (
        <Hardware
          demoIndustry={demoIndustry}
          demoSolution={demoSolution}
          data={data}
          dispatch={dispatch}
        />
      ) : null}
      {demo.blueprint.knowledge ? (
        <form
          className="panel grid gap-3 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            dispatch({ type: "query-knowledge", query });
          }}
        >
          <h3 className="font-serif text-2xl">{t("demo.query")}</h3>
          <Field label={t("demo.query")}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} />
          </Field>
          <button type="submit" className="btn w-fit">
            {t("demo.query")}
          </button>
          <ul className="grid gap-2">
            {data.knowledge.map((hit) => (
              <li key={hit.id} className="rounded-xl border border-[var(--border)] p-3">
                <strong>{hit.title}</strong>
                <p className="text-sm text-[var(--muted)]">{hit.excerpt}</p>
              </li>
            ))}
          </ul>
          {query && data.knowledge.length === 0 ? (
            <p className="text-sm">{t("demo.knowledgeEmpty")}</p>
          ) : null}
        </form>
      ) : null}
      {demo.blueprint.extract ? (
        <section className="grid gap-3">
          {(data.entities[demo.blueprint.extract.entity] ?? []).map((row) => (
            <article key={row.id} className="panel p-4">
              <h3 className="font-serif text-xl">{rowLabel(row)}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {String(row[demo.blueprint.extract?.bodyField ?? "body"] ?? "")}
              </p>
              <button
                type="button"
                className="btn mt-3"
                onClick={() => dispatch({ type: "extract", id: row.id })}
              >
                {t("demo.extract")}
              </button>
              {row.extractedAmount ? (
                <p className="mt-2 text-sm">
                  {t("demo.extracted")}: {String(row.extractedEmail)} ·{" "}
                  {String(row.extractedAmount)}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function Hardware({
  demoIndustry,
  demoSolution,
  data,
  dispatch,
}: {
  demoIndustry: string;
  demoSolution: string;
  data: DemoState;
  dispatch: (action: DemoAction) => void;
}) {
  const demo = resolveDemo(demoIndustry, demoSolution);
  const { t } = useLocale();
  if (!demo?.blueprint.hardware) return null;
  const hardware = demo.blueprint.hardware;
  const devices = data.entities[hardware.deviceEntity] ?? [];
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => dispatch({ type: "simulate" })}>
          {t("demo.simulate")}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {devices.map((device) => (
          <article key={device.id} className="panel p-4">
            <h3 className="font-serif text-xl">{rowLabel(device)}</h3>
            <p className="text-sm text-[var(--muted)]">
              {hardware.readingField}: {String(device[hardware.readingField] ?? "—")}
            </p>
            {hardware.kind === "robotics" ? (
              <svg
                viewBox="0 0 100 100"
                className="mt-3 h-28 w-full rounded-xl bg-[var(--secondary)]"
                role="img"
                aria-label={rowLabel(device)}
              >
                <circle
                  cx={Number(device.x ?? 20)}
                  cy={Number(device.y ?? 20)}
                  r="4"
                  fill="var(--accent)"
                />
              </svg>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {hardware.estop ? (
                <>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() =>
                      dispatch({
                        type: "control",
                        entity: hardware.deviceEntity,
                        id: device.id,
                        control: "estop",
                      })
                    }
                  >
                    {t("demo.estop")}
                  </button>
                  <button
                    type="button"
                    className="btn-quiet"
                    onClick={() =>
                      dispatch({
                        type: "control",
                        entity: hardware.deviceEntity,
                        id: device.id,
                        control: "resume",
                      })
                    }
                  >
                    {t("demo.resume")}
                  </button>
                </>
              ) : null}
              {hardware.kind === "embedded" ? (
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() =>
                    dispatch({
                      type: "control",
                      entity: hardware.deviceEntity,
                      id: device.id,
                      control: "diagnose",
                    })
                  }
                >
                  {t("demo.score")}
                </button>
              ) : null}
              {hardware.kind === "integration" ? (
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() =>
                    dispatch({
                      type: "control",
                      entity: hardware.deviceEntity,
                      id: device.id,
                      control: "sync",
                    })
                  }
                >
                  {t("demo.score")}
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {(data.entities.zones ?? []).map((zone) => (
          <article key={zone.id} className="panel p-4">
            <h3 className="font-serif text-xl">{rowLabel(zone)}</h3>
            <p className="text-sm">
              {String(zone.valve)} · {String(zone.moisture)}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  dispatch({
                    type: "control",
                    entity: "zones",
                    id: zone.id,
                    control: "valve",
                    value: "open",
                  })
                }
              >
                {t("demo.valveOpen")}
              </button>
              <button
                type="button"
                className="btn-quiet"
                onClick={() =>
                  dispatch({
                    type: "control",
                    entity: "zones",
                    id: zone.id,
                    control: "valve",
                    value: "closed",
                  })
                }
              >
                {t("demo.valveClosed")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pipeline({
  entities,
  data,
  dispatch,
}: { entities: EntityDef[]; data: DemoState; dispatch: (action: DemoAction) => void }) {
  const entity = entities.find((item) => item.transitions && item.statusKey);
  const { locale } = useLocale();
  if (!entity?.statusKey) return null;
  const options = entity.fields.find((field) => field.key === entity.statusKey)?.options ?? [];
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {options.map((option) => (
        <section key={option.value} className="pipeline-col">
          <h3 className="text-sm font-semibold">{option.label[locale]}</h3>
          <div className="mt-2 grid gap-2">
            {(data.entities[entity.key] ?? [])
              .filter((row) => row[entity.statusKey ?? ""] === option.value)
              .map((row) => {
                const next = entity.transitions?.[option.value]?.[0];
                return (
                  <article key={row.id} className="pipeline-card">
                    <p className="font-medium">{rowLabel(row)}</p>
                    {next ? (
                      <button
                        type="button"
                        className="btn-quiet mt-2"
                        onClick={() =>
                          dispatch({ type: "transition", entity: entity.key, id: row.id, to: next })
                        }
                      >
                        {next}
                      </button>
                    ) : null}
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Chart({ title, slices }: { title: string; slices: { label: string; value: number }[] }) {
  const max = Math.max(...slices.map((slice) => slice.value), 1);
  return (
    <article className="chart-panel">
      <h3 className="font-serif text-xl">{title}</h3>
      <div className="mt-4 grid gap-3">
        {slices.map((slice, index) => (
          <div
            key={slice.label}
            className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-sm"
          >
            <span className="truncate">{slice.label}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-[var(--secondary)]">
              <span
                className="block h-2.5 rounded-full transition-[width] duration-500"
                style={{
                  width: `${(slice.value / max) * 100}%`,
                  background: `var(--chart-${index % 6})`,
                }}
              />
            </span>
            <span className="font-semibold">{slice.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function EntityScreen({
  entity,
  data,
  dispatch,
  currency,
}: {
  entity: EntityDef;
  data: DemoState;
  dispatch: (action: DemoAction) => void;
  currency: string;
}) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState(entity.fields.find((field) => field.sortable)?.key ?? "");
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const status = entity.fields.find((field) => field.type === "status");
  const searchable = entity.fields.filter((field) => field.searchable).map((field) => field.key);
  const rows = queryRows(data.entities[entity.key] ?? [], searchable, {
    search,
    filters: status ? { [status.key]: filter } : {},
    sort,
    direction: "asc",
  });
  const columns = entity.fields.filter((field) => field.table).slice(0, 5);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl">{entity.plural[locale]}</h2>
          <p className="text-sm text-[var(--muted)]">
            {rows.length} {t("demo.rows")}
          </p>
        </div>
        <button type="button" className="btn" onClick={() => setCreating(true)}>
          {t("demo.new")}
        </button>
      </div>
      <div className="mb-3 grid gap-2 md:grid-cols-3">
        <Field label={t("demo.search")}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} />
        </Field>
        {status ? (
          <Field label={t("demo.filter")}>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">{t("demo.all")}</option>
              {status.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[locale]}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <span />
        )}
        <Field label={t("demo.sort")}>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            {entity.fields
              .filter((field) => field.sortable)
              .map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label[locale]}
                </option>
              ))}
          </select>
        </Field>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state">
          {search || filter !== "all" ? t("demo.emptyFilter") : t("demo.empty")}
        </div>
      ) : (
        <div className="table-shell">
          <table className="data">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label[locale]}</th>
                ))}
                <th>{t("demo.transition")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const current = String(row[entity.statusKey ?? ""] ?? "");
                const next = entity.transitions?.[current] ?? [];
                return (
                  <tr key={row.id}>
                    {columns.map((column) => (
                      <td key={column.key} data-label={column.label[locale]}>
                        {column.type === "status" ? (
                          <span className="status-pill">
                            {display(row[column.key], column, locale, currency, data)}
                          </span>
                        ) : (
                          display(row[column.key], column, locale, currency, data)
                        )}
                      </td>
                    ))}
                    <td data-label={t("demo.transition")}>
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className="btn-quiet" onClick={() => setEditing(row)}>
                          {t("demo.edit")}
                        </button>
                        {next.map((target) => (
                          <button
                            key={target}
                            type="button"
                            className="btn-quiet"
                            onClick={() =>
                              dispatch({
                                type: "transition",
                                entity: entity.key,
                                id: row.id,
                                to: target,
                              })
                            }
                          >
                            {target}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() =>
                            dispatch({ type: "delete", entity: entity.key, id: row.id })
                          }
                        >
                          {t("demo.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {creating ? (
        <RecordForm
          entity={entity}
          data={data}
          title={t("demo.new")}
          onClose={() => setCreating(false)}
          onSubmit={(values) => {
            dispatch({ type: "create", entity: entity.key, values });
            setCreating(false);
          }}
        />
      ) : null}
      {editing ? (
        <RecordForm
          entity={entity}
          data={data}
          title={t("demo.edit")}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            dispatch({ type: "update", entity: entity.key, id: editing.id, values });
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

function RecordForm({
  entity,
  data,
  title,
  initial,
  onClose,
  onSubmit,
}: {
  entity: EntityDef;
  data: DemoState;
  title: string;
  initial?: Row;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const { locale } = useLocale();
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    initial ? { ...initial } : {},
  );
  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(values);
        }}
      >
        {entity.fields
          .filter((field) => field.form && !field.readonly)
          .map((field) => (
            <Field key={field.key} label={field.label[locale]}>
              <FieldControl
                field={field}
                value={values[field.key]}
                data={data}
                onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
              />
            </Field>
          ))}
        <button type="submit" className="btn">
          {title}
        </button>
      </form>
    </Modal>
  );
}

function FieldControl({
  field,
  value,
  data,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  data: DemoState;
  onChange: (value: unknown) => void;
}) {
  const { locale } = useLocale();
  if (field.type === "textarea")
    return (
      <textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
    );
  if (field.type === "boolean")
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(event.target.checked)}
      />
    );
  if (field.type === "select" || field.type === "status") {
    return (
      <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
        <option value="" />
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label[locale]}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "relation" && field.relation) {
    return (
      <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
        <option value="" />
        {(data.entities[field.relation] ?? []).map((row) => (
          <option key={row.id} value={row.id}>
            {rowLabel(row)}
          </option>
        ))}
      </select>
    );
  }
  const kind =
    field.type === "number" || field.type === "money" || field.type === "percent"
      ? "number"
      : field.type === "date"
        ? "datetime-local"
        : field.type === "email"
          ? "email"
          : "text";
  return (
    <input
      type={kind}
      value={String(value ?? "")}
      onChange={(event) =>
        onChange(kind === "number" ? Number(event.target.value) : event.target.value)
      }
    />
  );
}

function display(
  value: unknown,
  field: FieldDef,
  locale: "en" | "es",
  currency: string,
  data: DemoState,
): string {
  if (field.type === "money" && typeof value === "number")
    return formatMoney(locale, value, currency);
  if (field.type === "relation" && field.relation) {
    const row = (data.entities[field.relation] ?? []).find((item) => item.id === value);
    return row ? rowLabel(row) : String(value ?? "");
  }
  if ((field.type === "status" || field.type === "select") && field.options) {
    return (
      field.options.find((option) => option.value === value)?.label[locale] ?? String(value ?? "")
    );
  }
  if (field.type === "date" && (typeof value === "string" || value instanceof Date)) {
    const formatted = formatDate(locale, value);
    if (formatted) return formatted;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value ?? "");
}

function readState(key: string, fallback: DemoState): DemoState {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed.entities) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}
