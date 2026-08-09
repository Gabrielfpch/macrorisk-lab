export const ASSETS = [
  { id: "globalEquity", name: "Renta variable global", ticker: "ACWI", sleeve: "Growth", color: "#44f2b2", expectedReturn: 0.082, volatility: 0.165 },
  { id: "tech", name: "Tecnología USA", ticker: "QQQ", sleeve: "Growth", color: "#4da6ff", expectedReturn: 0.105, volatility: 0.235 },
  { id: "emerging", name: "Mercados emergentes", ticker: "EEM", sleeve: "Growth", color: "#7c6cff", expectedReturn: 0.09, volatility: 0.22 },
  { id: "bonds", name: "US Treasuries 7–10Y", ticker: "IEF", sleeve: "Defensive", color: "#b98cff", expectedReturn: 0.045, volatility: 0.075 },
  { id: "tips", name: "Inflation-linked bonds", ticker: "TIP", sleeve: "Real assets", color: "#ffd166", expectedReturn: 0.043, volatility: 0.065 },
  { id: "gold", name: "Oro", ticker: "GLD", sleeve: "Real assets", color: "#ff9c5a", expectedReturn: 0.055, volatility: 0.16 },
  { id: "reits", name: "Real Estate", ticker: "VNQ", sleeve: "Real assets", color: "#ff6f91", expectedReturn: 0.072, volatility: 0.19 },
  { id: "cash", name: "T-Bills", ticker: "SGOV", sleeve: "Defensive", color: "#8ca3a0", expectedReturn: 0.035, volatility: 0.012 },
];

export const CORRELATIONS = [
  [1.00, 0.82, 0.78, -0.12, 0.02, 0.06, 0.67, 0.02],
  [0.82, 1.00, 0.65, -0.18, -0.03, -0.02, 0.56, 0.01],
  [0.78, 0.65, 1.00, -0.08, 0.05, 0.12, 0.58, 0.01],
  [-0.12, -0.18, -0.08, 1.00, 0.72, 0.18, -0.08, 0.34],
  [0.02, -0.03, 0.05, 0.72, 1.00, 0.28, 0.02, 0.28],
  [0.06, -0.02, 0.12, 0.18, 0.28, 1.00, 0.12, 0.05],
  [0.67, 0.56, 0.58, -0.08, 0.02, 0.12, 1.00, 0.01],
  [0.02, 0.01, 0.01, 0.34, 0.28, 0.05, 0.01, 1.00],
];

export const FACTOR_LOADINGS = {
  Growth: [1.00, 0.95, 0.85, 0.15, 0.20, 0.25, 0.65, 0.05],
  "Inflation hedge": [0.25, 0.10, 0.35, 0.15, 0.90, 1.00, 0.70, 0.20],
  Defensive: [0.35, 0.15, 0.20, 0.95, 0.80, 0.75, 0.25, 1.00],
  Liquidity: [0.75, 0.85, 0.55, 0.80, 0.75, 0.90, 0.45, 1.00],
  Duration: [0.30, 0.55, 0.25, 1.00, 0.70, 0.10, 0.65, 0.05],
};

export const PRESETS = {
  "Core 60/40": [38, 12, 8, 24, 5, 5, 5, 3],
  Growth: [35, 32, 15, 5, 2, 3, 7, 1],
  "All Weather": [22, 8, 5, 25, 15, 12, 8, 5],
  "Inflation Hedge": [20, 8, 7, 8, 22, 18, 12, 5],
  "Capital Preservation": [12, 3, 3, 30, 15, 10, 2, 25],
};

