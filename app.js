import {
  ASSETS,
  CORRELATIONS,
  PRESETS,
  SCENARIOS,
  calculateFactorExposures,
  calculatePortfolioMetrics,
  calculateScenario,
  classifyPortfolio,
  generateEfficientFrontier,
  getPortfolioInsights,
  rebalanceWeight,
  runMonteCarlo,
} from "./src/finance.js";

const state = {
  weights: [...PRESETS["Core 60/40"]],
  preset: "Core 60/40",
  scenarioId: SCENARIOS[0].id,
};

const $ = (id) => document.getElementById(id);
const formatPercent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
const formatWeight = (value) => `${Number(value).toFixed(1)}%`;
const formatMoney = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const formatCompactMoney = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

let frontierData = generateEfficientFrontier(0.035);
let projectionTimer;
let latestMetrics = calculatePortfolioMetrics(state.weights, 0.035);

function renderPresetButtons() {
  $("presetButtons").innerHTML = Object.keys(PRESETS).map((name) => (
    `<button class="preset-button ${state.preset === name ? "active" : ""}" data-preset="${name}" type="button">${name}</button>`
  )).join("");

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      state.preset = button.dataset.preset;
      state.weights = [...PRESETS[state.preset]];
      renderPresetButtons();
      syncAssetControls();
      updateAnalytics({ projection: true });
    });
  });
}

function renderAssetControls() {
  $("assetControls").innerHTML = ASSETS.map((asset, index) => `
    <div class="asset-row">
      <div class="asset-identity">
        <i style="background:${asset.color}"></i>
        <strong>${asset.name}</strong>
        <small>${asset.ticker} · ${asset.sleeve}</small>
      </div>
      <div>
        <input type="range" min="0" max="100" step="0.5" value="${state.weights[index]}" data-weight-index="${index}" aria-label="Peso de ${asset.name}" />
        <div class="asset-assumptions"><b>μ</b> ${formatPercent(asset.expectedReturn)} · <b>σ</b> ${formatPercent(asset.volatility)}</div>
      </div>
      <output class="asset-value" data-weight-output="${index}">${formatWeight(state.weights[index])}</output>
    </div>
  `).join("");

  document.querySelectorAll("[data-weight-index]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.weightIndex);
      state.weights = rebalanceWeight(state.weights, index, Number(input.value));
      state.preset = "Custom";
      syncAssetControls();
      renderPresetButtons();
      updateAnalytics();
    });
  });
}

function syncAssetControls() {
  document.querySelectorAll("[data-weight-index]").forEach((input) => {
    const index = Number(input.dataset.weightIndex);
    input.value = state.weights[index];
  });
  document.querySelectorAll("[data-weight-output]").forEach((output) => {
    output.textContent = formatWeight(state.weights[Number(output.dataset.weightOutput)]);
  });
  $("weightTotal").textContent = "100.0%";
}

function renderDonut() {
  const radius = 103;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = state.weights.map((weight, index) => {
    const length = circumference * weight / 100;
    const segment = `<circle class="donut-segment" cx="140" cy="140" r="${radius}" stroke="${ASSETS[index].color}" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 140 140)"><title>${ASSETS[index].ticker}: ${formatWeight(weight)}</title></circle>`;
    offset += length;
    return segment;
  }).join("");
  $("allocationDonut").innerHTML = `<circle cx="140" cy="140" r="${radius}" fill="none" stroke="rgba(255,255,255,.045)" stroke-width="25" />${segments}`;
  $("portfolioLabel").textContent = state.preset;
  $("allocationLegend").innerHTML = ASSETS.map((asset, index) => `
    <div class="legend-item"><i style="background:${asset.color}"></i><span>${asset.ticker}</span><strong>${formatWeight(state.weights[index])}</strong></div>
  `).join("");
}

