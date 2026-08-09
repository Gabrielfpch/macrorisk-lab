import type { FinancialStatements, LedgerEntryLike } from "./financial-statements";

export type LeadUrgency = "7d" | "30d" | "90d" | "exploring";
export type LeadStatus = "new" | "qualified" | "proposal" | "won" | "lost";

export type LeadScoringInput = {
  fullName: string;
  email: string;
  phone?: string | null;
  business?: string | null;
  service: string;
  challenge: string;
  budget: number;
  urgency: LeadUrgency;
};

export type AutomationItem = {
  id: string;
  priority: "high" | "medium" | "low";
  kind: "collection" | "lead" | "proposal" | "risk";
  title: string;
  detail: string;
  action: string;
  value: number;
};

type CopilotData = {
  workspace: { businessName: string; targetMargin: number; revenueGoal?: number; primaryService?: string };
  leads: Array<{
    id: string;
    fullName: string;
    service: string;
    budget: number;
    status: LeadStatus;
    score: number;
    nextAction: string;
  }>;
  clients: Array<{ name: string; monthlyRevenue: number }>;
  invoices: Array<{ clientName: string; description: string; amount: number; dueDate: string; status: "pending" | "paid" | "overdue" }>;
  quotes: Array<{ clientName: string; projectName: string; total: number; status: "draft" | "sent" | "accepted"; createdAt: string }>;
  metrics: {
    monthlyIncome: number;
    accountsReceivable: number;
    overdueAmount: number;
    topClientShare: number;
    projectedCash13w: number;
    protectedHourlyRate: number;
    pipelineValue: number;
  };
  automations: AutomationItem[];
  financials?: FinancialStatements;
  ledgerEntries?: LedgerEntryLike[];
  copilotHistory?: Array<{ question: string; answer: string; createdAt: string }>;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const money = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(value);

export function scoreLead(input: LeadScoringInput) {
  const budgetScore = input.budget >= 5000 ? 34 : input.budget >= 2500 ? 27 : input.budget >= 1200 ? 20 : input.budget >= 500 ? 12 : 4;
  const urgencyScore = input.urgency === "7d" ? 24 : input.urgency === "30d" ? 20 : input.urgency === "90d" ? 12 : 5;
  const clarityScore = input.challenge.trim().length >= 120 ? 22 : input.challenge.trim().length >= 55 ? 17 : input.challenge.trim().length >= 20 ? 10 : 4;
  const contactScore = 8 + (input.phone?.trim() ? 6 : 0) + (input.business?.trim() ? 6 : 0);
  const score = Math.round(clamp(budgetScore + urgencyScore + clarityScore + contactScore, 0, 100));
  const fit = score >= 78 ? "hot" : score >= 58 ? "warm" : "nurture";
  const nextAction = fit === "hot"
    ? "Responder hoy y agendar discovery call"
    : fit === "warm"
      ? "Validar alcance y presupuesto en 48 horas"
      : "Enviar recurso útil y mantener en seguimiento";

  return { score, fit, nextAction } as const;
}

export function buildAutomationQueue(input: {
  leads: CopilotData["leads"];
  invoices: CopilotData["invoices"];
  quotes: CopilotData["quotes"];
  topClientShare: number;
}) {
  const now = Date.now();
  const items: AutomationItem[] = [];

  for (const invoice of input.invoices.filter((item) => item.status === "overdue")) {
    items.push({
      id: `collection:${invoice.clientName}:${invoice.dueDate}`,
      priority: "high",
      kind: "collection",
      title: `Cobrar ${money(invoice.amount)} a ${invoice.clientName}`,
      detail: `${invoice.description} venció el ${invoice.dueDate}.`,
      action: "Enviar recordatorio de pago hoy",
      value: invoice.amount,
    });
  }

  for (const lead of input.leads.filter((item) => item.status === "new" && item.score >= 58)) {
    items.push({
      id: `lead:${lead.id}`,
      priority: lead.score >= 78 ? "high" : "medium",
      kind: "lead",
      title: `Responder a ${lead.fullName}`,
      detail: `${lead.service} · Fit ${lead.score}/100 · presupuesto ${money(lead.budget)}.`,
      action: lead.nextAction,
      value: lead.budget,
    });
  }

  for (const quote of input.quotes.filter((item) => {
    const ageDays = (now - Date.parse(item.createdAt)) / 86_400_000;
    return item.status === "draft" && ageDays >= 2;
  })) {
    items.push({
      id: `proposal:${quote.clientName}:${quote.projectName}`,
      priority: "medium",
      kind: "proposal",
      title: `Mover propuesta de ${quote.clientName}`,
      detail: `${quote.projectName} por ${money(quote.total)} sigue en draft.`,
      action: "Revisar y enviar la propuesta",
      value: quote.total,
    });
  }

  if (input.topClientShare >= 40) {
    items.push({
      id: "risk:concentration",
      priority: input.topClientShare >= 55 ? "high" : "medium",
      kind: "risk",
      title: "Reducir concentración de revenue",
      detail: `Tu principal cliente representa ${input.topClientShare.toFixed(0)}% del ingreso mensual.`,
      action: "Calificar dos leads nuevos esta semana",
      value: 0,
    });
  }

  const weight = { high: 3, medium: 2, low: 1 } as const;
  return items
    .sort((a, b) => weight[b.priority] - weight[a.priority] || b.value - a.value)
    .slice(0, 8);
}

export function answerCopilot(question: string, data: CopilotData) {
  const normalized = question.trim().toLocaleLowerCase("es");
  const overdue = data.invoices.filter((invoice) => invoice.status === "overdue").sort((a, b) => b.amount - a.amount);
  const openLeads = data.leads.filter((lead) => !["won", "lost"].includes(lead.status)).sort((a, b) => b.score - a.score);
  const topClient = [...data.clients].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)[0];
  const priority = data.automations[0];
  const statements = data.financials;
  const history = data.copilotHistory ?? [];

  if (/qu[eé] hago|plan.*semana|esta semana/.test(normalized)) {
    return {
      intent: "weekly_plan",
      answer: priority
        ? `Tu movimiento de mayor impacto ahora es: ${priority.title}. ${priority.detail}`
        : `${data.workspace.businessName} no tiene alertas críticas abiertas.`,
      evidence: [
        `Pipeline: ${money(data.metrics.pipelineValue)}`,
        `Accounts receivable: ${money(data.metrics.accountsReceivable)}`,
        `13-week cash: ${money(data.metrics.projectedCash13w)}`,
      ],
      next: priority?.action ?? "Revisa pipeline, pricing y cobros una vez por semana para mantener la operación al día.",
    };
  }

  if (/qu[eé].*pregunt|historial|conversaci[oó]n.*anter|antes.*dije/.test(normalized)) {
    return history.length
      ? {
          intent: "conversation_history",
          answer: `Tienes ${history.length} conversaciones guardadas. La más reciente fue: “${history[0].question}”.`,
          evidence: history.slice(0, 3).map((item) => item.question),
          next: "Abre una conversación del historial para volver a ver la respuesta, evidencia y siguiente acción.",
        }
      : {
          intent: "conversation_history",
          answer: "Todavía no tienes preguntas anteriores guardadas.",
          evidence: ["Cada nueva respuesta quedará asociada a tu workspace."],
          next: "Haz una pregunta sobre caja, ventas, pricing o estados financieros.",
        };
  }

  if (/estado.*resultado|p\s*&\s*l|p[eé]rdid|ganancia|utilidad|rentab|profit|gasto|expense/.test(normalized)) {
    if (!statements) return summaryResponse(data, priority);
    return {
      intent: "profitability",
      answer: statements.summary.netIncome >= 0
        ? `En ${statements.periodLabel}, tu net income estimado es ${money(statements.summary.netIncome)} con margen operativo de ${statements.ratios.operatingMargin.toFixed(1)}%.`
        : `En ${statements.periodLabel}, registras una pérdida estimada de ${money(Math.abs(statements.summary.netIncome))}.`,
      evidence: [
        `Revenue cobrado: ${money(statements.summary.revenue)}`,
        `Operating expenses: ${money(statements.summary.expenses)}`,
        `Reserva tributaria: ${money(statements.summary.taxReserve)}`,
      ],
      next: statements.summary.netIncome < 0
        ? "Revisa el Ledger, recorta el gasto menos productivo y acelera el cobro de receivables."
        : "Compara el margen contra tu target y reserva el monto tributario antes de disponer de la utilidad.",
    };
  }

  if (/balance|activo|pasivo|patrimonio|equity|situaci[oó]n financiera/.test(normalized)) {
    if (!statements) return summaryResponse(data, priority);
    const liabilities = statements.balanceSheet.liabilities.at(-1)?.amount ?? 0;
    const equity = statements.balanceSheet.equity[0]?.amount ?? 0;
    return {
      intent: "balance_sheet",
      answer: `Tus assets estimados suman ${money(statements.summary.totalAssets)} y el balance está ${statements.balanceSheet.balanced ? "cuadrado" : "pendiente de revisión"}.`,
      evidence: [
        `Cash: ${money(statements.summary.closingCash)}`,
        `Accounts receivable: ${money(statements.summary.accountsReceivable)}`,
        `Liabilities: ${money(liabilities)} · Equity: ${money(equity)}`,
      ],
      next: "Revisa que cada cobro real y gasto esté registrado en el Ledger antes de usar este cuadro para decisiones formales.",
    };
  }

  if (/flujo.*efectivo|cash flow statement|movimiento|ledger|libro|transacci[oó]n/.test(normalized)) {
    if (!statements) return summaryResponse(data, priority);
    return {
      intent: "cash_statement",
      answer: `Tu net cash flow acumulado es ${money(statements.summary.closingCash - statements.summary.openingCash)} y el closing cash es ${money(statements.summary.closingCash)}.`,
      evidence: [
        `Opening cash: ${money(statements.summary.openingCash)}`,
        `Movimientos registrados: ${data.ledgerEntries?.length ?? 0}`,
        `Cash runway: ${statements.ratios.cashRunwayMonths.toFixed(1)} meses`,
      ],
      next: "Registra todo ingreso o gasto en Estados financieros para que forecast, ratios y Copilot se actualicen juntos.",
    };
  }

  if (/meta|objetivo.*venta|revenue goal|cu[aá]nto.*falta/.test(normalized)) {
    const goal = data.workspace.revenueGoal ?? 0;
    const gap = Math.max(0, goal - data.metrics.monthlyIncome);
    return {
      intent: "revenue_goal",
      answer: goal > 0
        ? gap > 0 ? `Te faltan ${money(gap)} de revenue mensual para alcanzar tu meta de ${money(goal)}.` : `Ya alcanzaste tu meta mensual de ${money(goal)}.`
        : "Aún no has definido una meta mensual de revenue.",
      evidence: [`Revenue mensual contratado: ${money(data.metrics.monthlyIncome)}`, `Pipeline abierto: ${money(data.metrics.pipelineValue)}`],
      next: gap > 0 ? "Prioriza los leads con mayor Fit Score y convierte el gap en un número concreto de propuestas." : "Protege margen, renovaciones y calidad de cobro antes de elevar la meta.",
    };
  }

  if (/c[oó]mo.*(agrego|crear|registro).*cliente|nuevo cliente/.test(normalized)) {
    return {
      intent: "product_help",
      answer: "Ve a Clientes, completa nombre, email, revenue mensual y payment terms; al guardar, Honora recalcula concentración y revenue.",
      evidence: ["Lead Inbox también puede convertir un prospecto en cliente + quote con un clic."],
      next: "Si el cliente nació como lead, conviértelo desde Lead Inbox para conservar la trazabilidad completa.",
    };
  }

  if (/google forms|google sheet|csv|import/.test(normalized)) {
    return {
      intent: "integration_help",
      answer: "Exporta las respuestas de Google Forms desde su Google Sheet como CSV y súbelas en Lead Inbox. Honora reconoce encabezados en español o inglés y calcula el Fit Score.",
      evidence: ["Campos mínimos: nombre y email", "Recomendados: servicio, necesidad, presupuesto, teléfono y empresa"],
      next: "Descarga la plantilla del Bridge antes de importar para validar el formato en segundos.",
    };
  }

  if (/qu[eé] es honora|para qu[eé] sirve|c[oó]mo funciona|ayuda general|hola|buenas/.test(normalized)) {
    return {
      intent: "product_guide",
      answer: "Honora conecta el recorrido desde una consulta hasta el dinero cobrado: captura, califica, cotiza, cobra y traduce los movimientos en estados financieros.",
      evidence: ["Lead Inbox → Protected Quote → Collection Radar", "Ledger → P&L + Balance Sheet + Cash Flow", "Copilot usa esos mismos datos"],
      next: priority?.action ?? "Empieza por revisar Money Moves en el Command Center.",
    };
  }

  if (/debe|deuda|vencid|cobrar|cobro|pagar/.test(normalized)) {
    return overdue.length
      ? {
          intent: "collections",
          answer: `Tienes ${money(data.metrics.overdueAmount)} vencidos. Empieza por ${overdue[0].clientName}: ${money(overdue[0].amount)} por ${overdue[0].description}.`,
          evidence: overdue.slice(0, 3).map((item) => `${item.clientName} · ${money(item.amount)} · vence ${item.dueDate}`),
          next: "Envía hoy un mensaje breve con monto, vencimiento y enlace de pago. Si no responde en 48 horas, escala a llamada.",
        }
      : {
          intent: "collections",
          answer: "No tienes cuentas vencidas. Tu collection radar está limpio.",
          evidence: [`Accounts receivable abierto: ${money(data.metrics.accountsReceivable)}`],
          next: "Confirma preventivamente los próximos vencimientos con 3 días de anticipación.",
        };
  }

  if (/cu[aá]nto.*cobr|precio|tarifa|cotiz|quote|margen/.test(normalized)) {
    return {
      intent: "pricing",
      answer: `Tu protected hourly rate actual es ${money(data.metrics.protectedHourlyRate)}. Úsalo como piso, no como precio final.`,
      evidence: [`Target margin: ${data.workspace.targetMargin}%`, `Revenue mensual: ${money(data.metrics.monthlyIncome)}`],
      next: "En cada quote suma labor, costos externos y contingency; luego protege el margen dividiendo el costo protegido entre 1 menos tu target margin.",
    };
  }

  if (/lead|prospect|pipeline|oportunidad|venta/.test(normalized)) {
    return openLeads.length
      ? {
          intent: "pipeline",
          answer: `Tu pipeline abierto vale ${money(data.metrics.pipelineValue)}. El mejor siguiente prospecto es ${openLeads[0].fullName}, con fit ${openLeads[0].score}/100.`,
          evidence: openLeads.slice(0, 3).map((lead) => `${lead.fullName} · ${lead.service} · ${money(lead.budget)} · ${lead.score}/100`),
          next: openLeads[0].nextAction,
        }
      : {
          intent: "pipeline",
          answer: "Tu pipeline está vacío. Sin nuevos leads, la caja futura depende demasiado de los clientes actuales.",
          evidence: [`Concentración principal: ${data.metrics.topClientShare.toFixed(0)}%`],
          next: "Comparte tu Smart Intake en LinkedIn, WhatsApp y tu firma de correo.",
        };
  }

  if (/cliente|concentr|riesgo|depend/.test(normalized)) {
    return {
      intent: "risk",
      answer: topClient
        ? `${topClient.name} es tu mayor cliente y concentra ${data.metrics.topClientShare.toFixed(0)}% del revenue mensual.`
        : "Aún no hay clientes activos para calcular concentración.",
      evidence: topClient ? [`Revenue de ${topClient.name}: ${money(topClient.monthlyRevenue)}`, `Revenue total: ${money(data.metrics.monthlyIncome)}`] : [],
      next: data.metrics.topClientShare >= 40 ? "No aumentes costos fijos basándote en ese único cliente; convierte más pipeline antes." : "La concentración está controlada. Protege renovación y margen.",
    };
  }

  if (/caja|cash|13|semana|liquidez|runway/.test(normalized)) {
    return {
      intent: "cashflow",
      answer: `Tu closing cash proyectado a 13 semanas es ${money(data.metrics.projectedCash13w)}.`,
      evidence: [`Por cobrar: ${money(data.metrics.accountsReceivable)}`, `Vencido: ${money(data.metrics.overdueAmount)}`],
      next: data.metrics.projectedCash13w < 0 ? "La caja cruza cero: acelera cobros y pausa gastos no esenciales hoy." : "La proyección sigue positiva; conserva el buffer antes de asumir costos recurrentes.",
    };
  }

  if (/contrato|adelanto|anticipo|payment terms|t[eé]rminos/.test(normalized)) {
    return {
      intent: "playbook",
      answer: "Para proyectos nuevos, una estructura sana suele separar alcance, hitos, change requests y calendario de pagos.",
      evidence: ["Usa un adelanto antes de iniciar", "Ata cada pago a un hito verificable", "Define por escrito qué queda fuera del scope"],
      next: "Honora no reemplaza asesoría legal; usa estos puntos como checklist operativo y valida el contrato con un profesional.",
    };
  }

  return summaryResponse(data, priority);
}

