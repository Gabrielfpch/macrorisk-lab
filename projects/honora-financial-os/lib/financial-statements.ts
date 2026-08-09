export type LedgerKind = "income" | "expense";

export type LedgerEntryLike = {
  id: string;
  kind: LedgerKind;
  category: string;
  description: string;
  amount: number;
  occurredOn: string;
  source: string;
  clientName?: string | null;
  invoiceId?: string | null;
};

export type StatementInvoice = {
  amount: number;
  status: "pending" | "paid" | "overdue";
};

export type StatementClient = {
  monthlyRevenue: number;
  status: "active" | "paused";
};

export type StatementLine = {
  key: string;
  label: string;
  amount: number;
  tone?: "default" | "positive" | "negative" | "total";
};

export type FinancialStatements = {
  period: string;
  periodLabel: string;
  incomeStatement: StatementLine[];
  balanceSheet: {
    assets: StatementLine[];
    liabilities: StatementLine[];
    equity: StatementLine[];
    balanced: boolean;
  };
  cashFlowStatement: StatementLine[];
  monthlyTrend: Array<{
    period: string;
    label: string;
    revenue: number;
    expenses: number;
    netCash: number;
  }>;
  ratios: {
    operatingMargin: number;
    collectionRate: number;
    cashRunwayMonths: number;
    currentRatio: number | null;
    dsoDays: number;
  };
  summary: {
    revenue: number;
    expenses: number;
    netIncome: number;
    openingCash: number;
    closingCash: number;
    accountsReceivable: number;
    taxReserve: number;
    totalAssets: number;
  };
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("es-PE", { month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(".", "");
}

function previousMonths(asOf: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - (count - index - 1), 1));
    return monthKey(date);
  });
}

export function buildFinancialStatements(input: {
  openingCash: number;
  monthlyFixedCosts: number;
  reserveRate: number;
  entries: LedgerEntryLike[];
  invoices: StatementInvoice[];
  clients: StatementClient[];
  asOf?: string | Date;
}): FinancialStatements {
  const asOf = input.asOf instanceof Date ? input.asOf : input.asOf ? new Date(input.asOf) : new Date();
  const safeAsOf = Number.isNaN(asOf.getTime()) ? new Date() : asOf;
  const period = monthKey(safeAsOf);
  const periodEntries = input.entries.filter((entry) => entry.occurredOn.startsWith(period));
  const revenue = sum(periodEntries.filter((entry) => entry.kind === "income").map((entry) => entry.amount));
  const expenses = sum(periodEntries.filter((entry) => entry.kind === "expense").map((entry) => entry.amount));
  const operatingProfit = revenue - expenses;
  const taxReserve = Math.max(0, operatingProfit * input.reserveRate / 100);
  const netIncome = operatingProfit - taxReserve;

  const allInflows = sum(input.entries.filter((entry) => entry.kind === "income").map((entry) => entry.amount));
  const allOutflows = sum(input.entries.filter((entry) => entry.kind === "expense").map((entry) => entry.amount));
  const closingCash = Math.max(0, input.openingCash + allInflows - allOutflows);
  const accountsReceivable = sum(input.invoices.filter((invoice) => invoice.status !== "paid").map((invoice) => invoice.amount));
  const totalAssets = closingCash + accountsReceivable;
  const totalLiabilities = taxReserve;
  const ownerEquity = totalAssets - totalLiabilities;
  const totalInvoiced = sum(input.invoices.map((invoice) => invoice.amount));
  const totalCollected = sum(input.invoices.filter((invoice) => invoice.status === "paid").map((invoice) => invoice.amount));
  const activeRevenue = sum(input.clients.filter((client) => client.status === "active").map((client) => client.monthlyRevenue));

  const incomeStatement: StatementLine[] = [
    { key: "revenue", label: "Revenue cobrado", amount: round(revenue), tone: "positive" },
    { key: "expenses", label: "Operating expenses", amount: round(-expenses), tone: "negative" },
    { key: "operating-profit", label: "Operating profit", amount: round(operatingProfit), tone: "total" },
    { key: "tax-reserve", label: `Reserva tributaria (${input.reserveRate.toFixed(0)}%)`, amount: round(-taxReserve), tone: "negative" },
    { key: "net-income", label: "Net income estimado", amount: round(netIncome), tone: "total" },
  ];

  const cashFlowStatement: StatementLine[] = [
    { key: "opening-cash", label: "Opening cash", amount: round(input.openingCash) },
    { key: "cash-inflows", label: "Cash inflows acumulados", amount: round(allInflows), tone: "positive" },
    { key: "cash-outflows", label: "Cash outflows acumulados", amount: round(-allOutflows), tone: "negative" },
    { key: "net-cash-flow", label: "Net cash flow", amount: round(allInflows - allOutflows), tone: "total" },
    { key: "closing-cash", label: "Closing cash", amount: round(closingCash), tone: "total" },
  ];

  const assets: StatementLine[] = [
    { key: "cash", label: "Cash & equivalents", amount: round(closingCash) },
    { key: "accounts-receivable", label: "Accounts receivable", amount: round(accountsReceivable) },
    { key: "total-assets", label: "Total assets", amount: round(totalAssets), tone: "total" },
  ];
  const liabilities: StatementLine[] = [
    { key: "tax-payable", label: "Reserva tributaria", amount: round(totalLiabilities) },
    { key: "total-liabilities", label: "Total liabilities", amount: round(totalLiabilities), tone: "total" },
  ];
  const equity: StatementLine[] = [
    { key: "owner-equity", label: "Owner's equity", amount: round(ownerEquity) },
    { key: "liabilities-equity", label: "Liabilities + equity", amount: round(totalLiabilities + ownerEquity), tone: "total" },
  ];

  const monthlyTrend = previousMonths(safeAsOf, 6).map((month) => {
    const entries = input.entries.filter((entry) => entry.occurredOn.startsWith(month));
    const monthRevenue = sum(entries.filter((entry) => entry.kind === "income").map((entry) => entry.amount));
    const monthExpenses = sum(entries.filter((entry) => entry.kind === "expense").map((entry) => entry.amount));
    return {
      period: month,
      label: monthLabel(month),
      revenue: round(monthRevenue),
      expenses: round(monthExpenses),
      netCash: round(monthRevenue - monthExpenses),
    };
  });

  return {
    period,
    periodLabel: monthLabel(period),
    incomeStatement,
    balanceSheet: {
      assets,
      liabilities,
      equity,
      balanced: Math.abs(totalAssets - (totalLiabilities + ownerEquity)) < .01,
    },
    cashFlowStatement,
    monthlyTrend,
    ratios: {
      operatingMargin: revenue > 0 ? round(operatingProfit / revenue * 100) : 0,
      collectionRate: totalInvoiced > 0 ? round(totalCollected / totalInvoiced * 100) : 0,
      cashRunwayMonths: input.monthlyFixedCosts > 0 ? round(closingCash / input.monthlyFixedCosts) : 0,
      currentRatio: totalLiabilities > 0 ? round(totalAssets / totalLiabilities) : null,
      dsoDays: activeRevenue > 0 ? round(accountsReceivable / activeRevenue * 30) : 0,
    },
    summary: {
      revenue: round(revenue),
      expenses: round(expenses),
      netIncome: round(netIncome),
      openingCash: round(input.openingCash),
      closingCash: round(closingCash),
      accountsReceivable: round(accountsReceivable),
      taxReserve: round(taxReserve),
      totalAssets: round(totalAssets),
    },
  };
}
