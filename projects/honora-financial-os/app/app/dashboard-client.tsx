"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { buildThirteenWeekForecast, calculateProjectQuote } from "../../lib/honora";

type Client = { id: string; name: string; email: string | null; monthlyRevenue: number; paymentTermsDays: number; status: "active" | "paused"; createdAt: string };
type Invoice = { id: string; clientId: string | null; clientName: string; description: string; amount: number; dueDate: string; status: "pending" | "paid" | "overdue"; issuedAt: string; paidAt: string | null };
type Quote = { id: string; clientName: string; projectName: string; hours: number; hourlyRate: number; externalCosts: number; contingencyRate: number; targetMargin: number; total: number; status: "draft" | "sent" | "accepted"; createdAt: string };
type ForecastWeek = { week: number; startDate: string; openingCash: number; inflow: number; outflow: number; closingCash: number; risk: "healthy" | "watch" | "critical" };
type DashboardData = {
  user: { name: string; email: string };
  workspace: { id: string; businessName: string; monthlyFixedCosts: number; reserveRate: number; targetMargin: number; cashReserve: number; billableHours: number; plan: "free" | "pro"; subscriptionStatus: string };
  clients: Client[];
  invoices: Invoice[];
  quotes: Quote[];
  metrics: { monthlyIncome: number; accountsReceivable: number; overdueAmount: number; topClientShare: number; projectedCash13w: number; honoraScore: number; protectedHourlyRate: number };
  forecast: ForecastWeek[];
  limits: { clients: number; invoices: number; quotes: number };
};

type Tab = "overview" | "cashflow" | "clients" | "collections" | "quotes" | "billing" | "settings";

