import Link from "next/link";

const workflow = [
  { n: "01", title: "Smart Intake", copy: "Comparte un formulario profesional. Cada respuesta llega al Lead Inbox con contexto, presupuesto y timing." },
  { n: "02", title: "Qualification Engine", copy: "Prioriza oportunidades por fit operativo y recibe una next best action sin revisar otra hoja." },
  { n: "03", title: "Protected Quotes", copy: "Convierte un lead en cliente + quote, protegiendo labor, contingency y target margin." },
  { n: "04", title: "Collection Radar", copy: "Ordena accounts receivable, vencimientos y recordatorios para convertir trabajo entregado en caja." },
  { n: "05", title: "13-week Cash", copy: "Mira cómo pipeline y cobros impactan tu liquidez antes de asumir nuevos costos." },
];

export default function Home() {
  return <main className="marketing-page ctc-marketing">
    <header className="marketing-nav">
      <Link className="brand-lockup" href="/" aria-label="Honora, inicio"><span className="brand-mark">H</span><span><strong>HONORA</strong><small>CLIENT-TO-CASH OS</small></span></Link>
      <nav aria-label="Navegación principal"><a href="#flujo">Producto</a><a href="#copilot">Copilot</a><a href="#integraciones">Conexiones</a><a href="#precio">Precio</a></nav>
      <Link className="button button-dark button-small" href="/app">Crear cuenta <span>↗</span></Link>
    </header>

    <section className="marketing-hero ctc-hero">
      <div className="hero-copy-v2">
        <div className="eyebrow"><i /> Client-to-Cash OS · Built in Peru</div>
        <h1>De una consulta<br />a <em>dinero cobrado.</em></h1>
        <p>Honora convierte formularios, leads, propuestas y cobros en un solo sistema para profesionales independientes que quieren vender con método y operar con margen.</p>
        <div className="hero-buttons"><Link className="button button-accent" href="/app">Crear mi cuenta <span>→</span></Link><Link className="text-link" href="/demo/login">Entrar con usuario demo <span>↗</span></Link></div>
        <div className="hero-trust"><span><b>✓</b> Plan Free sin tarjeta</span><span><b>✓</b> Base de datos persistente</span><span><b>✓</b> Workspace privado</span></div>
      </div>

      <div className="hero-console ctc-console" aria-label="Vista previa del Client-to-Cash Command Center">
        <div className="console-top"><span><i /><i /><i /></span><small>honora / client-to-cash command center</small><b>LIVE</b></div>
        <div className="ctc-console-body">
          <div className="ctc-console-head"><div><small>OPEN PIPELINE</small><strong>S/ 16,812</strong></div><span>3 oportunidades activas</span></div>
          <div className="ctc-stages">{[{ n: 3, t: "Nuevos" }, { n: 1, t: "Calificados" }, { n: 2, t: "Propuesta" }, { n: 1, t: "Ganados" }].map((stage, index) => <div key={stage.t}><small>0{index + 1}</small><strong>{stage.n}</strong><span>{stage.t}</span>{index < 3 && <i>→</i>}</div>)}</div>
          <div className="ctc-console-grid">
            <article className="hot-lead-card"><div><span>91</span><small>HOT LEAD</small></div><h3>Mariana Torres</h3><p>Automatización · S/ 6,200</p><footer><span>Responder hoy</span><b>→</b></footer></article>
            <article className="money-moves-card"><small>MONEY MOVES · TODAY</small><div><b>$</b><p><strong>Cobrar S/ 1,200</strong><span>Páramo Digital · 4 días overdue</span></p></div><div><b>✦</b><p><strong>Agendar discovery call</strong><span>Fit 91/100 · esta semana</span></p></div></article>
          </div>
          <div className="ctc-copilot-bar"><b>H</b><p><small>HONORA COPILOT</small><strong>“¿Qué lead debo responder primero?”</strong></p><span>Preguntar →</span></div>
        </div>
      </div>
    </section>

    <section className="ctc-proof-strip"><div><strong>1</strong><span>formulario compartible</span></div><i>→</i><div><strong>1</strong><span>pipeline priorizado</span></div><i>→</i><div><strong>1</strong><span>quote con margen</span></div><i>→</i><div><strong>1</strong><span>cobro en caja</span></div></section>

    <section className="ctc-workflow-section" id="flujo">
      <div className="section-kicker">ONE REVENUE WORKFLOW</div>
      <div className="problem-heading"><h2>Tu cliente no debería perderse<br /><em>entre cinco herramientas.</em></h2><p>El valor no está en almacenar contactos. Está en hacer avanzar cada oportunidad hasta un cobro, con contexto financiero en cada decisión.</p></div>
      <div className="ctc-workflow-grid">{workflow.map((item) => <article key={item.n}><span>{item.n}</span><div>{item.n === "01" ? "↳" : item.n === "02" ? "✦" : item.n === "03" ? "◇" : item.n === "04" ? "$" : "∿"}</div><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div>
    </section>

    <section className="copilot-section" id="copilot">
      <div className="copilot-marketing-copy"><span>DATA-GROUNDED ASSISTANT</span><h2>Un bot general responde.<br /><em>Honora recuerda y decide contigo.</em></h2><p>Copilot cruza Lead Inbox, protected rate, accounts receivable, Ledger y estados financieros. Cada conversación queda guardada con evidencia y una next best action.</p><ul><li>¿Quién me debe dinero hoy?</li><li>¿Cómo están mis estados financieros?</li><li>¿Qué lead tiene mayor fit?</li><li>¿Qué hago esta semana para proteger caja?</li></ul><Link className="button button-light" href="/demo/login">Probar Copilot <span>→</span></Link></div>
      <div className="copilot-marketing-card"><header><b>H</b><span>HONORA COPILOT</span><small>GROUNDED IN YOUR DATA</small></header><div className="user-question">¿Qué hago primero esta semana?</div><div className="assistant-reply"><small>NEXT BEST ACTION</small><h3>Cobra S/ 1,200 a Páramo Digital hoy.</h3><p>Es la acción con mayor impacto inmediato en caja. La factura lleva 4 días vencida.</p><div><span>EVIDENCIA</span><b>S/ 4,750 receivable</b><b>S/ 1,200 overdue</b></div></div><footer>Pregunta sobre ventas, precios, cobros o caja… <b>→</b></footer></div>
    </section>

    <section className="connection-section" id="integraciones"><div className="connection-head"><span>CONNECTED, NOT COMPLICATED</span><h2>Todo llega al mismo lugar.</h2><p>Empieza sin gastar en infraestructura ni pegar datos manualmente.</p></div><div className="connection-grid"><article><b>GF</b><h3>Google Forms Bridge</h3><p>Importa respuestas desde Google Sheets en CSV y conviértelas automáticamente en leads calificados.</p><span>IMPORT + AUTO-SCORE</span></article><article><b>H</b><h3>Smart Intake nativo</h3><p>Comparte tu propio formulario y recibe nuevos leads directamente en el pipeline.</p><span>NO COPY / PASTE</span></article><article><b>DB</b><h3>Persistent Workspace</h3><p>Leads, clientes, quotes y cobros viven en una base de datos separada por usuario.</p><span>D1 DATABASE</span></article><article><b>MP</b><h3>Hosted Checkout</h3><p>Arquitectura preparada para activar suscripciones con Mercado Pago sin guardar datos de tarjeta.</p><span>PAYMENT-READY</span></article></div></section>

    <section className="pricing-section-v2 ctc-pricing" id="precio">
      <div className="pricing-intro"><span>PRICE FOR OUTCOME</span><h2>Si Honora no recupera una oportunidad,<br /><em>no merece tu suscripción.</em></h2><p>Empieza gratis. Paga cuando tu pipeline necesite operar sin límites.</p></div>
      <div className="pricing-cards-v2"><article><div><span>FREE</span><small>Para validar el sistema</small></div><strong>S/ 0</strong><ul><li>1 Smart Intake</li><li>10 leads activos + Fit Score</li><li>2 clientes y 5 receivables</li><li>1 protected quote</li><li>5 preguntas Copilot / mes</li></ul><Link className="button button-outline" href="/app">Empezar gratis →</Link></article><article className="founder-plan"><div className="popular-label">FOUNDING 100</div><div><span>PRO</span><small>Para operar y vender</small></div><strong>S/ 29.90<small>/ mes</small></strong><ul><li>Pipeline y records ilimitados</li><li>Google Forms Bridge</li><li>Honora Copilot ilimitado</li><li>Pricing + Collection Engine</li><li>13-week Cash Forecast</li></ul><Link className="button button-accent" href="/app">Reservar precio fundador →</Link><p>Precio regular proyectado: S/ 49.90. Checkout sujeto a activación comercial.</p></article></div>
    </section>

    <section className="founder-note"><span>BUILT IN PERU</span><blockquote>“Un negocio independiente no pierde dinero por falta de talento; lo pierde cuando una oportunidad no tiene siguiente paso.”</blockquote><p>— Gabriel Pérez Chávez, creador de Honora</p></section>
    <footer className="marketing-footer"><Link className="brand-lockup footer-lockup" href="/"><span className="brand-mark">H</span><span><strong>HONORA</strong><small>CLIENT-TO-CASH OS</small></span></Link><p>Capture. Quote. Collect. Grow.</p><span>© 2026 Gabriel Pérez Chávez</span></footer>
  </main>;
}