function renderHeroSignal(metrics) {
  const width = 520;
  const height = 150;
  const padding = 8;
  const values = Array.from({ length: 42 }, (_, index) => (
    100 + index * metrics.expectedReturn * 6.8 + Math.sin(index * 0.72) * metrics.volatility * 105 + Math.cos(index * 0.21) * metrics.volatility * 55
  ));
  const minimum = Math.min(...values) - 2;
  const maximum = Math.max(...values) + 2;
  const x = (index) => padding + index / (values.length - 1) * (width - padding * 2);
  const y = (value) => height - padding - (value - minimum) / (maximum - minimum) * (height - padding * 2);
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  $("heroSignalChart").innerHTML = `
    <defs><linearGradient id="signalGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#b8ff3d" stop-opacity=".22"/><stop offset="100%" stop-color="#b8ff3d" stop-opacity="0"/></linearGradient></defs>
    ${[.25,.5,.75].map((tick) => `<line class="signal-grid" x1="0" x2="520" y1="${height * tick}" y2="${height * tick}"/>`).join("")}
    <polygon class="signal-area" points="8,142 ${points} 512,142" />
    <polyline class="signal-line" points="${points}" />
  `;
}

function renderMetrics(metrics) {
  $("expectedReturn").textContent = formatPercent(metrics.expectedReturn);
  $("volatility").textContent = formatPercent(metrics.volatility);
  $("sharpe").textContent = metrics.sharpe.toFixed(2);
  $("beta").textContent = metrics.beta.toFixed(2);
  $("valueAtRisk").textContent = formatPercent(metrics.valueAtRisk);
  $("conditionalVaR").textContent = formatPercent(metrics.conditionalVaR);
  $("lossProbability").textContent = formatPercent(metrics.probabilityOfLoss);
  $("stressDrawdown").textContent = formatPercent(metrics.stressDrawdown);
  $("diversification").textContent = `${metrics.diversificationScore.toFixed(0)}/100`;
  $("diversificationLabel").textContent = metrics.diversificationScore >= 65 ? "Arquitectura robusta entre asset classes." : metrics.diversificationScore >= 42 ? "Diversificación moderada; aún existe concentración." : "Los riesgos dominantes siguen muy correlacionados.";

  const profile = classifyPortfolio(metrics);
  $("heroProfile").textContent = profile.label;
  $("memoProfile").textContent = profile.label;
  $("heroSharpe").textContent = metrics.sharpe.toFixed(2);
  $("heroReturn").textContent = formatPercent(metrics.expectedReturn);
  $("heroVolatility").textContent = formatPercent(metrics.volatility);
  $("heroBeta").textContent = metrics.beta.toFixed(2);
  $("heroLoss").textContent = formatPercent(metrics.probabilityOfLoss);
  renderHeroSignal(metrics);
}

function renderCorrelationMatrix() {
  const header = ASSETS.map((asset) => `<th title="${asset.name}">${asset.ticker}</th>`).join("");
  const rows = CORRELATIONS.map((row, rowIndex) => `
    <tr>
      <th title="${ASSETS[rowIndex].name}">${ASSETS[rowIndex].ticker}</th>
      ${row.map((value, columnIndex) => {
        const magnitude = Math.abs(value);
        const background = value >= 0
          ? `rgba(68,242,178,${0.05 + magnitude * 0.67})`
          : `rgba(255,95,105,${0.08 + magnitude * 0.62})`;
        const textColor = magnitude > 0.72 ? "#07100d" : "#edf6f2";
        return `<td class="${rowIndex === columnIndex ? "diagonal" : ""}" style="background:${background};color:${textColor}" title="${ASSETS[rowIndex].ticker} vs ${ASSETS[columnIndex].ticker}: ${value.toFixed(2)}">${value.toFixed(2)}</td>`;
      }).join("")}
    </tr>
  `).join("");
  $("correlationMatrix").innerHTML = `<table class="correlation-table"><thead><tr><th>ρ</th>${header}</tr></thead><tbody>${rows}</tbody></table>`;

  const pairs = [];
  for (let row = 0; row < CORRELATIONS.length; row += 1) {
    for (let column = row + 1; column < CORRELATIONS.length; column += 1) {
      pairs.push({ row, column, value: CORRELATIONS[row][column] });
    }
  }
  const highest = pairs.reduce((best, pair) => pair.value > best.value ? pair : best, pairs[0]);
  const lowest = pairs.reduce((best, pair) => pair.value < best.value ? pair : best, pairs[0]);
  $("highestCorrelation").textContent = `${ASSETS[highest.row].ticker} ↔ ${ASSETS[highest.column].ticker}`;
  $("highestCorrelationText").textContent = `ρ = ${highest.value.toFixed(2)} · Riesgos que tienden a amplificarse juntos.`;
  $("bestDiversifier").textContent = `${ASSETS[lowest.row].ticker} ↔ ${ASSETS[lowest.column].ticker}`;
  $("bestDiversifierText").textContent = `ρ = ${lowest.value.toFixed(2)} · La relación más defensiva del universo modelado.`;
}

