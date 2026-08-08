import {
  ASSETS,
  PRESETS,
  SCENARIOS,
  calculatePortfolioMetrics,
  calculateScenario,
  getPortfolioInsights,
  normalizeWeights,
  runMonteCarlo,
} from "./src/finance.js";

const state = {
  weights: [...PRESETS.Balanced],
  preset: "Balanced",
  scenarioId: SCENARIOS[0].id,
};

const $ = (id) => document.getElementById(id);
const formatPercent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
const formatMoney = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function renderPresetButtons() {
  $("presetButtons").innerHTML = Object.keys(PRESETS).map((name) => `<button class="preset-button ${state.preset === name ? "active" : ""}" data-preset="${name}" type="button">${name}</button>`).join("");
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      state.preset = button.dataset.preset;
      state.weights = [...PRESETS[state.preset]];
      renderAll();
    });
  });
}

function renderAssetControls() {
  $("assetControls").innerHTML = ASSETS.map((asset, index) => `
    <label class="asset-row">
      <span class="asset-label"><i class="asset-color" style="background:${asset.color}"></i><span>${asset.name}</span></span>
      <input type="range" min="0" max="100" step="1" value="${state.weights[index]}" data-weight-index="${index}" aria-label="${asset.name} allocation" />
      <span class="asset-value">${state.weights[index].toFixed(1)}%</span>
    </label>
  `).join("");

  document.querySelectorAll("[data-weight-index]").forEach((input) => {
    input.addEventListener("input", () => {
      state.weights[Number(input.dataset.weightIndex)] = Number(input.value);
      state.preset = "Custom";
      input.closest(".asset-row").querySelector(".asset-value").textContent = `${Number(input.value).toFixed(1)}%`;
      updateDashboard();
      renderPresetButtons();
    });
  });
}

function renderDonut() {
  const weights = normalizeWeights(state.weights);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  $("allocationDonut").innerHTML = `<circle cx="120" cy="120" r="${radius}" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="23" />` + weights.map((weight, index) => {
    const length = circumference * weight / 100;
    const segment = `<circle class="donut-segment" cx="120" cy="120" r="${radius}" stroke="${ASSETS[index].color}" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 120 120)" />`;
    offset += length;
    return segment;
  }).join("");
  $("portfolioLabel").textContent = state.preset;
  $("allocationLegend").innerHTML = ASSETS.map((asset, index) => `<div class="legend-item"><i style="background:${asset.color}"></i><span>${asset.ticker}</span><strong>${weights[index].toFixed(1)}%</strong></div>`).join("");
}

function renderMetrics() {
  const riskFreeRate = Math.max(0, Number($("riskFreeRate").value || 0)) / 100;
  const metrics = calculatePortfolioMetrics(state.weights, riskFreeRate);
  $("expectedReturn").textContent = formatPercent(metrics.expectedReturn);
  $("volatility").textContent = formatPercent(metrics.volatility);
  $("sharpe").textContent = metrics.sharpe.toFixed(2);
  $("valueAtRisk").textContent = formatPercent(metrics.valueAtRisk);
  $("conditionalVaR").textContent = formatPercent(metrics.conditionalVaR);
  $("diversification").textContent = `${metrics.diversificationScore.toFixed(0)}/100`;
  $("diversificationLabel").textContent = metrics.diversificationScore >= 65 ? "Strong risk spreading" : metrics.diversificationScore >= 40 ? "Moderate risk spreading" : "Concentration remains";
  $("insightText").innerHTML = getPortfolioInsights(state.weights, metrics).map((text) => `<p>${text}</p>`).join("");
}

function renderScenarioButtons() {
  $("scenarioButtons").innerHTML = SCENARIOS.map((scenario) => `<button class="scenario-button ${state.scenarioId === scenario.id ? "active" : ""}" data-scenario="${scenario.id}" role="tab" aria-selected="${state.scenarioId === scenario.id}">${scenario.name}</button>`).join("");
  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      state.scenarioId = button.dataset.scenario;
      renderScenarioButtons();
      renderScenario();
    });
  });
}

