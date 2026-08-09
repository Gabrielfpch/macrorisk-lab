import { and, asc, count, desc, eq, gte, lt, notInArray } from "drizzle-orm";
import { getDb } from "../db";
import { clients, invoices, leads, quotes, users, workspaces } from "../db/schema";
import { answerCopilot, buildAutomationQueue, scoreLead, type LeadScoringInput, type LeadStatus } from "./client-to-cash";
import { buildThirteenWeekForecast, calculateDiagnostics, calculateHonoraScore, calculateProjectQuote, calculateRevenueRisk } from "./honora";

export const FREE_LIMITS = { leads: 10, clients: 2, invoices: 5, quotes: 1 } as const;

export type AccountIdentity = { email: string; name: string };

const now = () => new Date().toISOString();
const cleanEmail = (value: string) => value.trim().toLowerCase();
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 42);
const makeIntakeSlug = (name: string, id: string) => `${slugify(name) || "studio"}-${id.replace(/-/g, "").slice(0, 6)}`;

export async function getOrCreateAccount(identity: AccountIdentity) {
  const db = getDb();
  const email = cleanEmail(identity.email);
  let user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];

  if (!user) {
    const candidate = { id: crypto.randomUUID(), email, name: identity.name || email, createdAt: now() };
    try {
      await db.insert(users).values(candidate);
      user = candidate;
    } catch {
      user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    }
  } else if (identity.name && user.name !== identity.name) {
    await db.update(users).set({ name: identity.name }).where(eq(users.id, user.id));
    user = { ...user, name: identity.name };
  }

  if (!user) throw new Error("No se pudo crear la cuenta.");

  let workspace = (await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1))[0];
  if (!workspace) {
    const createdAt = now();
    const candidate = {
      id: crypto.randomUUID(), ownerId: user.id, businessName: "Mi negocio independiente",
      intakeSlug: makeIntakeSlug(identity.name || email.split("@")[0], user.id),
      monthlyFixedCosts: 1800, reserveRate: 8, targetMargin: 25, cashReserve: 8500,
      billableHours: 80, plan: "free" as const, subscriptionStatus: "inactive",
      providerSubscriptionId: null, copilotQuestionsUsed: 0, copilotPeriod: null, createdAt, updatedAt: createdAt,
    };
    try {
      await db.insert(workspaces).values(candidate);
      workspace = candidate;
    } catch {
      workspace = (await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1))[0];
    }
  }

  if (!workspace) throw new Error("No se pudo crear el espacio financiero.");
  if (!workspace.intakeSlug) {
    const intakeSlug = makeIntakeSlug(identity.name || email.split("@")[0], user.id);
    await db.update(workspaces).set({ intakeSlug, updatedAt: now() }).where(eq(workspaces.id, workspace.id));
    workspace = { ...workspace, intakeSlug };
  }
  return { user, workspace };
}