function renderFactorRadar() {
  const factors = calculateFactorExposures(state.weights);
  const centerX = 210;
  const centerY = 192;
  const radius = 126;
  const angle = (index) => -Math.PI / 2 + index * (2 * Math.PI / factors.length);
  const point = (index, value) => [
    centerX + Math.cos(angle(index)) * radius * value,
    centerY + Math.sin(angle(index)) * radius * value,
  ];
  const grid = [.25,.5,.75,1].map((level) => {
    const points = factors.map((_, index) => point(index, level).join(",")).join(" ");
    return `<polygon class="radar-grid" points="${points}"/>`;
  }).join("");
  const axes = factors.map((_, index) => {
    const [x,y] = point(index, 1);
    return `<line class="radar-axis" x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}"/>`;
  }).join("");
  const shapePoints = factors.map((factor, index) => point(index, factor.value).join(",")).join(" ");
  const dots = factors.map((factor, index) => {
    const [x,y] = point(index, factor.value);
    return `<circle class="radar-point" cx="${x}" cy="${y}" r="4"><title>${factor.name}: ${(factor.value * 100).toFixed(0)}/100</title></circle>`;
  }).join("");
  const labels = factors.map((factor, index) => {
    const labelRadius = 1.19;
    const [x,y] = point(index, labelRadius);
    const anchor = x < centerX - 8 ? "end" : x > centerX + 8 ? "start" : "middle";
    return `<text class="radar-label" x="${x}" y="${y}" text-anchor="${anchor}">${factor.name}</text>`;
  }).join("");
  $("factorRadar").innerHTML = `${grid}${axes}<polygon class="radar-shape" points="${shapePoints}"/>${dots}${labels}`;
}