export const SCENARIOS = [
  {
    id: "soft-landing",
    name: "Soft landing",
    description: "La inflación converge sin una contracción profunda. Los activos de riesgo avanzan y los bonos conservan carry positivo.",
    shocks: [0.10, 0.14, 0.09, 0.035, 0.04, 0.02, 0.07, 0.038],
    signal: "Growth resiliente",
    policy: "Easing gradual",
    probability: "Base case",
  },
  {
    id: "stagflation",
    name: "Stagflation",
    description: "La inflación se reacelera mientras el crecimiento pierde fuerza. Duration y múltiplos altos reciben el mayor golpe.",
    shocks: [-0.15, -0.22, -0.18, -0.13, 0.08, 0.15, -0.12, 0.045],
    signal: "Inflation ↑ / Growth ↓",
    policy: "Higher for longer",
    probability: "Tail risk",
  },
  {
    id: "recession",
    name: "Global recession",
    description: "La demanda se contrae con fuerza. Equities y Real Estate caen mientras Treasuries y activos defensivos amortiguan el shock.",
    shocks: [-0.27, -0.33, -0.31, 0.13, 0.04, 0.09, -0.23, 0.035],
    signal: "Growth shock",
    policy: "Emergency cuts",
    probability: "Stress case",
  },
  {
    id: "rate-cuts",
    name: "Aggressive rate cuts",
    description: "La desinflación permite recortes rápidos. Duration, Technology y Real Estate capturan la mayor convexidad positiva.",
    shocks: [0.08, 0.13, 0.09, 0.15, 0.08, 0.06, 0.14, 0.025],
    signal: "Disinflation",
    policy: "Fast easing",
    probability: "Bull case",
  },
  {
    id: "ai-boom",
    name: "AI productivity boom",
    description: "Una sorpresa de productividad eleva las expectativas de beneficios y expande las valuaciones de activos Growth.",
    shocks: [0.19, 0.36, 0.16, -0.04, -0.02, -0.05, 0.07, 0.038],
    signal: "Productivity ↑",
    policy: "Neutral bias",
    probability: "Upside case",
  },
  {
    id: "usd-shock",
    name: "USD liquidity shock",
    description: "Un flight-to-quality fortalece al dólar, comprime liquidez global y castiga especialmente a Emerging Markets y Real Estate.",
    shocks: [-0.14, -0.12, -0.28, 0.07, -0.03, 0.05, -0.16, 0.04],
    signal: "Liquidity ↓",
    policy: "Defensive USD",
    probability: "Liquidity risk",
  },
];

const round = (value, digits = 10) => Number(value.toFixed(digits));
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function normalizeWeights(weights) {
  const clean = ASSETS.map((_, index) => Math.max(0, Number(weights[index]) || 0));
  const total = clean.reduce((sum, weight) => sum + weight, 0);
  if (total <= Number.EPSILON) return clean.map((_, index) => (index === clean.length - 1 ? 100 : 0));

  const normalized = clean.map((weight) => round((weight / total) * 100, 1));
  const gap = round(100 - normalized.reduce((sum, weight) => sum + weight, 0), 1);
  const correctionIndex = normalized.indexOf(Math.max(...normalized));
  normalized[correctionIndex] = round(normalized[correctionIndex] + gap, 1);
  return normalized;
}

export function rebalanceWeight(weights, changedIndex, requestedValue) {
  const current = normalizeWeights(weights);
  const nextValue = round(clamp(Number(requestedValue) || 0, 0, 100), 1);
  const targetForOthers = round(100 - nextValue, 1);
  const result = [...current];
  result[changedIndex] = nextValue;

  const otherIndexes = result.map((_, index) => index).filter((index) => index !== changedIndex);
  const currentOtherTotal = otherIndexes.reduce((sum, index) => sum + current[index], 0);

  if (targetForOthers === 0) {
    otherIndexes.forEach((index) => { result[index] = 0; });
    return result;
  }

  if (currentOtherTotal <= Number.EPSILON) {
    otherIndexes.forEach((index) => { result[index] = 0; });
    const fallbackIndex = otherIndexes.includes(ASSETS.length - 1) ? ASSETS.length - 1 : otherIndexes[0];
    result[fallbackIndex] = targetForOthers;
    return result;
  }

  otherIndexes.forEach((index) => {
    result[index] = round((current[index] / currentOtherTotal) * targetForOthers, 1);
  });
  const gap = round(100 - result.reduce((sum, weight) => sum + weight, 0), 1);
  const correctionIndex = otherIndexes.reduce((best, index) => result[index] > result[best] ? index : best, otherIndexes[0]);
  result[correctionIndex] = round(result[correctionIndex] + gap, 1);
  return result;
}

export function getCovarianceMatrix() {
  return CORRELATIONS.map((row, rowIndex) => row.map((correlation, columnIndex) => (
    correlation * ASSETS[rowIndex].volatility * ASSETS[columnIndex].volatility
  )));
}

