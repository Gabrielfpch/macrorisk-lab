import Link from "next/link";

const features = [
  { n: "01", title: "Pricing Intelligence", copy: "Cotiza proyectos desde costos, contingency y target margin. Detecta cuánto dinero dejas sobre la mesa antes de enviar la propuesta." },
  { n: "02", title: "Collection Radar", copy: "Ordena tus cuentas por cobrar, vencimientos y cash in transit. Convierte cobros dispersos en una rutina semanal." },
  { n: "03", title: "13-week Cash Forecast", copy: "Proyecta entradas, operating burn y caja de cierre durante 13 semanas para anticipar problemas, no explicarlos después." },
  { n: "04", title: "Client Economics", copy: "Mide revenue concentration y calidad de cartera. Identifica qué cliente sostiene el negocio y cuál aumenta tu riesgo." },
];

export default function Home() {
  return (
    <main className="marketing-page">
      <header className="marketing-nav">
        <Link className="brand-lockup" href="/" aria-label="Honora, inicio">
          <span className="brand-mark">H</span>
          <span><strong>HONORA</strong><small>FINANCIAL OS</small></span>
        </Link>
        <nav aria-label="Navegación principal">
          <a href="#producto">Producto</a>
          <a href="#metodo">Método</a>
          <a href="#precio">Precio</a>
        </nav>
        <Link className="button button-dark button-small" href="/app">Crear cuenta <span>↗</span></Link>
      </header>

      <section className="marketing-hero">
        <div className="hero-copy-v2">
          <div className="eyebrow"><i /> Built for independents · Perú</div>
          <h1>Deja de facturar<br />a ciegas. <em>Opera con margen.</em></h1>
          <p>El Financial OS que conecta clientes, pricing, cobros y cash flow para que tu talento también se convierta en un negocio rentable.</p>
          <div className="hero-buttons">
            <Link className="button button-accent" href="/app">Crear mi workspace <span>→</span></Link>
            <Link className="text-link" href="/demo">Abrir demo interactiva <span>↗</span></Link>
          </div>
          <div className="hero-trust">
            <span><b>✓</b> Cuenta segura con ChatGPT</span>
            <span><b>✓</b> Plan Free sin tarjeta</span>
            <span><b>✓</b> Datos separados por usuario</span>
          </div>
        </div>

        <div className="hero-console" aria-label="Vista previa de Honora">
          <div className="console-top"><span><i /><i /><i /></span><small>honora / executive overview</small><b>LIVE</b></div>
          <div className="console-body">
            <aside className="console-nav">
              <span className="mini-brand">H</span>
              {["⌁", "◎", "◫", "◇", "⚙"].map((icon, index) => <i className={index === 0 ? "active" : ""} key={icon}>{icon}</i>)}
            </aside>
            <div className="console-main">
              <div className="console-heading"><div><small>BUENOS DÍAS, GABRIEL</small><h2>Tu negocio, en control.</h2></div><span>AGOSTO 2026</span></div>
              <div className="console-kpis">
                <article><small>REVENUE / MES</small><strong>S/ 8,900</strong><em>+12.4% ↗</em></article>
                <article><small>ACCOUNTS RECEIVABLE</small><strong>S/ 4,750</strong><em className="amber">S/ 1,200 overdue</em></article>
                <article><small>13W CASH</small><strong>S/ 14,820</strong><em>healthy runway</em></article>
              </div>
              <div className="console-grid">
                <article className="forecast-card">
                  <div><small>13-WEEK CASH FORECAST</small><b>+ S/ 6,320</b></div>
                  <div className="forecast-bars" aria-hidden="true">
                    {[32, 39, 35, 48, 52, 46, 61, 58, 70, 76, 73, 84, 91].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
                  </div>
                  <div className="chart-axis"><span>W01</span><span>W07</span><span>W13</span></div>
                </article>
                <article className="signal-card">
                  <small>PRICING SIGNAL</small><strong>+18%</strong><h3>Tu último quote está subvaluado.</h3><p>Protege S/ 860 adicionales sin cambiar el scope.</p><span>RECALCULAR →</span>
                </article>
              </div>
              <div className="console-alert"><b>!</b><p><small>COLLECTION RADAR</small><strong>2 cobros necesitan acción esta semana.</strong></p><span>Ver prioridades →</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="ticker" aria-label="Capacidades">
        <span>PRICING INTELLIGENCE</span><i>✦</i><span>COLLECTION RADAR</span><i>✦</i><span>13-WEEK CASH FORECAST</span><i>✦</i><span>CLIENT ECONOMICS</span>
      </section>

      <section className="problem-section" id="producto">
        <div className="section-kicker">THE INDEPENDENT BUSINESS GAP</div>
        <div className="problem-heading"><h2>No necesitas otra hoja de cálculo.<br /><em>Necesitas decisiones conectadas.</em></h2><p>Honora convierte los movimientos diarios de un profesional independiente en señales concretas de precio, cobro y caja.</p></div>
        <div className="feature-grid">
          {features.map((feature) => <article key={feature.n}><span>{feature.n}</span><div className="feature-icon">{feature.n === "01" ? "↗" : feature.n === "02" ? "◎" : feature.n === "03" ? "⌁" : "◇"}</div><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}
        </div>
      </section>

      <section className="method-section" id="metodo">
        <div className="method-copy"><span>HONORA DECISION LOOP</span><h2>Cada dato debe terminar<br />en una <em>acción rentable.</em></h2><p>Honora no pretende reemplazar a un contador. Su trabajo es darte visibilidad operativa entre una factura y la siguiente.</p><Link className="button button-light" href="/demo">Explorar el sistema <span>→</span></Link></div>
        <div className="decision-loop">
          <div className="loop-center"><span>H</span><small>DECISION<br />ENGINE</small></div>
          <article className="loop-one"><b>01</b><span>REGISTRA</span><small>Clientes y cobros</small></article>
          <article className="loop-two"><b>02</b><span>CALCULA</span><small>Margin y runway</small></article>
          <article className="loop-three"><b>03</b><span>PRIORIZA</span><small>Pricing y collection</small></article>
          <article className="loop-four"><b>04</b><span>DECIDE</span><small>Con anticipación</small></article>
        </div>
      </section>

      <section className="pricing-section-v2" id="precio">
        <div className="pricing-intro"><span>SIMPLE PRICING</span><h2>Si Honora no protege más de S/ 29.90,<br /><em>no merece tu suscripción.</em></h2><p>Empieza gratis. Paga cuando necesites operar sin límites y convertir el sistema en una rutina semanal.</p></div>
        <div className="pricing-cards-v2">
          <article><div><span>FREE</span><small>Para ordenar el negocio</small></div><strong>S/ 0</strong><ul><li>2 clientes activos</li><li>5 accounts receivable</li><li>1 project quote</li><li>Executive dashboard</li></ul><Link className="button button-outline" href="/app">Empezar gratis →</Link></article>
          <article className="founder-plan"><div className="popular-label">FOUNDING 100</div><div><span>PRO</span><small>Para operar con control</small></div><strong>S/ 29.90<small>/ mes</small></strong><ul><li>Clientes y cobros ilimitados</li><li>Pricing leak detection</li><li>13-week cash forecast</li><li>Historial y workspace persistente</li><li>Client concentration alerts</li></ul><Link className="button button-accent" href="/app">Crear cuenta Pro →</Link><p>Precio fundador reservado para los primeros 100 clientes.</p></article>
        </div>
      </section>

      <section className="founder-note"><span>BUILT IN PERU</span><blockquote>“Un profesional independiente no debería descubrir que cobró mal cuando ya terminó el trabajo.”</blockquote><p>— Gabriel Pérez Chávez, creador de Honora</p></section>

      <footer className="marketing-footer">
        <Link className="brand-lockup footer-lockup" href="/"><span className="brand-mark">H</span><span><strong>HONORA</strong><small>FINANCIAL OS</small></span></Link>
        <p>Financial clarity for independent work.</p>
        <span>© 2026 Gabriel Pérez Chávez</span>
      </footer>
    </main>
  );
}