export async function getDashboard(identity: AccountIdentity) {
  const db = getDb();
  const account = await getOrCreateAccount(identity);
  const today = new Date().toISOString().slice(0, 10);
  await db.update(invoices)
    .set({ status: "overdue" })
    .where(and(eq(invoices.workspaceId, account.workspace.id), eq(invoices.status, "pending"), lt(invoices.dueDate, today)));

  const [leadRows, clientRows, invoiceRows, quoteRows] = await Promise.all([
    db.select().from(leads).where(eq(leads.workspaceId, account.workspace.id)).orderBy(desc(leads.score), desc(leads.createdAt)),
    db.select().from(clients).where(eq(clients.workspaceId, account.workspace.id)).orderBy(desc(clients.monthlyRevenue)),
    db.select().from(invoices).where(eq(invoices.workspaceId, account.workspace.id)).orderBy(asc(invoices.dueDate)),
    db.select().from(quotes).where(eq(quotes.workspaceId, account.workspace.id)).orderBy(desc(quotes.createdAt)),
  ]);

  const activeClients = clientRows.filter((client) => client.status === "active");
  const monthlyIncome = activeClients.reduce((sum, client) => sum + client.monthlyRevenue, 0);
  const topClientRevenue = activeClients[0]?.monthlyRevenue ?? 0;
  const topClientShare = monthlyIncome > 0 ? (topClientRevenue / monthlyIncome) * 100 : 0;
  const pendingInvoices = invoiceRows.filter((invoice) => invoice.status !== "paid");
  const accountsReceivable = pendingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = pendingInvoices.filter((invoice) => invoice.status === "overdue").reduce((sum, invoice) => sum + invoice.amount, 0);
  const averageTerms = activeClients.length
    ? activeClients.reduce((sum, client) => sum + client.paymentTermsDays, 0) / activeClients.length
    : 0;
  const diagnostics = calculateDiagnostics({
    monthlyIncome,
    fixedCosts: account.workspace.monthlyFixedCosts,
    variableCosts: 0,
    debtPayments: 0,
    cashReserve: account.workspace.cashReserve,
    billableHours: account.workspace.billableHours,
    reserveRate: account.workspace.reserveRate,
    targetMargin: account.workspace.targetMargin,
  });
  const revenueRisk = calculateRevenueRisk({
    revenueHistory: [monthlyIncome * .72, monthlyIncome * .86, monthlyIncome * .78, monthlyIncome * .96, monthlyIncome * .91, monthlyIncome],
    topClientShare,
    averagePaymentDelay: averageTerms,
  }, monthlyIncome);
  const forecast = buildThirteenWeekForecast(
    account.workspace.cashReserve,
    account.workspace.monthlyFixedCosts / 4.33,
    pendingInvoices.map((invoice) => ({ amount: invoice.amount, dueDate: invoice.dueDate, status: invoice.status })),
  );
  const pipelineValue = leadRows.filter((lead) => !["won", "lost"].includes(lead.status)).reduce((sum, lead) => sum + lead.budget, 0)
    + quoteRows.filter((quote) => quote.status !== "accepted").reduce((sum, quote) => sum + quote.total, 0);
  const wonLeads = leadRows.filter((lead) => lead.status === "won").length;
  const closedLeads = leadRows.filter((lead) => ["won", "lost"].includes(lead.status)).length;
  const automations = buildAutomationQueue({ leads: leadRows, invoices: invoiceRows, quotes: quoteRows, topClientShare });

  return {
    user: account.user,
    workspace: account.workspace,
    leads: leadRows,
    clients: clientRows,
    invoices: invoiceRows,
    quotes: quoteRows,
    metrics: {
      monthlyIncome,
      accountsReceivable,
      overdueAmount,
      topClientShare,
      projectedCash13w: forecast.at(-1)?.closingCash ?? account.workspace.cashReserve,
      honoraScore: calculateHonoraScore(diagnostics.coreScore, revenueRisk.stabilityScore),
      protectedHourlyRate: diagnostics.recommendedRate,
      pipelineValue,
      leadConversionRate: closedLeads ? (wonLeads / closedLeads) * 100 : 0,
    },
    forecast,
    automations,
    limits: FREE_LIMITS,
  };
}

export async function assertPlanLimit(identity: AccountIdentity, resource: keyof typeof FREE_LIMITS) {
  const db = getDb();
  const { workspace } = await getOrCreateAccount(identity);
  if (workspace.plan === "pro") return workspace;
  const result = resource === "leads"
    ? await db.select({ total: count() }).from(leads).where(and(eq(leads.workspaceId, workspace.id), notInArray(leads.status, ["won", "lost"])))
    : resource === "clients"
      ? await db.select({ total: count() }).from(clients).where(eq(clients.workspaceId, workspace.id))
      : resource === "invoices"
        ? await db.select({ total: count() }).from(invoices).where(eq(invoices.workspaceId, workspace.id))
        : await db.select({ total: count() }).from(quotes).where(eq(quotes.workspaceId, workspace.id));
  if ((result[0]?.total ?? 0) >= FREE_LIMITS[resource]) {
    const error = new Error(`Límite Free alcanzado: ${FREE_LIMITS[resource]} ${resource}.`);
    Object.assign(error, { status: 402, code: "PLAN_LIMIT" });
    throw error;
  }
  return workspace;
}

export async function assertProFeature(identity: AccountIdentity, feature: string) {
  const { workspace } = await getOrCreateAccount(identity);
  if (workspace.plan === "pro") return workspace;
  const error = new Error(`${feature} es parte de Honora Pro.`);
  Object.assign(error, { status: 402, code: "PLAN_REQUIRED" });
  throw error;
}

type LeadInput = LeadScoringInput & { source?: string };

