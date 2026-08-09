"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { answerCopilot, parseGoogleFormsCsv, scoreLead } from "../../lib/client-to-cash";
import { buildThirteenWeekForecast, calculateProjectQuote } from "../../lib/honora";

type Lead = { id: string; fullName: string; email: string; phone: string | null; business: string | null; service: string; challenge: string; budget: number; urgency: "7d" | "30d" | "90d" | "exploring"; source: string; status: "new" | "qualified" | "proposal" | "won" | "lost"; score: number; nextAction: string; createdAt: string; updatedAt: string };
type Client = { id: string; name: string; email: string | null; monthlyRevenue: number; paymentTermsDays: number; status: "active" | "paused"; createdAt: string };
type Invoice = { id: string; clientId: string | null; clientName: string; description: string; amount: number; dueDate: string; status: "pending" | "paid" | "overdue"; issuedAt: string; paidAt: string | null };
type Quote = { id: string; clientName: string; projectName: string; hours: number; hourlyRate: number; externalCosts: number; contingencyRate: number; targetMargin: number; total: number; status: "draft" | "sent" | "accepted"; createdAt: string };
type ForecastWeek = { week: number; startDate: string; openingCash: number; inflow: number; outflow: number; closingCash: number; risk: "healthy" | "watch" | "critical" };
type Automation = { id: string; priority: "high" | "medium" | "low"; kind: "collection" | "lead" | "proposal" | "risk"; title: string; detail: string; action: string; value: number };
type CopilotResponse = { intent: string; answer: string; evidence: string[]; next: string };
type DashboardData = {
  user: { name: string; email: string };
  workspace: { id: string; businessName: string; intakeSlug: string | null; monthlyFixedCosts: number; reserveRate: number; targetMargin: number; cashReserve: number; billableHours: number; plan: "free" | "pro"; subscriptionStatus: string; copilotQuestionsUsed: number; copilotPeriod: string | null };
  leads: Lead[];
  clients: Client[];
  invoices: Invoice[];
  quotes: Quote[];
  metrics: { monthlyIncome: number; accountsReceivable: number; overdueAmount: number; topClientShare: number; projectedCash13w: number; honoraScore: number; protectedHourlyRate: number; pipelineValue: number; leadConversionRate: number };
  forecast: ForecastWeek[];
  automations: Automation[];
  limits: { leads: number; clients: number; invoices: number; quotes: number };
};

type Tab = "overview" | "leads" | "quotes" | "collections" | "cashflow" | "clients" | "copilot" | "billing" | "settings";

