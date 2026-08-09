import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSETS,
  CORRELATIONS,
  PRESETS,
  calculateFactorExposures,
  calculatePortfolioMetrics,
  calculateScenario,
  generateEfficientFrontier,
  normalizeWeights,
  rebalanceWeight,
  runMonteCarlo,
} from "../src/finance.js";

const total = (weights) => weights.reduce((sum, weight) => sum + weight, 0);

test("todos los model portfolios asignan exactamente 100%", () => {
  for (const weights of Object.values(PRESETS)) {
    assert.equal(total(weights), 100);
    assert.equal(weights.length, ASSETS.length);
  }
});

test("la matriz de correlaciones es válida, simétrica y tiene diagonal unitaria", () => {
  assert.equal(CORRELATIONS.length, ASSETS.length);
  for (let row = 0; row < CORRELATIONS.length; row += 1) {
    assert.equal(CORRELATIONS[row].length, ASSETS.length);
    assert.equal(CORRELATIONS[row][row], 1);
    for (let column = 0; column < CORRELATIONS.length; column += 1) {
      assert.ok(CORRELATIONS[row][column] >= -1 && CORRELATIONS[row][column] <= 1);
      assert.equal(CORRELATIONS[row][column], CORRELATIONS[column][row]);
    }
  }
});

test("normalizeWeights siempre devuelve una asignación de 100%", () => {
  const normalized = normalizeWeights([10, 10, 10, 10, 10, 10, 10, 10]);
  assert.ok(Math.abs(total(normalized) - 100) < 1e-9);
  assert.deepEqual(normalizeWeights(Array(ASSETS.length).fill(0)), [0, 0, 0, 0, 0, 0, 0, 100]);
});

test("rebalanceWeight impide exceder 100% y conserva el peso solicitado", () => {
  const increased = rebalanceWeight(PRESETS["Core 60/40"], 1, 70);
  assert.ok(Math.abs(total(increased) - 100) < 1e-9);
  assert.equal(increased[1], 70);
  assert.ok(increased.every((weight) => weight >= 0 && weight <= 100));

  const clamped = rebalanceWeight(increased, 0, 180);
  assert.ok(Math.abs(total(clamped) - 100) < 1e-9);
  assert.equal(clamped[0], 100);
  assert.equal(clamped.slice(1).every((weight) => weight === 0), true);
});

test("las contribuciones al riesgo suman 100%", () => {
  const metrics = calculatePortfolioMetrics(PRESETS["All Weather"], 0.035);
  assert.ok(Math.abs(metrics.riskContributions.reduce((sum, value) => sum + value, 0) - 1) < 1e-9);
  assert.ok(metrics.expectedReturn > 0.03 && metrics.expectedReturn < 0.12);
  assert.ok(metrics.volatility > 0 && metrics.volatility < 0.25);
  assert.ok(metrics.conditionalVaR >= metrics.valueAtRisk);
  assert.ok(metrics.diversificationScore >= 0 && metrics.diversificationScore <= 100);
  assert.ok(Number.isFinite(metrics.beta));
});

test("los factores macro permanecen entre cero y uno", () => {
  const factors = calculateFactorExposures(PRESETS["Inflation Hedge"]);
  assert.equal(factors.length, 5);
  assert.ok(factors.every(({ value }) => value >= 0 && value <= 1));
});

test("el impacto de escenario coincide con la suma de contribuciones", () => {
  const result = calculateScenario(PRESETS.Growth, "recession");
  const contributionTotal = result.contributions.reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(result.impact - contributionTotal) < 1e-12);
  assert.ok(result.impact < 0);
});

test("la efficient frontier genera portafolios long-only de 100%", () => {
  const frontier = generateEfficientFrontier(0.035, { samples: 120, seed: 7 });
  assert.equal(frontier.points.length, 120);
  assert.ok(frontier.frontier.length > 1);
  assert.ok(frontier.points.every((point) => Math.abs(total(point.weights) - 100) < 1e-9));
  assert.ok(frontier.maxSharpe.sharpe >= frontier.minVolatility.sharpe);
});

test("Monte Carlo es reproducible e informa probabilidades válidas", () => {
  const options = { initialCapital: 1000, monthlyContribution: 200, goal: 20000, years: 5, simulations: 300, seed: 42 };
  const first = runMonteCarlo(PRESETS["Core 60/40"], options);
  const second = runMonteCarlo(PRESETS["Core 60/40"], options);
  assert.deepEqual(first, second);
  assert.ok(first.low <= first.median && first.median <= first.high);
  assert.ok(first.goalProbability >= 0 && first.goalProbability <= 1);
  assert.ok(first.capitalLossProbability >= 0 && first.capitalLossProbability <= 1);
  assert.equal(first.paths.length, 6);
});
