"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateDiagnostics,
  calculateHonoraScore,
  calculateRevenueRisk,
  calculateScenario,
  generateActionPlan,
  type FinancialInputs,
} from "../lib/honora";

const initialInputs: FinancialInputs = {
  monthlyIncome: 6500,
  fixedCosts: 1800,
  variableCosts: 900,
  debtPayments: 300,
  cashReserve: 8500,
  billableHours: 80,
  reserveRate: 8,
  targetMargin: 20,
};

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const decimalMoney = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function NumberField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <div>
        {!suffix && <small>S/</small>}
        <input
          aria-label={label}
          min="0"
          inputMode="decimal"
          type="number"
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  );
}

export default function Home() {
  const [inputs, setInputs] = useState<FinancialInputs>(initialInputs);
  const [revenueHistory, setRevenueHistory] = useState([5200, 4700, 7100, 5900, 7800, 6500]);
  const [topClientShare, setTopClientShare] = useState(42);
  const [averagePaymentDelay, setAveragePaymentDelay] = useState(24);
  const [scenarioShock, setScenarioShock] = useState(-0.2);
  const [loaded, setLoaded] = useState(false);

  const diagnostics = useMemo(() => calculateDiagnostics(inputs), [inputs]);
  const revenueRisk = useMemo(() => calculateRevenueRisk({ revenueHistory, topClientShare, averagePaymentDelay }, inputs.monthlyIncome), [revenueHistory, topClientShare, averagePaymentDelay, inputs.monthlyIncome]);
  const score = calculateHonoraScore(diagnostics.coreScore, revenueRisk.stabilityScore);
  const scenario = useMemo(() => calculateScenario(inputs, scenarioShock), [inputs, scenarioShock]);
  const actionPlan = useMemo(() => generateActionPlan(inputs, diagnostics, { revenueHistory, topClientShare, averagePaymentDelay }, revenueRisk), [inputs, diagnostics, revenueHistory, topClientShare, averagePaymentDelay, revenueRisk]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("honora-financial-profile");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.inputs) setInputs({ ...initialInputs, ...parsed.inputs });
          if (Array.isArray(parsed.revenueHistory) && parsed.revenueHistory.length === 6) setRevenueHistory(parsed.revenueHistory);
          if (Number.isFinite(parsed.topClientShare)) setTopClientShare(parsed.topClientShare);
          if (Number.isFinite(parsed.averagePaymentDelay)) setAveragePaymentDelay(parsed.averagePaymentDelay);
        }
      } catch {
        window.localStorage.removeItem("honora-financial-profile");
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem("honora-financial-profile", JSON.stringify({ inputs, revenueHistory, topClientShare, averagePaymentDelay }));
  }, [loaded, inputs, revenueHistory, topClientShare, averagePaymentDelay]);

  const update = (key: keyof FinancialInputs, value: number) =>
    setInputs((current) => ({ ...current, [key]: value }));

  const scoreLabel = score >= 78
    ? "Caja saludable"
    : score >= 55
      ? "Equilibrio frágil"
      : "Requiere atención";

  const historyMaximum = Math.max(...revenueHistory, 1);
  const historyPoints = revenueHistory.map((value, index) => `${20 + index * 96},${205 - (value / historyMaximum) * 160}`).join(" ");
  const earlyAccessUrl = "https://github.com/Gabrielfpch/macrorisk-lab/issues/new?template=early-access.yml";

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Honora, inicio">
          <span className="brand-symbol">H</span>
          <span><strong>HONORA</strong><small>FINANCIAL OS</small></span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#diagnostico">Diagnóstico</a>
          <a href="#metodo">Método</a>
          <a href="#planes">Planes</a>
          <a className="nav-cta" href="#diagnostico">Probar gratis <span>↗</span></a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="launch-pill"><i /> Early access · Perú</div>
          <h1>Tu talento factura.<br /><em>Tu caja decide.</em></h1>
          <p>
            El Financial OS para profesionales independientes que convierte ingresos
            irregulares en una tarifa rentable, runway visible y decisiones con margen.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#diagnostico">Diagnosticar mi negocio <span>→</span></a>
            <span className="price-note"><b>S/ 0</b> para empezar<br /><small>sin tarjeta · sin registro</small></span>
          </div>
          <div className="trust-line">
            <span><b>01</b> Datos en tu dispositivo</span>
            <span><b>02</b> Resultados inmediatos</span>
            <span><b>03</b> Sin fórmulas ocultas</span>
          </div>
        </div>

        <div className="hero-product" aria-label="Vista previa del diagnóstico">
          <div className="window-bar"><span><i /><i /><i /></span><small>honora.app / overview</small><b>LIVE</b></div>
          <div className="preview-grid">
            <article className="score-preview">
              <span>HONORA SCORE</span>
              <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
                <div><strong>{score}</strong><small>/100</small></div>
              </div>
              <b className="score-status"><i /> {scoreLabel}</b>
            </article>
            <article className="cash-preview">
              <div><span>FREE CASH FLOW</span><strong className={diagnostics.freeCashFlow < 0 ? "negative" : ""}>{money.format(diagnostics.freeCashFlow)}</strong></div>
              <svg viewBox="0 0 360 105" role="img" aria-label="Tendencia financiera ilustrativa">
                <defs><linearGradient id="cashArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c8ff62" stopOpacity=".32"/><stop offset="1" stopColor="#c8ff62" stopOpacity="0"/></linearGradient></defs>
                <path className="chart-grid" d="M0 20H360M0 52H360M0 84H360" />
                <path className="chart-area" d="M0 86 C35 82 42 60 77 67 S126 84 157 54 S207 67 237 38 S303 51 360 13 L360 105 L0 105Z" />
                <path className="chart-line" d="M0 86 C35 82 42 60 77 67 S126 84 157 54 S207 67 237 38 S303 51 360 13" />
                <circle cx="360" cy="13" r="5" />
              </svg>
              <div className="micro-metrics">
                <span>Runway <b>{diagnostics.runway.toFixed(1)} meses</b></span>
                <span>Margen <b>{(diagnostics.margin * 100).toFixed(1)}%</b></span>
              </div>
            </article>
          </div>
          <div className="product-alert"><span>↗</span><p><b>Pricing signal</b>Tu tarifa protegida comienza en {decimalMoney.format(diagnostics.recommendedRate)} por hora.</p><button aria-label="Ver recomendación" onClick={() => document.getElementById("diagnostico")?.scrollIntoView()}>→</button></div>
        </div>
      </section>

      <section className="proof-tape" aria-label="Principales capacidades">
        <span>PRICING INTELLIGENCE</span><i>✦</i><span>CASH RUNWAY</span><i>✦</i><span>REVENUE RISK</span><i>✦</i><span>CLIENT CONCENTRATION</span><i>✦</i><span>90-DAY PLAN</span>
      </section>

      <section className="diagnostic-section" id="diagnostico">
        <div className="section-intro">
          <span>01 · FINANCIAL DIAGNOSTIC</span>
          <h2>De “creo que me alcanza”<br />a <em>sé exactamente cuánto cobrar.</em></h2>
          <p>Completa ocho variables. Honora separa facturación, costos, reserva y margen para encontrar el precio mínimo que protege tu trabajo.</p>
        </div>

        <div className="calculator-shell">
          <article className="inputs-panel">
            <div className="panel-title"><div><span>MONTHLY INPUTS</span><h3>Tu operación real</h3></div><button onClick={() => setInputs(initialInputs)}>Restablecer</button></div>
            <div className="input-grid">
              <NumberField label="Ingreso mensual promedio" value={inputs.monthlyIncome} onChange={(value) => update("monthlyIncome", value)} />
              <NumberField label="Costos fijos" value={inputs.fixedCosts} onChange={(value) => update("fixedCosts", value)} />
              <NumberField label="Costos variables" value={inputs.variableCosts} onChange={(value) => update("variableCosts", value)} />
              <NumberField label="Pagos de deuda" value={inputs.debtPayments} onChange={(value) => update("debtPayments", value)} />
              <NumberField label="Caja disponible" value={inputs.cashReserve} onChange={(value) => update("cashReserve", value)} />
              <NumberField label="Horas facturables al mes" value={inputs.billableHours} suffix="h" onChange={(value) => update("billableHours", value)} />
              <NumberField label="Reserva configurable" value={inputs.reserveRate} suffix="%" onChange={(value) => update("reserveRate", clamp(value, 0, 60))} />
              <NumberField label="Margen objetivo" value={inputs.targetMargin} suffix="%" onChange={(value) => update("targetMargin", clamp(value, 0, 60))} />
            </div>
            <p className="input-disclaimer">La reserva es una preferencia de planificación, no una estimación tributaria ni asesoría fiscal.</p>
          </article>

          <aside className="result-panel">
            <div className="panel-title inverse"><div><span>LIVE DIAGNOSIS</span><h3>Tu precio protegido</h3></div><b>ACTUALIZADO</b></div>
            <div className="main-result"><span>TARIFA MÍNIMA SUGERIDA</span><strong>{decimalMoney.format(diagnostics.recommendedRate)}<small>/ hora</small></strong><p>Incluye costos, reserva de {inputs.reserveRate}% y margen objetivo de {inputs.targetMargin}%.</p></div>
            <div className="rate-comparison">
              <div><span>Tarifa implícita actual</span><strong>{decimalMoney.format(diagnostics.currentRate)}</strong></div>
              <i>→</i>
              <div><span>Pricing gap</span><strong className={diagnostics.currentRate >= diagnostics.recommendedRate ? "positive" : "warning"}>{diagnostics.currentRate >= diagnostics.recommendedRate ? "+" : ""}{decimalMoney.format(diagnostics.currentRate - diagnostics.recommendedRate)}</strong></div>
            </div>
            <div className="result-metrics">
              <div><span>Free cash flow</span><strong>{money.format(diagnostics.freeCashFlow)}</strong></div>
              <div><span>Cash runway</span><strong>{diagnostics.runway.toFixed(1)} meses</strong></div>
              <div><span>Operating margin</span><strong>{(diagnostics.margin * 100).toFixed(1)}%</strong></div>
            </div>
            <button className="report-button" type="button" onClick={() => document.getElementById("planes")?.scrollIntoView()}>Desbloquear reporte completo <span>S/ 9.90 →</span></button>
          </aside>
        </div>
      </section>

      <section className="method-strip" id="metodo">
        <span>HONORA METHOD</span>
        <p>Facturación <i>−</i> reserva <i>−</i> operating burn <i>=</i> free cash flow</p>
        <b>Sin black box.</b>
      </section>

      <section className="risk-section">
        <div className="section-intro dark-intro">
          <span>02 · REVENUE RISK</span>
          <h2>Facturar más no sirve<br />si dependes de <em>un solo cliente.</em></h2>
          <p>Honora mide revenue volatility, client concentration y payment delay para revelar la estabilidad detrás del promedio.</p>
        </div>

        <div className="risk-lab-grid">
          <article className="history-card">
            <div className="risk-card-head"><div><span>6-MONTH REVENUE</span><h3>Ingresos reales</h3></div><strong>{money.format(revenueRisk.average)}<small> promedio</small></strong></div>
            <svg className="history-chart" viewBox="0 0 520 230" role="img" aria-label="Evolución de ingresos de seis meses">
              <path d="M20 45H500M20 95H500M20 145H500M20 195H500" className="history-grid-lines" />
              <polygon points={`20,205 ${historyPoints} 500,205`} className="history-area" />
              <polyline points={historyPoints} className="history-line" />
              {revenueHistory.map((value, index) => <circle key={index} cx={20 + index * 96} cy={205 - (value / historyMaximum) * 160} r="5"><title>Mes {index + 1}: {money.format(value)}</title></circle>)}
            </svg>
            <div className="history-inputs">
              {revenueHistory.map((value, index) => (
                <label key={index}><span>M-{5 - index === 0 ? "0" : 5 - index}</span><input aria-label={`Ingreso del mes ${index + 1}`} type="number" min="0" value={value} onChange={(event) => setRevenueHistory((current) => current.map((item, itemIndex) => itemIndex === index ? Math.max(0, Number(event.target.value) || 0) : item))} /></label>
              ))}
            </div>
          </article>

          <article className="stability-card">
            <div className="risk-card-head"><div><span>STABILITY SCORE</span><h3>Calidad del revenue</h3></div><b className="live-badge">LIVE</b></div>
            <div className="stability-score"><strong>{revenueRisk.stabilityScore}</strong><span>/100</span><div><i style={{ width: `${revenueRisk.stabilityScore}%` }} /></div></div>
            <label className="risk-slider"><span><b>Principal cliente</b><em>{topClientShare}% del revenue</em></span><input aria-label="Participación del principal cliente" type="range" min="0" max="100" value={topClientShare} onChange={(event) => setTopClientShare(Number(event.target.value))} /><small>{revenueRisk.concentrationLevel} concentration</small></label>
            <label className="risk-slider"><span><b>Payment delay promedio</b><em>{averagePaymentDelay} días</em></span><input aria-label="Demora promedio de cobro" type="range" min="0" max="90" value={averagePaymentDelay} onChange={(event) => setAveragePaymentDelay(Number(event.target.value))} /><small>Cobranza {revenueRisk.collectionLevel.toLowerCase()}</small></label>
            <div className="cash-transit"><span>CASH IN TRANSIT</span><strong>{money.format(revenueRisk.cashInTransit)}</strong><p>Facturación equivalente inmovilizada por demora de cobro.</p></div>
          </article>
        </div>
      </section>

      <section className="scenario-section">
        <div className="section-intro">
          <span>03 · CASH STRESS TEST</span>
          <h2>¿Qué pasa si el próximo<br />mes llega <em>20% menos?</em></h2>
          <p>No es una predicción. Es una prueba de resistencia para saber cuánto tiempo puedes decidir sin presión.</p>
        </div>
        <div className="scenario-shell">
          <div className="scenario-controls">
            {[{ label: "Growth", value: .15 }, { label: "Base", value: 0 }, { label: "Slow month", value: -.2 }, { label: "Client loss", value: -.35 }].map((item) => (
              <button key={item.label} className={scenarioShock === item.value ? "active" : ""} onClick={() => setScenarioShock(item.value)}><span>{item.label}</span><strong>{item.value > 0 ? "+" : ""}{item.value * 100}%</strong></button>
            ))}
          </div>
          <div className="scenario-result">
            <div className="scenario-copy"><span>STRESSED MONTH</span><h3>{scenarioShock >= 0 ? "Tu estructura absorbe el escenario." : scenario.stressedFreeCashFlow >= 0 ? "El mes baja, pero tu caja sigue positiva." : "La caja entra en modo defensa."}</h3><p>Con un shock de {scenarioShock * 100}% en revenue, el resultado mensual sería <b>{money.format(scenario.stressedFreeCashFlow)}</b>.</p></div>
            <div className="stress-visual">
              <div className="stress-bars"><span><i style={{ width: `${Math.min(100, scenario.stressedIncome / Math.max(inputs.monthlyIncome, 1) * 100)}%` }} /></span><span><i style={{ width: `${Math.min(100, diagnostics.burn / Math.max(inputs.monthlyIncome, 1) * 100)}%` }} /></span></div>
              <div className="stress-labels"><div><span>Stressed revenue</span><strong>{money.format(scenario.stressedIncome)}</strong></div><div><span>Operating burn</span><strong>{money.format(diagnostics.burn)}</strong></div></div>
              <div className="survival-card"><span>DEFENSIVE RUNWAY</span><strong>{Number.isFinite(scenario.survivalMonths) ? `${scenario.survivalMonths.toFixed(1)} meses` : "Sin consumo de caja"}</strong><small>si el escenario se repitiera</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="action-section">
        <div className="action-heading"><span>04 · 90-DAY ACTION PLAN</span><h2>No solo un score.<br /><em>Un orden de acción.</em></h2><p>Las prioridades cambian con tus números. Este memo se actualiza cada vez que editas una variable.</p></div>
        <div className="action-list">
          {actionPlan.map((action, index) => (
            <article key={action.horizon}><span>{action.horizon}</span><b>0{index + 1}</b><div><h3>{action.title}</h3><p>{action.detail}</p></div><strong>{action.impact} ↗</strong></article>
          ))}
        </div>
      </section>

      <section className="pricing-section" id="planes">
        <div className="pricing-heading"><span>HONORA PRICING</span><h2>Empieza gratis.<br />Paga cuando una decisión <em>valga más.</em></h2><p>Modelo diseñado para validar demanda con costo operativo mínimo.</p></div>
        <div className="pricing-grid">
          <article className="price-card"><div><span>FREE</span><b>Diagnóstico</b></div><strong>S/ 0<small> para siempre</small></strong><ul><li>Tarifa mínima sugerida</li><li>Cash runway y margin</li><li>Un stress scenario</li><li>Datos guardados localmente</li></ul><a href="#diagnostico">Usar ahora <span>→</span></a></article>
          <article className="price-card report-plan"><div><span>ONE-TIME</span><b>Decision Report</b></div><strong>S/ 9.90<small> pago único</small></strong><ul><li>Reporte ejecutivo exportable</li><li>Revenue risk completo</li><li>Plan de acción de 90 días</li><li>Breakdown de pricing</li></ul><a href={`${earlyAccessUrl}&title=${encodeURIComponent("Quiero comprar Honora Decision Report")}`} target="_blank" rel="noreferrer">Solicitar reporte <span>→</span></a></article>
          <article className="price-card pro-plan"><div><span>BEST VALUE</span><b>Honora Pro</b></div><strong>S/ 19.90<small> / mes</small></strong><ul><li>Historial mensual ilimitado</li><li>Seguimiento de clientes</li><li>Alerts de caja y cobro</li><li>Reportes y partner benefits</li></ul><a href={`${earlyAccessUrl}&title=${encodeURIComponent("Quiero early access a Honora Pro")}`} target="_blank" rel="noreferrer">Unirme al early access <span>→</span></a></article>
        </div>
      </section>

      <section className="partner-section">
        <div><span>PARTNER REVENUE</span><h2>Una segunda fuente de ingresos.</h2><p>Honora puede recomendar servicios útiles en el momento exacto: cuando el diagnóstico detecta una necesidad real. Cada espacio está preparado para acuerdos por referral, sin vender datos personales.</p><a href={`${earlyAccessUrl}&title=${encodeURIComponent("Quiero ser partner de Honora")}`} target="_blank" rel="noreferrer">Solicitar alianza →</a></div>
        <div className="partner-slots"><article><span>01</span><b>Cobros digitales</b><small>Payment partner</small></article><article><span>02</span><b>Soporte contable</b><small>Professional partner</small></article><article><span>03</span><b>Protección financiera</b><small>Insurance partner</small></article></div>
      </section>

      <section className="transparency-section">
        <div><span>05 · MODEL TRANSPARENCY</span><h2>Tus datos son tuyos.</h2></div>
        <div className="transparency-grid"><article><b>Local-first</b><p>El MVP guarda los datos en tu propio navegador. No existe una base central ni venta de información.</p></article><article><b>Supuestos visibles</b><p>Reserva y target margin son configurables. Honora no inventa una tasa tributaria para ti.</p></article><article><b>Uso responsable</b><p>Es una herramienta educativa de planificación financiera, no asesoría contable, tributaria ni legal.</p></article></div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#inicio"><span className="brand-symbol">H</span><span><strong>HONORA</strong><small>FINANCIAL OS</small></span></a>
        <p>Construido para quienes viven de su talento.</p>
        <span>Gabriel Pérez Chávez · 2026</span>
      </footer>
    </main>
  );
}