function renderScenario() {
  const { scenario, contributions, impact } = calculateScenario(state.weights, state.scenarioId);
  $("scenarioCode").textContent = `SCENARIO ${String(SCENARIOS.indexOf(scenario) + 1).padStart(2, "0")}`;
  $("scenarioName").textContent = scenario.name;
  $("scenarioDescription").textContent = scenario.description;
  $("scenarioImpact").textContent = `${impact >= 0 ? "+" : ""}${formatPercent(impact)}`;
  $("scenarioImpact").style.color = impact >= 0 ? "var(--accent)" : "var(--danger)";
  $("scenarioNotes").innerHTML = `<div><span>Macro signal</span><strong>${scenario.signal}</strong></div><div><span>Policy response</span><strong>${scenario.policy}</strong></div>`;

  const maximum = Math.max(...contributions.map((value) => Math.abs(value)), 0.001);
  $("contributionChart").innerHTML = contributions.map((contribution, index) => {
    const width = Math.abs(contribution) / maximum * 48;
    return `<div class="bar-row"><span>${ASSETS[index].ticker}</span><div class="bar-track"><i class="bar-zero"></i><i class="bar-fill ${contribution >= 0 ? "positive" : "negative"}" style="width:${width}%"></i></div><strong style="color:${contribution >= 0 ? "var(--accent)" : "var(--danger)"}">${contribution >= 0 ? "+" : ""}${(contribution * 100).toFixed(1)}</strong></div>`;
  }).join("");
}

function renderProjection() {
  const initialCapital = Math.max(0, Number($("initialCapital").value || 0));
  const monthlyContribution = Math.max(0, Number($("monthlyContribution").value || 0));
  const years = Math.min(30, Math.max(1, Math.round(Number($("horizonYears").value || 10))));
  const result = runMonteCarlo(state.weights, { initialCapital, monthlyContribution, years });
  $("projectionLow").textContent = formatMoney(result.low);
  $("projectionMedian").textContent = formatMoney(result.median);
  $("projectionHigh").textContent = formatMoney(result.high);
  drawProjectionChart(result.paths);
}

function drawProjectionChart(paths) {
  const svg = $("projectionChart");
  const width = 760;
  const height = 280;
  const padding = { left: 56, right: 18, top: 16, bottom: 32 };
  const maximum = Math.max(...paths.map((point) => point.high), 1);
  const x = (index) => padding.left + index / Math.max(paths.length - 1, 1) * (width - padding.left - padding.right);
  const y = (value) => height - padding.bottom - value / maximum * (height - padding.top - padding.bottom);
  const points = (key) => paths.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");
  const band = `${paths.map((point, index) => `${x(index)},${y(point.high)}`).join(" ")} ${[...paths].reverse().map((point, reversedIndex) => `${x(paths.length - reversedIndex - 1)},${y(point.low)}`).join(" ")}`;
  const yTicks = [0, .25, .5, .75, 1];
  const yearStep = Math.max(1, Math.ceil((paths.length - 1) / 5));
  const yearTicks = paths.filter((_, index) => index % yearStep === 0 || index === paths.length - 1);

  svg.innerHTML = `
    <defs><linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#60f5bd" stop-opacity=".25"/><stop offset="100%" stop-color="#60f5bd" stop-opacity="0"/></linearGradient></defs>
    ${yTicks.map((tick) => `<line class="chart-grid" x1="${padding.left}" x2="${width - padding.right}" y1="${y(maximum * tick)}" y2="${y(maximum * tick)}"/><text class="chart-label" x="${padding.left - 10}" y="${y(maximum * tick) + 3}" text-anchor="end">${formatMoney(maximum * tick).replace("$", "$")}</text>`).join("")}
    ${yearTicks.map((point) => `<text class="chart-label" x="${x(point.year)}" y="${height - 8}" text-anchor="middle">Y${point.year}</text>`).join("")}
    <polygon class="chart-band" points="${band}" />
    <polygon class="chart-area" points="${padding.left},${height - padding.bottom} ${points("median")} ${x(paths.length - 1)},${height - padding.bottom}" />
    <polyline class="chart-line" points="${points("median")}" />
  `;
}

function updateDashboard() {
  const total = state.weights.reduce((sum, weight) => sum + weight, 0);
  $("weightTotal").textContent = `${total.toFixed(1)}%`;
  $("weightTotal").classList.toggle("invalid", Math.abs(total - 100) > 0.05);
  renderDonut();
  renderMetrics();
  renderScenario();
  renderProjection();
}

function renderAll() {
  renderPresetButtons();
  renderAssetControls();
  renderScenarioButtons();
  updateDashboard();
}

$("normalizeButton").addEventListener("click", () => {
  state.weights = normalizeWeights(state.weights);
  state.preset = "Custom";
  renderAll();
});

$("riskFreeRate").addEventListener("input", renderMetrics);
["initialCapital", "monthlyContribution", "horizonYears"].forEach((id) => $(id).addEventListener("input", renderProjection));

renderAll();