function leadRow(workspaceId: string, input: LeadInput) {
  const scored = scoreLead(input);
  const createdAt = now();
  return {
    id: crypto.randomUUID(),
    workspaceId,
    fullName: input.fullName.trim(),
    email: cleanEmail(input.email),
    phone: input.phone?.trim() || null,
    business: input.business?.trim() || null,
    service: input.service.trim(),
    challenge: input.challenge.trim(),
    budget: input.budget,
    urgency: input.urgency,
    source: input.source?.trim().slice(0, 80) || "manual",
    status: "new" as const,
    score: scored.score,
    nextAction: scored.nextAction,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function createLead(identity: AccountIdentity, input: LeadInput) {
  const db = getDb();
  const workspace = await assertPlanLimit(identity, "leads");
  const row = leadRow(workspace.id, input);
  await db.insert(leads).values(row);
  return row;
}

export async function importLeads(identity: AccountIdentity, inputs: LeadInput[]) {
  await assertProFeature(identity, "Google Forms Bridge");
  const rows = inputs.slice(0, 100);
  let imported = 0;
  for (const input of rows) {
    await createLead(identity, input);
    imported += 1;
  }
  return imported;
}

export async function updateLeadStatus(identity: AccountIdentity, leadId: string, status: LeadStatus) {
  const db = getDb();
  const { workspace } = await getOrCreateAccount(identity);
  await db.update(leads).set({ status, updatedAt: now() })
    .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspace.id)));
}

export async function convertLead(identity: AccountIdentity, leadId: string) {
  const db = getDb();
  const { workspace } = await getOrCreateAccount(identity);
  const lead = (await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspace.id))).limit(1))[0];
  if (!lead) {
    const error = new Error("Lead no encontrado.");
    Object.assign(error, { status: 404, code: "LEAD_NOT_FOUND" });
    throw error;
  }
  await assertPlanLimit(identity, "clients");
  await assertPlanLimit(identity, "quotes");

  const diagnostics = calculateDiagnostics({
    monthlyIncome: 0,
    fixedCosts: workspace.monthlyFixedCosts,
    variableCosts: 0,
    debtPayments: 0,
    cashReserve: workspace.cashReserve,
    billableHours: workspace.billableHours,
    reserveRate: workspace.reserveRate,
    targetMargin: workspace.targetMargin,
  });
  const hourlyRate = Math.max(50, Math.round(diagnostics.recommendedRate));
  const marginFactor = Math.max(.15, 1 - workspace.targetMargin / 100);
  const hours = Math.max(2, Math.min(240, Math.round((Math.max(lead.budget, hourlyRate * 6) * marginFactor) / (hourlyRate * 1.1))));
  const quoteInput = { hours, hourlyRate, externalCosts: 0, contingencyRate: 10, targetMargin: workspace.targetMargin };
  const quote = calculateProjectQuote(quoteInput);
  const createdAt = now();
  const existingClient = (await db.select().from(clients).where(and(eq(clients.workspaceId, workspace.id), eq(clients.email, lead.email))).limit(1))[0];
  const clientId = existingClient?.id ?? crypto.randomUUID();

  const quoteInsert = db.insert(quotes).values({
    id: crypto.randomUUID(), workspaceId: workspace.id, clientName: lead.fullName,
    projectName: lead.service, ...quoteInput, total: quote.total, status: "draft", createdAt,
  });
  const leadUpdate = db.update(leads).set({ status: "proposal", nextAction: "Revisar y enviar propuesta", updatedAt: createdAt })
    .where(and(eq(leads.id, lead.id), eq(leads.workspaceId, workspace.id)));
  if (!existingClient) {
    const clientInsert = db.insert(clients).values({
      id: clientId, workspaceId: workspace.id, name: lead.fullName, email: lead.email,
      monthlyRevenue: 0, paymentTermsDays: 15, status: "active", createdAt,
    });
    await db.batch([clientInsert, quoteInsert, leadUpdate]);
  } else {
    await db.batch([quoteInsert, leadUpdate]);
  }
}

export async function getPublicIntake(slug: string) {
  const db = getDb();
  const workspace = (await db.select({ id: workspaces.id, businessName: workspaces.businessName, intakeSlug: workspaces.intakeSlug })
    .from(workspaces).where(eq(workspaces.intakeSlug, slug)).limit(1))[0];
  if (!workspace) return null;
  return { businessName: workspace.businessName, intakeSlug: workspace.intakeSlug };
}

