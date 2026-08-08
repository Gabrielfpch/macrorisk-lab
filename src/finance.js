export const ASSETS = [
  { id: "globalEquity", name: "Global Equity", ticker: "ACWI", color: "#60f5bd", expectedReturn: 0.085, volatility: 0.17 },
  { id: "tech", name: "US Technology", ticker: "QQQ", color: "#6eb5ff", expectedReturn: 0.105, volatility: 0.235 },
  { id: "bonds", name: "Treasury Bonds", ticker: "IEF", color: "#b58cff", expectedReturn: 0.045, volatility: 0.075 },
  { id: "tips", name: "Inflation Bonds", ticker: "TIPS", color: "#ffcf62", expectedReturn: 0.043, volatility: 0.065 },
  { id: "gold", name: "Gold", ticker: "GLD", color: "#ff9b64", expectedReturn: 0.055, volatility: 0.16 },
  { id: "reits", name: "Global REITs", ticker: "REIT", color: "#ff6f9f", expectedReturn: 0.07, volatility: 0.19 },
  { id: "cash", name: "Short Treasury", ticker: "SGOV", color: "#8aa59d", expectedReturn: 0.035, volatility: 0.012 },
];

export const CORRELATIONS = [
  [1.00, 0.82, -0.12, 0.02, 0.06, 0.67, 0.02],
  [0.82, 1.00, -0.18, -0.03, -0.02, 0.56, 0.01],
  [-0.12, -0.18, 1.00, 0.72, 0.18, -0.08, 0.34],
  [0.02, -0.03, 0.72, 1.00, 0.28, 0.02, 0.28],
  [0.06, -0.02, 0.18, 0.28, 1.00, 0.12, 0.05],
  [0.67, 0.56, -0.08, 0.02, 0.12, 1.00, 0.01],
  [0.02, 0.01, 0.34, 0.28, 0.05, 0.01, 1.00],
];

export const PRESETS = {
  Balanced: [35, 15, 20, 10, 8, 7, 5],
  Growth: [43, 32, 5, 3, 5, 10, 2],
  Defensive: [20, 5, 30, 15, 12, 3, 15],
  "Inflation shield": [25, 10, 10, 20, 18, 12, 5],
};

export const SCENARIOS = [
  {
    id: "soft-landing",
    name: "Soft landing",
    description: "Inflation cools without a deep contraction. Risk assets advance while bond returns remain positive.",
    shocks: [0.10, 0.14, 0.035, 0.04, 0.02, 0.07, 0.038],
    signal: "Growth resilient",
    policy: "Gradual easing",
  },
  {
    id: "inflation-shock",
    name: "Inflation resurgence",
    description: "Price pressures reaccelerate and yields rise. Duration and high-multiple assets absorb the largest shock.",
    shocks: [-0.12, -0.18, -0.15, 0.06, 0.12, -0.08, 0.042],
    signal: "Inflation up",
    policy: "Rates higher",
  },
  {
    id: "recession",
    name: "Global recession",
    description: "Demand contracts sharply. Equities and real estate fall while sovereign bonds and defensive assets rally.",
    shocks: [-0.25, -0.30, 0.12, 0.04, 0.08, -0.20, 0.035],
    signal: "Growth shock",
    policy: "Emergency cuts",
  },
  {
    id: "rate-cuts",
    name: "Aggressive rate cuts",
    description: "Disinflation gives central banks room to ease quickly, supporting duration-sensitive assets and real estate.",
    shocks: [0.08, 0.12, 0.15, 0.08, 0.06, 0.14, 0.025],
    signal: "Disinflation",
    policy: "Fast easing",
  },
  {
    id: "ai-boom",
    name: "AI productivity boom",
    description: "A technology-led productivity surprise drives earnings expectations and expands growth-asset valuations.",
    shocks: [0.18, 0.35, -0.04, -0.02, -0.05, 0.06, 0.038],
    signal: "Productivity up",
    policy: "Neutral",
  },
];

export function normalizeWeights(weights) {
  const clean = weights.map((weight) => Math.max(0, Number(weight) || 0));
  const total = clean.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) return clean.map((_, index) => (index === clean.length - 1 ? 100 : 0));
  const normalized = clean.map((weight) => (weight / total) * 100);
  const roundingGap = 100 - normalized.reduce((sum, weight) => sum + weight, 0);
  normalized[normalized.length - 1] += roundingGap;
  return normalized;
}