function renderFrontier(metrics) {
  const svg = $("frontierChart");
  const width = 820;
  const height = 410;
  const padding = { left: 62, right: 24, top: 24, bottom: 48 };
  const allPoints = [...frontierData.points, { return: metrics.expectedReturn, volatility: metrics.volatility }];
  const xMin = Math.max(0, Math.min(...allPoints.map((point) => point.volatility)) * 0.78);
  const xMax = Math.max(...allPoints.map((point) => point.volatility)) * 1.08;
  const yMin = Math.min(...allPoints.map((point) => point.return)) - 0.006;
  const yMax = Math.max(...allPoints.map((point) => point.return)) + 0.006;
  const x = (value) => padding.left + (value - xMin) / (xMax - xMin) * (width - padding.left - padding.right);
  const y = (value) => height - padding.bottom - (value - yMin) / (yMax - yMin) * (height - padding.top - padding.bottom);
  const ticks = [0,.25,.5,.75,1];
  const grid = ticks.map((tick) => {
    const xValue = xMin + (xMax - xMin) * tick;
    const yValue = yMin + (yMax - yMin) * tick;
    return `<line class="chart-grid-line" x1="${x(xValue)}" x2="${x(xValue)}" y1="${padding.top}" y2="${height-padding.bottom}"/><text class="chart-axis-label" x="${x(xValue)}" y="${height-20}" text-anchor="middle">${formatPercent(xValue,0)}</text><line class="chart-grid-line" x1="${padding.left}" x2="${width-padding.right}" y1="${y(yValue)}" y2="${y(yValue)}"/><text class="chart-axis-label" x="${padding.left-10}" y="${y(yValue)+3}" text-anchor="end">${formatPercent(yValue,0)}</text>`;
  }).join("");
  const cloud = frontierData.points.filter((_, index) => index % 3 === 0).map((point) => `<circle class="cloud-point" cx="${x(point.volatility)}" cy="${y(point.return)}" r="2.1"/>`).join("");
  const frontierLine = frontierData.frontier.map((point) => `${x(point.volatility)},${y(point.return)}`).join(" ");
  const currentX = x(metrics.volatility);
  const currentY = y(metrics.expectedReturn);
  const optimal = frontierData.maxSharpe;
  const minimum = frontierData.minVolatility;
  svg.innerHTML = `
    ${grid}${cloud}
    <polyline class="frontier-line" points="${frontierLine}"/>
    <circle class="minvol-point" cx="${x(minimum.volatility)}" cy="${y(minimum.return)}" r="5"><title>Minimum volatility</title></circle>
    <rect class="optimal-point" x="${x(optimal.volatility)-5}" y="${y(optimal.return)-5}" width="10" height="10" transform="rotate(45 ${x(optimal.volatility)} ${y(optimal.return)})"><title>Max Sharpe</title></rect>
    <circle class="current-point" cx="${currentX}" cy="${currentY}" r="7"><title>Tu portfolio</title></circle>
    <text class="chart-axis-label" x="${width/2}" y="${height-4}" text-anchor="middle">VOLATILITY →</text>
    <text class="chart-axis-label" x="15" y="${height/2}" text-anchor="middle" transform="rotate(-90 15 ${height/2})">EXPECTED RETURN →</text>
  `;
  $("currentSharpe").textContent = metrics.sharpe.toFixed(2);
  $("maxSharpe").textContent = optimal.sharpe.toFixed(2);
  $("minVolatility").textContent = formatPercent(minimum.volatility);
}

function renderRiskBudget(metrics) {
  const riskPercentages = metrics.riskContributions.map((value) => value * 100);
  const maximum = Math.max(...state.weights, ...riskPercentages.map((value) => Math.max(0, value)), 1);
  $("riskBudgetChart").innerHTML = ASSETS.map((asset, index) => {
    const capital = state.weights[index];
    const risk = riskPercentages[index];
    const overBudget = risk - capital > 7;
    return `<div class="risk-row">
      <div class="risk-row-label"><i style="background:${asset.color}"></i><span>${asset.ticker}</span></div>
      <div class="risk-bars">
        <div class="risk-track"><i class="capital-bar" style="width:${capital/maximum*100}%"></i></div>
        <div class="risk-track"><i class="risk-bar ${overBudget ? "over-budget" : ""}" style="width:${Math.max(0,risk)/maximum*100}%"></i></div>
      </div>
      <div class="risk-values"><strong>${capital.toFixed(1)}%</strong><span>${risk.toFixed(1)}%</span></div>
    </div>`;
  }).join("");
  $("effectiveAssets").textContent = `${metrics.effectiveAssets.toFixed(1)} / ${ASSETS.length}`;
  $("hhi").textContent = metrics.hhi.toFixed(3);
  $("correlationBenefit").textContent = formatPercent(metrics.diversificationBenefit);

  const gaps = metrics.riskContributions.map((risk, index) => risk * 100 - state.weights[index]);
  const biggestGap = Math.max(...gaps);
  const index = gaps.indexOf(biggestGap);
  $("riskSignal").innerHTML = biggestGap > 10
    ? `<strong>${ASSETS[index].ticker} domina el risk budget.</strong> Aporta ${biggestGap.toFixed(1)} puntos porcentuales más de riesgo que de capital.`
    : `<strong>Risk budget controlado.</strong> Ningún activo excede de forma crítica su participación de capital.`;
}

