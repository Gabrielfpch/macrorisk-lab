import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    businessName: text("business_name").notNull().default("Mi negocio"),
    intakeSlug: text("intake_slug"),
    monthlyFixedCosts: real("monthly_fixed_costs").notNull().default(1800),
    reserveRate: real("reserve_rate").notNull().default(8),
    targetMargin: real("target_margin").notNull().default(25),
    cashReserve: real("cash_reserve").notNull().default(8500),
    billableHours: real("billable_hours").notNull().default(80),
    revenueGoal: real("revenue_goal").notNull().default(10000),
    businessType: text("business_type").notNull().default("Servicios profesionales"),
    primaryService: text("primary_service").notNull().default("Consultoría"),
    onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).notNull().default(false),
    plan: text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
    subscriptionStatus: text("subscription_status").notNull().default("inactive"),
    providerSubscriptionId: text("provider_subscription_id"),
    copilotQuestionsUsed: integer("copilot_questions_used").notNull().default(0),
    copilotPeriod: text("copilot_period"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("workspaces_owner_unique").on(table.ownerId),
    uniqueIndex("workspaces_intake_slug_unique").on(table.intakeSlug),
  ],
);

export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    business: text("business"),
    service: text("service").notNull(),
    challenge: text("challenge").notNull(),
    budget: real("budget").notNull().default(0),
    urgency: text("urgency", { enum: ["7d", "30d", "90d", "exploring"] }).notNull().default("30d"),
    source: text("source").notNull().default("honora_form"),
    status: text("status", { enum: ["new", "qualified", "proposal", "won", "lost"] }).notNull().default("new"),
    score: integer("score").notNull().default(0),
    nextAction: text("next_action").notNull().default("Responder y validar encaje"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("leads_workspace_idx").on(table.workspaceId),
    index("leads_workspace_status_idx").on(table.workspaceId, table.status),
    index("leads_workspace_email_idx").on(table.workspaceId, table.email),
  ],
);

export const clients = sqliteTable(
  "clients",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    monthlyRevenue: real("monthly_revenue").notNull().default(0),
    paymentTermsDays: integer("payment_terms_days").notNull().default(15),
    status: text("status", { enum: ["active", "paused"] }).notNull().default("active"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("clients_workspace_idx").on(table.workspaceId)],
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    clientName: text("client_name").notNull(),
    description: text("description").notNull(),
    amount: real("amount").notNull(),
    dueDate: text("due_date").notNull(),
    status: text("status", { enum: ["pending", "paid", "overdue"] }).notNull().default("pending"),
    issuedAt: text("issued_at").notNull(),
    paidAt: text("paid_at"),
  },
  (table) => [index("invoices_workspace_idx").on(table.workspaceId)],
);

export const quotes = sqliteTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    clientName: text("client_name").notNull(),
    projectName: text("project_name").notNull(),
    hours: real("hours").notNull(),
    hourlyRate: real("hourly_rate").notNull(),
    externalCosts: real("external_costs").notNull().default(0),
    contingencyRate: real("contingency_rate").notNull().default(10),
    targetMargin: real("target_margin").notNull().default(25),
    total: real("total").notNull(),
    status: text("status", { enum: ["draft", "sent", "accepted"] }).notNull().default("draft"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("quotes_workspace_idx").on(table.workspaceId)],
);

export const ledgerEntries = sqliteTable(
  "ledger_entries",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["income", "expense"] }).notNull(),
    category: text("category").notNull(),
    description: text("description").notNull(),
    amount: real("amount").notNull(),
    occurredOn: text("occurred_on").notNull(),
    source: text("source", { enum: ["manual", "invoice", "onboarding"] }).notNull().default("manual"),
    clientName: text("client_name"),
    invoiceId: text("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("ledger_workspace_date_idx").on(table.workspaceId, table.occurredOn),
    uniqueIndex("ledger_invoice_unique").on(table.invoiceId),
  ],
);

export const copilotConversations = sqliteTable(
  "copilot_conversations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    intent: text("intent").notNull(),
    answer: text("answer").notNull(),
    evidenceJson: text("evidence_json").notNull().default("[]"),
    nextAction: text("next_action").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("copilot_workspace_created_idx").on(table.workspaceId, table.createdAt)],
);
