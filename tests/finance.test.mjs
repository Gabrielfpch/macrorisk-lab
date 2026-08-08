import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSETS,
  PRESETS,
  calculatePortfolioMetrics,
  calculateScenario,
  normalizeWeights,
  runMonteCarlo,
} from "../src/finance.js";

test("all model portfolios sum to 100%", () => {
  for (const weights of Object.values(PRESETS)) {
    assert.equal(weights.reduce((sum, weight) => sum + weight, 0), 100);
    assert.equal(weights.length, ASSETS.length);
  }
});

test("normalization handles arbitrary and zero allocations", () => {
  const normalized = normalizeWeights([10, 10, 10, 10, 10, 10, 10]);
  assert.ok(Math.abs(normalized.reduce((sum, weight) => sum + weight, 0) - 100) < 1e-9);
  assert.deepEqual(normalizeWeights([0, 0, 0, 0, 0, 0, 0]), [0, 0, 0, 0, 0, 0, 100]);
});

test("balanced portfolio metrics are finite and economically plausible", () => {
  const metrics = calculatePortfolioMetrics(PRESETS.Balanced, 0.035);
  assert.ok(metrics.expectedReturn > 0.04 && metrics.expectedReturn < 0.12);
  assert.ok(metrics.volatility > 0.03 && metrics.volatility < 0.2);
  assert.ok(Number.isFinite(metrics.sharpe));
  assert.ok(metrics.valueAtRisk >= 0);
  assert.ok(metrics.conditionalVaR >= metrics.valueAtRisk);
  assert.ok(metrics.diversificationScore >= 0 && metrics.diversificationScore <= 100);
});

test("scenario impact equals the sum of asset contributions", () => {
  const result = calculateScenario(PRESETS.Growth, "recession");
  const sum = result.contributions.reduce((total, value) => total + value, 0);
  assert.ok(Math.abs(result.impact - sum) < 1e-12);
  assert.ok(result.impact < 0);
});

test("Monte Carlo engine is reproducible and includes recurring contributions", () => {
  const options = { initialCapital: 1000, monthlyContribution: 200, years: 5, simulations: 250, seed: 42 };
  const first = runMonteCarlo(PRESETS.Balanced, options);
  const second = runMonteCarlo(PRESETS.Balanced, options);
  assert.deepEqual(first, second);
  assert.ok(first.low <= first.median && first.median <= first.high);
  assert.ok(first.median > 1000 + 200 * 60);
  assert.equal(first.paths.length, 6);
});