function normalCdf(value) {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * absolute);
  const coefficients = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  const polynomial = coefficients.reduceRight((accumulator, coefficient) => (accumulator * t) + coefficient, 0) * t;
  const erf = sign * (1 - polynomial * Math.exp(-(absolute ** 2)));
  return 0.5 * (1 + erf);
}

export function calculatePortfolioMetrics(weights, riskFreeRate = 0.035) {
  const percentages = normalizeWeights(weights);
  const normalized = percentages.map((weight) => weight / 100);
  const covariance = getCovarianceMatrix();
  const expectedReturn = normalized.reduce((sum, weight, index) => sum + weight * ASSETS[index].expectedReturn, 0);
  const covarianceTimesWeights = covariance.map((row) => row.reduce((sum, value, index) => sum + value * normalized[index], 0));
  const variance = normalized.reduce((sum, weight, index) => sum + weight * covarianceTimesWeights[index], 0);
  const volatility = Math.sqrt(Math.max(variance, 0));
  const sharpe = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;
  const valueAtRisk = Math.max(0, 1.644854 * volatility - expectedReturn);
  const conditionalVaR = Math.max(0, 2.062713 * volatility - expectedReturn);
  const standaloneRisk = normalized.reduce((sum, weight, index) => sum + weight * ASSETS[index].volatility, 0);
  const diversificationBenefit = standaloneRisk > 0 ? 1 - volatility / standaloneRisk : 0;
  const hhi = normalized.reduce((sum, weight) => sum + weight ** 2, 0);
  const effectiveAssets = hhi > 0 ? 1 / hhi : 0;
  const diversificationScore = clamp((diversificationBenefit * 0.52 + ((effectiveAssets - 1) / (ASSETS.length - 1)) * 0.48) * 100, 0, 100);
  const riskContributions = normalized.map((weight, index) => variance > 0 ? (weight * covarianceTimesWeights[index]) / variance : 0);
  const marginalRisk = covarianceTimesWeights.map((value) => volatility > 0 ? value / volatility : 0);
  const globalVariance = covariance[0][0];
  const beta = globalVariance > 0 ? normalized.reduce((sum, weight, index) => sum + weight * covariance[index][0], 0) / globalVariance : 0;
  const probabilityOfLoss = volatility > 0 ? normalCdf(-expectedReturn / volatility) : 0;
  const stressDrawdown = clamp(1.75 * volatility - 0.25 * expectedReturn, 0, 0.75);

  return {
    weights: percentages,
    expectedReturn,
    volatility,
    sharpe,
    valueAtRisk,
    conditionalVaR,
    diversificationScore,
    diversificationBenefit,
    effectiveAssets,
    hhi,
    beta,
    probabilityOfLoss,
    stressDrawdown,
    riskContributions,
    marginalRisk,
  };
}

export function calculateScenario(weights, scenarioId) {
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0];
  const normalized = normalizeWeights(weights).map((weight) => weight / 100);
  const contributions = normalized.map((weight, index) => weight * scenario.shocks[index]);
  const impact = contributions.reduce((sum, contribution) => sum + contribution, 0);
  return { scenario, contributions, impact };
}