export async function createLeadFromIntake(slug: string, input: LeadInput) {
  const db = getDb();
  const workspace = (await db.select().from(workspaces).where(eq(workspaces.intakeSlug, slug)).limit(1))[0];
  if (!workspace) {
    const error = new Error("Formulario no encontrado.");
    Object.assign(error, { status: 404, code: "INTAKE_NOT_FOUND" });
    throw error;
  }
  if (workspace.plan !== "pro") {
    const active = await db.select({ total: count() }).from(leads).where(and(
      eq(leads.workspaceId, workspace.id),
      notInArray(leads.status, ["won", "lost"]),
    ));
    if ((active[0]?.total ?? 0) >= FREE_LIMITS.leads) {
      const error = new Error("Este formulario alcanzó su capacidad temporal. Intenta nuevamente más tarde.");
      Object.assign(error, { status: 402, code: "INTAKE_LIMIT" });
      throw error;
    }
  }
  const duplicateSince = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const duplicate = (await db.select({ id: leads.id }).from(leads).where(and(
    eq(leads.workspaceId, workspace.id),
    eq(leads.email, cleanEmail(input.email)),
    gte(leads.createdAt, duplicateSince),
  )).limit(1))[0];
  if (duplicate) return { duplicate: true };
  await db.insert(leads).values(leadRow(workspace.id, { ...input, source: "honora_form" }));
  return { duplicate: false };
}

export async function askCopilot(identity: AccountIdentity, question: string) {
  const db = getDb();
  const { workspace } = await getOrCreateAccount(identity);
  const period = now().slice(0, 7);
  const used = workspace.copilotPeriod === period ? workspace.copilotQuestionsUsed : 0;
  if (workspace.plan !== "pro" && used >= 5) {
    const error = new Error("Alcanzaste las 5 preguntas mensuales del plan Free. Activa Honora Pro para continuar.");
    Object.assign(error, { status: 402, code: "COPILOT_LIMIT" });
    throw error;
  }
  if (workspace.plan !== "pro") {
    await db.update(workspaces).set({ copilotQuestionsUsed: used + 1, copilotPeriod: period, updatedAt: now() })
      .where(eq(workspaces.id, workspace.id));
  }
  return answerCopilot(question, await getDashboard(identity));
}

export async function createClient(identity: AccountIdentity, input: { name: string; email?: string; monthlyRevenue: number; paymentTermsDays: number }) {
  const db = getDb();
  const workspace = await assertPlanLimit(identity, "clients");
  const row = {
    id: crypto.randomUUID(), workspaceId: workspace.id, name: input.name.trim(),
    email: input.email?.trim().toLowerCase() || null, monthlyRevenue: input.monthlyRevenue,
    paymentTermsDays: input.paymentTermsDays, status: "active" as const, createdAt: now(),
  };
  await db.insert(clients).values(row);
  return row;
}

export async function createInvoice(identity: AccountIdentity, input: { clientId?: string; clientName: string; description: string; amount: number; dueDate: string }) {
  const db = getDb();
  const workspace = await assertPlanLimit(identity, "invoices");
  const row = {
    id: crypto.randomUUID(), workspaceId: workspace.id, clientId: input.clientId || null,
    clientName: input.clientName.trim(), description: input.description.trim(), amount: input.amount,
    dueDate: input.dueDate, status: "pending" as const, issuedAt: now(), paidAt: null,
  };
  await db.insert(invoices).values(row);
  return row;
}

export async function markInvoicePaid(identity: AccountIdentity, invoiceId: string) {
  const db = getDb();
  const { workspace } = await getOrCreateAccount(identity);
  await db.update(invoices).set({ status: "paid", paidAt: now() })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.workspaceId, workspace.id)));
}

export async function createQuote(identity: AccountIdentity, input: {
  clientName: string; projectName: string; hours: number; hourlyRate: number;
  externalCosts: number; contingencyRate: number; targetMargin: number; total: number;
}) {
  const db = getDb();
  const workspace = await assertPlanLimit(identity, "quotes");
  const row = { id: crypto.randomUUID(), workspaceId: workspace.id, ...input, status: "draft" as const, createdAt: now() };
  await db.insert(quotes).values(row);
  return row;
}

export async function updateWorkspace(identity: AccountIdentity, input: {
  businessName: string; monthlyFixedCosts: number; reserveRate: number;
  targetMargin: number; cashReserve: number; billableHours: number;
}) {
  const db = getDb();
  const { workspace } = await getOrCreateAccount(identity);
  await db.update(workspaces).set({ ...input, updatedAt: now() }).where(eq(workspaces.id, workspace.id));
}

export async function updateSubscriptionByEmail(email: string, status: string, providerSubscriptionId: string) {
  const db = getDb();
  const user = (await db.select().from(users).where(eq(users.email, cleanEmail(email))).limit(1))[0];
  if (!user) return false;
  const isPro = status === "authorized";
  await db.update(workspaces).set({
    plan: isPro ? "pro" : "free",
    subscriptionStatus: status,
    providerSubscriptionId,
    updatedAt: now(),
  }).where(eq(workspaces.ownerId, user.id));
  return true;
}
