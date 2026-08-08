# MacroRisk Lab

**Interactive portfolio risk, macro scenario, and Monte Carlo simulator.**

MacroRisk Lab turns a portfolio allocation into a transparent risk dashboard. It combines modern portfolio theory, parametric tail-risk measures, hypothetical macroeconomic shocks, and a seeded long-term simulation in a zero-dependency web application.

## Why this project

Most portfolio calculators show only historical returns or a single optimistic forecast. MacroRisk Lab is designed around a more useful question: **what can go wrong, what drives the result, and how wide is the range of possible outcomes?**

## Features

- Custom allocation across seven asset classes
- Balanced, growth, defensive, and inflation-hedged model portfolios
- Expected return and covariance-based portfolio volatility
- Sharpe ratio, 95% Value at Risk, and 95% Conditional Value at Risk
- Diversification score based on effective positions and correlation benefit
- Five transparent macroeconomic stress scenarios
- Contribution analysis showing which assets drive each scenario result
- Reproducible 2,000-path Monte Carlo projection with monthly contributions
- Responsive interface with no frameworks, APIs, trackers, or paid services
- Automated unit tests using Node's built-in test runner

## Asset universe

| Asset class | Proxy | Portfolio role |
|---|---|---|
| Global equity | ACWI | Broad growth exposure |
| US technology | QQQ | High-growth and duration-sensitive equity |
| Treasury bonds | IEF | Duration and recession hedge |
| Inflation-linked bonds | TIPS | Inflation protection |
| Gold | GLD | Crisis and inflation diversifier |
| Global REITs | REIT | Real assets and income |
| Short Treasury | SGOV | Liquidity and capital stability |

## Run locally

No build step or dependencies are required.

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Validate the model

Node.js 20 or newer is recommended.

```bash
npm test
npm run check
```

## Model overview

Expected portfolio return is calculated as the weighted average of asset assumptions. Volatility is calculated from a seven-asset covariance matrix. Parametric VaR and CVaR use a 95% normal approximation. Scenario results are the weighted sum of explicit asset-level shocks. Long-term outcomes use monthly lognormal returns, recurring contributions, and a fixed seed so results remain reproducible.

All assumptions are stored in [`src/finance.js`](src/finance.js) and can be audited or changed.

## Project structure

```text
.
├── index.html              # Semantic application interface
├── styles.css              # Responsive visual system
├── app.js                  # UI rendering and interaction
├── src/finance.js          # Financial model and simulation engine
├── tests/finance.test.mjs  # Unit tests for model behavior
└── package.json            # Validation commands
```

## Built by

**Gabriel Pérez Chávez** — Economics student at Pontificia Universidad Católica del Perú (PUCP), interested in finance, investments, and automation.

## Disclaimer

This project is for educational and portfolio-demonstration purposes. Assumptions are illustrative, not live forecasts, and the outputs do not constitute investment advice.