function renderScenarioButtons() {
  $("scenarioButtons").innerHTML = SCENARIOS.map((scenario) => `
    <button class="scenario-button ${state.scenarioId === scenario.id ? "active" : ""}" data-scenario="${scenario.id}" type="button" role="tab" aria-selected="${state.scenarioId === scenario.id}">${scenario.name}</button>
  `).join("");
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
  $("scenarioProbability").textContent = scenario.probability;
  $("scenarioName").textContent = scenario.name;
  $("scenarioDescription").textContent = scenario.description;
  $("scenarioImpact").textContent = `${impact >= 0 ? "+" : ""}${formatPercent(impact)}`;
  $("scenarioImpact").style.color = impact >= 0 ? "var(--acid)" : "var(--red)";
  $("scenarioNotes").innerHTML = `<div><span>Macro signal</span><strong>${scenario.signal}</strong></div><div><span>Policy regime</span><strong>${scenario.policy}</strong></div>`;

  const maximum = Math.max(...contributions.map((value) => Math.abs(value)), 0.001);
  $("contributionChart").innerHTML = contributions.map((contribution, index) => {
    const width = Math.abs(contribution) / maximum * 48;
    return `<div class="contribution-row"><span>${ASSETS[index].ticker}</span><div class="contribution-track"><i class="contribution-fill ${contribution >= 0 ? "positive" : "negative"}" style="width:${width}%"></i></div><strong style="color:${contribution >= 0 ? "var(--mint)" : "var(--red)"}">${contribution >= 0 ? "+" : ""}${(contribution * 100).toFixed(1)}</strong></div>`;
  }).join("");
}

function drawProjectionChart(paths) {
  const svg = $("projectionChart");
  const width = 820;
  const height = 330;
  const padding = { left: 65, right: 18, top: 18, bottom: 38 };
  const maximum = Math.max(...paths.map((point) => point.high), 1);
  const x = (index) => padding.left + index / Math.max(paths.length - 1, 1) * (width - padding.left - padding.right);
  const y = (value) => height - padding.bottom - value / maximum * (height - padding.top - padding.bottom);
  const points = (key) => paths.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");
  const band = `${paths.map((point, index) => `${x(index)},${y(point.high)}`).join(" ")} ${[...paths].reverse().map((point, reverseIndex) => `${x(paths.length-reverseIndex-1)},${y(point.low)}`).join(" ")}`;
  const yTicks = [0,.25,.5,.75,1];
  const yearStep = Math.max(1, Math.ceil((paths.length - 1) / 5));
  const yearTicks = paths.filter((_, index) => index % yearStep === 0 || index === paths.length - 1);
  svg.innerHTML = `
    <defs><linearGradient id="projectionGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#b8ff3d" stop-opacity=".2"/><stop offset="100%" stop-color="#b8ff3d" stop-opacity="0"/></linearGradient></defs>
    ${yTicks.map((tick) => `<line class="chart-grid-line" x1="${padding.left}" x2="${width-padding.right}" y1="${y(maximum*tick)}" y2="${y(maximum*tick)}"/><text class="chart-axis-label" x="${padding.left-9}" y="${y(maximum*tick)+3}" text-anchor="end">${formatCompactMoney(maximum*tick)}</text>`).join("")}
    ${yearTicks.map((point) => `<text class="chart-axis-label" x="${x(point.year)}" y="${height-10}" text-anchor="middle">Y${point.year}</text>`).join("")}
    <polygon class="projection-band" points="${band}"/>
    <polygon class="projection-area" points="${padding.left},${height-padding.bottom} ${points("median")} ${x(paths.length-1)},${height-padding.bottom}"/>
    <polyline class="projection-line" points="${points("median")}"/>
  `;
}