const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 });
const exactMoney = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", timeZone: "UTC" });
const dateFromNow = (days: number) => { const date = new Date(); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
const demoId = () => `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

function createDemoData(): DashboardData {
  const clients: Client[] = [
    { id: "c1", name: "Estudio Norte", email: "finanzas@estudionorte.pe", monthlyRevenue: 3900, paymentTermsDays: 30, status: "active", createdAt: new Date().toISOString() },
    { id: "c2", name: "Páramo Digital", email: "hola@paramo.pe", monthlyRevenue: 2800, paymentTermsDays: 15, status: "active", createdAt: new Date().toISOString() },
    { id: "c3", name: "Lucía Benavides", email: "lucia@example.com", monthlyRevenue: 2200, paymentTermsDays: 20, status: "active", createdAt: new Date().toISOString() },
  ];
  const invoices: Invoice[] = [
    { id: "i1", clientId: "c1", clientName: "Estudio Norte", description: "Retainer de estrategia", amount: 2600, dueDate: dateFromNow(5), status: "pending", issuedAt: new Date().toISOString(), paidAt: null },
    { id: "i2", clientId: "c2", clientName: "Páramo Digital", description: "Sprint de automatización", amount: 1200, dueDate: dateFromNow(-4), status: "overdue", issuedAt: new Date().toISOString(), paidAt: null },
    { id: "i3", clientId: "c3", clientName: "Lucía Benavides", description: "Financial review", amount: 950, dueDate: dateFromNow(12), status: "pending", issuedAt: new Date().toISOString(), paidAt: null },
  ];
  const forecast = buildThirteenWeekForecast(8500, 710, invoices);
  return {
    user: { name: "Gabriel Pérez Chávez", email: "demo@honora.pe" },
    workspace: { id: "demo", businessName: "Gabriel Independent Studio", monthlyFixedCosts: 3075, reserveRate: 8, targetMargin: 25, cashReserve: 8500, billableHours: 80, plan: "pro", subscriptionStatus: "demo" },
    clients, invoices,
    quotes: [{ id: "q1", clientName: "Altura Labs", projectName: "Go-to-market sprint", hours: 42, hourlyRate: 95, externalCosts: 450, contingencyRate: 10, targetMargin: 25, total: 6512, status: "draft", createdAt: new Date().toISOString() }],
    metrics: { monthlyIncome: 8900, accountsReceivable: 4750, overdueAmount: 1200, topClientShare: 43.8, projectedCash13w: forecast.at(-1)?.closingCash ?? 0, honoraScore: 78, protectedHourlyRate: 72.84 },
    forecast, limits: { clients: 2, invoices: 5, quotes: 1 },
  };
}

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌁" }, { id: "cashflow", label: "Cash flow", icon: "∿" },
  { id: "clients", label: "Clientes", icon: "◎" }, { id: "collections", label: "Cobros", icon: "◫" },
  { id: "quotes", label: "Quotes", icon: "◇" }, { id: "billing", label: "Plan Pro", icon: "↗" },
  { id: "settings", label: "Configuración", icon: "⚙" },
];

export default function DashboardClient({ mode, initialUser }: { mode: "live" | "demo"; initialUser: { name: string; email: string } }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData | null>(mode === "demo" ? createDemoData() : null);
  const [busy, setBusy] = useState(mode === "live");
  const [notice, setNotice] = useState(mode === "demo" ? "Estás explorando una demo editable. Los cambios no se guardan." : "");
  const [error, setError] = useState("");

  const load = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const payload = await response.json() as DashboardData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar el workspace.");
      setData(payload);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo cargar Honora."); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as DashboardData & { error?: string };
        if (!response.ok) throw new Error(payload.error || "No se pudo cargar el workspace.");
        return payload;
      })
      .then((payload) => { if (!cancelled) setData(payload); })
      .catch((caught: unknown) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "No se pudo cargar Honora."); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [mode]);

  const mutate = async (path: string, method: "POST" | "PATCH", body: unknown, success: string) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json() as DashboardData & { error?: string; code?: string };
      if (!response.ok) throw Object.assign(new Error(payload.error || "No se pudo guardar."), { code: payload.code });
      setData(payload); setNotice(success); return true;
    } catch (caught) {
      const value = caught as Error & { code?: string };
      setError(value.message);
      if (value.code === "PLAN_LIMIT") setActiveTab("billing");
      return false;
    } finally { setBusy(false); }
  };

  if (!data) return <div className="workspace-loading"><span className="brand-mark">H</span><p>{error || "Preparando tu Financial OS…"}</p>{error && <button onClick={() => void load()}>Reintentar</button>}</div>;

  const firstName = (data.user.name || initialUser.name).split(" ")[0];
  const month = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(new Date());

  return (
    <main className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link className="workspace-brand" href="/"><span className="brand-mark">H</span><span><strong>HONORA</strong><small>FINANCIAL OS</small></span></Link>
        <nav aria-label="Módulos de Honora">
          <small>WORKSPACE</small>
          {navItems.slice(0, 5).map((item) => <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}><i>{item.icon}</i><span>{item.label}</span>{item.id === "collections" && data.metrics.overdueAmount > 0 && <b>!</b>}</button>)}
          <small>ACCOUNT</small>
          {navItems.slice(5).map((item) => <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}><i>{item.icon}</i><span>{item.label}</span></button>)}
        </nav>
        <div className="sidebar-plan"><span>{data.workspace.plan === "pro" ? "PRO WORKSPACE" : "FREE WORKSPACE"}</span><strong>{data.workspace.plan === "pro" ? "Sistema desbloqueado" : `${data.clients.length}/${data.limits.clients} clientes usados`}</strong><div><i style={{ width: data.workspace.plan === "pro" ? "100%" : `${Math.min(100, data.clients.length / data.limits.clients * 100)}%` }} /></div>{data.workspace.plan === "free" && <button onClick={() => setActiveTab("billing")}>Ver Pro →</button>}</div>
        <div className="sidebar-user"><span>{firstName.slice(0, 1).toUpperCase()}</span><div><strong>{data.user.name || initialUser.name}</strong><small>{mode === "demo" ? "Demo interactiva" : data.user.email}</small></div>{mode === "live" && <a href="/signout-with-chatgpt?return_to=%2F" aria-label="Cerrar sesión">↗</a>}</div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-topbar"><div><button className="mobile-menu" onClick={() => setActiveTab("overview")}>H</button><span>{data.workspace.businessName}</span><i>/</i><strong>{navItems.find((item) => item.id === activeTab)?.label}</strong></div><div><span className="sync-status"><i /> {mode === "demo" ? "DEMO" : "SYNCED"}</span><button className="upgrade-mini" onClick={() => setActiveTab("billing")}>{data.workspace.plan === "pro" ? "PRO" : "UPGRADE"}</button></div></header>
        <div className="mobile-tabs">{navItems.map((item) => <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}>{item.icon}<span>{item.label}</span></button>)}</div>

        {(notice || error) && <div className={`workspace-notice ${error ? "error" : ""}`}><span>{error ? "!" : "✓"}</span><p>{error || notice}</p><button onClick={() => { setNotice(""); setError(""); }}>×</button></div>}
        {busy && <div className="busy-line"><i /></div>}

        {activeTab === "overview" && <Overview data={data} firstName={firstName} month={month} go={setActiveTab} />}
        {activeTab === "cashflow" && <CashFlow data={data} />}
        {activeTab === "clients" && <ClientsPanel data={data} mode={mode} setData={setData} mutate={mutate} />}
        {activeTab === "collections" && <CollectionsPanel data={data} mode={mode} setData={setData} mutate={mutate} />}
        {activeTab === "quotes" && <QuotesPanel data={data} mode={mode} setData={setData} mutate={mutate} />}
        {activeTab === "billing" && <BillingPanel data={data} mode={mode} setNotice={setNotice} setError={setError} />}
        {activeTab === "settings" && <SettingsPanel data={data} mode={mode} setData={setData} mutate={mutate} />}
      </section>
    </main>
  );
}

function SectionHeader({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="workspace-title"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}

function MetricCard({ label, value, note, tone = "normal", index }: { label: string; value: string; note: string; tone?: "normal" | "good" | "warn"; index: string }) {
  return <article className={`metric-card ${tone}`}><div><span>{label}</span><b>{index}</b></div><strong>{value}</strong><p>{note}</p></article>;
}

function Overview({ data, firstName, month, go }: { data: DashboardData; firstName: string; month: string; go: (tab: Tab) => void }) {
  const outstanding = data.invoices.filter((invoice) => invoice.status !== "paid");
  return <div className="workspace-content">
    <SectionHeader eyebrow={`EXECUTIVE OVERVIEW · ${month.toUpperCase()}`} title={`Buenos días, ${firstName}.`} copy="Aquí está la verdad operativa de tu negocio y la próxima decisión que más puede proteger tu caja." action={<button className="primary-action" onClick={() => go("collections")}>Registrar cobro <span>＋</span></button>} />
    <div className="metrics-grid">
      <MetricCard index="01" label="REVENUE / MES" value={money.format(data.metrics.monthlyIncome)} note={`${data.clients.filter((client) => client.status === "active").length} clientes activos`} tone="good" />
      <MetricCard index="02" label="ACCOUNTS RECEIVABLE" value={money.format(data.metrics.accountsReceivable)} note={`${money.format(data.metrics.overdueAmount)} vencido`} tone={data.metrics.overdueAmount > 0 ? "warn" : "normal"} />
      <MetricCard index="03" label="13-WEEK CASH" value={money.format(data.metrics.projectedCash13w)} note={data.metrics.projectedCash13w >= 0 ? "Caja proyectada positiva" : "Requiere acción inmediata"} tone={data.metrics.projectedCash13w >= 0 ? "good" : "warn"} />
      <MetricCard index="04" label="HONORA SCORE" value={`${data.metrics.honoraScore}/100`} note={data.metrics.honoraScore >= 75 ? "Operación saludable" : "Equilibrio por mejorar"} />
    </div>
    <div className="overview-grid">
      <article className="panel forecast-overview"><div className="panel-head"><div><span>13-WEEK CASH FORECAST</span><h2>Liquidez proyectada</h2></div><button onClick={() => go("cashflow")}>Abrir detalle ↗</button></div><ForecastBars forecast={data.forecast} /><div className="forecast-summary"><span>Opening cash <b>{money.format(data.workspace.cashReserve)}</b></span><span>Closing cash <b>{money.format(data.metrics.projectedCash13w)}</b></span><span>Net movement <b>{money.format(data.metrics.projectedCash13w - data.workspace.cashReserve)}</b></span></div></article>
      <article className="panel score-panel"><div className="panel-head"><div><span>REVENUE QUALITY</span><h2>Concentración</h2></div><b className={data.metrics.topClientShare > 40 ? "risk-chip" : "healthy-chip"}>{data.metrics.topClientShare > 40 ? "ALTA" : "CONTROLADA"}</b></div><div className="score-dial" style={{ "--score-angle": `${Math.min(100, data.metrics.topClientShare) * 3.6}deg` } as React.CSSProperties}><div><strong>{data.metrics.topClientShare.toFixed(0)}%</strong><small>top client</small></div></div><p>{data.metrics.topClientShare > 40 ? "Más del 40% de tu revenue depende de un cliente. Protege tu pipeline antes de aumentar costos fijos." : "Tu cartera mantiene una concentración manejable. Defiende la recurrencia de los clientes rentables."}</p><button onClick={() => go("clients")}>Revisar client economics →</button></article>
    </div>
    <div className="overview-grid lower">
      <article className="panel collection-preview"><div className="panel-head"><div><span>COLLECTION RADAR</span><h2>Próximos cobros</h2></div><button onClick={() => go("collections")}>Ver todos →</button></div>{outstanding.length ? <div className="compact-table">{outstanding.slice(0, 4).map((invoice) => <div key={invoice.id}><span className={`status-dot ${invoice.status}`} /><div><strong>{invoice.clientName}</strong><small>{invoice.description}</small></div><time>{shortDate.format(new Date(`${invoice.dueDate}T00:00:00Z`))}</time><b>{money.format(invoice.amount)}</b></div>)}</div> : <EmptyState title="Nada pendiente" copy="Tu accounts receivable está limpio." />}</article>
      <article className="opportunity-card"><span>PRICING OPPORTUNITY</span><div><strong>{exactMoney.format(data.metrics.protectedHourlyRate)}</strong><small>protected hourly rate</small></div><h2>Cotiza desde tu margen, no desde la intuición.</h2><p>El quote builder protege costos externos, contingency y target margin antes de presentar un precio.</p><button onClick={() => go("quotes")}>Crear project quote <span>→</span></button></article>
    </div>
  </div>;
}

function ForecastBars({ forecast }: { forecast: ForecastWeek[] }) {
  const minimum = Math.min(0, ...forecast.map((week) => week.closingCash));
  const maximum = Math.max(1, ...forecast.map((week) => week.closingCash));
  const range = maximum - minimum;
  return <div className="forecast-visual"><div className="zero-line" style={{ bottom: `${Math.max(0, (-minimum / range) * 100)}%` }} />{forecast.map((week) => <div key={week.week} className="week-bar"><i className={week.risk} style={{ height: `${Math.max(4, ((week.closingCash - minimum) / range) * 100)}%` }}><span>{money.format(week.closingCash)}</span></i><small>W{String(week.week).padStart(2, "0")}</small></div>)}</div>;
}

function CashFlow({ data }: { data: DashboardData }) {
  const lowest = data.forecast.reduce((current, week) => week.closingCash < current.closingCash ? week : current, data.forecast[0]);
  return <div className="workspace-content">
    <SectionHeader eyebrow="CASH CONTROL · 13 WEEKS" title="Anticipa tu caja." copy="Una vista semanal de cobros esperados, operating burn y liquidez disponible." />
    <div className="cash-insight"><div><span>LOWEST CASH POINT</span><strong>{money.format(lowest?.closingCash ?? 0)}</strong><small>Semana {lowest?.week ?? 1}</small></div><p>{(lowest?.closingCash ?? 0) < 0 ? "La proyección cruza cero. Acelera cobros o difiere gastos antes de esa semana." : "La caja se mantiene positiva en todo el horizonte. Conserva el buffer antes de asumir nuevos costos."}</p></div>
    <article className="panel full-forecast"><div className="panel-head"><div><span>ROLLING FORECAST</span><h2>Cash position por semana</h2></div><b>13W</b></div><ForecastBars forecast={data.forecast} /></article>
    <article className="panel forecast-table"><div className="table-row table-head"><span>Semana</span><span>Opening cash</span><span>Inflows</span><span>Outflows</span><span>Closing cash</span><span>Signal</span></div>{data.forecast.map((week) => <div className="table-row" key={week.week}><b>W{String(week.week).padStart(2, "0")}</b><span>{money.format(week.openingCash)}</span><span className="positive">+{money.format(week.inflow)}</span><span className="negative">−{money.format(week.outflow)}</span><strong>{money.format(week.closingCash)}</strong><em className={`forecast-signal ${week.risk}`}>{week.risk}</em></div>)}</article>
  </div>;
}

function ClientsPanel({ data, mode, setData, mutate }: { data: DashboardData; mode: "live" | "demo"; setData: (data: DashboardData) => void; mutate: (path: string, method: "POST" | "PATCH", body: unknown, success: string) => Promise<boolean> }) {
  const [form, setForm] = useState({ name: "", email: "", monthlyRevenue: 1800, paymentTermsDays: 15 });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "demo") {
      const client: Client = { id: demoId(), ...form, status: "active", createdAt: new Date().toISOString() };
      const clients = [...data.clients, client].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);
      const monthlyIncome = clients.reduce((sum, item) => sum + item.monthlyRevenue, 0);
      setData({ ...data, clients, metrics: { ...data.metrics, monthlyIncome, topClientShare: monthlyIncome ? clients[0].monthlyRevenue / monthlyIncome * 100 : 0 } });
      setForm({ name: "", email: "", monthlyRevenue: 1800, paymentTermsDays: 15 }); return;
    }
    if (await mutate("/api/clients", "POST", form, "Cliente agregado. Revenue concentration recalculado.")) setForm({ name: "", email: "", monthlyRevenue: 1800, paymentTermsDays: 15 });
  };
  return <div className="workspace-content"><SectionHeader eyebrow="CLIENT ECONOMICS" title="Conoce tu cartera." copy="No todos los ingresos tienen la misma calidad. Controla concentración, recurrencia y payment terms." />
    <div className="two-column-form"><article className="panel"><div className="panel-head"><div><span>ACTIVE CLIENTS</span><h2>Revenue por cliente</h2></div><b>{data.clients.length}</b></div><div className="client-list">{data.clients.map((client, index) => <div key={client.id}><span className="client-rank">0{index + 1}</span><div><strong>{client.name}</strong><small>{client.paymentTermsDays} días · {client.email || "sin email"}</small></div><div className="client-share"><b>{money.format(client.monthlyRevenue)}</b><span><i style={{ width: `${Math.min(100, client.monthlyRevenue / Math.max(data.metrics.monthlyIncome, 1) * 100)}%` }} /></span><small>{(client.monthlyRevenue / Math.max(data.metrics.monthlyIncome, 1) * 100).toFixed(1)}%</small></div></div>)}</div></article>
      <form className="panel data-form" onSubmit={submit}><div className="panel-head"><div><span>NEW CLIENT</span><h2>Agregar relación</h2></div><b>＋</b></div><Field label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Ej. Estudio Norte" required /><Field label="Email de contacto" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="cliente@empresa.pe" type="email" /><div className="form-split"><NumberInput label="Revenue mensual" value={form.monthlyRevenue} onChange={(value) => setForm({ ...form, monthlyRevenue: value })} /><NumberInput label="Payment terms" value={form.paymentTermsDays} onChange={(value) => setForm({ ...form, paymentTermsDays: value })} suffix="días" /></div><button className="form-submit" type="submit">Guardar cliente <span>→</span></button>{data.workspace.plan === "free" && <small className="limit-note">Plan Free: {data.clients.length}/{data.limits.clients} clientes.</small>}</form></div>
  </div>;
}

function CollectionsPanel({ data, mode, setData, mutate }: { data: DashboardData; mode: "live" | "demo"; setData: (data: DashboardData) => void; mutate: (path: string, method: "POST" | "PATCH", body: unknown, success: string) => Promise<boolean> }) {
  const defaultClient = data.clients[0];
  const [form, setForm] = useState({ clientId: defaultClient?.id ?? "", clientName: defaultClient?.name ?? "", description: "Servicio profesional", amount: 1500, dueDate: dateFromNow(15) });
  const selectClient = (id: string) => { const client = data.clients.find((item) => item.id === id); setForm({ ...form, clientId: id, clientName: client?.name ?? "" }); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "demo") {
      const invoice: Invoice = { id: demoId(), ...form, status: "pending", issuedAt: new Date().toISOString(), paidAt: null };
      const invoices = [...data.invoices, invoice];
      const forecast = buildThirteenWeekForecast(data.workspace.cashReserve, data.workspace.monthlyFixedCosts / 4.33, invoices);
      setData({ ...data, invoices, forecast, metrics: { ...data.metrics, accountsReceivable: data.metrics.accountsReceivable + invoice.amount, projectedCash13w: forecast.at(-1)?.closingCash ?? 0 } }); return;
    }
    await mutate("/api/invoices", "POST", form, "Cuenta por cobrar registrada en el radar.");
  };
  const markPaid = async (invoice: Invoice) => {
    if (mode === "demo") {
      const invoices = data.invoices.map((item) => item.id === invoice.id ? { ...item, status: "paid" as const, paidAt: new Date().toISOString() } : item);
      const forecast = buildThirteenWeekForecast(data.workspace.cashReserve, data.workspace.monthlyFixedCosts / 4.33, invoices);
      setData({ ...data, invoices, forecast, metrics: { ...data.metrics, accountsReceivable: Math.max(0, data.metrics.accountsReceivable - invoice.amount), overdueAmount: invoice.status === "overdue" ? Math.max(0, data.metrics.overdueAmount - invoice.amount) : data.metrics.overdueAmount, projectedCash13w: forecast.at(-1)?.closingCash ?? 0 } }); return;
    }
    await mutate("/api/invoices", "PATCH", { invoiceId: invoice.id }, "Cobro marcado como pagado.");
  };
  return <div className="workspace-content"><SectionHeader eyebrow="COLLECTION RADAR" title="Cobra antes, decide mejor." copy="Prioriza vencimientos y convierte accounts receivable en caja real." />
    <div className="collection-kpis"><span>POR COBRAR <b>{money.format(data.metrics.accountsReceivable)}</b></span><span>OVERDUE <b>{money.format(data.metrics.overdueAmount)}</b></span><span>COBROS ABIERTOS <b>{data.invoices.filter((item) => item.status !== "paid").length}</b></span></div>
    <div className="two-column-form wide-left"><article className="panel"><div className="panel-head"><div><span>PRIORITY QUEUE</span><h2>Cuentas por cobrar</h2></div><b>LIVE</b></div><div className="invoice-list">{data.invoices.map((invoice) => <div key={invoice.id} className={invoice.status}><span className={`status-pill ${invoice.status}`}>{invoice.status}</span><div><strong>{invoice.clientName}</strong><small>{invoice.description} · vence {shortDate.format(new Date(`${invoice.dueDate}T00:00:00Z`))}</small></div><b>{money.format(invoice.amount)}</b>{invoice.status !== "paid" ? <button onClick={() => void markPaid(invoice)}>Marcar pagado</button> : <span className="paid-check">✓</span>}</div>)}</div></article>
      <form className="panel data-form" onSubmit={submit}><div className="panel-head"><div><span>NEW RECEIVABLE</span><h2>Registrar cobro</h2></div><b>＋</b></div><label className="field"><span>Cliente</span><select value={form.clientId} onChange={(event) => selectClient(event.target.value)} required><option value="">Selecciona</option>{data.clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><Field label="Concepto" value={form.description} onChange={(value) => setForm({ ...form, description: value })} required /><NumberInput label="Monto" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} /><Field label="Vencimiento" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} required /><button className="form-submit" type="submit" disabled={!data.clients.length}>Agregar al radar <span>→</span></button></form></div>
  </div>;
}

function QuotesPanel({ data, mode, setData, mutate }: { data: DashboardData; mode: "live" | "demo"; setData: (data: DashboardData) => void; mutate: (path: string, method: "POST" | "PATCH", body: unknown, success: string) => Promise<boolean> }) {
  const [form, setForm] = useState({ clientName: "", projectName: "", hours: 40, hourlyRate: Math.max(80, Math.round(data.metrics.protectedHourlyRate)), externalCosts: 300, contingencyRate: 10, targetMargin: data.workspace.targetMargin });
  const quote = useMemo(() => calculateProjectQuote(form), [form]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "demo") {
      const row: Quote = { id: demoId(), ...form, total: quote.total, status: "draft", createdAt: new Date().toISOString() };
      setData({ ...data, quotes: [row, ...data.quotes] }); return;
    }
    await mutate("/api/quotes", "POST", form, "Project quote guardado con margen protegido.");
  };
  return <div className="workspace-content"><SectionHeader eyebrow="PRICING INTELLIGENCE" title="Cotiza para ganar." copy="Un precio profesional debe cubrir labor, costos externos, contingency y target margin." />
    <div className="quote-builder"><form className="panel data-form quote-form" onSubmit={submit}><div className="panel-head"><div><span>PROJECT INPUTS</span><h2>Construir quote</h2></div><b>01</b></div><div className="form-split"><Field label="Cliente" value={form.clientName} onChange={(value) => setForm({ ...form, clientName: value })} required /><Field label="Proyecto" value={form.projectName} onChange={(value) => setForm({ ...form, projectName: value })} required /></div><div className="form-split"><NumberInput label="Horas estimadas" value={form.hours} onChange={(value) => setForm({ ...form, hours: value })} suffix="h" /><NumberInput label="Hourly rate" value={form.hourlyRate} onChange={(value) => setForm({ ...form, hourlyRate: value })} /></div><div className="form-split"><NumberInput label="Costos externos" value={form.externalCosts} onChange={(value) => setForm({ ...form, externalCosts: value })} /><NumberInput label="Contingency" value={form.contingencyRate} onChange={(value) => setForm({ ...form, contingencyRate: Math.min(100, value) })} suffix="%" /></div><NumberInput label="Target margin" value={form.targetMargin} onChange={(value) => setForm({ ...form, targetMargin: Math.min(85, value) })} suffix="%" /><button className="form-submit" type="submit">Guardar project quote <span>→</span></button></form>
      <article className="quote-result"><div className="quote-result-head"><span>PROTECTED QUOTE</span><b>LIVE CALCULATION</b></div><div className="quote-total"><small>PRECIO RECOMENDADO</small><strong>{exactMoney.format(quote.total)}</strong><p>Equivale a {exactMoney.format(quote.total / Math.max(1, form.hours))} por hora vendida.</p></div><div className="quote-waterfall"><span><small>Labor base</small><b>{money.format(quote.laborCost)}</b></span><span><small>External costs</small><b>{money.format(quote.externalCosts)}</b></span><span><small>Contingency</small><b>+ {money.format(quote.contingency)}</b></span><span className="margin-row"><small>Contribution protegida</small><b>+ {money.format(quote.contribution)}</b></span></div><div className="price-signal"><b>↗</b><p><strong>No regales el riesgo del proyecto.</strong>Tu quote incorpora {form.contingencyRate}% de contingency y {form.targetMargin}% de target margin.</p></div></article></div>
    {data.quotes.length > 0 && <article className="panel saved-quotes"><div className="panel-head"><div><span>QUOTE PIPELINE</span><h2>Propuestas guardadas</h2></div><b>{data.quotes.length}</b></div>{data.quotes.map((item) => <div key={item.id}><span className={`status-pill ${item.status}`}>{item.status}</span><div><strong>{item.projectName}</strong><small>{item.clientName} · {item.hours}h</small></div><b>{money.format(item.total)}</b></div>)}</article>}
  </div>;
}

function BillingPanel({ data, mode, setNotice, setError }: { data: DashboardData; mode: "live" | "demo"; setNotice: (value: string) => void; setError: (value: string) => void }) {
  const [loading, setLoading] = useState(false);
  const checkout = async () => {
    if (mode === "demo") { setNotice("En producción, este botón abre el checkout seguro alojado por Mercado Pago."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      const payload = await response.json() as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "Checkout no disponible.");
      window.location.assign(payload.url);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Checkout no disponible."); }
    finally { setLoading(false); }
  };
  return <div className="workspace-content billing-content"><SectionHeader eyebrow="HONORA PRO" title="Paga por control, no por pantallas." copy="Una sola mejora de precio o un cobro anticipado puede cubrir muchos meses de Honora." />
    {data.workspace.plan === "pro" && <div className="current-plan-banner"><span>✓</span><div><strong>Honora Pro está activo</strong><p>Tu workspace no tiene límites de clientes, cobros ni quotes.</p></div><b>ACTIVE</b></div>}
    <div className="billing-grid"><article className="billing-plan"><div className="founding-tag">FOUNDING 100 · S/ 10 DE AHORRO</div><span>HONORA PRO</span><strong>S/ 29.90<small>/ mes</small></strong><p>Precio fundador mientras mantengas activa la suscripción. Precio regular proyectado: S/ 39.90.</p><button onClick={() => void checkout()} disabled={loading || data.workspace.plan === "pro"}>{data.workspace.plan === "pro" ? "Plan activo ✓" : loading ? "Conectando…" : "Activar con Mercado Pago →"}</button><small className="billing-safety">El pago ocurre en Mercado Pago. Honora no recibe ni guarda PAN, fecha de expiración o CVV.</small></article>
      <article className="value-stack"><span>WHAT YOU UNLOCK</span>{[{ n: "01", t: "Unlimited operating records", c: "Clientes, accounts receivable y project quotes sin límites." }, { n: "02", t: "13-week Cash Forecast", c: "Visibilidad semanal para anticipar déficits de caja." }, { n: "03", t: "Pricing leak detection", c: "Protección de contingency, costs y target margin." }, { n: "04", t: "Client risk signals", c: "Revenue concentration y payment terms visibles." }].map((item) => <div key={item.n}><b>{item.n}</b><p><strong>{item.t}</strong><small>{item.c}</small></p></div>)}</article></div>
    <div className="roi-strip"><div><span>BREAK-EVEN EXAMPLE</span><strong>1 quote corregido</strong></div><p>Si Honora te ayuda a proteger <b>S/ 300</b> adicionales en una propuesta, cubre aproximadamente <b>10 meses</b> del plan fundador.</p></div>
  </div>;
}

function SettingsPanel({ data, mode, setData, mutate }: { data: DashboardData; mode: "live" | "demo"; setData: (data: DashboardData) => void; mutate: (path: string, method: "POST" | "PATCH", body: unknown, success: string) => Promise<boolean> }) {
  const [form, setForm] = useState({ businessName: data.workspace.businessName, monthlyFixedCosts: data.workspace.monthlyFixedCosts, reserveRate: data.workspace.reserveRate, targetMargin: data.workspace.targetMargin, cashReserve: data.workspace.cashReserve, billableHours: data.workspace.billableHours });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "demo") { setData({ ...data, workspace: { ...data.workspace, ...form } }); return; }
    await mutate("/api/dashboard", "PATCH", form, "Configuración financiera actualizada.");
  };
  return <div className="workspace-content settings-content"><SectionHeader eyebrow="FINANCIAL SETTINGS" title="Define tu operating model." copy="Estos supuestos alimentan pricing, runway y cash forecast. Revísalos cuando cambie tu estructura." />
    <form className="panel data-form settings-form" onSubmit={submit}><div className="panel-head"><div><span>WORKSPACE CONFIG</span><h2>Supuestos del negocio</h2></div><b>⚙</b></div><Field label="Nombre del negocio" value={form.businessName} onChange={(value) => setForm({ ...form, businessName: value })} required /><div className="form-split"><NumberInput label="Operating costs / mes" value={form.monthlyFixedCosts} onChange={(value) => setForm({ ...form, monthlyFixedCosts: value })} /><NumberInput label="Caja disponible" value={form.cashReserve} onChange={(value) => setForm({ ...form, cashReserve: value })} /></div><div className="form-split"><NumberInput label="Horas facturables / mes" value={form.billableHours} onChange={(value) => setForm({ ...form, billableHours: value })} suffix="h" /><NumberInput label="Reserva configurable" value={form.reserveRate} onChange={(value) => setForm({ ...form, reserveRate: Math.min(60, value) })} suffix="%" /></div><NumberInput label="Target margin" value={form.targetMargin} onChange={(value) => setForm({ ...form, targetMargin: Math.min(80, value) })} suffix="%" /><button className="form-submit" type="submit">Guardar configuración <span>→</span></button><p className="financial-disclaimer">Honora es una herramienta educativa de planificación. No sustituye asesoría contable, tributaria, legal ni de inversión.</p></form>
  </div>;
}

function Field({ label, value, onChange, type = "text", placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} placeholder={placeholder} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}

function NumberInput({ label, value, onChange, suffix }: { label: string; value: number; onChange: (value: number) => void; suffix?: string }) {
  return <label className="field"><span>{label}</span><div className="number-input">{!suffix && <small>S/</small>}<input type="number" min="0" step="any" value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} />{suffix && <small>{suffix}</small>}</div></label>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-state"><span>◇</span><strong>{title}</strong><p>{copy}</p></div>;
}