export function calculatePortfolioMetrics(weights, riskFreeRate = 0.035) {
  const normalized = normalizeWeights(weights).map((weight) => weight / 100);
  const expectedReturn = normalized.reduce((sum, weight, index) => sum + weight * ASSETS[index].expectedReturn, 0);

  let variance = 0;
  for (let i = 0; i < ASSETS.length; i += 1) {
    for (let j = 0; j < ASSETS.length; j += 1) {
      variance += normalized[i] * normalized[j] * ASSETS[i].volatility * ASSETS[j].volatility * CORRELATIONS[i][j];
    }
  }

  const volatility = Math.sqrt(Math.max(variance, 0));
  const sharpe = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;
  const valueAtRisk = Math.max(0, 1.644854 * volatility - expectedReturn);
  const conditionalVaR = Math.max(0, 2.062713 * volatility - expectedReturn);
  const standaloneRisk = normalized.reduce((sum, weight, index) => sum + weight * ASSETS[index].volatility, 0);
  const diversificationBenefit = standaloneRisk > 0 ? 1 - volatility / standaloneRisk : 0;
  const effectiveAssets = 1 / normalized.reduce((sum, weight) => sum + weight ** 2, 0);
  const diversificationScore = Math.max(0, Math.min(100, (diversificationBenefit * 0.55 + (effectiveAssets - 1) / 6 * 0.45) * 100));

  return { expectedReturn, volatility, sharpe, valueAtRisk, conditionalVaR, diversificationScore, effectiveAssets };
}

export function calculateScenario(weights, scenarioId) {
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0];
  const normalized = normalizeWeights(weights).map((weight) => weight / 100);
  const contributions = normalized.map((weight, index) => weight * scenario.shocks[index]);
  const impact = contributions.reduce((sum, contribution) => sum + contribution, 0);
  return { scenario, contributions, impact };
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function standardNormal(random) {
  const u = Math.max(random(), Number.EPSILON);
  const v = Math.max(random(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function percentile(sortedValues, probability) {
  const index = (sortedValues.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
}

export function runMonteCarlo(weights, options = {}) {
  const {
    initialCapital = 1000,
    monthlyContribution = 200,
    years = 10,
    simulations = 2000,
    seed = 83979427,
  } = options;
  const { expectedReturn, volatility } = calculatePortfolioMetrics(weights, 0);
  const months = Math.max(1, Math.round(years * 12));
  const monthlyDrift = (expectedReturn - 0.5 * volatility ** 2) / 12;
  const monthlyVolatility = volatility / Math.sqrt(12);
  const random = mulberry32(seed);
  const terminalValues = [];
  const checkpoints = Array.from({ length: years + 1 }, () => []);

  for (let simulation = 0; simulation < simulations; simulation += 1) {
    let value = Math.max(0, initialCapital);
    checkpoints[0].push(value);
    for (let month = 1; month <= months; month += 1) {
      const monthlyReturn = Math.exp(monthlyDrift + monthlyVolatility * standardNormal(random)) - 1;
      value = Math.max(0, value * (1 + monthlyReturn) + Math.max(0, monthlyContribution));
      if (month % 12 === 0) checkpoints[month / 12].push(value);
    }
    terminalValues.push(value);
  }

  terminalValues.sort((a, b) => a - b);
  const paths = checkpoints.map((values, year) => {
    values.sort((a, b) => a - b);
    return {
      year,
      low: percentile(values, 0.1),
      median: percentile(values, 0.5),
      high: percentile(values, 0.9),
    };
  });

  return {
    low: percentile(terminalValues, 0.1),
    median: percentile(terminalValues, 0.5),
    high: percentile(terminalValues, 0.9),
    paths,
  };
}

export function getPortfolioInsights(weights, metrics) {
  const normalized = normalizeWeights(weights);
  const ranked = normalized.map((weight, index) => ({ weight, asset: ASSETS[index] })).sort((a, b) => b.weight - a.weight);
  const equityWeight = normalized[0] + normalized[1] + normalized[5];
  const defensiveWeight = normalized[2] + normalized[3] + normalized[4] + normalized[6];
  const insights = [];

  insights.push(`<strong>${ranked[0].asset.name}</strong> is the largest allocation at ${ranked[0].weight.toFixed(1)}%, so it is the portfolio's main source of both return and concentration risk.`);
  if (equityWeight >= 65) insights.push(`<strong>Growth sensitivity is high.</strong> ${equityWeight.toFixed(1)}% is allocated to equity-like assets, which can improve upside but deepens recession losses.`);
  else if (defensiveWeight >= 60) insights.push(`<strong>Capital preservation dominates.</strong> ${defensiveWeight.toFixed(1)}% sits in bonds, inflation hedges, gold, or cash, reducing expected volatility.`);
  else insights.push(`<strong>The risk mix is balanced.</strong> Growth exposure is paired with ${defensiveWeight.toFixed(1)}% in defensive or diversifying assets.`);

  if (metrics.diversificationScore >= 60) insights.push(`<strong>Diversification is doing useful work.</strong> Cross-asset correlations reduce total volatility versus a simple weighted average of standalone risk.`);
  else insights.push(`<strong>Diversification can improve.</strong> Concentration or correlated growth exposures are limiting the risk reduction from adding more positions.`);

  return insights;
}