const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 });
const exactMoney = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", timeZone: "UTC" });
const dateFromNow = (days: number) => { const date = new Date(); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
const demoId = () => `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

function createDemoData(): DashboardData {
  const leads: Lead[] = [
    { id: "l1", fullName: "Mariana Torres", email: "mariana@alturalabs.pe", phone: "+51 987 123 456", business: "Altura Labs", service: "Automatización / tecnología", challenge: "Necesitamos automatizar el onboarding de clientes y reducir tareas manuales del equipo comercial.", budget: 6200, urgency: "7d", source: "honora_form", status: "new", score: 91, nextAction: "Responder hoy y agendar discovery call", createdAt: dateFromNow(-1), updatedAt: dateFromNow(-1) },
    { id: "l2", fullName: "Diego Salazar", email: "diego@norte.pe", phone: null, business: "Norte Arquitectura", service: "Estrategia / consultoría", challenge: "Buscamos ordenar pricing y propuesta de valor para una nueva línea B2B.", budget: 3200, urgency: "30d", source: "google_forms_csv", status: "qualified", score: 73, nextAction: "Validar alcance y presupuesto en 48 horas", createdAt: dateFromNow(-3), updatedAt: dateFromNow(-2) },
    { id: "l3", fullName: "Valeria Ruiz", email: "valeria@example.com", phone: null, business: null, service: "Diseño / branding", challenge: "Quiero actualizar la identidad de mi marca personal.", budget: 900, urgency: "90d", source: "manual", status: "new", score: 49, nextAction: "Enviar recurso útil y mantener en seguimiento", createdAt: dateFromNow(-2), updatedAt: dateFromNow(-2) },
  ];
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
    workspace: { id: "demo", businessName: "Gabriel Independent Studio", intakeSlug: "gabriel-studio", monthlyFixedCosts: 3075, reserveRate: 8, targetMargin: 25, cashReserve: 8500, billableHours: 80, plan: "pro", subscriptionStatus: "demo", copilotQuestionsUsed: 0, copilotPeriod: null },
    leads, clients, invoices,
    quotes: [{ id: "q1", clientName: "Altura Labs", projectName: "Go-to-market sprint", hours: 42, hourlyRate: 95, externalCosts: 450, contingencyRate: 10, targetMargin: 25, total: 6512, status: "draft", createdAt: new Date().toISOString() }],
    metrics: { monthlyIncome: 8900, accountsReceivable: 4750, overdueAmount: 1200, topClientShare: 43.8, projectedCash13w: forecast.at(-1)?.closingCash ?? 0, honoraScore: 78, protectedHourlyRate: 72.84, pipelineValue: 16_812, leadConversionRate: 33 },
    automations: [
      { id: "collection:demo", priority: "high", kind: "collection", title: "Cobrar S/ 1,200 a Páramo Digital", detail: "Sprint de automatización vencido hace 4 días.", action: "Enviar recordatorio de pago hoy", value: 1200 },
      { id: "lead:l1", priority: "high", kind: "lead", title: "Responder a Mariana Torres", detail: "Fit 91/100 · presupuesto S/ 6,200.", action: "Agendar discovery call hoy", value: 6200 },
      { id: "risk:concentration", priority: "medium", kind: "risk", title: "Reducir concentración de revenue", detail: "Estudio Norte representa 44% del ingreso.", action: "Convertir dos leads esta semana", value: 0 },
    ],
    forecast, limits: { leads: 10, clients: 2, invoices: 5, quotes: 1 },
  };
}

const navItems: { id: Tab; label: string; icon: string; group: "OPERATE" | "INTELLIGENCE" | "ACCOUNT" }[] = [
  { id: "overview", label: "Command Center", icon: "⌁", group: "OPERATE" },
  { id: "leads", label: "Lead Inbox", icon: "✦", group: "OPERATE" },
  { id: "quotes", label: "Quotes", icon: "◇", group: "OPERATE" },
  { id: "collections", label: "Cobros", icon: "◫", group: "OPERATE" },
  { id: "cashflow", label: "Caja 13W", icon: "∿", group: "INTELLIGENCE" },
  { id: "clients", label: "Clientes", icon: "◎", group: "INTELLIGENCE" },
  { id: "copilot", label: "Honora Copilot", icon: "H", group: "INTELLIGENCE" },
  { id: "billing", label: "Plan Pro", icon: "↗", group: "ACCOUNT" },
  { id: "settings", label: "Configuración", icon: "⚙", group: "ACCOUNT" },
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
      if (value.code === "PLAN_LIMIT" || value.code === "PLAN_REQUIRED") setActiveTab("billing");
      return false;
    } finally { setBusy(false); }
  };

  if (!data) return <div className="workspace-loading"><span className="brand-mark">H</span><p>{error || "Preparando tu Client-to-Cash OS…"}</p>{error && <button onClick={() => void load()}>Reintentar</button>}</div>;

  const firstName = (data.user.name || initialUser.name).split(" ")[0];
  const month = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(new Date());
  const activeLeadCount = data.leads.filter((lead) => !["won", "lost"].includes(lead.status)).length;

  return (
    <main className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link className="workspace-brand" href="/"><span className="brand-mark">H</span><span><strong>HONORA</strong><small>CLIENT-TO-CASH OS</small></span></Link>
        <nav aria-label="Módulos de Honora">
          {(["OPERATE", "INTELLIGENCE", "ACCOUNT"] as const).map((group) => <div className="nav-group" key={group}><small>{group}</small>{navItems.filter((item) => item.group === group).map((item) => <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}><i>{item.icon}</i><span>{item.label}</span>{item.id === "collections" && data.metrics.overdueAmount > 0 && <b>!</b>}{item.id === "leads" && data.leads.filter((lead) => lead.status === "new").length > 0 && <b>{data.leads.filter((lead) => lead.status === "new").length}</b>}</button>)}</div>)}
        </nav>
        <div className="sidebar-plan"><span>{data.workspace.plan === "pro" ? "PRO WORKSPACE" : "FREE WORKSPACE"}</span><strong>{data.workspace.plan === "pro" ? "Client-to-Cash activo" : `${activeLeadCount}/${data.limits.leads} leads activos`}</strong><div><i style={{ width: data.workspace.plan === "pro" ? "100%" : `${Math.min(100, activeLeadCount / data.limits.leads * 100)}%` }} /></div>{data.workspace.plan === "free" && <button onClick={() => setActiveTab("billing")}>Ver Pro →</button>}</div>
        <div className="sidebar-user"><span>{firstName.slice(0, 1).toUpperCase()}</span><div><strong>{data.user.name || initialUser.name}</strong><small>{mode === "demo" ? "Demo interactiva" : data.user.email}</small></div>{mode === "live" && <a href="/signout-with-chatgpt?return_to=%2F" aria-label="Cerrar sesión">↗</a>}</div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-topbar"><div><button className="mobile-menu" onClick={() => setActiveTab("overview")}>H</button><span>{data.workspace.businessName}</span><i>/</i><strong>{navItems.find((item) => item.id === activeTab)?.label}</strong></div><div><span className="sync-status"><i /> {mode === "demo" ? "DEMO" : "SYNCED"}</span><button className="upgrade-mini" onClick={() => setActiveTab("billing")}>{data.workspace.plan === "pro" ? "PRO" : "UPGRADE"}</button></div></header>
        <div className="mobile-tabs">{navItems.map((item) => <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}>{item.icon}<span>{item.label}</span></button>)}</div>

        {(notice || error) && <div className={`workspace-notice ${error ? "error" : ""}`}><span>{error ? "!" : "✓"}</span><p>{error || notice}</p><button onClick={() => { setNotice(""); setError(""); }}>×</button></div>}
        {busy && <div className="busy-line"><i /></div>}

        {activeTab === "overview" && <Overview data={data} firstName={firstName} month={month} go={setActiveTab} />}
        {activeTab === "leads" && <LeadsPanel data={data} mode={mode} setData={setData} mutate={mutate} setNotice={setNotice} setError={setError} />}
        {activeTab === "cashflow" && <CashFlow data={data} />}
        {activeTab === "clients" && <ClientsPanel data={data} mode={mode} setData={setData} mutate={mutate} />}
        {activeTab === "collections" && <CollectionsPanel data={data} mode={mode} setData={setData} mutate={mutate} />}
        {activeTab === "quotes" && <QuotesPanel data={data} mode={mode} setData={setData} mutate={mutate} />}
        {activeTab === "copilot" && <CopilotPanel data={data} mode={mode} />}
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
  const stages = [
    { label: "Nuevos", value: data.leads.filter((lead) => lead.status === "new").length },
    { label: "Calificados", value: data.leads.filter((lead) => lead.status === "qualified").length },
    { label: "Propuesta", value: data.leads.filter((lead) => lead.status === "proposal").length + data.quotes.filter((quote) => quote.status !== "accepted").length },
    { label: "Ganados", value: data.leads.filter((lead) => lead.status === "won").length },
  ];
  return <div className="workspace-content">
    <SectionHeader eyebrow={`CLIENT-TO-CASH COMMAND CENTER · ${month.toUpperCase()}`} title={`Tu próxima venta ya tiene un siguiente paso, ${firstName}.`} copy="Honora conecta captación, propuesta, cobro y caja para que ninguna oportunidad rentable se pierda entre herramientas." action={<button className="primary-action" onClick={() => go("leads")}>Abrir Lead Inbox <span>→</span></button>} />
    <div className="metrics-grid">
      <MetricCard index="01" label="OPEN PIPELINE" value={money.format(data.metrics.pipelineValue)} note={`${data.leads.filter((lead) => !["won", "lost"].includes(lead.status)).length} oportunidades activas`} tone="good" />
      <MetricCard index="02" label="ACCOUNTS RECEIVABLE" value={money.format(data.metrics.accountsReceivable)} note={`${money.format(data.metrics.overdueAmount)} overdue`} tone={data.metrics.overdueAmount > 0 ? "warn" : "normal"} />
      <MetricCard index="03" label="13-WEEK CASH" value={money.format(data.metrics.projectedCash13w)} note={data.metrics.projectedCash13w >= 0 ? "Caja proyectada positiva" : "Requiere acción inmediata"} tone={data.metrics.projectedCash13w >= 0 ? "good" : "warn"} />
      <MetricCard index="04" label="REVENUE / MES" value={money.format(data.metrics.monthlyIncome)} note={`${data.clients.filter((client) => client.status === "active").length} clientes activos`} />
    </div>
    <div className="overview-grid ctc-grid">
      <article className="panel pipeline-overview"><div className="panel-head"><div><span>CLIENT-TO-CASH PIPELINE</span><h2>De consulta a dinero cobrado</h2></div><button onClick={() => go("leads")}>Gestionar pipeline ↗</button></div><div className="funnel-strip">{stages.map((stage, index) => <div key={stage.label}><small>0{index + 1}</small><strong>{stage.value}</strong><span>{stage.label}</span>{index < stages.length - 1 && <i>→</i>}</div>)}</div><div className="pipeline-value-row"><div><span>PIPELINE VALUE</span><b>{money.format(data.metrics.pipelineValue)}</b></div><p>Valor potencial entre leads activos y quotes abiertos. Honora prioriza el siguiente movimiento, no solo el total.</p></div></article>
      <article className="copilot-callout"><span>HONORA COPILOT</span><h2>Pregunta con tus datos.</h2><p>“¿A quién debo cobrar hoy?”<br />“¿Cuánto debería cotizar?”<br />“¿Qué lead debo responder primero?”</p><button onClick={() => go("copilot")}>Abrir Copilot <b>H</b></button></article>
    </div>
    <div className="overview-grid lower money-grid">
      <article className="panel automation-panel"><div className="panel-head"><div><span>MONEY MOVES · THIS WEEK</span><h2>Acciones automáticas priorizadas</h2></div><b>{data.automations.length}</b></div>{data.automations.length ? <div className="automation-list">{data.automations.slice(0, 4).map((item) => <div key={item.id}><span className={`automation-kind ${item.kind}`}>{item.kind === "collection" ? "$" : item.kind === "lead" ? "✦" : item.kind === "proposal" ? "◇" : "!"}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><p>{item.action}</p><em className={item.priority}>{item.priority}</em></div>)}</div> : <EmptyState title="Sin acciones críticas" copy="Tu operación está al día." />}</article>
      <article className="panel cash-mini"><div className="panel-head"><div><span>CASH POSITION</span><h2>13-week outlook</h2></div><button onClick={() => go("cashflow")}>Abrir ↗</button></div><ForecastBars forecast={data.forecast} /><div className="forecast-summary"><span>Opening <b>{money.format(data.workspace.cashReserve)}</b></span><span>Closing <b>{money.format(data.metrics.projectedCash13w)}</b></span></div></article>
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

function LeadsPanel({ data, mode, setData, mutate, setNotice, setError }: { data: DashboardData; mode: "live" | "demo"; setData: (data: DashboardData) => void; mutate: (path: string, method: "POST" | "PATCH", body: unknown, success: string) => Promise<boolean>; setNotice: (value: string) => void; setError: (value: string) => void }) {
  const [view, setView] = useState<"pipeline" | "capture" | "import">("pipeline");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", business: "", service: "Estrategia / consultoría", challenge: "", budget: 1500, urgency: "30d" as Lead["urgency"], source: "manual" });
  const intakePath = `/intake/${data.workspace.intakeSlug || "mi-studio"}`;
  const openLeads = data.leads.filter((lead) => !["won", "lost"].includes(lead.status));
  const stages: { id: Lead["status"]; label: string }[] = [{ id: "new", label: "Nuevos" }, { id: "qualified", label: "Calificados" }, { id: "proposal", label: "Propuesta" }, { id: "won", label: "Ganados" }];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "demo") {
      const scored = scoreLead(form);
      const lead: Lead = { id: demoId(), ...form, phone: form.phone || null, business: form.business || null, status: "new", score: scored.score, nextAction: scored.nextAction, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setData({ ...data, leads: [lead, ...data.leads], metrics: { ...data.metrics, pipelineValue: data.metrics.pipelineValue + lead.budget } });
      setNotice(`Lead calificado automáticamente con fit ${lead.score}/100.`);
      setForm({ fullName: "", email: "", phone: "", business: "", service: "Estrategia / consultoría", challenge: "", budget: 1500, urgency: "30d", source: "manual" });
      setView("pipeline");
      return;
    }
    if (await mutate("/api/leads", "POST", form, "Lead guardado y calificado automáticamente.")) setView("pipeline");
  };

  const changeStatus = async (lead: Lead, status: Lead["status"]) => {
    if (mode === "demo") {
      const leads = data.leads.map((item) => item.id === lead.id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
      setData({ ...data, leads });
      return;
    }
    await mutate("/api/leads", "PATCH", { leadId: lead.id, status }, "Pipeline actualizado.");
  };

  const convert = async (lead: Lead) => {
    if (mode === "demo") {
      const quoteInput = { hours: Math.max(8, Math.round(lead.budget / 100)), hourlyRate: Math.max(80, Math.round(data.metrics.protectedHourlyRate)), externalCosts: 0, contingencyRate: 10, targetMargin: data.workspace.targetMargin };
      const calculated = calculateProjectQuote(quoteInput);
      const client: Client = { id: demoId(), name: lead.fullName, email: lead.email, monthlyRevenue: 0, paymentTermsDays: 15, status: "active", createdAt: new Date().toISOString() };
      const quote: Quote = { id: demoId(), clientName: lead.fullName, projectName: lead.service, ...quoteInput, total: calculated.total, status: "draft", createdAt: new Date().toISOString() };
      setData({ ...data, leads: data.leads.map((item) => item.id === lead.id ? { ...item, status: "proposal" as const, nextAction: "Revisar y enviar propuesta" } : item), clients: [client, ...data.clients], quotes: [quote, ...data.quotes], metrics: { ...data.metrics, pipelineValue: data.metrics.pipelineValue + quote.total } });
      setNotice("Lead convertido en cliente y quote draft. Revisa el precio antes de enviarlo.");
      return;
    }
    await mutate("/api/leads/convert", "POST", { leadId: lead.id }, "Lead convertido en cliente + quote draft.");
  };

  const importCsv = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseGoogleFormsCsv(await file.text());
    if (!parsed.length) { setError("No encontramos filas válidas. Incluye columnas Nombre, Email, Servicio, Necesidad y Presupuesto."); return; }
    if (mode === "demo") {
      const imported: Lead[] = parsed.map((row) => {
        const scored = scoreLead(row);
        return { id: demoId(), ...row, phone: row.phone || null, business: row.business || null, status: "new", score: scored.score, nextAction: scored.nextAction, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      });
      setData({ ...data, leads: [...imported, ...data.leads], metrics: { ...data.metrics, pipelineValue: data.metrics.pipelineValue + imported.reduce((sum, lead) => sum + lead.budget, 0) } });
      setNotice(`${imported.length} leads importados y calificados desde Google Forms / Sheets.`);
      setView("pipeline");
      return;
    }
    if (await mutate("/api/leads/import", "POST", { leads: parsed }, `${parsed.length} leads importados y calificados desde Google Forms / Sheets.`)) setView("pipeline");
  };

  const copyIntake = async () => {
    const url = `${window.location.origin}${intakePath}`;
    await navigator.clipboard.writeText(url);
    setNotice("Smart Intake copiado. Compártelo por WhatsApp, LinkedIn o tu web.");
  };

  return <div className="workspace-content lead-workspace">
    <SectionHeader eyebrow="ACQUISITION · CRM · CONVERSION" title="Convierte consultas en revenue." copy="Un inbox comercial conectado: captura, califica, prioriza y convierte un lead en cliente + quote sin volver a copiar datos." action={<button className="primary-action" onClick={() => setView("capture")}>Agregar lead <span>＋</span></button>} />
    <div className="capture-toolbar">
      <div><span>SMART INTAKE</span><strong>{intakePath}</strong><small>Formulario compartible que alimenta este pipeline.</small></div>
      <button onClick={() => void copyIntake()}>Copiar enlace</button>
      {mode === "live" && <Link href={intakePath} target="_blank">Vista previa ↗</Link>}
    </div>
    <div className="subnav"><button className={view === "pipeline" ? "active" : ""} onClick={() => setView("pipeline")}>Pipeline <b>{openLeads.length}</b></button><button className={view === "capture" ? "active" : ""} onClick={() => setView("capture")}>Captura manual</button><button className={view === "import" ? "active" : ""} onClick={() => setView("import")}>Google Forms Bridge</button></div>

    {view === "pipeline" && <div className="pipeline-board">{stages.map((stage) => <section key={stage.id} className="pipeline-column"><header><span>{stage.label}</span><b>{data.leads.filter((lead) => lead.status === stage.id).length}</b></header><div>{data.leads.filter((lead) => lead.status === stage.id).map((lead) => <article key={lead.id} className="lead-card"><div className="lead-card-top"><span className={`fit-score ${lead.score >= 78 ? "hot" : lead.score >= 58 ? "warm" : "nurture"}`}>{lead.score}</span><small>{lead.source.replaceAll("_", " ")}</small></div><h3>{lead.fullName}</h3><p>{lead.service}</p><div className="lead-money"><strong>{money.format(lead.budget)}</strong><span>{lead.urgency === "7d" ? "Esta semana" : lead.urgency === "30d" ? "30 días" : lead.urgency === "90d" ? "90 días" : "Explorando"}</span></div><small className="lead-next">{lead.nextAction}</small><div className="lead-actions">{lead.status === "new" && <button onClick={() => void changeStatus(lead, "qualified")}>Calificar</button>}{["new", "qualified"].includes(lead.status) && <button className="primary" onClick={() => void convert(lead)}>Cliente + quote</button>}{lead.status === "proposal" && <button onClick={() => void changeStatus(lead, "won")}>Marcar ganado</button>}</div></article>)}</div></section>)}</div>}

    {view === "capture" && <div className="lead-capture-grid"><form className="panel data-form lead-form" onSubmit={submit}><div className="panel-head"><div><span>NEW OPPORTUNITY</span><h2>Captura y calificación</h2></div><b>AUTO-SCORE</b></div><div className="form-split"><Field label="Nombre" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} required /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required /></div><div className="form-split"><Field label="WhatsApp" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Field label="Negocio" value={form.business} onChange={(value) => setForm({ ...form, business: value })} /></div><label className="field"><span>Servicio</span><select value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}><option>Estrategia / consultoría</option><option>Diseño / branding</option><option>Marketing / growth</option><option>Automatización / tecnología</option><option>Otro servicio profesional</option></select></label><label className="field"><span>Necesidad / resultado esperado</span><textarea minLength={20} value={form.challenge} onChange={(event) => setForm({ ...form, challenge: event.target.value })} required /></label><div className="form-split"><NumberInput label="Presupuesto" value={form.budget} onChange={(value) => setForm({ ...form, budget: value })} /><label className="field"><span>Timing</span><select value={form.urgency} onChange={(event) => setForm({ ...form, urgency: event.target.value as Lead["urgency"] })}><option value="7d">Esta semana</option><option value="30d">30 días</option><option value="90d">90 días</option><option value="exploring">Explorando</option></select></label></div><button className="form-submit" type="submit">Guardar y calificar <span>→</span></button></form><aside className="qualification-model"><span>QUALIFICATION ENGINE</span><h2>Fit Score / 100</h2><p>Prioriza usando señales operativas, no datos sensibles:</p><ul><li><b>34%</b> presupuesto declarado</li><li><b>24%</b> urgencia del proyecto</li><li><b>22%</b> claridad de la necesidad</li><li><b>20%</b> contexto de contacto</li></ul><small>El score sugiere prioridad; tú conservas la decisión final.</small></aside></div>}

    {view === "import" && <div className="forms-bridge"><article><span>GOOGLE FORMS → HONORA</span><h2>Trae tus respuestas. Honora hace el resto.</h2><p>En Google Forms, vincula las respuestas a Sheets, descarga la hoja como CSV y suéltala aquí. Cada fila se convierte en un lead con score, fuente y siguiente acción.</p><label className="csv-drop"><b>＋</b><strong>Seleccionar CSV de respuestas</strong><small>Máximo 100 leads por importación</small><input type="file" accept=".csv,text/csv" onChange={(event) => void importCsv(event.target.files?.[0])} /></label></article><aside><span>MAPEO AUTOMÁTICO</span>{["Nombre / Name", "Correo / Email", "Teléfono / WhatsApp", "Servicio", "Necesidad / Problema", "Presupuesto / Budget"].map((field) => <div key={field}><b>✓</b>{field}</div>)}<small>Honora reconoce encabezados en español e inglés. Las filas incompletas se excluyen.</small></aside></div>}
  </div>;
}

function CopilotPanel({ data, mode }: { data: DashboardData; mode: "live" | "demo" }) {
  const prompts = ["¿Qué hago esta semana?", "¿Quién me debe dinero?", "¿Qué lead respondo primero?", "¿Cuánto debería cobrar?", "¿Cómo estará mi caja en 13 semanas?"];
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<CopilotResponse>(() => answerCopilot(prompts[0], data));
  const [loading, setLoading] = useState(false);

  const ask = async (value = question) => {
    if (!value.trim()) return;
    setQuestion(value);
    setLoading(true);
    try {
      if (mode === "demo") setResponse(answerCopilot(value, data));
      else {
        const result = await fetch("/api/copilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: value }) });
        const payload = await result.json() as CopilotResponse & { error?: string };
        if (!result.ok) throw new Error(payload.error || "Copilot no pudo responder.");
        setResponse(payload);
      }
    } catch (error) {
      setResponse({
        intent: "plan_limit",
        answer: error instanceof Error ? error.message : "Copilot no pudo responder.",
        evidence: ["Tus datos permanecen guardados y disponibles en el workspace."],
        next: "Activa Honora Pro para usar Copilot sin límites.",
      });
    } finally { setLoading(false); }
  };

  return <div className="workspace-content copilot-workspace"><SectionHeader eyebrow="DATA-GROUNDED BUSINESS ASSISTANT" title="Pregunta. Decide. Avanza." copy="Honora Copilot responde con tu pipeline, pricing, cobros y cash forecast; cada recomendación muestra la evidencia utilizada." />
    <div className="copilot-grid"><section className="copilot-chat"><div className="copilot-orb">H</div><div className="copilot-answer"><span>HONORA COPILOT · {response.intent.toUpperCase()}</span><h2>{response.answer}</h2><div className="evidence-stack"><small>EVIDENCIA</small>{response.evidence.map((item) => <p key={item}><b>↳</b>{item}</p>)}</div><div className="copilot-next"><span>NEXT BEST ACTION</span><strong>{response.next}</strong></div></div><form onSubmit={(event) => { event.preventDefault(); void ask(); }}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pregunta sobre ventas, precios, cobros o caja…" /><button disabled={loading}>{loading ? "…" : "→"}</button></form></section><aside className="copilot-side"><span>QUICK QUESTIONS</span>{prompts.map((prompt) => <button key={prompt} onClick={() => void ask(prompt)}>{prompt}<b>↗</b></button>)}<div><small>{data.workspace.plan === "pro" ? "PRIVATE BY DESIGN" : `${Math.max(0, 5 - data.workspace.copilotQuestionsUsed)} FREE QUESTIONS LEFT`}</small><p>El asistente analiza únicamente los datos de tu workspace. No inventa saldos ni reemplaza asesoría contable, legal o tributaria.</p></div></aside></div>
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
  return <div className="workspace-content billing-content"><SectionHeader eyebrow="HONORA PRO" title="Paga por mover revenue." copy="Honora conecta captación, conversión, pricing y cobros. Una oportunidad recuperada puede pagar el sistema por meses." />
    {data.workspace.plan === "pro" && <div className="current-plan-banner"><span>✓</span><div><strong>Honora Pro está activo</strong><p>Tu workspace no tiene límites de clientes, cobros ni quotes.</p></div><b>ACTIVE</b></div>}
    <div className="billing-grid"><article className="billing-plan"><div className="founding-tag">FOUNDING 100 · PRECIO BLOQUEADO</div><span>HONORA PRO</span><strong>S/ 29.90<small>/ mes</small></strong><p>Precio fundador mientras mantengas activa la suscripción. Precio regular proyectado: S/ 49.90.</p><button onClick={() => void checkout()} disabled={loading || data.workspace.plan === "pro"}>{data.workspace.plan === "pro" ? "Plan activo ✓" : loading ? "Conectando…" : "Activar con Mercado Pago →"}</button><small className="billing-safety">El pago ocurre en Mercado Pago. Honora no recibe ni guarda PAN, fecha de expiración o CVV.</small></article>
      <article className="value-stack"><span>WHAT YOU UNLOCK</span>{[{ n: "01", t: "Lead-to-Cash pipeline", c: "Smart Intake, Google Forms Bridge y CRM sin límites." }, { n: "02", t: "Honora Copilot ilimitado", c: "Respuestas accionables usando tus datos comerciales y financieros." }, { n: "03", t: "Pricing + Collection Engine", c: "Quotes con margen protegido y prioridades de cobro." }, { n: "04", t: "13-week Cash Forecast", c: "Pipeline, receivables y caja futura en un mismo sistema." }].map((item) => <div key={item.n}><b>{item.n}</b><p><strong>{item.t}</strong><small>{item.c}</small></p></div>)}</article></div>
    <div className="roi-strip"><div><span>BREAK-EVEN EXAMPLE</span><strong>1 lead recuperado</strong></div><p>Si Honora evita que pierdas una oportunidad de <b>S/ 1,500</b>, cubre aproximadamente <b>50 meses</b> del plan fundador.</p></div>
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
