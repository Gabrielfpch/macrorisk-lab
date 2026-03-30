#!/usr/bin/env python3
"""
===============================================================================
INVESTMENT PORTFOLIO BUILDER — Semana del 31 de Marzo 2026
Perfil: MODERADO (crecimiento con gestión de riesgo)
Regla: Solo acciones | Máximo 20% por acción
===============================================================================

Contexto de mercado (30 Mar 2026):
- S&P 500 retrocedió ~6% desde máximos históricos
- Conflicto Irán eleva precios del petróleo (>$99/barril)
- Sector Energía lidera 2026 (+20% YTD)
- Sector Defensa con fuertes vientos a favor (gasto militar récord $924.7B)
- Tecnología corrigió fuerte (-15% Nasdaq desde feb), creando oportunidades
- Oro cerca de $4,600 por tensiones geopolíticas
- Mercado ampliándose más allá de mega-cap tech

Estrategia: Diversificación sectorial, combinando acciones de crecimiento
a precios de descuento con defensivas de alta calidad y sectores con momentum.
===============================================================================
"""

import json
from datetime import datetime


# =============================================================================
# DATOS DEL PORTAFOLIO
# =============================================================================

PORTFOLIO_DATE = "2026-03-30"
PROFILE = "Moderado"
INVESTMENT_AMOUNT = 10000  # Monto base para cálculos (USD)

STOCKS = [
    {
        "ticker": "MSFT",
        "name": "Microsoft Corporation",
        "sector": "Tecnología",
        "price": 372.74,
        "allocation_pct": 15,
        "rationale": (
            "Líder en IA (Copilot/Azure) y cloud. Cotiza 31% debajo de máximos "
            "históricos ($539), ofreciendo punto de entrada atractivo. Forward P/E ~23x "
            "razonable para su perfil de crecimiento. Dividendo 0.95%."
        ),
        "risk_level": "Medio",
        "52w_high": 555.45,
        "52w_low": 344.79,
    },
    {
        "ticker": "AMZN",
        "name": "Amazon.com Inc.",
        "sector": "Tecnología / Consumo Discrecional",
        "price": 200.33,
        "allocation_pct": 12,
        "rationale": (
            "E-commerce + AWS (cloud #1). Cayó $58 desde máximos ($258.60). "
            "Market cap $2.14T. La corrección ofrece descuento en un negocio "
            "con crecimiento secular en cloud e IA."
        ),
        "risk_level": "Medio-Alto",
        "52w_high": 258.60,
        "52w_low": 169.21,
    },
    {
        "ticker": "RTX",
        "name": "RTX Corporation",
        "sector": "Defensa / Aeroespacial",
        "price": 189.71,
        "allocation_pct": 15,
        "rationale": (
            "Contrato reciente de $2.01B con la Fuerza Aérea de EE.UU. "
            "Beneficiario directo del conflicto con Irán y aumento de gasto "
            "en defensa ($924.7B). Analistas ven 15% de upside. "
            "Rating 'Overweight' en Morgan Stanley con target $235."
        ),
        "risk_level": "Medio",
        "52w_high": 214.50,
        "52w_low": 112.27,
    },
    {
        "ticker": "EOG",
        "name": "EOG Resources Inc.",
        "sector": "Energía",
        "price": 143.21,
        "allocation_pct": 13,
        "rationale": (
            "Productor de petróleo y gas con ventajas de costos (moat). "
            "Sector energía +20% YTD, liderando el mercado en 2026. "
            "Petróleo >$99/barril por conflicto Irán. Retorna >70% del FCF "
            "a accionistas. Cerca de máximos históricos. Consenso 'Buy'."
        ),
        "risk_level": "Medio",
        "52w_high": 143.73,
        "52w_low": 101.59,
    },
    {
        "ticker": "PG",
        "name": "Procter & Gamble Co.",
        "sector": "Consumo Defensivo",
        "price": 143.73,
        "allocation_pct": 12,
        "rationale": (
            "Ancla defensiva del portafolio. Marcas esenciales (Gillette, Tide, "
            "Pampers). Cayó 5.9% en 6 días — oportunidad de entrada. "
            "Analistas proyectan recuperación a $165-175 si consumo se mantiene. "
            "Dividendo creciente por décadas. Wide moat (Morningstar)."
        ),
        "risk_level": "Bajo",
        "52w_high": 174.80,
        "52w_low": 137.62,
    },
    {
        "ticker": "JPM",
        "name": "JPMorgan Chase & Co.",
        "sector": "Financiero",
        "price": 282.84,
        "allocation_pct": 13,
        "rationale": (
            "Banco más grande de EE.UU. con +18.59% en el último año. "
            "Retrocedió desde máximos ($334.61) ofreciendo descuento. "
            "33 analistas con consenso alcista, target mediano $345. "
            "Exposición a financiero diversifica el portafolio."
        ),
        "risk_level": "Medio",
        "52w_high": 337.25,
        "52w_low": 202.16,
    },
    {
        "ticker": "NEE",
        "name": "NextEra Energy Inc.",
        "sector": "Utilities / Energía Renovable",
        "price": 91.40,
        "allocation_pct": 10,
        "rationale": (
            "Combina utilidad regulada con energía renovable. Defensiva con "
            "crecimiento moderado. Market cap $187B. Cerca de máximos "
            "($95.03). Baja correlación con tech — reduce volatilidad "
            "del portafolio."
        ),
        "risk_level": "Bajo",
        "52w_high": 95.91,
        "52w_low": 61.72,
    },
    {
        "ticker": "MU",
        "name": "Micron Technology Inc.",
        "sector": "Semiconductores / IA",
        "price": 322.19,
        "allocation_pct": 10,
        "rationale": (
            "Proveedor clave de chips HBM para centros de datos de IA. "
            "Revenue +196% y EPS +682% YoY en Q2 2026. Alta volatilidad "
            "pero enorme momentum secular. Corrección reciente desde $461 "
            "crea oportunidad. Posición pequeña acorde al riesgo."
        ),
        "risk_level": "Alto",
        "52w_high": 471.34,
        "52w_low": 61.54,
    },
]


