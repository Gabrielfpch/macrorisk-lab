import { and, asc, count, desc, eq, lt } from "drizzle-orm";
import { getDb } from "../db";
import { clients, invoices, quotes, users, workspaces } from "../db/schema";
import { buildThirteenWeekForecast, calculateDiagnostics, calculateHonoraScore, calculateRevenueRisk } from "./honora";

export const FREE_LIMITS = { clients: 2, invoices: 5, quotes: 1 } as const;

export type AccountIdentity = { email: string; name: string };

const now = () => new Date().toISOString();
const cleanEmail = (value: string) => value.trim().toLowerCase();

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
      monthlyFixedCosts: 1800, reserveRate: 8, targetMargin: 25, cashReserve: 8500,
      billableHours: 80, plan: "free" as const, subscriptionStatus: "inactive",
      providerSubscriptionId: null, createdAt, updatedAt: createdAt,
    };
    try {
      await db.insert(workspaces).values(candidate);
      workspace = candidate;
    } catch {
      workspace = (await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1))[0];
    }
  }

  if (!workspace) throw new Error("No se pudo crear el espacio financiero.");
  return { user, workspace };
}

export async function getDashboard(identity: AccountIdentity) {
  const db = getDb();
  const account = await getOrCreateAccount(identity);
  const today = new Date().toISOString().slice(0, 10);
  await db.update(invoices)
    .set({ status: "overdue" })
    .where(and(eq(invoices.workspaceId, account.workspace.id), eq(invoices.status, "pending"), lt(invoices.dueDate, today)));

  const [clientRows, invoiceRows, quoteRows] = await Promise.all([
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

  return {
    user: account.user,
    workspace: account.workspace,
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
    },
    forecast,
    limits: FREE_LIMITS,
  };
}

export async function assertPlanLimit(identity: AccountIdentity, resource: keyof typeof FREE_LIMITS) {
  const db = getDb();
  const { workspace } = await getOrCreateAccount(identity);
  if (workspace.plan === "pro") return workspace;
  const table = resource === "clients" ? clients : resource === "invoices" ? invoices : quotes;
  const result = await db.select({ total: count() }).from(table).where(eq(table.workspaceId, workspace.id));
  if ((result[0]?.total ?? 0) >= FREE_LIMITS[resource]) {
    const error = new Error(`Límite Free alcanzado: ${FREE_LIMITS[resource]} ${resource}.`);
    Object.assign(error, { status: 402, code: "PLAN_LIMIT" });
    throw error;
  }
  return workspace;
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
