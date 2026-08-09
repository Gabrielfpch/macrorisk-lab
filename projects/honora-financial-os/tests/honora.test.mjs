import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDiagnostics,
  calculateHonoraScore,
  calculateRevenueRisk,
  calculateScenario,
  generateActionPlan,
} from "../lib/honora.ts";

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