export function calculateFactorExposures(weights) {
  const normalized = normalizeWeights(weights).map((weight) => weight / 100);
  return Object.entries(FACTOR_LOADINGS).map(([name, loadings]) => ({
    name,
    value: loadings.reduce((sum, loading, index) => sum + loading * normalized[index], 0),
  }));
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

export function generateEfficientFrontier(riskFreeRate = 0.035, options = {}) {
  const { samples = 900, seed = 20260808 } = options;
  const random = mulberry32(seed);
  const points = [];

  for (let sample = 0; sample < samples; sample += 1) {
    const raw = ASSETS.map(() => -Math.log(Math.max(random(), Number.EPSILON)));
    const total = raw.reduce((sum, value) => sum + value, 0);
    const weights = raw.map((value) => (value / total) * 100);
    const metrics = calculatePortfolioMetrics(weights, riskFreeRate);
    points.push({ weights: metrics.weights, return: metrics.expectedReturn, volatility: metrics.volatility, sharpe: metrics.sharpe });
  }

  const sorted = [...points].sort((a, b) => a.volatility - b.volatility || b.return - a.return);
  const frontier = [];
  let bestReturn = -Infinity;
  for (const point of sorted) {
    if (point.return > bestReturn + 0.00025) {
      frontier.push(point);
      bestReturn = point.return;
    }
  }

  const maxSharpe = points.reduce((best, point) => point.sharpe > best.sharpe ? point : best, points[0]);
  const minVolatility = points.reduce((best, point) => point.volatility < best.volatility ? point : best, points[0]);
  return { points, frontier, maxSharpe, minVolatility };
}

export function runMonteCarlo(weights, options = {}) {
  const {
    initialCapital = 1000,
    monthlyContribution = 200,
    goal = 100000,
    years = 10,
    simulations = 3000,
    seed = 83979427,
  } = options;
  const { expectedReturn, volatility } = calculatePortfolioMetrics(weights, 0);
  const safeYears = Math.max(1, Math.round(years));
  const months = safeYears * 12;
  const monthlyDrift = (expectedReturn - 0.5 * volatility ** 2) / 12;
  const monthlyVolatility = volatility / Math.sqrt(12);
  const random = mulberry32(seed);
  const terminalValues = [];
  const checkpoints = Array.from({ length: safeYears + 1 }, () => []);
  const investedCapital = Math.max(0, initialCapital) + Math.max(0, monthlyContribution) * months;

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
      low: percentile(values, 0.10),
      median: percentile(values, 0.50),
      high: percentile(values, 0.90),
    };
  });

  return {
    low: percentile(terminalValues, 0.10),
    median: percentile(terminalValues, 0.50),
    high: percentile(terminalValues, 0.90),
    goalProbability: terminalValues.filter((value) => value >= goal).length / simulations,
    capitalLossProbability: terminalValues.filter((value) => value < investedCapital).length / simulations,
    investedCapital,
    paths,
  };
}

export function classifyPortfolio(metrics) {
  if (metrics.volatility >= 0.16 || metrics.beta >= 1.05) return { label: "Aggressive Growth", tone: "high" };
  if (metrics.volatility >= 0.115 || metrics.beta >= 0.78) return { label: "Moderado dinámico", tone: "medium" };
  if (metrics.volatility >= 0.07) return { label: "Balanced", tone: "balanced" };
  return { label: "Capital Preservation", tone: "low" };
}

export function getPortfolioInsights(weights, metrics) {
  const ranked = metrics.weights.map((weight, index) => ({ weight, asset: ASSETS[index], risk: metrics.riskContributions[index] })).sort((a, b) => b.weight - a.weight);
  const riskRanked = [...ranked].sort((a, b) => b.risk - a.risk);
  const growthWeight = metrics.weights[0] + metrics.weights[1] + metrics.weights[2] + metrics.weights[6];
  const defensiveWeight = metrics.weights[3] + metrics.weights[4] + metrics.weights[5] + metrics.weights[7];
  const insights = [];

  insights.push(`<strong>${ranked[0].asset.ticker}</strong> concentra ${ranked[0].weight.toFixed(1)}% del capital, mientras <strong>${riskRanked[0].asset.ticker}</strong> explica ${(riskRanked[0].risk * 100).toFixed(1)}% del riesgo total.`);
  if (riskRanked[0].risk - riskRanked[0].weight / 100 > 0.12) insights.push(`<strong>Risk budget desalineado:</strong> ${riskRanked[0].asset.name} aporta bastante más riesgo que capital. El portafolio parece más diversificado de lo que realmente está.`);
  else insights.push(`<strong>Risk budget razonable:</strong> ninguna posición domina de forma extrema el riesgo frente a su peso de capital.`);

  if (growthWeight >= 68) insights.push(`<strong>Alta sensibilidad a Growth:</strong> ${growthWeight.toFixed(1)}% está en activos ligados al ciclo y a expansión de múltiplos.`);
  else if (defensiveWeight >= 62) insights.push(`<strong>Sesgo defensivo:</strong> ${defensiveWeight.toFixed(1)}% está en Treasuries, TIPS, Gold o T-Bills.`);
  else insights.push(`<strong>Arquitectura balanceada:</strong> Growth y activos defensivos conviven sin que un solo sleeve supere ampliamente al otro.`);

  insights.push(`<strong>Lectura de eficiencia:</strong> Sharpe Ratio de ${metrics.sharpe.toFixed(2)}, beta de ${metrics.beta.toFixed(2)} y ${(metrics.probabilityOfLoss * 100).toFixed(1)}% de probabilidad paramétrica de retorno anual negativo.`);
  return insights;
}