function renderProjection() {
  const initialCapital = Math.max(0, Number($("initialCapital").value || 0));
  const monthlyContribution = Math.max(0, Number($("monthlyContribution").value || 0));
  const goal = Math.max(1, Number($("targetCapital").value || 1));
  const years = clamp(Math.round(Number($("horizonYears").value || 10)), 1, 30);
  const result = runMonteCarlo(state.weights, { initialCapital, monthlyContribution, goal, years });
  $("projectionLow").textContent = formatMoney(result.low);
  $("projectionMedian").textContent = formatMoney(result.median);
  $("projectionHigh").textContent = formatMoney(result.high);
  $("goalProbability").textContent = formatPercent(result.goalProbability, 0);
  $("capitalLossProbability").textContent = formatPercent(result.capitalLossProbability, 0);
  $("investedCapital").textContent = formatMoney(result.investedCapital);
  $("goalProbabilityBar").style.width = `${result.goalProbability * 100}%`;
  $("capitalLossProbabilityBar").style.width = `${result.capitalLossProbability * 100}%`;
  drawProjectionChart(result.paths);
}

function scheduleProjection() {
  clearTimeout(projectionTimer);
  projectionTimer = setTimeout(renderProjection, 120);
}

function renderInsights(metrics) {
  $("insightText").innerHTML = getPortfolioInsights(state.weights, metrics).map((insight) => `<p>${insight}</p>`).join("");
}

function updateAnalytics({ projection = false } = {}) {
  const riskFreeRate = clamp(Number($("riskFreeRate").value || 0) / 100, 0, 0.15);
  latestMetrics = calculatePortfolioMetrics(state.weights, riskFreeRate);
  renderDonut();
  renderMetrics(latestMetrics);
  renderFactorRadar();
  renderFrontier(latestMetrics);
  renderRiskBudget(latestMetrics);
  renderScenario();
  renderInsights(latestMetrics);
  if (projection) renderProjection(); else scheduleProjection();
}

function exportSnapshot() {
  const scenario = calculateScenario(state.weights, state.scenarioId);
  const rows = [
    ["MacroRisk Lab", "Portfolio Snapshot"],
    ["Risk profile", classifyPortfolio(latestMetrics).label],
    ["Expected return", formatPercent(latestMetrics.expectedReturn)],
    ["Volatility", formatPercent(latestMetrics.volatility)],
    ["Sharpe Ratio", latestMetrics.sharpe.toFixed(2)],
    ["Portfolio Beta", latestMetrics.beta.toFixed(2)],
    ["VaR 95%", formatPercent(latestMetrics.valueAtRisk)],
    ["CVaR 95%", formatPercent(latestMetrics.conditionalVaR)],
    ["Scenario", scenario.scenario.name],
    ["Scenario impact", formatPercent(scenario.impact)],
    [],
    ["Asset", "Ticker", "Capital weight", "Risk contribution"],
    ...ASSETS.map((asset, index) => [asset.name, asset.ticker, formatWeight(state.weights[index]), formatPercent(latestMetrics.riskContributions[index])]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "macrorisk-portfolio-snapshot.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  const button = $("exportButton");
  const original = button.textContent;
  button.textContent = "Snapshot exportado ✓";
  setTimeout(() => { button.textContent = original; }, 1800);
}

function renderAll() {
  renderPresetButtons();
  renderAssetControls();
  renderScenarioButtons();
  renderCorrelationMatrix();
  syncAssetControls();
  updateAnalytics({ projection: true });
}

$("riskFreeRate").addEventListener("input", () => {
  const riskFreeRate = clamp(Number($("riskFreeRate").value || 0) / 100, 0, 0.15);
  frontierData = generateEfficientFrontier(riskFreeRate);
  updateAnalytics();
});
["initialCapital", "monthlyContribution", "targetCapital", "horizonYears"].forEach((id) => $(id).addEventListener("input", scheduleProjection));
$("exportButton").addEventListener("click", exportSnapshot);

renderAll();
