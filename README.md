# MacroRisk Lab

> **El riesgo no se adivina. Se modela.**

MacroRisk Lab es una experiencia interactiva de `Portfolio Intelligence` para construir, diagnosticar y someter un portfolio multi-asset a distintas condiciones de mercado. La interfaz está en español y conserva el lenguaje técnico de finanzas en inglés.

[![Model checks](https://github.com/Gabrielfpch/macrorisk-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/Gabrielfpch/macrorisk-lab/actions/workflows/ci.yml)
[![GitHub Pages](https://img.shields.io/badge/live-GitHub%20Pages-b8ff3d?style=flat-square&labelColor=07100d)](https://gabrielfpch.github.io/macrorisk-lab/)
[![Vanilla JS](https://img.shields.io/badge/stack-Vanilla%20JS-4da6ff?style=flat-square&labelColor=07100d)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## Qué hace diferente a este proyecto

- Mantiene la asignación bloqueada en **100% long-only**. Si un peso sube, los demás se rebalancean proporcionalmente.
- Modela ocho asset classes con una matriz de **correlation 8×8** y una matriz de covarianzas completa.
- Calcula `Expected return`, `Volatility`, `Sharpe Ratio`, `Portfolio Beta`, `VaR`, `CVaR` y probabilidad paramétrica de pérdida.
- Traza una `Efficient Frontier` reproducible y marca `Max Sharpe`, `Minimum Volatility` y el portfolio actual.
- Separa `Capital allocation` de `Risk contribution` usando `Euler decomposition`.
- Expone sensibilidad a cinco macro factors: `Growth`, `Inflation hedge`, `Defensive`, `Liquidity` y `Duration`.
- Ejecuta seis `Macro Stress Tests`, desde `Soft landing` hasta `Stagflation` y `USD liquidity shock`.
- Simula 3,000 trayectorias `Monte Carlo`, percentiles P10/P50/P90 y probabilidad de alcanzar una meta.
- Genera un `Investment Committee Memo` dinámico y permite exportar un snapshot en CSV.

## Universo de inversión

| Ticker | Asset class | Sleeve |
|---|---|---|
| ACWI | Renta variable global | Growth |
| QQQ | Tecnología USA | Growth |
| EEM | Mercados emergentes | Growth |
| IEF | US Treasuries 7–10Y | Defensive |
| TIP | Inflation-linked bonds | Real assets |
| GLD | Oro | Real assets |
| VNQ | Real Estate | Real assets |
| SGOV | T-Bills | Defensive |

## Metodología

El motor utiliza supuestos declarados en [`src/finance.js`](src/finance.js). No hay llamadas a APIs, datos ocultos ni resultados aleatorios imposibles de reproducir.

| Capa | Modelo |
|---|---|
| Expected return | $\mu_p = w^{\mathsf T}\mu$ |
| Portfolio volatility | $\sigma_p = \sqrt{w^{\mathsf T}\Sigma w}$ |
| Sharpe Ratio | $(\mu_p-r_f)/\sigma_p$ |
| Risk contribution | $RC_i = w_i(\Sigma w)_i/\sigma_p^2$ |
| Parametric VaR 95% | $\max(0, 1.644854\sigma_p-\mu_p)$ |
| CVaR 95% | $\max(0, 2.062713\sigma_p-\mu_p)$ |
| Monte Carlo | Geometric returns con aportes mensuales y seed fijo |

La `Efficient Frontier` se aproxima con portfolios long-only generados mediante muestreo de Dirichlet. Los resultados son determinísticos gracias a un pseudorandom generator con seed fijo.

## Ejecutar localmente

```bash
npm ci
npm test
npm run check
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Validación

La suite automatizada comprueba:

1. que todos los model portfolios sumen exactamente 100%;
2. que la correlation matrix sea simétrica, válida y tenga diagonal unitaria;
3. que el rebalanceo no permita sobreasignar capital;
4. que las risk contributions sumen 100%;
5. que la Efficient Frontier produzca portfolios long-only;
6. que Monte Carlo sea reproducible y reporte probabilidades válidas.

GitHub Actions ejecuta los tests y el syntax check en cada `push` y `pull request`.

## Alcance

Esta es una herramienta educativa y de demostración. Los supuestos son ilustrativos, no utilizan precios en tiempo real y no constituyen asesoría ni recomendación de inversión.

---

Diseñado y desarrollado por **Gabriel Pérez**.