# =============================================================================
# FUNCIONES DEL PORTAFOLIO
# =============================================================================

def validate_portfolio(stocks):
    """Valida que el portafolio cumpla las reglas."""
    total = sum(s["allocation_pct"] for s in stocks)
    errors = []

    if total != 100:
        errors.append(f"La suma de asignaciones es {total}%, debe ser 100%.")

    for s in stocks:
        if s["allocation_pct"] > 20:
            errors.append(
                f"{s['ticker']}: {s['allocation_pct']}% excede el máximo de 20%."
            )

    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
        return False

    print("  Portafolio válido: suma 100%, ninguna acción excede 20%.")
    return True


def calculate_positions(stocks, investment_amount):
    """Calcula las posiciones en dólares y número de acciones."""
    positions = []
    for s in stocks:
        dollar_amount = investment_amount * (s["allocation_pct"] / 100)
        shares = dollar_amount / s["price"]
        upside_to_52w_high = ((s["52w_high"] - s["price"]) / s["price"]) * 100
        positions.append({
            "ticker": s["ticker"],
            "name": s["name"],
            "sector": s["sector"],
            "price": s["price"],
            "allocation_pct": s["allocation_pct"],
            "dollar_amount": round(dollar_amount, 2),
            "shares": round(shares, 4),
            "risk_level": s["risk_level"],
            "upside_to_52w_high": round(upside_to_52w_high, 2),
            "rationale": s["rationale"],
        })
    return positions


def calculate_sector_breakdown(positions):
    """Agrupa la asignación por sector."""
    sectors = {}
    for p in positions:
        sector = p["sector"]
        if sector not in sectors:
            sectors[sector] = 0
        sectors[sector] += p["allocation_pct"]
    return dict(sorted(sectors.items(), key=lambda x: x[1], reverse=True))


def calculate_risk_breakdown(positions):
    """Agrupa la asignación por nivel de riesgo."""
    risk = {}
    for p in positions:
        level = p["risk_level"]
        if level not in risk:
            risk[level] = 0
        risk[level] += p["allocation_pct"]
    return risk


