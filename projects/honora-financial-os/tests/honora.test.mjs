import assert from "node:assert/strict";
import test from "node:test";
import {
  buildThirteenWeekForecast,
  calculateDiagnostics,
  calculateHonoraScore,
  calculateProjectQuote,
  calculateRevenueRisk,
  calculateScenario,
  generateActionPlan,
} from "../lib/honora.ts";
import {
  answerCopilot,
  buildAutomationQueue,
  parseGoogleFormsCsv,
  scoreLead,
} from "../lib/client-to-cash.ts";

const financials = {
  monthlyIncome: 6500,
  fixedCosts: 1800,
  variableCosts: 900,
  debtPayments: 300,
  cashReserve: 8500,
  billableHours: 80,
  reserveRate: 8,
  targetMargin: 20,
};

const stableRisk = {
  revenueHistory: [6200, 6400, 6350, 6500, 6450, 6550],
  topClientShare: 25,
  averagePaymentDelay: 10,
};

test("el diagnóstico conserva la identidad de free cash flow", () => {
  const result = calculateDiagnostics(financials);
  assert.equal(result.freeCashFlow, financials.monthlyIncome - result.reserve - result.burn);
  assert.ok(result.recommendedRate > 0);
  assert.ok(result.runway > 0);
});

test("la tarifa protegida aumenta con el margen objetivo", () => {
  const base = calculateDiagnostics(financials);
  const ambitious = calculateDiagnostics({ ...financials, targetMargin: 35 });
  assert.ok(ambitious.recommendedRate > base.recommendedRate);
});

test("el revenue stability score penaliza concentración y demora", () => {
  const healthy = calculateRevenueRisk(stableRisk, financials.monthlyIncome);
  const fragile = calculateRevenueRisk({ ...stableRisk, topClientShare: 75, averagePaymentDelay: 70 }, financials.monthlyIncome);
  assert.ok(healthy.stabilityScore > fragile.stabilityScore);
});

test("el Honora Score siempre permanece entre cero y cien", () => {
  assert.equal(calculateHonoraScore(-100, -20), 0);
  assert.equal(calculateHonoraScore(140, 180), 100);
});

test("un shock negativo reduce revenue y free cash flow", () => {
  const base = calculateScenario(financials, 0);
  const stress = calculateScenario(financials, -0.35);
  assert.ok(stress.stressedIncome < base.stressedIncome);
  assert.ok(stress.stressedFreeCashFlow < base.stressedFreeCashFlow);
});

test("el plan entrega cuatro acciones concretas", () => {
  const diagnostics = calculateDiagnostics(financials);
  const revenueRisk = calculateRevenueRisk(stableRisk, financials.monthlyIncome);
  const actions = generateActionPlan(financials, diagnostics, stableRisk, revenueRisk);
  assert.equal(actions.length, 4);
  assert.ok(actions.every((action) => action.horizon && action.title && action.detail && action.impact));
});

test("el project quote protege costos, contingencia y margen", () => {
  const quote = calculateProjectQuote({ hours: 40, hourlyRate: 80, externalCosts: 300, contingencyRate: 10, targetMargin: 25 });
  assert.equal(quote.laborCost, 3200);
  assert.equal(quote.directCost, 3500);
  assert.equal(quote.contingency, 350);
  assert.ok(quote.total > quote.protectedCost);
  assert.ok(Math.abs(quote.total * .75 - quote.protectedCost) < .001);
});

test("el forecast de 13 semanas reconoce cobros por vencimiento", () => {
  const start = new Date("2026-08-03T00:00:00Z");
  const forecast = buildThirteenWeekForecast(1000, 100, [
    { amount: 750, dueDate: "2026-08-05", status: "pending" },
    { amount: 900, dueDate: "2026-08-06", status: "paid" },
  ], start);
  assert.equal(forecast.length, 13);
  assert.equal(forecast[0].inflow, 750);
  assert.equal(forecast[0].closingCash, 1650);
  assert.equal(forecast[1].openingCash, 1650);
});

test("el Fit Score prioriza presupuesto, urgencia y claridad sin datos sensibles", () => {
  const hot = scoreLead({ fullName: "Mariana", email: "m@example.com", phone: "999", business: "Altura", service: "Automatización", challenge: "Necesitamos automatizar el onboarding comercial, reducir horas manuales y medir cada conversión del pipeline.", budget: 6000, urgency: "7d" });
  const nurture = scoreLead({ fullName: "Luis", email: "l@example.com", service: "Diseño", challenge: "Quiero información general.", budget: 200, urgency: "exploring" });
  assert.ok(hot.score >= 78);
  assert.ok(hot.score > nurture.score);
  assert.match(hot.nextAction, /hoy/i);
});

test("Google Forms Bridge interpreta CSV con comas y campos entre comillas", () => {
  const rows = parseGoogleFormsCsv('Marca temporal,Nombre,Email,Servicio,Necesidad,Presupuesto\n2026-08-09,"Ana Pérez",ana@example.com,Consultoría,"Ordenar pricing, ventas y caja","S/ 2,500"');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].fullName, "Ana Pérez");
  assert.equal(rows[0].budget, 2500);
  assert.equal(rows[0].source, "google_forms_csv");
});

test("las automatizaciones ponen cobros vencidos y hot leads primero", () => {
  const queue = buildAutomationQueue({
    leads: [{ id: "l1", fullName: "Mariana", service: "Automation", budget: 6200, status: "new", score: 91, nextAction: "Responder hoy" }],
    invoices: [{ clientName: "Páramo", description: "Sprint", amount: 1200, dueDate: "2026-08-01", status: "overdue" }],
    quotes: [],
    topClientShare: 20,
  });
  assert.equal(queue.length, 2);
  assert.ok(queue.every((item) => item.priority === "high"));
});

test("Copilot responde con cifras trazables del workspace", () => {
  const response = answerCopilot("¿Quién me debe dinero?", {
    workspace: { businessName: "Studio", targetMargin: 25 },
    leads: [], clients: [], quotes: [], automations: [],
    invoices: [{ clientName: "Páramo", description: "Sprint", amount: 1200, dueDate: "2026-08-01", status: "overdue" }],
    metrics: { monthlyIncome: 5000, accountsReceivable: 1200, overdueAmount: 1200, topClientShare: 0, projectedCash13w: 8000, protectedHourlyRate: 80, pipelineValue: 0 },
  });
  assert.match(response.answer, /Páramo/);
  assert.match(response.answer, /1[,.]200/);
  assert.ok(response.evidence.length > 0);
});