function summaryResponse(data: CopilotData, priority?: AutomationItem) {
  return {
    intent: "business_summary",
    answer: `${data.workspace.businessName} tiene ${money(data.metrics.pipelineValue)} en pipeline y ${money(data.metrics.accountsReceivable)} por cobrar.`,
    evidence: [
      `Pipeline: ${money(data.metrics.pipelineValue)}`,
      `Accounts receivable: ${money(data.metrics.accountsReceivable)}`,
      `13-week cash: ${money(data.metrics.projectedCash13w)}`,
    ],
    next: priority?.action ?? "Pregunta por pipeline, pricing, cobros, estados financieros o cómo usar Honora.",
  };
}

export function parseGoogleFormsCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.toLocaleLowerCase("es"));
  const pick = (values: string[], aliases: string[]) => {
    const index = headers.findIndex((header) => aliases.some((alias) => header.includes(alias)));
    return index >= 0 ? values[index]?.trim() ?? "" : "";
  };
  const parseAmount = (raw: string) => {
    let clean = raw.replace(/[^0-9.,-]/g, "");
    const comma = clean.lastIndexOf(",");
    const dot = clean.lastIndexOf(".");
    if (comma >= 0 && dot >= 0) {
      clean = comma > dot ? clean.replaceAll(".", "").replace(",", ".") : clean.replaceAll(",", "");
    } else if (comma >= 0) {
      clean = clean.length - comma - 1 === 3 ? clean.replaceAll(",", "") : clean.replace(",", ".");
    } else if (dot >= 0 && clean.length - dot - 1 === 3) {
      clean = clean.replaceAll(".", "");
    }
    return Number(clean) || 0;
  };

  return rows.slice(1).map((values) => ({
    fullName: pick(values, ["nombre", "name"]),
    email: pick(values, ["correo", "email"]),
    phone: pick(values, ["teléfono", "telefono", "phone", "whatsapp"]),
    business: pick(values, ["empresa", "negocio", "business"]),
    service: pick(values, ["servicio", "service"]) || "Servicio profesional",
    challenge: pick(values, ["necesidad", "reto", "problema", "challenge", "mensaje"]) || "Lead importado desde Google Forms; validar necesidad en el primer contacto.",
    budget: parseAmount(pick(values, ["presupuesto", "budget"])),
    urgency: "30d" as LeadUrgency,
    source: "google_forms_csv",
  })).filter((lead) => lead.fullName && lead.email);
}