def print_portfolio_report(positions, investment_amount):
    """Imprime el reporte completo del portafolio."""

    print("=" * 80)
    print("  PORTAFOLIO DE INVERSIÓN — Semana del 31 de Marzo 2026")
    print(f"  Perfil: {PROFILE} | Monto base: ${investment_amount:,.2f}")
    print(f"  Fecha de análisis: {PORTFOLIO_DATE}")
    print("=" * 80)

    # --- Contexto de mercado ---
    print("\n  CONTEXTO DE MERCADO")
    print("  " + "-" * 76)
    market_points = [
        "S&P 500 retrocedió ~6% desde máximos — corrección saludable",
        "Conflicto Irán: petróleo >$99/barril, oro ~$4,600",
        "Sector Energía lidera 2026 (+20% YTD)",
        "Defensa en auge: presupuesto militar récord $924.7B",
        "Nasdaq -15% desde feb — tech a precios de descuento",
        "Earnings S&P 500 esperados +12.5% para 2026",
        "Fed: posibles recortes de tasas favorecen mercado",
    ]
    for point in market_points:
        print(f"  - {point}")

    # --- Validación ---
    print("\n  VALIDACIÓN DE REGLAS")
    print("  " + "-" * 76)
    validate_portfolio(STOCKS)

    # --- Tabla de posiciones ---
    print("\n  COMPOSICIÓN DEL PORTAFOLIO")
    print("  " + "-" * 76)
    header = f"  {'Ticker':<7} {'Sector':<28} {'Precio':>8} {'Asign.':>7} {'Monto':>10} {'Acciones':>9} {'Upside':>8} {'Riesgo':<10}"
    print(header)
    print("  " + "-" * 76)

    for p in sorted(positions, key=lambda x: x["allocation_pct"], reverse=True):
        sector_short = p["sector"][:26]
        print(
            f"  {p['ticker']:<7} {sector_short:<28} ${p['price']:>7.2f} "
            f"{p['allocation_pct']:>5}%  ${p['dollar_amount']:>8.2f}  "
            f"{p['shares']:>8.4f}  {p['upside_to_52w_high']:>5.1f}%  {p['risk_level']:<10}"
        )

    total_invested = sum(p["dollar_amount"] for p in positions)
    print("  " + "-" * 76)
    print(f"  {'TOTAL':<37} {'100%':>15}  ${total_invested:>8.2f}")

    # --- Desglose sectorial ---
    sectors = calculate_sector_breakdown(positions)
    print("\n  DIVERSIFICACIÓN SECTORIAL")
    print("  " + "-" * 76)
    for sector, pct in sectors.items():
        bar = "█" * int(pct / 2)
        print(f"  {sector:<32} {pct:>3}%  {bar}")

    # --- Desglose por riesgo ---
    risk = calculate_risk_breakdown(positions)
    print("\n  PERFIL DE RIESGO")
    print("  " + "-" * 76)
    risk_order = ["Bajo", "Medio", "Medio-Alto", "Alto"]
    for level in risk_order:
        if level in risk:
            bar = "█" * int(risk[level] / 2)
            print(f"  {level:<20} {risk[level]:>3}%  {bar}")

    # --- Justificación por acción ---
    print("\n  JUSTIFICACIÓN POR ACCIÓN")
    print("  " + "-" * 76)
    for p in sorted(positions, key=lambda x: x["allocation_pct"], reverse=True):
        print(f"\n  {p['ticker']} ({p['name']}) — {p['allocation_pct']}%")
        # Word wrap the rationale
        words = p["rationale"].split()
        line = "    "
        for word in words:
            if len(line) + len(word) + 1 > 78:
                print(line)
                line = "    " + word
            else:
                line += " " + word if line.strip() else word
        if line.strip():
            print(line)

    # --- Estrategia ---
    print("\n  ESTRATEGIA DE GESTIÓN DE RIESGO")
    print("  " + "-" * 76)
    strategies = [
        "Diversificación en 6 sectores distintos para reducir riesgo específico",
        "22% en defensivos (PG + NEE) como ancla de estabilidad",
        "28% en sectores con momentum (Energía + Defensa) para capturar tendencia",
        "37% en tech a precios de descuento (MSFT, AMZN, MU) para upside",
        "13% en financiero (JPM) para diversificación y valor",
        "Ninguna acción supera 15% — margen adicional sobre regla del 20%",
        "Posiciones más pequeñas (10%) en activos de mayor riesgo (MU, NEE)",
        "Stop-loss sugerido: -8% por posición individual",
        "Rebalanceo mensual si alguna posición supera 20% por apreciación",
    ]
    for s in strategies:
        print(f"  - {s}")

    # --- Disclaimer ---
    print("\n  " + "=" * 76)
    print("  DISCLAIMER: Este portafolio es un ejercicio educativo/informativo.")
    print("  NO constituye asesoría financiera. Los precios corresponden al")
    print(f"  {PORTFOLIO_DATE}. Consulte a un asesor financiero antes de invertir.")
    print("  El rendimiento pasado no garantiza resultados futuros.")
    print("  " + "=" * 76)


def export_portfolio_json(positions, filepath="portfolio_output.json"):
    """Exporta el portafolio a JSON."""
    output = {
        "portfolio_date": PORTFOLIO_DATE,
        "profile": PROFILE,
        "base_investment": INVESTMENT_AMOUNT,
        "generated_at": datetime.now().isoformat(),
        "market_context": {
            "sp500_drawdown_from_ath": "-6%",
            "key_risk": "Conflicto Irán, petróleo >$99",
            "leading_sector": "Energía (+20% YTD)",
            "outlook": "Cautelosamente optimista — earnings +12.5% esperado",
        },
        "positions": positions,
        "sector_breakdown": calculate_sector_breakdown(positions),
        "risk_breakdown": calculate_risk_breakdown(positions),
    }
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\n  Portafolio exportado a: {filepath}")


# =============================================================================
# EJECUCIÓN PRINCIPAL
# =============================================================================

if __name__ == "__main__":
    positions = calculate_positions(STOCKS, INVESTMENT_AMOUNT)
    print_portfolio_report(positions, INVESTMENT_AMOUNT)
    export_portfolio_json(positions)
